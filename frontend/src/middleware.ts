import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'Nex_SECRET_KEY_2026'
)

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') return NextResponse.next();

  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

  // 1. ASSET & AUTH BYPASS
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname === '/login' || 
    pathname === '/favicon.ico' ||
    pathname.startsWith('/static') ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // 2. PUBLIC WEBSITE ROUTES (White-listed)
  const publicPaths = ['/', '/about', '/blog', '/contact', '/maklon', '/products'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/blog/'));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 3. INTERNAL ERP GATE: HARD VERIFICATION AT THE EDGE
  if (!token) {
    return redirectToLogin(request, pathname);
  }

  try {
    // Verify JWT at the Edge Runtime (No cold starts, ultra fast)
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (err) {
    console.error('Middleware Auth Error:', err);
    return redirectToLogin(request, pathname);
  }
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

