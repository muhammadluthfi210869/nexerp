const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

let email = 'zaki@dreamlab.id';
let password = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  const mEmail = envContent.match(/OLD_ERP_EMAIL=([^\r\n]+)/);
  if (mEmail) email = mEmail[1].trim();
  const mPass = envContent.match(/OLD_ERP_PASSWORD=([^\r\n]+)/);
  if (mPass) password = mPass[1].trim();
} catch (e) {}
if (!password) {
  throw new Error('Isi OLD_ERP_PASSWORD di .env — password tidak lagi ditulis di source.');
}

async function checkLabels() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://kil.gserp.id/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation(),
    page.click('#GSForm button[type="submit"]')
  ]);

  await page.goto('https://kil.gserp.id/goods-category-manage/create');
  const coaCategoryLabels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.form-group, .row > div')).map(div => {
      const select = div.querySelector('select[name^="coa_"]');
      if (select) {
        return { name: select.name, label: div.querySelector('label')?.innerText.trim() };
      }
      return null;
    }).filter(Boolean);
  });
  console.log('Category CoA Labels:', JSON.stringify(coaCategoryLabels, null, 2));

  await page.goto('https://kil.gserp.id/coa-auto-manage');
  const coaAutoLabels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.form-group, .row > div, tr')).map(div => {
      const select = div.querySelector('select[name^="coa_"]');
      if (select) {
        return {
          name: select.name,
          label: div.querySelector('label, td:first-child')?.innerText.trim()
        };
      }
      return null;
    }).filter(Boolean);
  });
  console.log('CoA Auto Labels:', JSON.stringify(coaAutoLabels, null, 2));

  await browser.close();
}

checkLabels().catch(console.error);
