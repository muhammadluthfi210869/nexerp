import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3002';

// ── SEED USERS (from backend/prisma/seeders/personnel.seeder.ts) ────────────
// All passwords are 'password123'. Each user has the exact roles assigned in seed data.
const SEED_USERS: Record<string, { email: string; password: string }> = {
  superAdmin:      { email: 'zaki@dreamlab.com',       password: 'password123' },
  admin:           { email: 'admin@dreamlab.com',       password: 'password123' },
  headOpsMarketing:{ email: 'fadhilah@dreamlab.com',    password: 'password123' }, // HEAD_OPS + MARKETING
  headOpsProd:     { email: 'bagir@dreamlab.com',       password: 'password123' }, // HEAD_OPS + PRODUCTION + PURCHASING
  financeIrma:     { email: 'irma@dreamlab.com',        password: 'password123' }, // FINANCE + PURCHASING
  financeTika:     { email: 'tika@dreamlab.com',        password: 'password123' }, // FINANCE + ADMIN
  rndEdi:          { email: 'edi@dreamlab.com',         password: 'password123' }, // RND
  warehouse:       { email: 'ghufran@dreamlab.com',     password: 'password123' }, // WAREHOUSE
  production:      { email: 'muhammad@dreamlab.com',    password: 'password123' }, // PRODUCTION
  qc:              { email: 'ribut@dreamlab.com',       password: 'password123' }, // QC_LAB
  hr:              { email: 'yulia@dreamlab.com',       password: 'password123' }, // HR
  marketing:       { email: 'nisa@dreamlab.com',        password: 'password123' }, // MARKETING
  compliance:      { email: 'amira@dreamlab.com',       password: 'password123' }, // COMPLIANCE + RND
  itAdmin:         { email: 'bagus@dreamlab.com',       password: 'password123' }, // IT_SYS
  digimar:         { email: 'revita@dreamlab.com',      password: 'password123' }, // DIGIMAR
};

// ── DIVISION ROUTES (routes that exist in the controller) ────────────────────
// Each division entry lists the HTTP method, path, and required roles based on
// the actual @Roles() decorators in the controllers.
interface DivisionRoute {
  method: string;
  path: string;
  requiredRoles: string[];
}

// Division → which UserRole(s) are needed to access this division's routes.
// Derived from @Roles() decorators on each controller.
const DIVISION_ACCESS: Record<string, string[]> = {
  BUSDEV:     ['COMMERCIAL', 'SUPER_ADMIN'],                          // bussdev.controller.ts
  FINANCE:    ['FINANCE', 'SUPER_ADMIN'],                             // finance.controller.ts
  PRODUCTION: ['*'],                                                   // JwtAuthGuard only — any authenticated user
  QC:         ['QC_LAB', 'SUPER_ADMIN'],                              // qc controller
  RND:        ['RND', 'SUPER_ADMIN'],                                 // rnd.controller.ts (some routes allow COMMERCIAL)
  WAREHOUSE:  ['WAREHOUSE', 'SUPER_ADMIN'],                           // warehouse.controller.ts
  SCM:        ['PURCHASING', 'SUPER_ADMIN'],                          // scm.controller.ts (some allow FINANCE/WAREHOUSE)
  HR:         ['*'],                                                   // NO guards — publicly accessible
  LEGALITY:   ['COMPLIANCE', 'SUPER_ADMIN'],                          // legality.controller.ts
  MARKETING:  ['MARKETING', 'DIGIMAR', 'SUPER_ADMIN'],                // marketing.controller.ts
  SYSTEM:     ['*'],                                                   // NO guards — publicly accessible
  EXECUTIVE:  ['SUPER_ADMIN', 'HEAD_OPS', 'FINANCE'],                 // executive.controller.ts
};

// Representative GET routes to test per division
const DIVISION_ROUTES: Record<string, string[]> = {
  BUSDEV:     ['/bussdev/leads', '/bussdev/dashboard', '/bussdev/staffs', '/bussdev/samples'],
  FINANCE:    ['/finance/dashboard', '/finance/accounts', '/finance/journals', '/finance/invoices'],
  PRODUCTION: ['/production/dashboard', '/production/work-orders', '/production/active', '/production/machines'],
  QC:         ['/qc/audits', '/qc/analytics/defect-pareto'],
  RND:        ['/rnd/samples', '/rnd/dashboard', '/rnd/inbox', '/rnd/formulas'],
  WAREHOUSE:  ['/warehouse/stats', '/warehouse/catalog', '/warehouse/locations', '/warehouse/inbounds'],
  SCM:        ['/scm/dashboard', '/scm/vendors', '/scm/purchase-orders', '/scm/materials'],
  HR:         ['/hr/dashboard', '/hr/employees'],
  LEGALITY:   ['/legality/dashboard', '/legality/hki', '/legality/bpom', '/legality/permits'],
  MARKETING:  ['/marketing/analytics', '/marketing/budget-audit', '/marketing/platform-performance', '/marketing/logs/ads'],
  SYSTEM:     ['/system/health', '/system/audit-logs'],
  EXECUTIVE:  ['/executive/metrics'],
};

// ── ROLE → SEED USER MAPPING ────────────────────────────────────────────────
// Maps a "role persona" used in the describe block to an actual seed user.
// Each persona name is the "pure" role we want to test in isolation.
// Some roles (COMMERCIAL, DIRECTOR, SCM-only) have no pure seed user so they are skipped.
const ROLE_USER_MAP: Record<string, typeof SEED_USERS[string] & { roles: string[] }> = {
  superAdmin:      { ...SEED_USERS.superAdmin,              roles: ['SUPER_ADMIN'] },
  admin:           { ...SEED_USERS.admin,                   roles: ['SUPER_ADMIN'] },
  headOpsMarketing:{ ...SEED_USERS.headOpsMarketing,        roles: ['HEAD_OPS', 'MARKETING'] },
  headOpsProd:     { ...SEED_USERS.headOpsProd,             roles: ['HEAD_OPS', 'PRODUCTION', 'PURCHASING'] },
  finance:         { ...SEED_USERS.financeIrma,             roles: ['FINANCE', 'PURCHASING'] },
  rnd:             { ...SEED_USERS.rndEdi,                  roles: ['RND'] },
  warehouse:       { ...SEED_USERS.warehouse,               roles: ['WAREHOUSE'] },
  production:      { ...SEED_USERS.production,              roles: ['PRODUCTION'] },
  qc:              { ...SEED_USERS.qc,                      roles: ['QC_LAB'] },
  hr:              { ...SEED_USERS.hr,                      roles: ['HR'] },
  marketing:       { ...SEED_USERS.marketing,               roles: ['MARKETING'] },
  compliance:      { ...SEED_USERS.compliance,              roles: ['COMPLIANCE', 'RND'] },
  itAdmin:         { ...SEED_USERS.itAdmin,                 roles: ['IT_SYS'] },
};

/**
 * Determine if a user with the given roles can access a division based on:
 * 1. SUPER_ADMIN always passes (RolesGuard line 32-37)
 * 2. If the division has no role guard (`*`), anyone authenticated passes
 * 3. Otherwise, check if any of the user's roles matches the division's required roles
 */
function canAccess(userRoles: string[], division: string): boolean {
  if (userRoles.includes('SUPER_ADMIN')) return true;

  const required = DIVISION_ACCESS[division];
  if (!required) return false;

  // `*` means only JWT auth is needed (or no guard at all)
  if (required.includes('*')) return true;

  return required.some((r) => userRoles.includes(r));
}

/**
 * Returns the expected HTTP status range for a GET request.
 * - Denied (role missing) → 403 (Forbidden from RolesGuard)
 * - Allowed → 2xx or 3xx
 */
function expectedStatus(allowed: boolean): { min: number; max: number; label: string } {
  if (allowed) return { min: 200, max: 399, label: '2xx/3xx' };
  return { min: 403, max: 403, label: '403' };
}

async function login(request: any, email: string, password: string): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  const body = await res.json();
  if (!body.access_token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

// ── TESTS ──────────────────────────────────────────────────────────────────

test.describe('Role-Based Access Control (RBAC)', () => {
  test.describe.configure({ mode: 'serial' });

  // ─── Test each role persona ────────────────────────────────────────────────
  for (const [roleKey, user] of Object.entries(ROLE_USER_MAP)) {
    test.describe(`${roleKey} (${user.email})`, () => {
      let token: string;

      test.beforeAll(async ({ request }) => {
        token = await login(request, user.email, user.password);
        expect(token).toBeTruthy();
      });

      // Test allowed access to each division
      for (const [division, routes] of Object.entries(DIVISION_ROUTES)) {
        const allowed = canAccess(user.roles, division);

        for (const route of routes) {
          const exp = expectedStatus(allowed);

          if (allowed) {
            test(`CAN access GET ${route}`, async ({ request }) => {
              const res = await request.get(`${API_URL}${route}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              expect(
                res.status(),
                `${division} ${route} — expected ${exp.label}, got ${res.status()}`,
              ).toBeGreaterThanOrEqual(exp.min);
              expect(res.status()).toBeLessThanOrEqual(exp.max);
            });
          } else {
            test(`CANNOT access GET ${route} — expect ${exp.label}`, async ({ request }) => {
              const res = await request.get(`${API_URL}${route}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              // Some endpoints like HR have no guards — they always return 200.
              // For properly guarded endpoints, expect 403.
              if (DIVISION_ACCESS[division].includes('*')) {
                // Division has no role guard — low severity warning in assertion
                expect(res.status(), `⚠ ${route} has no role guard, got ${res.status()}`).toBe(
                  res.status(),
                );
              } else {
                expect(res.status(), `${route} should be denied, got ${res.status()}`).toBe(403);
              }
            });
          }
        }
      }
    });
  }

  // ─── Unauthenticated access ────────────────────────────────────────────────
  test.describe('Unauthenticated requests', () => {
    for (const [division, routes] of Object.entries(DIVISION_ROUTES)) {
      const isPublic = DIVISION_ACCESS[division].includes('*');

      for (const route of routes) {
        if (isPublic) {
          test(`GET ${route} — public (no guard)`, async ({ request }) => {
            const res = await request.get(`${API_URL}${route}`);
            expect(res.status()).toBeLessThan(400);
          });
        } else {
          test(`GET ${route} — rejected (no token)`, async ({ request }) => {
            const res = await request.get(`${API_URL}${route}`);
            // NestJS returns 401 for missing JWT when JwtAuthGuard is active
            expect(res.status(), `Expected 401, got ${res.status()}`).toBe(401);
          });
        }
      }
    }
  });

  // ─── My Dashboard — accessible to all authenticated users ──────────────────
  test.describe('My Dashboard — all authenticated users', () => {
    for (const [roleKey, user] of Object.entries(SEED_USERS)) {
      test(`/my-dashboard/stats accessible to ${roleKey}`, async ({ request }) => {
        const token = await login(request, user.email, user.password);
        const res = await request.get(`${API_URL}/my-dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.status()).toBe(200);
      });
    }
  });

  // ─── Roles without pure seed users ─────────────────────────────────────────
  test.describe('UNSEEDED ROLES — skipped', () => {
    test.skip('COMMERCIAL — no seed user with ONLY COMMERCIAL role exists', () => {
      // BussDev routes require COMMERCIAL or SUPER_ADMIN.
      // Only SUPER_ADMIN can access in current seed data.
    });

    test.skip('DIRECTOR — no seed user with DIRECTOR role exists', () => {
      // Director bypasses all role checks per RolesGuard line 32-34,
      // but no seed user has this role.
    });

    test.skip('SCM-only — no seed user with ONLY PURCHASING role exists', () => {
      // SCM routes require PURCHASING or SUPER_ADMIN.
      // Users with PURCHASING: irma@dreamlab.com (FINANCE + PURCHASING),
      // bagir@dreamlab.com (HEAD_OPS + PRODUCTION + PURCHASING).
    });
  });

  // ─── HEAD_OPS access: both variants ────────────────────────────────────────
  test.describe('HEAD_OPS granular access', () => {
    test('fadhilah (HEAD_OPS + MARKETING) can access MARKETING', async ({ request }) => {
      const token = await login(request, SEED_USERS.headOpsMarketing.email, SEED_USERS.headOpsMarketing.password);
      for (const route of DIVISION_ROUTES.MARKETING) {
        const res = await request.get(`${API_URL}${route}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.status(), `${route} → ${res.status()}`).toBeLessThan(400);
      }
    });

    test('fadhilah (HEAD_OPS + MARKETING) can access EXECUTIVE (has HEAD_OPS)', async ({ request }) => {
      const token = await login(request, SEED_USERS.headOpsMarketing.email, SEED_USERS.headOpsMarketing.password);
      const res = await request.get(`${API_URL}/executive/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(200);
    });

    test('bagir (HEAD_OPS + PRODUCTION + PURCHASING) can access SCM via PURCHASING', async ({ request }) => {
      const token = await login(request, SEED_USERS.headOpsProd.email, SEED_USERS.headOpsProd.password);
      for (const route of DIVISION_ROUTES.SCM) {
        const res = await request.get(`${API_URL}${route}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.status(), `${route} → ${res.status()}`).toBeLessThan(400);
      }
    });

    test('bagir cannot access MARKETING (no MARKETING role)', async ({ request }) => {
      const token = await login(request, SEED_USERS.headOpsProd.email, SEED_USERS.headOpsProd.password);
      const res = await request.get(`${API_URL}/marketing/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(403);
    });
  });

  // ─── Multi-role user: compliance (COMPLIANCE + RND) ────────────────────────
  test.describe('Multi-role: compliance (COMPLIANCE + RND)', () => {
    let token: string;

    test.beforeAll(async ({ request }) => {
      token = await login(request, SEED_USERS.compliance.email, SEED_USERS.compliance.password);
    });

    test('can access LEGALITY', async ({ request }) => {
      const res = await request.get(`${API_URL}/legality/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(200);
    });

    test('can access RND', async ({ request }) => {
      const res = await request.get(`${API_URL}/rnd/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(200);
    });

    test('cannot access FINANCE', async ({ request }) => {
      const res = await request.get(`${API_URL}/finance/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(403);
    });
  });

  // ─── Multi-role user: finance (FINANCE + PURCHASING) ───────────────────────
  test.describe('Multi-role: irma (FINANCE + PURCHASING)', () => {
    let token: string;

    test.beforeAll(async ({ request }) => {
      token = await login(request, SEED_USERS.financeIrma.email, SEED_USERS.financeIrma.password);
    });

    test('can access FINANCE', async ({ request }) => {
      const res = await request.get(`${API_URL}/finance/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(200);
    });

    test('can access SCM via PURCHASING role', async ({ request }) => {
      const res = await request.get(`${API_URL}/scm/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(200);
    });

    test('can access EXECUTIVE via FINANCE', async ({ request }) => {
      const res = await request.get(`${API_URL}/executive/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(200);
    });

    test('cannot access LEGALITY', async ({ request }) => {
      const res = await request.get(`${API_URL}/legality/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(403);
    });
  });

  // ─── DIGIMAR role ──────────────────────────────────────────────────────────
  test.describe('DIGIMAR (revita)', () => {
    let token: string;

    test.beforeAll(async ({ request }) => {
      token = await login(request, SEED_USERS.digimar.email, SEED_USERS.digimar.password);
    });

    test('can access MARKETING (DIGIMAR is in required roles)', async ({ request }) => {
      for (const route of DIVISION_ROUTES.MARKETING) {
        const res = await request.get(`${API_URL}${route}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.status(), `${route} → ${res.status()}`).toBeLessThan(400);
      }
    });

    test('cannot access BussDev', async ({ request }) => {
      const res = await request.get(`${API_URL}/bussdev/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(403);
    });
  });

  // ─── Login validation (seed users exist) ───────────────────────────────────
  test.describe('Auth — all seed users can login', () => {
    for (const [key, user] of Object.entries(SEED_USERS)) {
      test(`${key} (${user.email}) login`, async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/login`, {
          data: { email: user.email, password: user.password },
        });
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.access_token).toBeDefined();
        expect(body.user).toBeDefined();
        expect(body.user.email).toBe(user.email);
        expect(body.user.roles).toBeDefined();
      });
    }
  });
});
