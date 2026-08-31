/**
 * Batch 1 visual verification (gate pass 2) — capture 5 representative pages
 * after canonicalization. Viewport: 1600x1000, light theme, 100% browser zoom.
 *
 * Pages:
 *   01-busdev    /bussdev/client-manager      (BUSDEV   Pipeline: KPI + Tabs + Tables + Forms)
 *   02-finance   /finance/jurnal              (FINANCE  Jurnal & COA: KPI + Tabs + DataTable)
 *   03-scm       /scm/pembelian               (SCM      Pembelian: Tabs + KPI + DataTable)
 *   04-production /production/operations      (PRODUCTION Operasional Produksi: KPI + Tabs + Dialog)
 *   05-warehouse  /warehouse/stok             (WAREHOUSE Stok Gudang: KPI + Tabs + Filter + Table)
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "ui-evidence", "batch-1", "after");
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = process.env.BATCH1_BASE_URL || "http://localhost:3001";
const EMAIL = process.env.BATCH1_EMAIL || "superadmin@nexerp.id";
const PASSWORD = process.env.BATCH1_PASSWORD || "password123";

const PAGES = [
  { id: "01-busdev",     path: "/bussdev/client-manager" },
  { id: "02-finance",    path: "/finance/jurnal" },
  { id: "03-scm",        path: "/scm/pembelian" },
  { id: "04-production", path: "/production/operations" },
  { id: "05-warehouse",  path: "/warehouse/stok" },
];

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const pwInput = page.locator('input[type="password"], input[name="password"]').first();
  if (await emailInput.count()) {
    await emailInput.fill(EMAIL);
    await pwInput.fill(PASSWORD);
    const submit = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    await submit.click();
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  }
}

async function capture(page, target) {
  console.log(`capturing ${target.id} → ${target.path}`);
  await page.goto(`${BASE_URL}${target.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Wait for either content or empty-state to appear
  await page.waitForTimeout(4500);
  const file = path.join(OUT_DIR, `${target.id}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  saved → ${file}`);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  // Force light theme + hide prototype banner via the env-driven layout branch.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("theme", "light");
    } catch {}
  });

  try {
    await login(page);
  } catch (err) {
    console.warn(`login step: ${err.message}`);
  }

  for (const target of PAGES) {
    try {
      await capture(page, target);
    } catch (err) {
      console.error(`failed ${target.id}: ${err.message}`);
    }
  }

  await browser.close();
  console.log("done");
})();
