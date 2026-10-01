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

async function checkForms() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in to kil.gserp.id...');
  await page.goto('https://kil.gserp.id/auth/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
    page.click('#GSForm button[type="submit"], button:has-text("Masuk")')
  ]);

  const targets = [
    { url: 'https://kil.gserp.id/goods-manage', name: 'Barang' },
    { url: 'https://kil.gserp.id/supplier-manage', name: 'Supplier' },
    { url: 'https://kil.gserp.id/customer-manage', name: 'Customer' },
    { url: 'https://kil.gserp.id/warehouse-manage', name: 'Warehouse' },
    { url: 'https://kil.gserp.id/coa-manage', name: 'CoA' },
    { url: 'https://kil.gserp.id/user-manage', name: 'User' },
    { url: 'https://kil.gserp.id/sales-target', name: 'Sales Target' }
  ];

  const results = {};

  for (const t of targets) {
    try {
      await page.goto(t.url, { waitUntil: 'networkidle' });
      const buatBtn = await page.$('button:has-text("Buat"), a:has-text("Buat")');
      if (buatBtn) {
        await buatBtn.click();
        await page.waitForTimeout(1200);
        const fields = await page.evaluate(() => {
          const modal = document.querySelector('.modal.show, .modal.in, #modal-default, .modal') || document;
          const inputs = Array.from(modal.querySelectorAll('input, select, textarea'));
          return inputs.map(i => {
            const lbl = i.closest('.form-group, .row, div')?.querySelector('label')?.innerText.trim() || '';
            const opts = i.tagName.toLowerCase() === 'select' ? Array.from(i.querySelectorAll('option')).map(o => o.innerText.trim()).filter(Boolean) : undefined;
            return {
              label: lbl,
              name: i.getAttribute('name') || '',
              tag: i.tagName.toLowerCase(),
              type: i.getAttribute('type') || i.tagName.toLowerCase(),
              required: i.hasAttribute('required'),
              options: opts ? opts.slice(0, 10) : undefined
            };
          }).filter(x => x.name && x.name !== 'csrf_gs');
        });
        results[t.name] = fields;
        console.log(`=== Form Buat: ${t.name} ===`);
        console.log(JSON.stringify(fields, null, 2));

        const closeBtn = await page.$('.modal.show [data-dismiss="modal"], .modal.show .close');
        if (closeBtn) await closeBtn.click().catch(() => {});
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log(`Error on ${t.name}:`, e.message);
    }
  }

  fs.writeFileSync(path.join(__dirname, '..', 'artifacts', 'gserp_audit', 'fase1', 'form_fields_audit.json'), JSON.stringify(results, null, 2));
  console.log('Saved form audit to form_fields_audit.json');

  await browser.close();
}

checkForms().catch(console.error);
