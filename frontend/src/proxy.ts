import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify, decodeJwt } from 'jose'
import { isRndLockedAccount } from '@/lib/rnd-access'

// Must match backend fallback in backend/src/modules/auth/auth.module.ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ERP_SECRET_DEV_ONLY'
)

type UserRole =
  | 'SUPER_ADMIN' | 'HEAD_OPS' | 'COMMERCIAL' | 'DIGIMAR' | 'RND'
  | 'COMPLIANCE' | 'FINANCE' | 'PURCHASING' | 'PPIC' | 'WAREHOUSE'
  | 'PRODUCTION_OP' | 'QC_LAB' | 'HR' | 'IT_SYS' | 'ADMIN' | 'SCM'
  | 'PRODUCTION' | 'MARKETING' | 'APJ' | 'DIRECTOR'

const ROLE_ROUTES: Record<UserRole, string[]> = {
  SUPER_ADMIN:   ['*'],
  HEAD_OPS:      ['*'],
  DIRECTOR:      ['*'],
  FINANCE:       ['/finance'],
  SCM:           ['/scm'],
  PURCHASING:    ['/scm', '/master/goods', '/master/suppliers'],
  WAREHOUSE:     ['/warehouse'],
  PRODUCTION:    ['/production'],
  PRODUCTION_OP: ['/production'],
  PPIC:          ['/production/schedule'],
  RND:           ['/rnd'],
  QC_LAB:        ['/qc'],
  COMMERCIAL:    ['/bussdev'],
  MARKETING:     ['/marketing'],
  DIGIMAR:       ['/marketing'],
  HR:            ['/hr'],
  COMPLIANCE:    ['/legality'],
  APJ:           ['/legality', '/creative'],
  IT_SYS:        ['/system'],
  ADMIN:         ['/system', '/master'],
}

// Roles that can access the shared dashboard
const DASHBOARD_ROLES: UserRole[] = [
  'SUPER_ADMIN', 'HEAD_OPS', 'DIRECTOR',
  'COMMERCIAL', 'DIGIMAR', 'RND', 'COMPLIANCE',
  'PURCHASING', 'PPIC', 'WAREHOUSE', 'PRODUCTION_OP',
  'SCM', 'PRODUCTION', 'MARKETING', 'APJ', 'HR', 'QC_LAB'
]

function roleMatchesPath(roles: UserRole[], pathname: string): boolean {
  for (const role of roles) {
    const allowedRoutes = ROLE_ROUTES[role]
    if (!allowedRoutes) continue
    if (allowedRoutes.includes('*')) return true
    for (const route of allowedRoutes) {
      if (pathname === route || pathname.startsWith(route + '/')) return true
    }
  }
  return false
}

function hasDashboardAccess(roles: UserRole[]): boolean {
  return roles.some(r => DASHBOARD_ROLES.includes(r))
}

export async function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') return NextResponse.next()

  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value ||
                request.headers.get('Authorization')?.replace('Bearer ', '')

  // 1. ASSET & AUTH BYPASS
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/static') ||
    pathname === '/manifest.json' ||
    /\.(jpg|jpeg|png|gif|svg|webp|ico|css)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // 2. PUBLIC WEBSITE ROUTES (White-listed)
  const publicPaths = ['/', '/about', '/blog', '/contact', '/maklon', '/products']
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/blog/'))
  if (isPublicPath) return NextResponse.next()

  // 3. INTERNAL ERP GATE
  if (!token) return redirectToLogin(request, pathname)

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const roles = (payload.roles || []) as UserRole[]
    const isRndLocked = isRndLockedAccount(payload.email as string | undefined)

    if (isRndLocked && !(pathname === '/rnd' || pathname.startsWith('/rnd/'))) {
      return NextResponse.redirect(new URL('/rnd/analytics', request.url))
    }

    // 4. CHECK DASHBOARD ACCESS
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      if (hasDashboardAccess(roles)) return NextResponse.next()
      return redirectToDivision(request, roles)
    }

    // 5. CHECK ROLE-ROUTE MATCH
    if (roleMatchesPath(roles, pathname)) return NextResponse.next()

    // 6. NO MATCH - redirect to user's division
    return redirectToDivision(request, roles)
  } catch (err) {
    const errorName = (err as Error).name
    const errorMsg = (err as Error).message
    const reason =
      errorName === 'JWTExpired' ? 'expired' :
      errorName === 'JWTInvalid' || errorName === 'JWSSignatureVerificationFailed' ? 'invalid_signature' :
      errorName === 'JWTClaimValidationFailed' ? 'invalid_claims' :
      'malformed'
    console.error(`[Middleware Auth] ${reason}: ${errorMsg} | path=${pathname} | token=${token?.slice(0, 20)}...`)

    if (errorName === 'JWTExpired') {
      // Token expired but valid — decode for role routing, let through
      // Axios interceptor on the client will refresh the token
      try {
        const decoded = decodeJwt(token)
        const roles = (decoded.roles || []) as UserRole[]
        const isRndLocked = isRndLockedAccount(decoded.email as string | undefined)

        if (isRndLocked && !(pathname === '/rnd' || pathname.startsWith('/rnd/'))) {
          return NextResponse.redirect(new URL('/rnd/analytics', request.url))
        }

        if (roleMatchesPath(roles, pathname)) return NextResponse.next()
        return redirectToDivision(request, roles)
      } catch {
        return redirectToLogin(request, pathname)
      }
    }

    return redirectToLogin(request, pathname)
  }
}

function getDivisionPath(roles: UserRole[]): string {
  if (roles.some(r => ['SUPER_ADMIN', 'HEAD_OPS', 'DIRECTOR'].includes(r))) return '/executive/dashboard'
  if (roles.includes('FINANCE' as UserRole)) return '/finance/dashboard'
  if (roles.includes('RND' as UserRole)) return '/rnd/analytics'
  if (roles.includes('SCM' as UserRole) || roles.includes('PURCHASING' as UserRole)) return '/scm/dashboard'
  if (roles.includes('WAREHOUSE' as UserRole)) return '/warehouse'
  if (roles.includes('PRODUCTION' as UserRole) || roles.includes('PRODUCTION_OP' as UserRole) || roles.includes('PPIC' as UserRole)) return '/production'
  if (roles.includes('QC_LAB' as UserRole)) return '/qc'
  if (roles.includes('HR' as UserRole)) return '/hr'
  if (roles.includes('MARKETING' as UserRole) || roles.includes('DIGIMAR' as UserRole)) return '/marketing/digital'
  if (roles.includes('COMMERCIAL' as UserRole)) return '/bussdev/dashboard'
  if (roles.includes('COMPLIANCE' as UserRole) || roles.includes('APJ' as UserRole)) return '/legality'
  if (roles.includes('IT_SYS' as UserRole) || roles.includes('ADMIN' as UserRole)) return '/system/audit-ledger'
  return '/dashboard'
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('callbackUrl', pathname)
  return NextResponse.redirect(loginUrl)
}

function redirectToDivision(request: NextRequest, roles: UserRole[]) {
  const dest = getDivisionPath(roles)
  return NextResponse.redirect(new URL(dest, request.url))
}

export const proxyConfig = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

