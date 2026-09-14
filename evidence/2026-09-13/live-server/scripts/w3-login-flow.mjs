// W3c — Login via UI then test pages
import { chromium } from 'playwright-core';
import fs from 'fs';

const PRODUCTION = 'https://103.93.134.215';

async function findChromium() {
  const dirs = [process.env.LOCALAPPDATA + '/ms-playwright', 'C:/Users/Luthfi/AppData/Local/ms-playwright'];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const e of fs.readdirSync(d).filter(x => x.startsWith('chromium-'))) {
      const exe = `${d}/${e}/chrome-win64/chrome.exe`;
      if (fs.existsSync(exe)) return exe;
    }
  }
}

(async () => {
  const exe = await findChromium();
  const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const errs = [];
  const fails = [];
  const reqs = [];
  page.on('console', m => { if (m.type()==='error') errs.push(m.text().substring(0,150)); });
  page.on('pageerror', e => errs.push('PAGE: '+e.message.substring(0,150)));
  page.on('requestfailed', r => fails.push(r.url() + ' -> ' + r.failure()?.errorText));
  page.on('response', r => { if (r.status() >= 400) reqs.push(r.status() + ' ' + r.url()); });

  // Step 1: Go to login page
  console.log('1. Navigate to /login');
  await page.goto(PRODUCTION + '/login', { waitUntil: 'networkidle', timeout: 20000 });

  // Step 2: Fill form
  console.log('2. Fill credentials');
  // Look for email + password inputs
  const inputs = await page.$$('input');
  console.log('   inputs found:', inputs.length);
  let emailFilled = false, passFilled = false;
  for (const inp of inputs) {
    const type = await inp.getAttribute('type');
    const name = await inp.getAttribute('name');
    if (type === 'email' || name?.includes('email') || name?.includes('user')) {
      await inp.fill('admin@nexerp.id');
      emailFilled = true;
    } else if (type === 'password' || name?.includes('pass')) {
      await inp.fill('password123');
      passFilled = true;
    }
  }
  console.log('   emailFilled=' + emailFilled + ' passFilled=' + passFilled);

  // Step 3: Submit
  console.log('3. Submit form');
  const submit = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign")');
  if (submit) {
    await submit.click();
    await page.waitForTimeout(5000);
    console.log('   URL after submit:', page.url());
  } else {
    console.log('   No submit button found');
  }

  // Step 4: Visit protected pages
  const pages = ['/marketing/management-task/overview', '/marketing/reports/dreamlab', '/marketing/omnicrm', '/samples/omni-crm', '/marketing/social-tracker'];
  const results = [];
  for (const p of pages) {
    errs.length = 0; fails.length = 0; reqs.length = 0;
    const r = await page.goto(PRODUCTION + p, { waitUntil: 'networkidle', timeout: 20000 }).catch(e => null);
    const status = r?.status() ?? 0;
    const url = page.url();
    const body = await page.evaluate(() => document.body.innerText.substring(0, 400)).catch(() => '');
    await page.waitForTimeout(1500);
    results.push({ path: p, status, url, body: body.substring(0, 300), errs: [...errs], fails: [...fails], reqs4xx: [...reqs] });
  }

  console.log('\n=== AUTHENTICATED PAGE RESULTS ===');
  for (const r of results) {
    const stillLogin = r.url.includes('/login');
    console.log(r.path + ' [' + r.status + ']' + (stillLogin ? ' [STILL ON LOGIN]' : '') + ': errs=' + r.errs.length + ' fails=' + r.fails.length + ' 4xx=' + r.reqs4xx.length);
    if (r.errs.length) console.log('  err: ' + r.errs[0]);
    if (r.reqs4xx.length) console.log('  4xx: ' + r.reqs4xx[0]);
    console.log('  body: ' + r.body.substring(0, 150).replace(/\n/g, ' | '));
  }

  await browser.close();
})();
