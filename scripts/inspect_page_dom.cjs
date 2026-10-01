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

const urlToInspect = process.argv[2] || 'https://kil.gserp.id/goods-manage';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://kil.gserp.id/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
    page.click('#GSForm button[type="submit"]')
  ]);

  console.log('Navigating to:', urlToInspect);
  await page.goto(urlToInspect, { waitUntil: 'networkidle' });

  const info = await page.evaluate(() => {
    const cardHeader = document.querySelector('.card-header')?.outerHTML || '';
    const cardTools = document.querySelector('.card-tools')?.outerHTML || '';
    const buttons = Array.from(document.querySelectorAll('button, a.btn, .card-header a')).map(el => ({
      text: el.innerText.trim(),
      tag: el.tagName,
      className: el.className,
      href: el.getAttribute('href'),
      onclick: el.getAttribute('onclick'),
      dataToggle: el.getAttribute('data-toggle'),
      dataTarget: el.getAttribute('data-target')
    }));

    // First row action buttons
    const rowActions = Array.from(document.querySelectorAll('table tbody tr:first-child td a, table tbody tr:first-child td button')).map(el => ({
      text: el.innerText.trim(),
      title: el.getAttribute('title') || el.getAttribute('data-original-title'),
      className: el.className,
      href: el.getAttribute('href'),
      onclick: el.getAttribute('onclick')
    }));

    // Modals in HTML
    const modals = Array.from(document.querySelectorAll('.modal')).map(m => ({
      id: m.id,
      title: m.querySelector('.modal-title')?.innerText.trim(),
      bodyHtml: m.querySelector('.modal-body')?.innerHTML?.substring(0, 500)
    }));

    return { cardHeader, cardTools, buttons, rowActions, modals };
  });

  console.log('=== BUTTONS ===');
  console.log(JSON.stringify(info.buttons, null, 2));
  console.log('=== ROW ACTIONS ===');
  console.log(JSON.stringify(info.rowActions, null, 2));
  console.log('=== MODALS ===');
  console.log(JSON.stringify(info.modals, null, 2));

  await browser.close();
}

main().catch(console.error);
