// W3d — Debug login submission flow
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

  const allErrs = [];
  const apiCalls = [];
  page.on('console', m => { allErrs.push(`[${m.type()}] ${m.text().substring(0,300)}`); });
  page.on('pageerror', e => allErrs.push('PAGE_ERR: ' + e.message.substring(0,300)));
  page.on('response', r => {
    const u = r.url();
    if (u.includes('/api/') && !u.includes('/_next/')) {
      apiCalls.push({ method: r.request().method(), url: u, status: r.status() });
    }
  });

  await page.goto(PRODUCTION + '/login', { waitUntil: 'networkidle', timeout: 20000 });

  // Inspect actual inputs more carefully
  const inputDetails = await page.evaluate(() => {
    const ins = document.querySelectorAll('input');
    return Array.from(ins).map(i => ({
      type: i.type,
      name: i.name,
      id: i.id,
      placeholder: i.placeholder,
      autocomplete: i.autocomplete,
      ariaLabel: i.getAttribute('aria-label'),
      required: i.required,
    }));
  });
  console.log('INPUT DETAILS:', JSON.stringify(inputDetails, null, 2));

  // Fill with explicit selectors
  const emailInput = await page.$('input[type="email"], input[autocomplete*="email"], input[autocomplete*="username"]');
  const passInput = await page.$('input[type="password"]');
  console.log('emailInput found:', !!emailInput);
  console.log('passInput found:', !!passInput);

  if (emailInput) await emailInput.fill('admin@nexerp.id');
  if (passInput) await passInput.fill('password123');

  console.log('\n--- Before submit, API calls:', apiCalls.length);
  // Submit and watch
  apiCalls.length = 0;
  const submit = await page.$('button[type="submit"]');
  await submit.click();
  await page.waitForTimeout(8000);
  console.log('URL after submit:', page.url());
  console.log('API calls during submit:', apiCalls.length);
  for (const c of apiCalls) console.log(' ', c.method, c.url, '[' + c.status + ']');

  console.log('\n--- ALL ERRORS:');
  for (const e of allErrs) console.log(' ', e);

  await browser.close();
})();
