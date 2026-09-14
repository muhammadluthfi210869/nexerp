// W3b — Check 401 source + auth'd flow
import { chromium } from 'playwright-core';
import fs from 'fs';

const PRODUCTION = 'https://103.93.134.215';
const TOKEN = fs.readFileSync('C:/tmp/token.txt', 'utf8').trim();

async function findChromium() {
  const dirs = [process.env.LOCALAPPDATA + '/ms-playwright', 'C:/Users/Luthfi/AppData/Local/ms-playwright'];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const e of fs.readdirSync(d).filter(x => x.startsWith('chromium-'))) {
      for (const sub of ['chrome-win64/chrome.exe']) {
        const exe = `${d}/${e}/${sub}`;
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
}

(async () => {
  const exe = await findChromium();
  const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--ignore-certificate-errors'] });

  // ===== A) UNAUTHENTICATED: check what 401 =====
  console.log('=== A) Unauthenticated ===');
  const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true });
  const page1 = await ctx1.newPage();
  const reqs401 = [];
  page1.on('response', resp => {
    if (resp.status() === 401) reqs401.push(resp.url());
  });
  await page1.goto(PRODUCTION + '/marketing/management-task/overview', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('401 sources:', reqs401);

  // ===== B) AUTHENTICATED: seed token in localStorage =====
  console.log('=== B) Authenticated (seed token) ===');
  const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true });
  // Inject token via addInitScript before any page loads
  await ctx2.addInitScript((tk) => {
    localStorage.setItem('nexerp-auth-token', tk);
    localStorage.setItem('auth_token', tk);
  }, TOKEN);
  const page2 = await ctx2.newPage();
  const errs = [];
  const fails = [];
  page2.on('console', m => { if (m.type()==='error') errs.push(m.text().substring(0,150)); });
  page2.on('pageerror', e => errs.push('PAGE: '+e.message.substring(0,150)));
  page2.on('requestfailed', r => fails.push(r.url() + ' -> ' + r.failure()?.errorText));

  const pages = ['/marketing/management-task/overview', '/marketing/reports/dreamlab', '/marketing/omnicrm', '/samples/omni-crm'];
  const results = [];
  for (const p of pages) {
    errs.length = 0; fails.length = 0;
    const r = await page2.goto(PRODUCTION + p, { waitUntil: 'networkidle', timeout: 20000 }).catch(e => null);
    const status = r?.status() ?? 0;
    const body = await page2.evaluate(() => document.body.innerText.substring(0, 300)).catch(() => '');
    await page2.waitForTimeout(2000); // let async loads settle
    results.push({ path: p, status, body: body.substring(0, 200), errs: [...errs], fails: [...fails] });
  }
  for (const r of results) {
    console.log(r.path + ' [' + r.status + ']: errs=' + r.errs.length + ' fails=' + r.fails.length);
    if (r.errs.length) console.log('  err: ' + r.errs[0]);
    if (r.fails.length) console.log('  fail: ' + r.fails[0]);
    console.log('  body: ' + r.body.substring(0, 100).replace(/\n/g, ' | '));
  }

  await browser.close();
})();
