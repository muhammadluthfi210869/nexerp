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

const CREATE_URLS = [
  { name: 'Barang', url: 'https://kil.gserp.id/goods-manage/create' },
  { name: 'Kategori-Barang', url: 'https://kil.gserp.id/goods-category-manage/create' },
  { name: 'Supplier', url: 'https://kil.gserp.id/supplier-manage/create' },
  { name: 'Kategori-Supplier', url: 'https://kil.gserp.id/supplier-category-manage/create' },
  { name: 'Customer', url: 'https://kil.gserp.id/customer-manage/create' },
  { name: 'Kategori-Customer', url: 'https://kil.gserp.id/customer-category-manage/create' },
  { name: 'Warehouse', url: 'https://kil.gserp.id/warehouse-manage/create' },
  { name: 'CoA', url: 'https://kil.gserp.id/coa-manage/create' },
  { name: 'User', url: 'https://kil.gserp.id/user-manage/create' },
  { name: 'Role', url: 'https://kil.gserp.id/role-manage/create' },
  { name: 'Sales-Category', url: 'https://kil.gserp.id/sales-category/create' },
  { name: 'Sales-Target', url: 'https://kil.gserp.id/sales-target/create' }
];

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

  const results = {};

  for (const item of CREATE_URLS) {
    console.log(`Checking create page: ${item.name} (${item.url})...`);
    try {
      await page.goto(item.url, { waitUntil: 'networkidle', timeout: 15000 });
      const pageTitle = await page.title();
      const formFields = await page.evaluate(() => {
        const form = document.querySelector('form#GSForm, form');
        if (!form) return [];
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        return inputs.map(i => {
          const formGroup = i.closest('.form-group, .row, div');
          const label = formGroup?.querySelector('label')?.innerText.trim() || '';
          const options = i.tagName.toLowerCase() === 'select' ? Array.from(i.querySelectorAll('option')).map(o => o.innerText.trim()).filter(Boolean) : undefined;
          return {
            label,
            name: i.getAttribute('name') || '',
            tag: i.tagName.toLowerCase(),
            type: i.getAttribute('type') || i.tagName.toLowerCase(),
            placeholder: i.getAttribute('placeholder') || '',
            required: i.hasAttribute('required') || i.classList.contains('required'),
            options: options ? options.slice(0, 10) : undefined
          };
        }).filter(f => f.name && f.name !== 'csrf_gs');
      });

      const ssPath = path.join(__dirname, '..', 'artifacts', 'gserp_audit', 'fase1', `create_${item.name}.png`);
      await page.screenshot({ path: ssPath, fullPage: true });

      results[item.name] = {
        title: pageTitle,
        url: item.url,
        fields: formFields
      };
      console.log(`  Found ${formFields.length} fields in ${item.name}`);
    } catch (e) {
      console.log(`  Error on ${item.name}: ${e.message}`);
      results[item.name] = { error: e.message };
    }
  }

  fs.writeFileSync(
    path.join(__dirname, '..', 'artifacts', 'gserp_audit', 'fase1', 'all_create_forms_audit.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('Saved all create forms to all_create_forms_audit.json');

  await browser.close();
}

main().catch(console.error);
