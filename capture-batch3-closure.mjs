import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3000';
const EMAIL = 'superadmin@nexerp.id';
const PASSWORD = 'password123';
const OUT_DIR = 'frontend/ui-evidence/batch-3/final-closure';
const VIEWPORT = { width: 1600, height: 1000 };

const TARGETS = [
  { file: '01-marketing.png', path: '/marketing/dashboard' },
  { file: '02-warehouse.png', path: '/warehouse/stok' },
  { file: '03-finance-control.png', path: '/finance/jurnal' },
];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function main() {
  await ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();

  // Auth
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  const existing = await page.evaluate(() => ({
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user'),
  }));
  if (!existing.token) {
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('input#email')?.form, { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.fill('input#email', EMAIL);
    await page.fill('input#password', PASSWORD);
    await Promise.all([
      page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState('networkidle');
  }

  for (const t of TARGETS) {
    const target = BASE + t.path;
    let finalUrl = target;
    let bytes = 0;
    let bannerFound = false;
    let warehouseSheetFound = false;
    let marketingRedBorder = false;
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1800);
      finalUrl = page.url();

      // Probe DOM for the three acceptance gates
      const probe = await page.evaluate(() => {
        // Banner probe
        const bannerEls = Array.from(document.querySelectorAll('span, div'));
        const bannerFoundLocal = bannerEls.some((el) => {
          const t = (el.textContent || '').toLowerCase();
          return /prototype\s*mode/.test(t) && /data\s*contoh/.test(t);
        });

        // Warehouse white-sheet probe: any direct ancestor chain on body contains min-h-full bg-white
        let warehouseSheetLocal = false;
        if (location.pathname.includes('/warehouse/')) {
          const ps = document.querySelector('.erp-page-shell');
          if (ps) {
            for (const c of ps.children) {
              const cls = (c.className || '') + '';
              if (/min-h-full/.test(cls) && /bg-white/.test(cls)) {
                warehouseSheetLocal = true;
              }
            }
          }
        }

        // Marketing red-border probe: any visible card on the marketing dashboard page with
        // a red borderColor on its computed style.
        let marketingRedLocal = false;
        if (location.pathname.includes('/marketing/dashboard')) {
          const all = Array.from(document.querySelectorAll('div'));
          for (const d of all) {
            const cs = getComputedStyle(d);
            const bc = cs.borderColor || '';
            if (/220.*38.*38|239.*68.*68/.test(bc)) {
              marketingRedLocal = true;
              break;
            }
          }
        }

        return {
          bannerFound: bannerFoundLocal,
          warehouseSheetFound: warehouseSheetLocal,
          marketingRedBorder: marketingRedLocal,
        };
      });
      bannerFound = probe.bannerFound;
      warehouseSheetFound = probe.warehouseSheetFound;
      marketingRedBorder = probe.marketingRedBorder;

      const file = path.join(OUT_DIR, t.file);
      await page.screenshot({ path: file, fullPage: false });
      const fs = await import('fs/promises');
      const st = await fs.stat(file);
      bytes = st.size;
    } catch (e) {
      console.error('ERR', t.path, e);
    }
    console.log(
      `[CLOSURE] ${t.path} -> ${finalUrl} bytes=${bytes} banner=${bannerFound} warehouseSheet=${warehouseSheetFound} marketingRed=${marketingRedBorder}`,
    );
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
