import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3000';
const EMAIL = 'superadmin@nexerp.id';
const PASSWORD = 'password123';
const OUT_DIR = 'frontend/ui-evidence/batch-3';

const VIEWPORT = { width: 1600, height: 1000 };

// Map of representative routes
const INITIAL_ROUTES = [
  { file: '01-executive.png', path: '/executive/audit' },
  { file: '02-marketing.png', path: '/marketing/dashboard' },
  { file: '03-busdev.png', path: '/bussdev/dashboard' },
  { file: '04-finance.png', path: '/finance/jurnal' },
  { file: '05-rnd.png', path: '/rnd/repository' },
  { file: '06-scm.png', path: '/scm/pembelian' },
  { file: '07-production.png', path: '/production/operations' },
  { file: '08-qc.png', path: '/qc/coa' },
  { file: '09-warehouse.png', path: '/warehouse/stok' },
  { file: '10-legal.png', path: '/legality/dashboard' },
];

const SIDEBAR_ROUTES = [
  // Executive
  { module: 'Executive', path: '/executive/dashboard', name: 'Dasbor Eksekutif' },
  // Digital Marketing
  { module: 'Marketing', path: '/marketing/dashboard', name: 'Dasbor Marketing' },
  { module: 'Marketing', path: '/marketing/input', name: 'Input Kampanye' },
  { module: 'Marketing', path: '/marketing/management-task', name: 'Tugas Marketing' },
  { module: 'Marketing', path: '/marketing/whatsapp-sales', name: 'WhatsApp Sales' },
  { module: 'Marketing', path: '/marketing/logs', name: 'Riwayat Lead' },
  // BusDev
  { module: 'BusDev', path: '/bussdev/dashboard', name: 'Dasbor BusDev' },
  { module: 'BusDev', path: '/bussdev/pipeline', name: 'Pipeline Penjualan' },
  { module: 'BusDev', path: '/bussdev/intake', name: 'Form Intake Lead' },
  { module: 'BusDev', path: '/bussdev/lost', name: 'Lost' },
  // Finance
  { module: 'Finance', path: '/finance/dashboard', name: 'Dasbor Keuangan' },
  { module: 'Finance', path: '/finance/kas', name: 'Kas & Bank' },
  { module: 'Finance', path: '/finance/jurnal', name: 'Jurnal & COA' },
  { module: 'Finance', path: '/finance/dp', name: 'DP' },
  { module: 'Finance', path: '/finance/bayar', name: 'Pembayaran' },
  { module: 'Finance', path: '/finance/piutang', name: 'Piutang & Hutang' },
  { module: 'Finance', path: '/finance/fund', name: 'Dana & Persetujuan' },
  { module: 'Finance', path: '/finance/reports', name: 'Laporan Keuangan' },
  // Legal
  { module: 'Legal', path: '/legality/dashboard', name: 'Dasbor Legal/APJ' },
  { module: 'Legal', path: '/legality/pipeline', name: 'Pipeline Legalitas' },
  { module: 'Legal', path: '/legality/inbox', name: 'Inbox Compliance' },
  // RnD
  { module: 'RnD', path: '/rnd/pipeline', name: 'Pipeline Aktif' },
  { module: 'RnD', path: '/rnd/repository', name: 'Repository Formula' },
  { module: 'RnD', path: '/rnd/inbox', name: 'Inbox Sampel' },
  { module: 'RnD', path: '/rnd/dashboard', name: 'Analitik Formula' },
  // SCM
  { module: 'SCM', path: '/scm/dashboard', name: 'Dasbor SCM' },
  { module: 'SCM', path: '/scm/pembelian', name: 'Pembelian' },
  { module: 'SCM', path: '/scm/kebutuhan-barang', name: 'Kebutuhan Barang' },
  { module: 'SCM', path: '/master/goods', name: 'Barang' },
  { module: 'SCM', path: '/master/suppliers', name: 'Supplier' },
  // Production
  { module: 'Production', path: '/production', name: 'Dasbor Produksi' },
  { module: 'Production', path: '/production/schedule', name: 'Penjadwalan' },
  { module: 'Production', path: '/production/operations', name: 'Operasional' },
  { module: 'Production', path: '/production/work-orders', name: 'Work Orders' },
  { module: 'Production', path: '/production/batch-records', name: 'Batch Records' },
  { module: 'Production', path: '/production/warehouse', name: 'Gudang Produksi' },
  { module: 'Production', path: '/production/audit', name: 'Audit Produksi' },
  { module: 'Production', path: '/production/leakage', name: 'Leakage' },
  // QC
  { module: 'QC', path: '/qc/dashboard', name: 'Dasbor QC' },
  { module: 'QC', path: '/qc/workbench', name: 'Workbench QC' },
  { module: 'QC', path: '/qc/inspections', name: 'Inspeksi Lab' },
  { module: 'QC', path: '/qc/stability', name: 'Uji Stabilitas' },
  { module: 'QC', path: '/qc/coa', name: 'Pusat CoA' },
  { module: 'QC', path: '/qc/report', name: 'Report QC' },
  // Warehouse
  { module: 'Warehouse', path: '/warehouse', name: 'Dasbor Gudang' },
  { module: 'Warehouse', path: '/warehouse/gudang', name: 'Gudang' },
  { module: 'Warehouse', path: '/warehouse/stok', name: 'Stok' },
  { module: 'Warehouse', path: '/warehouse/inbound', name: 'Inbound' },
  { module: 'Warehouse', path: '/logistics/shipments', name: 'Shipment' },
  { module: 'Warehouse', path: '/master/warehouses', name: 'Data Gudang' },
];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  // If already authenticated, navigate to dashboard and bail out
  const existing = await page.evaluate(() => ({
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user'),
  }));
  if (existing.token && existing.user) {
    await page.goto(BASE + '/executive/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    return;
  }
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  // Wait for hydration so the React Hook Form handler is attached
  await page.waitForFunction(() => {
    const inp = document.querySelector('input#email');
    return inp && inp.form;
  }, { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.fill('input#email', EMAIL);
  await page.fill('input#password', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState('networkidle', { timeout: 30000 });
}

async function probeRoute(page, route) {
  const startUrl = BASE + route.path;
  let finalUrl = startUrl;
  let error = null;
  let status = null;
  let html = '';
  let text = '';
  try {
    const resp = await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    status = resp ? resp.status() : null;
    // Wait briefly for client-side data to land
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(800);
    finalUrl = page.url();
    html = await page.content();
    text = (await page.locator('body').innerText({ timeout: 5000 }).catch(() => '')).slice(0, 4000);
  } catch (e) {
    error = (e && e.message) || String(e);
  }

  const onLogin = finalUrl.includes('/login');
  const hasSpinner = /loading\.\.\.|memuat|loading/i.test(text.slice(0, 200));
  const errorBoundary = /Application error|Unhandled Runtime Error|TypeError|ReferenceError/i.test(text.slice(0, 500));
  const nullTokens = /\bnull\s*%|\bundefined\b|\bNaN\b/i.test(text);
  // Loose check for page-specific content: must NOT be just login form
  const looksLikeLogin = /Corporate Email|Secret Key|Initialize Session/i.test(text.slice(0, 500));

  return {
    module: route.module,
    name: route.name,
    path: route.path,
    finalUrl,
    auth_ok: !onLogin,
    page_404: status === 404,
    page_500: status >= 500,
    render_ok: !onLogin && !errorBoundary,
    endless_loading: hasSpinner && text.length < 200,
    runtime_error: !!errorBoundary,
    error,
    status,
    looks_like_login: looksLikeLogin,
    null_tokens: nullTokens,
    text_excerpt: text.slice(0, 200).replace(/\s+/g, ' '),
    text_length: text.length,
  };
}

async function captureInitial(page) {
  const initialDir = path.join(OUT_DIR, 'initial');
  await ensureDir(initialDir);
  const results = [];
  for (const r of INITIAL_ROUTES) {
    const target = BASE + r.path;
    let finalUrl = target;
    let ok = false;
    let bytes = 0;
    try {
      const resp = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1200);
      finalUrl = page.url();
      const onLogin = finalUrl.includes('/login');
      const file = path.join(initialDir, r.file);
      await page.screenshot({ path: file, fullPage: false });
      bytes = (await import('fs/promises')).then ? 0 : 0;
      try {
        const fs = await import('fs/promises');
        const st = await fs.stat(file);
        bytes = st.size;
      } catch {}
      ok = !onLogin && bytes > 5000;
    } catch (e) {
      ok = false;
    }
    results.push({ file: r.file, path: r.path, finalUrl, ok, bytes });
    console.log(`[INIT] ${r.path} → ${finalUrl} ${ok ? '✓' : '�'} (${bytes} bytes)`);
  }
  return results;
}

async function captureFinal(page) {
  const finalDir = path.join(OUT_DIR, 'final');
  await ensureDir(finalDir);
  const results = [];
  for (const r of INITIAL_ROUTES) {
    const target = BASE + r.path;
    let finalUrl = target;
    let ok = false;
    let bytes = 0;
    try {
      const resp = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1200);
      finalUrl = page.url();
      const onLogin = finalUrl.includes('/login');
      const file = path.join(finalDir, r.file);
      await page.screenshot({ path: file, fullPage: false });
      try {
        const fs = await import('fs/promises');
        const st = await fs.stat(file);
        bytes = st.size;
      } catch {}
      ok = !onLogin && bytes > 5000;
    } catch (e) {
      ok = false;
    }
    results.push({ file: r.file, path: r.path, finalUrl, ok, bytes });
    console.log(`[FINAL] ${r.path} → ${finalUrl} ${ok ? '✓' : '✗'} (${bytes} bytes)`);
  }
  return results;
}

async function main() {
  await ensureDir(OUT_DIR);
  await ensureDir(path.join(OUT_DIR, 'screenshots'));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();

  console.log('=== AUTHENTICATE ===');
  await login(page);
  console.log('Authenticated at:', page.url());

  const mode = process.argv[2] || 'initial';
  if (mode === 'initial') {
    const r = await captureInitial(page);
    console.log('\n=== INITIAL CAPTURE DONE ===');
    console.log(JSON.stringify(r, null, 2));
  } else if (mode === 'final') {
    const r = await captureFinal(page);
    console.log('\n=== FINAL CAPTURE DONE ===');
    console.log(JSON.stringify(r, null, 2));
  } else if (mode === 'crawl') {
    const crawl = [];
    for (const r of SIDEBAR_ROUTES) {
      const probe = await probeRoute(page, r);
      crawl.push(probe);
      console.log(`[CRAWL] ${r.module}/${r.name} → ${probe.finalUrl} auth=${probe.auth_ok} render=${probe.render_ok} ${probe.error ? 'ERR:' + probe.error : ''}`);
    }
    const fs = await import('fs/promises');
    await fs.writeFile(path.join(OUT_DIR, 'route-crawl.json'), JSON.stringify(crawl, null, 2));
    console.log('\n=== CRAWL DONE ===');
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
