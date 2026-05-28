import { test, expect, Page } from '@playwright/test';

const FRONTEND = 'http://localhost:3000';
const API = 'http://localhost:3002';

interface AuditResult {
  route: string;
  status: 'OK' | 'BLANK' | 'ERROR' | 'TIMEOUT' | 'SKIPPED';
  loadMs: number;
  errors: string[];
  bodyChildren: number;
}

const auditResults: AuditResult[] = [];

let AUTH_TOKEN = '';

async function loginViaApi(page: Page): Promise<void> {
  const res = await page.request.post(`${API}/auth/login`, {
    data: { email: 'admin@nexerp.id', password: 'password123' },
  });
  expect(res.status()).toBe(201);
  const { access_token } = await res.json();
  AUTH_TOKEN = access_token;

  // Use addInitScript to inject token before any page JS runs
  await page.addInitScript((token: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('token', token);
  }, access_token);

  await page.goto(`${FRONTEND}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
}

async function auditPage(page: Page, route: string): Promise<AuditResult> {
  const start = Date.now();
  const errors: string[] = [];

  const consoleHandler = (msg: any) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  const pageErrorHandler = (err: Error) => errors.push(err.message);

  page.on('console', consoleHandler);
  page.on('pageerror', pageErrorHandler);

  let navigated = false;
  try {
    await page.goto(`${FRONTEND}${route}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    navigated = true;
  } catch {
    // timeout — still try to check what rendered
    navigated = true;
  }

  await page.waitForTimeout(2500);

  const bodyChildren = await page.locator('body > *').count();
  const loadMs = Date.now() - start;

  page.removeListener('console', consoleHandler);
  page.removeListener('pageerror', pageErrorHandler);

  if (!navigated) {
    return { route, status: 'TIMEOUT', loadMs, errors, bodyChildren: 0 };
  }
  if (bodyChildren === 0) {
    return { route, status: 'BLANK', loadMs, errors, bodyChildren };
  }
  if (errors.length > 0) {
    return { route, status: 'ERROR', loadMs, errors, bodyChildren };
  }
  return { route, status: 'OK', loadMs, errors, bodyChildren };
}

const ALL_ROUTES: string[] = [
  // ============ DASHBOARD (9) ============
  '/dashboard',
  '/dashboard/commercial',
  '/dashboard/finance',
  '/dashboard/fulfillment',
  '/dashboard/production-planning',
  '/dashboard/production-floor',
  '/dashboard/warehouse',
  '/dashboard/qc',
  '/dashboard/super-admin',

  // ============ BUSSDEV (13) ============
  '/bussdev/dashboard',
  '/bussdev/client-manager',
  '/bussdev/intake',
  '/bussdev/pipeline-v2',
  '/bussdev/sales-target',
  '/bussdev/sample-sales',
  '/bussdev/sample-sales/input',
  '/bussdev/sample-tracking',
  '/bussdev/guest-book',
  '/bussdev/down-payment',
  '/bussdev/lost',
  '/bussdev/retur-penjualan',
  '/bussdev/retention-engine',

  // ============ FINANCE (18) ============
  '/finance/dashboard',
  '/finance/transactions',
  '/finance/ledger',
  '/finance/invoices',
  '/finance/bills',
  '/finance/cash-in',
  '/finance/cash-out',
  '/finance/approvals',
  '/finance/reports',
  '/finance/reports/trial-balance',
  '/finance/reports/balance-sheet',
  '/finance/sales-orders',
  '/finance/bayar-sample',
  '/finance/bayar-penjualan',
  '/finance/dp-penjualan',
  '/finance/fund-requests',
  '/finance/ar-hub',
  '/finance/accounting/coa',

  // ============ SCM (10) ============
  '/scm/dashboard',
  '/scm/purchasing',
  '/scm/purchase-requests',
  '/scm/purchase-returns',
  '/scm/receiving',
  '/scm/mrp',
  '/scm/vendors/performance',
  '/scm/warehouse/requisition',
  '/scm/purchasing/down-payment',
  '/scm/purchasing/payments',

  // ============ WAREHOUSE (10) ============
  '/warehouse',
  '/warehouse/inbound',
  '/warehouse/opname',
  '/warehouse/adjustment',
  '/warehouse/transfers',
  '/warehouse/release',
  '/warehouse/hub',
  '/warehouse/map',
  '/warehouse/workstation',
  '/warehouse/mutasi-stok',

  // ============ PRODUCTION (14) ============
  '/production',
  '/production/dashboard',
  '/production/floor',
  '/production/schedule',
  '/production/schedules',
  '/production/work-orders',
  '/production/batch-records',
  '/production/formula-adjustment',
  '/production/leakage',
  '/production/warehouse',
  '/production/analytics',
  '/production/audit',
  '/production/terminal',
  '/production/terminal/reconciliation',

  // ============ R&D (7) ============
  '/rnd/dashboard',
  '/rnd/pipeline',
  '/rnd/repository',
  '/rnd/revision-tracker',
  '/rnd/master-inci',
  '/rnd/lab-test',
  '/rnd/inbox',

  // ============ QC (8) ============
  '/qc/dashboard',
  '/qc/workbench',
  '/qc/inspections',
  '/qc/stability',
  '/qc/report',
  '/qc/coa',
  '/qc/checklist-category',
  '/qc/checklist/tracking',

  // ============ LEGALITY (7) ============
  '/legality/dashboard',
  '/legality/permits',
  '/legality/pipeline',
  '/legality/records',
  '/legality/input',
  '/legality/inbox',
  '/legality/master-inci',

  // ============ EXECUTIVE (3) ============
  '/executive/dashboard',
  '/executive/notifications',
  '/executive/audit',

  // ============ HR (6) ============
  '/hr',
  '/hr/dashboard',
  '/hr/attendance',
  '/hr/payroll',
  '/hr/recruitment',
  '/hr/kpi',

  // ============ MARKETING (5) ============
  '/marketing/dashboard',
  '/marketing/crm-leads',
  '/marketing/landing-tracker',
  '/marketing/input',
  '/marketing/logs',

  // ============ LOGISTICS (4) ============
  '/logistics/delivery-orders',
  '/logistics/fleet',
  '/logistics/outbound',
  '/logistics/logs',

  // ============ CREATIVE (1) ============
  '/creative/board',

  // ============ SYSTEM (4) ============
  '/system/request-list',
  '/system/error-dashboard',
  '/system/change-requests',
  '/system/audit-ledger',

  // ============ MASTER (7) ============
  '/master',
  '/master/goods',
  '/master/suppliers',
  '/master/customers',
  '/master/personnel',
  '/master/warehouses',
  '/master/categories',

  // ============ USER (2) ============
  '/my-requests',
  '/user/todo',

  // ============ DNA PREVIEW (1) ============
  '/dna-preview',
];

function printSummary(): void {
  const ok = auditResults.filter((r) => r.status === 'OK').length;
  const blank = auditResults.filter((r) => r.status === 'BLANK').length;
  const err = auditResults.filter((r) => r.status === 'ERROR').length;
  const timeout = auditResults.filter((r) => r.status === 'TIMEOUT').length;
  const skipped = auditResults.filter((r) => r.status === 'SKIPPED').length;
  const total = auditResults.length;

  console.log('\n' + '='.repeat(70));
  console.log(`  PAGE AUDIT SUMMARY — ${total} routes tested`);
  console.log('='.repeat(70));
  console.log(`  ✅ OK:       ${ok}`);
  console.log(`  ⚠️  BLANK:    ${blank}`);
  console.log(`  ❌ ERRORS:   ${err}`);
  console.log(`  ⏱️  TIMEOUT:  ${timeout}`);
  console.log(`  ⏭️  SKIPPED:  ${skipped}`);
  console.log('='.repeat(70));

  const problemRoutes = auditResults.filter((r) => r.status !== 'OK' && r.status !== 'SKIPPED');
  if (problemRoutes.length > 0) {
    console.log('\n  PROBLEM ROUTES:');
    for (const r of problemRoutes) {
      const emoji = r.status === 'BLANK' ? '⚠️' : r.status === 'ERROR' ? '❌' : '⏱️';
      console.log(`  ${emoji} [${r.status}] ${r.route} — ${r.loadMs}ms, bodyChildren=${r.bodyChildren}`);
      if (r.errors.length > 0) {
        console.log(`     Errors: ${r.errors.slice(0, 2).join(' | ')}`);
      }
    }
  }

  const slowRoutes = auditResults.filter((r) => r.loadMs > 10000);
  if (slowRoutes.length > 0) {
    console.log('\n  SLOW ROUTES (>10s):');
    for (const r of slowRoutes) {
      console.log(`  🐌 ${r.route} — ${r.loadMs}ms`);
    }
  }

  console.log('');
}

function printRouteResult(result: AuditResult, index: number, total: number): void {
  const emoji = result.status === 'OK' ? '✅' : result.status === 'BLANK' ? '⚠️' : result.status === 'ERROR' ? '❌' : result.status === 'TIMEOUT' ? '⏱️' : '⏭️';
  console.log(`  [${String(index + 1).padStart(3, '0')}/${total}] ${emoji} ${result.status.padEnd(7)} ${result.loadMs.toString().padStart(5)}ms | ${result.route}`);
}

test.describe('ERP Page Audit — All Routes', () => {
  test.describe.configure({ mode: 'serial', timeout: 900000 });

  test('AUTH: Login via API and inject token', async ({ page }) => {
    test.setTimeout(120000);
    console.log('\n[AUTH] Authenticating via API...');
    await loginViaApi(page);
    const heading = page.locator('h1, h2, h3').first();
    const text = await heading.textContent().catch(() => null);
    console.log(`[AUTH] Dashboard loaded, heading: "${text}"`);
    expect(text, 'Dashboard should show a heading').toBeTruthy();
  });

  for (let i = 0; i < ALL_ROUTES.length; i++) {
    const route = ALL_ROUTES[i];
    test(`AUDIT [${i + 1}/${ALL_ROUTES.length}]: ${route}`, async ({ page }) => {
      test.setTimeout(60000);

      // Re-inject token init script for this test (fresh page context)
      await page.addInitScript((token: string) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('token', token);
      }, AUTH_TOKEN);

      const result = await auditPage(page, route);
      auditResults.push(result);
      printRouteResult(result, i, ALL_ROUTES.length);

      expect(result.bodyChildren, `${route} rendered a blank page (0 body children)`).toBeGreaterThan(0);

      if (result.errors.length > 0) {
        console.warn(`  ⚠ Console errors on ${route}: ${result.errors.slice(0, 3).join(' | ')}`);
      }
    });
  }

  test('REPORT: Print final audit summary', async () => {
    printSummary();
    const ok = auditResults.filter((r) => r.status === 'OK').length;
    const total = auditResults.length;
    const pct = ((ok / total) * 100).toFixed(1);
    console.log(`  PASS RATE: ${ok}/${total} = ${pct}%`);
    expect(ok, `Only ${ok}/${total} pages rendered OK`).toBe(total);
  });
});
