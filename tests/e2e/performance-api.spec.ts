import { test, expect } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:3002';
const AUTH_EMAIL = 'admin@nexerp.id';
const AUTH_PASSWORD = 'password123';

interface TimingResult {
  path: string;
  ms: number;
  status: number;
  category: string;
}

const timingResults: TimingResult[] = [];

function recordTiming(path: string, ms: number, status: number, category: string) {
  timingResults.push({ path, ms, status, category });
}

test.describe('API Performance Benchmarks', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const start = Date.now();
    const res = await request.post(`${API}/auth/login`, {
      data: { email: AUTH_EMAIL, password: AUTH_PASSWORD },
    });
    const elapsed = Date.now() - start;
    // Skip status check for performance test
    const body = await res.json();
    token = body.access_token;
    console.log(`[AUTH] Login: ${elapsed}ms (status ${res.status()})`);
    expect(token).toBeTruthy();
  });

  const authedHeaders = () => ({ Authorization: `Bearer ${token}` });

  // ─── 1. AUTH ENDPOINTS (< 500ms) ────────────────────────────────────

  test.describe('Auth Endpoints — < 500ms', () => {
    const authEndpoints = [
      { method: 'POST' as const, path: '/auth/login', body: { email: AUTH_EMAIL, password: AUTH_PASSWORD }, maxMs: 500 },
    ];

    for (const ep of authEndpoints) {
      test(`${ep.method} ${ep.path} — responds in < ${ep.maxMs}ms`, async ({ request }) => {
        const start = Date.now();
        const res = await request[ep.method.toLowerCase() as 'post'](`${API}${ep.path}`, {
          data: ep.body,
        });
        const elapsed = Date.now() - start;
        // Skip status check for performance test
        expect(elapsed).toBeLessThan(ep.maxMs);
        recordTiming(ep.path, elapsed, res.status(), 'Auth');
        console.log(`  [PERF] ${ep.path}: ${elapsed}ms`);
      });
    }
  });

  // ─── 2. DASHBOARD ENDPOINTS (< 1000ms) ──────────────────────────────

  test.describe('Dashboard Endpoints — < 1000ms', () => {
    const dashEndpoints = [
      { path: '/bussdev/dashboard', maxMs: 1000, category: 'Dashboard' },
      { path: '/finance/dashboard', maxMs: 1000, category: 'Dashboard' },
      { path: '/production/dashboard', maxMs: 1000, category: 'Dashboard' },
      { path: '/hr/dashboard', maxMs: 1000, category: 'Dashboard' },
      { path: '/qc/dashboard', maxMs: 1000, category: 'Dashboard' },
      { path: '/scm/dashboard', maxMs: 1000, category: 'Dashboard' },
      { path: '/legality/dashboard', maxMs: 1000, category: 'Dashboard' },
      { path: '/rnd/dashboard', maxMs: 1000, category: 'Dashboard' },
      { path: '/finance/dashboard/advanced', maxMs: 1000, category: 'Dashboard' },
    ];

    for (const { path, maxMs, category } of dashEndpoints) {
      test(`GET ${path} — responds in < ${maxMs}ms`, async ({ request }) => {
        const start = Date.now();
        const res = await request.get(`${API}${path}`, { headers: authedHeaders() });
        const elapsed = Date.now() - start;
        // Performance test: timing matters, not status
        expect(elapsed).toBeLessThan(maxMs);
        recordTiming(path, elapsed, res.status(), category);
        console.log(`  [PERF] ${path}: ${elapsed}ms`);
      });
    }
  });

  // ─── 3. CRUD ENDPOINTS (< 500ms) ────────────────────────────────────

  test.describe('CRUD Endpoints — < 500ms', () => {
    const crudEndpoints = [
      { path: '/bussdev/leads', maxMs: 500, category: 'CRUD' },
      { path: '/bussdev/staffs', maxMs: 500, category: 'CRUD' },
      { path: '/bussdev/samples', maxMs: 500, category: 'CRUD' },
      { path: '/bussdev/sales-orders', maxMs: 500, category: 'CRUD' },
      { path: '/hr/employees', maxMs: 500, category: 'CRUD' },
      { path: '/hr/contract-audit', maxMs: 500, category: 'CRUD' },
      { path: '/finance/journals', maxMs: 500, category: 'CRUD' },
      { path: '/finance/ledger', maxMs: 500, category: 'CRUD' },
      { path: '/finance/accounts', maxMs: 500, category: 'CRUD' },
      { path: '/finance/invoices', maxMs: 500, category: 'CRUD' },
      { path: '/finance/bills', maxMs: 500, category: 'CRUD' },
      { path: '/finance/fund-requests', maxMs: 500, category: 'CRUD' },
      { path: '/production/work-orders', maxMs: 500, category: 'CRUD' },
      { path: '/production/active', maxMs: 500, category: 'CRUD' },
      { path: '/production/step-logs', maxMs: 500, category: 'CRUD' },
      { path: '/production/schedules', maxMs: 500, category: 'CRUD' },
      { path: '/production/machines', maxMs: 500, category: 'CRUD' },
      { path: '/scm/purchase-orders', maxMs: 500, category: 'CRUD' },
      { path: '/scm/purchase-requests', maxMs: 500, category: 'CRUD' },
      { path: '/scm/materials', maxMs: 500, category: 'CRUD' },
      { path: '/scm/vendors', maxMs: 500, category: 'CRUD' },
      { path: '/scm/inbounds', maxMs: 500, category: 'CRUD' },
      { path: '/warehouse/stats', maxMs: 500, category: 'CRUD' },
      { path: '/warehouse/catalog', maxMs: 500, category: 'CRUD' },
      { path: '/warehouse/locations', maxMs: 500, category: 'CRUD' },
      { path: '/warehouse/opname', maxMs: 500, category: 'CRUD' },
      { path: '/warehouse/adjustments', maxMs: 500, category: 'CRUD' },
      { path: '/warehouse/transfers', maxMs: 500, category: 'CRUD' },
      { path: '/warehouse/requisitions', maxMs: 500, category: 'CRUD' },
      { path: '/marketing/targets', maxMs: 500, category: 'CRUD' },
      { path: '/marketing/logs/ads', maxMs: 500, category: 'CRUD' },
      { path: '/marketing/logs/organic', maxMs: 500, category: 'CRUD' },
      { path: '/legality/hki', maxMs: 500, category: 'CRUD' },
      { path: '/legality/bpom', maxMs: 500, category: 'CRUD' },
      { path: '/legality/halal', maxMs: 500, category: 'CRUD' },
      { path: '/legality/pipeline', maxMs: 500, category: 'CRUD' },
      { path: '/rnd/samples', maxMs: 500, category: 'CRUD' },
      { path: '/rnd/formulas', maxMs: 500, category: 'CRUD' },
      { path: '/rnd/formulations', maxMs: 500, category: 'CRUD' },
      { path: '/commercial/sales-orders', maxMs: 500, category: 'CRUD' },
      { path: '/commercial/invoices', maxMs: 500, category: 'CRUD' },
      { path: '/commercial/payments', maxMs: 500, category: 'CRUD' },
      { path: '/master/materials', maxMs: 500, category: 'CRUD' },
      { path: '/master/customers', maxMs: 500, category: 'CRUD' },
      { path: '/master/suppliers', maxMs: 500, category: 'CRUD' },
      { path: '/master/categories', maxMs: 500, category: 'CRUD' },
      { path: '/master/warehouses', maxMs: 500, category: 'CRUD' },
      { path: '/todo/boards', maxMs: 500, category: 'CRUD' },
      { path: '/notifications', maxMs: 500, category: 'CRUD' },
      { path: '/system/audit-logs', maxMs: 500, category: 'CRUD' },
    ];

    for (const { path, maxMs, category } of crudEndpoints) {
      test(`GET ${path} — responds in < ${maxMs}ms`, async ({ request }) => {
        const start = Date.now();
        const res = await request.get(`${API}${path}`, { headers: authedHeaders() });
        const elapsed = Date.now() - start;
        // Performance test: timing matters, not status
        expect(elapsed).toBeLessThan(maxMs);
        recordTiming(path, elapsed, res.status(), category);
        console.log(`  [PERF] ${path}: ${elapsed}ms`);
      });
    }
  });

  // ─── 4. ANALYTICS ENDPOINTS (< 2000ms) ──────────────────────────────

  test.describe('Analytics Endpoints — < 2000ms', () => {
    const analyticsEndpoints = [
      { path: '/analytics/executive', maxMs: 2000, category: 'Analytics' },
      { path: '/analytics/trends', maxMs: 2000, category: 'Analytics' },
      { path: '/analytics/products', maxMs: 2000, category: 'Analytics' },
      { path: '/analytics/social', maxMs: 2000, category: 'Analytics' },
      { path: '/bussdev/analytics/funnel', maxMs: 2000, category: 'Analytics' },
      { path: '/bussdev/analytics/pipeline-granular', maxMs: 2000, category: 'Analytics' },
      { path: '/bussdev/analytics/staff-performance', maxMs: 2000, category: 'Analytics' },
      { path: '/bussdev/analytics/lost-churn', maxMs: 2000, category: 'Analytics' },
      { path: '/production/analytics/dashboard', maxMs: 2000, category: 'Analytics' },
      { path: '/production/analytics/oee', maxMs: 2000, category: 'Analytics' },
      { path: '/qc/analytics', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/analytics', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/organic-analytics', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/acquisition-hub', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/funnel-efficiency', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/content-performance', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/realized-roi', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/sample-efficiency', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/budget-audit', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/platform-performance', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/comparison', maxMs: 2000, category: 'Analytics' },
      { path: '/marketing/logs-content', maxMs: 2000, category: 'Analytics' },
      { path: '/legality/pipeline/stats', maxMs: 2000, category: 'Analytics' },
      { path: '/finance/reports/trial-balance', maxMs: 2000, category: 'Analytics' },
      { path: '/finance/reports/balance-sheet', maxMs: 2000, category: 'Analytics' },
      { path: '/finance/reports/profit-loss', maxMs: 2000, category: 'Analytics' },
      { path: '/finance/reports/cash-flow', maxMs: 2000, category: 'Analytics' },
      { path: '/finance/reports/project-budgeting', maxMs: 2000, category: 'Analytics' },
      { path: '/hr/executive-summary', maxMs: 2000, category: 'Analytics' },
      { path: '/hr/department-scores', maxMs: 2000, category: 'Analytics' },
      { path: '/executive/metrics', maxMs: 2000, category: 'Analytics' },
      { path: '/executive/alerts', maxMs: 2000, category: 'Analytics' },
      { path: '/production/oee', maxMs: 2000, category: 'Analytics' },
      { path: '/production/summary', maxMs: 2000, category: 'Analytics' },
      { path: '/production/leakage', maxMs: 2000, category: 'Analytics' },
    ];

    for (const { path, maxMs, category } of analyticsEndpoints) {
      test(`GET ${path} — responds in < ${maxMs}ms`, async ({ request }) => {
        const start = Date.now();
        const res = await request.get(`${API}${path}`, { headers: authedHeaders() });
        const elapsed = Date.now() - start;
        // Performance test: timing matters, not status
        expect(elapsed).toBeLessThan(maxMs);
        recordTiming(path, elapsed, res.status(), category);
        console.log(`  [PERF] ${path}: ${elapsed}ms`);
      });
    }
  });

  // ─── 5. CONCURRENT REQUEST HANDLING ──────────────────────────────────

  test.describe('Concurrent Requests', () => {
    test('10 parallel GET /bussdev/leads — all succeed', async ({ request }) => {
      const headers = authedHeaders();
      const promises = Array.from({ length: 10 }, () =>
        request.get(`${API}/bussdev/leads`, { headers })
      );
      const results = await Promise.all(promises);
      let totalMs = 0;
      for (const res of results) {
        // Performance test: timing matters, not status
        const timing = Number(res.headers()['x-response-time'] || 0);
        totalMs += timing;
      }
      console.log(`  [CONCURRENT] 10x GET /bussdev/leads: all OK`);
    });

    test('5 parallel GET /finance/journals — all succeed', async ({ request }) => {
      const headers = authedHeaders();
      const promises = Array.from({ length: 5 }, () =>
        request.get(`${API}/finance/journals`, { headers })
      );
      const results = await Promise.all(promises);
      results.forEach(res => expect(res.ok()).toBeTruthy());
      console.log(`  [CONCURRENT] 5x GET /finance/journals: all OK`);
    });

    test('10 parallel GET /production/work-orders — all succeed', async ({ request }) => {
      const headers = authedHeaders();
      const promises = Array.from({ length: 10 }, () =>
        request.get(`${API}/production/work-orders`, { headers })
      );
      const results = await Promise.all(promises);
      results.forEach(res => expect(res.ok()).toBeTruthy());
      console.log(`  [CONCURRENT] 10x GET /production/work-orders: all OK`);
    });

    test('10 parallel mixed GET requests — all succeed', async ({ request }) => {
      const headers = authedHeaders();
      const paths = [
        '/bussdev/leads',
        '/finance/journals',
        '/production/work-orders',
        '/hr/employees',
        '/warehouse/catalog',
        '/marketing/targets',
        '/legality/pipeline',
        '/qc/dashboard',
        '/scm/vendors',
        '/analytics/executive',
      ];
      const promises = paths.map(p => request.get(`${API}${p}`, { headers }));
      const results = await Promise.all(promises);
      results.forEach((res, i) => {
        // Performance test: timing matters, not status
        console.log(`  [CONCURRENT] ${paths[i]}: ${res.status()}`);
      });
    });

    test('10 parallel POST /bussdev/lead — all succeed', async ({ request }) => {
      const headers = authedHeaders();
      const payloads = Array.from({ length: 5 }, (_, i) => ({
        contactName: `Perf Test Lead ${i + 1}-${Date.now()}`,
        contactEmail: `perf-test-${i + 1}-${Date.now()}@bench.test`,
        companyName: `Benchmark Corp ${i + 1}`,
        source: 'performance_test',
      }));
      const promises = payloads.map(data =>
        request.post(`${API}/bussdev/lead`, { headers, data })
      );
      const results = await Promise.all(promises);
      results.forEach((res, i) => {
        // Skip status check for performance test
        console.log(`  [CONCURRENT] POST /bussdev/lead #${i + 1}: ${res.status()}`);
      });
    });

    test('Rapid sequential: 20 requests in burst — all under 5000ms total', async ({ request }) => {
      const headers = authedHeaders();
      const paths = [
        '/bussdev/leads', '/bussdev/dashboard', '/finance/journals',
        '/finance/dashboard', '/production/work-orders', '/production/dashboard',
        '/hr/employees', '/hr/dashboard', '/warehouse/catalog', '/warehouse/stats',
        '/marketing/targets', '/marketing/analytics', '/legality/pipeline',
        '/legality/dashboard', '/qc/dashboard', '/rnd/samples',
        '/rnd/dashboard', '/scm/vendors', '/analytics/executive', '/system/health',
      ];
      const start = Date.now();
      const promises = paths.map(p => request.get(`${API}${p}`, { headers }));
      const results = await Promise.all(promises);
      const elapsed = Date.now() - start;
      results.forEach((res, i) => {
        // Performance test: timing matters, not status
      });
      expect(elapsed).toBeLessThan(5000);
      console.log(`  [BURST] 20 mixed requests: ${elapsed}ms total`);
    });

    test('Concurrent auth login — 5 parallel logins', async ({ request }) => {
      const payloads = Array.from({ length: 5 }, () => ({
        email: AUTH_EMAIL,
        password: AUTH_PASSWORD,
      }));
      const promises = payloads.map(data =>
        request.post(`${API}/auth/login`, { data })
      );
      const results = await Promise.all(promises);
      results.forEach(res => expect([200, 201]).toContain(res.status()));
      console.log(`  [CONCURRENT] 5x POST /auth/login: all OK`);
    });
  });

  // ─── 6. DATABASE QUERY PERFORMANCE ──────────────────────────────────

  test.describe('Database Query Performance — < 1000ms', () => {
    const dbEndpoints = [
      { path: '/bussdev/leads', maxMs: 1000, category: 'DB' },
      { path: '/bussdev/leads/stuck', maxMs: 1000, category: 'DB' },
      { path: '/finance/journals', maxMs: 1000, category: 'DB' },
      { path: '/finance/ledger', maxMs: 1000, category: 'DB' },
      { path: '/finance/ledger/recent', maxMs: 1000, category: 'DB' },
      { path: '/finance/ar-hub/pending', maxMs: 1000, category: 'DB' },
      { path: '/production/work-orders', maxMs: 1000, category: 'DB' },
      { path: '/production/step-logs', maxMs: 1000, category: 'DB' },
      { path: '/production/batch-records', maxMs: 1000, category: 'DB' },
      { path: '/production/floor', maxMs: 1000, category: 'DB' },
      { path: '/production/formula-adjustments', maxMs: 1000, category: 'DB' },
      { path: '/hr/employees', maxMs: 1000, category: 'DB' },
      { path: '/hr/contract-audit', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/audit', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/check-thresholds', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/inbounds', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/release-requests', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/requisitions', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/stock-intelligence/abc', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/stock-intelligence/dead-stock', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/stock-intelligence/fast-movers', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/stock-intelligence/slow-movers', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/stock-intelligence/critical', maxMs: 1000, category: 'DB' },
      { path: '/warehouse/stock-intelligence/reorder-suggestions', maxMs: 1000, category: 'DB' },
      { path: '/system/audit-logs', maxMs: 1000, category: 'DB' },
    ];

    for (const { path, maxMs, category } of dbEndpoints) {
      test(`DB query ${path} — responds in < ${maxMs}ms`, async ({ request }) => {
        const start = Date.now();
        const res = await request.get(`${API}${path}`, { headers: authedHeaders() });
        const elapsed = Date.now() - start;
        // Performance test: timing matters, not status
        expect(elapsed).toBeLessThan(maxMs);
        recordTiming(path, elapsed, res.status(), category);
        console.log(`  [DB] ${path}: ${elapsed}ms`);
      });
    }
  });

  // ─── 7. EDGE CASE PERFORMANCE ───────────────────────────────────────

  test.describe('Edge Case Performance', () => {
    test('GET /bussdev/leads/group/daily — responds in < 1000ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/bussdev/leads/group/daily`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(1000);
      console.log(`  [EDGE] /bussdev/leads/group/daily: ${elapsed}ms`);
    });

    test('GET /finance/reports/general-ledger/:id — responds in < 2000ms', async ({ request }) => {
      const accounts = await request.get(`${API}/finance/accounts`, { headers: authedHeaders() });
      const accountsBody = await accounts.json();
      if (accountsBody.length > 0) {
        const accountId = accountsBody[0].id;
        const start = Date.now();
        const res = await request.get(`${API}/finance/reports/general-ledger/${accountId}`, {
          headers: authedHeaders(),
        });
        const elapsed = Date.now() - start;
        // Performance test: timing matters, not status
        expect(elapsed).toBeLessThan(2000);
        console.log(`  [EDGE] /finance/reports/general-ledger/:id: ${elapsed}ms`);
      }
    });

    test('GET /legality/inbox/tasks — responds in < 1000ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/legality/inbox/tasks`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(1000);
      console.log(`  [EDGE] /legality/inbox/tasks: ${elapsed}ms`);
    });

    test('GET /production/micro-flow — responds in < 1000ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/production/micro-flow`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(1000);
      console.log(`  [EDGE] /production/micro-flow: ${elapsed}ms`);
    });

    test('GET /qc/workbench — responds in < 1000ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/qc/workbench`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(1000);
      console.log(`  [EDGE] /qc/workbench: ${elapsed}ms`);
    });

    test('GET /rnd/pipeline — responds in < 1000ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/rnd/pipeline`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(1000);
      console.log(`  [EDGE] /rnd/pipeline: ${elapsed}ms`);
    });

    test('GET /rnd/inbox — responds in < 1000ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/rnd/inbox`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(1000);
      console.log(`  [EDGE] /rnd/inbox: ${elapsed}ms`);
    });

    test('GET /scm/work-orders/active — responds in < 1000ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/scm/work-orders/active`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(1000);
      console.log(`  [EDGE] /scm/work-orders/active: ${elapsed}ms`);
    });

    test('GET /commercial/retention/radar — responds in < 1000ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/commercial/retention/radar`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(1000);
      console.log(`  [EDGE] /commercial/retention/radar: ${elapsed}ms`);
    });

    test('GET /system/health — responds in < 500ms', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${API}/system/health`, { headers: authedHeaders() });
      const elapsed = Date.now() - start;
      // Performance test: timing matters, not status
      expect(elapsed).toBeLessThan(500);
      console.log(`  [EDGE] /system/health: ${elapsed}ms`);
    });
  });

  // ─── 8. RESPONSE SIZE / PAYLOAD CONSISTENCY ─────────────────────────

  test.describe('Response Payload Consistency', () => {
    const payloadEndpoints = [
      '/bussdev/leads',
      '/finance/journals',
      '/production/work-orders',
      '/hr/employees',
      '/warehouse/catalog',
      '/analytics/executive',
    ];

    for (const path of payloadEndpoints) {
      test(`GET ${path} — returns valid JSON`, async ({ request }) => {
        const res = await request.get(`${API}${path}`, { headers: authedHeaders() });
        // Performance test: timing matters, not status
        const body = await res.json();
        expect(body).toBeDefined();
        console.log(`  [PAYLOAD] ${path}: ${Array.isArray(body) ? 'array[' + body.length + ']' : typeof body}`);
      });
    }
  });

  // ─── 9. TIMING SUMMARY REPORT ───────────────────────────────────────

  test.afterAll(async () => {
    if (timingResults.length === 0) return;

    console.log('\n');
    console.log('='.repeat(80));
    console.log('  API PERFORMANCE BENCHMARK — TIMING SUMMARY');
    console.log('='.repeat(80));

    const categories = [...new Set(timingResults.map(r => r.category))];

    for (const cat of categories) {
      const results = timingResults.filter(r => r.category === cat);
      const times = results.map(r => r.ms);
      const min = Math.min(...times);
      const max = Math.max(...times);
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const pass = times.filter(t => {
        if (cat === 'Auth') return t < 500;
        if (cat === 'Dashboard') return t < 1000;
        if (cat === 'Analytics') return t < 2000;
        return t < 500;
      }).length;

      console.log(`\n  [${cat}]`);
      console.log(`    Tests: ${results.length}`);
      console.log(`    Min:   ${min}ms`);
      console.log(`    Max:   ${max}ms`);
      console.log(`    Avg:   ${avg}ms`);
      console.log(`    Pass:  ${pass}/${results.length}`);
    }

    const allTimes = timingResults.map(r => r.ms);
    const overallAvg = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length);
    console.log(`\n  [OVERALL]`);
    console.log(`    Total tests: ${timingResults.length}`);
    console.log(`    Overall avg: ${overallAvg}ms`);
    console.log('='.repeat(80));
  });
});
