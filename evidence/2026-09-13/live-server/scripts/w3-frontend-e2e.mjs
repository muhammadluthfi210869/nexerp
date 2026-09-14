// W3 — Frontend E2E Production Verification
// Uses installed Chromium via playwright-core
// Production URL: https://103.93.134.215 (DNS for erp.dreamlab.id broken locally)

import { chromium } from 'playwright-core';
import fs from 'fs';

const PRODUCTION = 'https://103.93.134.215';
const TOKEN = fs.readFileSync('C:/tmp/token.txt', 'utf8').trim();
const REPORT = 'C:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO/evidence/2026-09-13/live-server/w3-results.json';

const PAGES = [
  '/login',
  '/',
  '/marketing/management-task/overview',
  '/marketing/management-task/achmad-bagir',
  '/marketing/reports/dreamlab',
  '/marketing/reports/toribio',
  '/marketing/social-tracker',
  '/marketing/social-tracker/reporting',
  '/marketing/social-tracker/integrations',
  '/marketing/omnicrm',
  '/samples/omni-crm',
];

async function findChromium() {
  const dirs = [
    process.env.LOCALAPPDATA + '/ms-playwright',
    'C:/Users/Luthfi/AppData/Local/ms-playwright',
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    const entries = fs.readdirSync(d);
    for (const e of entries.filter(x => x.startsWith('chromium-'))) {
      for (const sub of ['chrome-win/chrome.exe', 'chrome-win64/chrome.exe', 'chrome-linux/chrome']) {
        const exe = `${d}/${e}/${sub}`;
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  return null;
}

(async () => {
  const exe = await findChromium();
  if (!exe) {
    console.log('NO_CHROMIUM');
    process.exit(1);
  }

  const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--ignore-certificate-errors', '--ignore-ssl-errors'] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const results = { pages: [], summary: { pass: 0, fail: 0, total: PAGES.length } };

  // Capture errors per page
  async function visit(p) {
    const errors = [];
    const networkFailures = [];
    const consoleErrors = [];

    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.removeAllListeners('requestfailed');

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 200));
    });
    page.on('pageerror', err => consoleErrors.push('PAGE:' + err.message.substring(0, 200)));
    page.on('requestfailed', req => networkFailures.push(req.url() + ' -> ' + req.failure()?.errorText));

    try {
      const resp = await page.goto(PRODUCTION + p, { waitUntil: 'networkidle', timeout: 20000 });
      const status = resp?.status() ?? 0;
      const title = await page.title().catch(() => '');
      const url = page.url();
      const html = await page.content();
      const hasStub = /stub|coming soon|placeholder/i.test(html) && !/test|stubborn/i.test(html);
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));

      results.pages.push({
        path: p,
        status,
        title,
        finalUrl: url,
        hasStub,
        bodyPreview: bodyText.substring(0, 200),
        consoleErrors: consoleErrors.slice(0, 5),
        networkFailures: networkFailures.slice(0, 5),
      });

      if (status === 200 || status === 307) results.summary.pass++;
      else results.summary.fail++;
    } catch (e) {
      results.pages.push({
        path: p,
        error: e.message.substring(0, 200),
        consoleErrors: consoleErrors.slice(0, 5),
        networkFailures: networkFailures.slice(0, 5),
      });
      results.summary.fail++;
    }
  }

  for (const p of PAGES) {
    await visit(p);
  }

  await browser.close();
  fs.writeFileSync(REPORT, JSON.stringify(results, null, 2));
  console.log(`PASS=${results.summary.pass} FAIL=${results.summary.fail} TOTAL=${results.summary.total}`);
  console.log('Report:', REPORT);
})();
