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

const TARGET_PAGES = [
  { name: 'goods-manage', url: 'https://kil.gserp.id/goods-manage', label: 'Master Barang' },
  { name: 'goods-category-manage', url: 'https://kil.gserp.id/goods-category-manage', label: 'Kategori Barang' },
  { name: 'supplier-manage', url: 'https://kil.gserp.id/supplier-manage', label: 'Master Supplier' },
  { name: 'supplier-category-manage', url: 'https://kil.gserp.id/supplier-category-manage', label: 'Kategori Supplier' },
  { name: 'customer-manage', url: 'https://kil.gserp.id/customer-manage', label: 'Master Pelanggan' },
  { name: 'customer-category-manage', url: 'https://kil.gserp.id/customer-category-manage', label: 'Kategori Pelanggan' },
  { name: 'customer-my-manage', url: 'https://kil.gserp.id/customer-my-manage', label: 'Pelanggan Saya' },
  { name: 'warehouse-manage', url: 'https://kil.gserp.id/warehouse-manage', label: 'Master Gudang' },
  { name: 'warehouse-access-manage', url: 'https://kil.gserp.id/warehouse-access-manage', label: 'Hak Akses Gudang' },
  { name: 'coa-manage', url: 'https://kil.gserp.id/coa-manage', label: 'Master CoA' },
  { name: 'coa-auto-manage', url: 'https://kil.gserp.id/coa-auto-manage', label: 'CoA Jurnal Otomatis' },
  { name: 'sales-category', url: 'https://kil.gserp.id/sales-category', label: 'Kategori Penjualan' },
  { name: 'sales-target', url: 'https://kil.gserp.id/sales-target', label: 'Target Penjualan' },
  { name: 'role-manage', url: 'https://kil.gserp.id/role-manage', label: 'Hak Akses (Role)' },
  { name: 'user-manage', url: 'https://kil.gserp.id/user-manage', label: 'Pengguna (User)' }
];

async function main() {
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

  const outDir = path.join(__dirname, '..', 'artifacts', 'gserp_audit', 'fase1');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const results = [];

  for (const target of TARGET_PAGES) {
    console.log(`Auditing: ${target.label} (${target.url})...`);
    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1000);

      // Take screenshot
      const ssPath = path.join(outDir, `${target.name}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });

      // Extract page details
      const pageInfo = await page.evaluate((tName) => {
        // Table columns
        const ths = Array.from(document.querySelectorAll('table thead th, table th')).map(th => th.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean);
        // Header title
        const pageTitle = document.querySelector('.content-header h1, h1, .page-title')?.innerText.trim() || document.title;
        // Top buttons
        const topButtons = Array.from(document.querySelectorAll('.card-header button, .card-header a, .content-header button, .content-header a, .btn'))
          .map(b => ({
            text: b.innerText.trim().replace(/\s+/g, ' '),
            tag: b.tagName,
            href: b.getAttribute('href') || null,
            id: b.id || null,
            className: b.className
          }))
          .filter(b => b.text && b.text.length < 50);

        // Check for filters
        const filterInputs = Array.from(document.querySelectorAll('.card-body select, .card-header select, input[type="search"], .dataTables_filter input'))
          .map(i => i.placeholder || i.name || i.id || 'filter')
          .filter(Boolean);

        // Check for row action buttons in first table row
        const rowActions = Array.from(document.querySelectorAll('table tbody tr:first-child a, table tbody tr:first-child button'))
          .map(a => a.innerText.trim() || a.getAttribute('title') || a.getAttribute('data-original-title') || a.className)
          .filter(Boolean);

        // Check modals present in DOM
        const modals = Array.from(document.querySelectorAll('.modal')).map(m => {
          const id = m.id;
          const modalTitle = m.querySelector('.modal-title, h4, h5')?.innerText.trim() || '';
          const inputs = Array.from(m.querySelectorAll('input, select, textarea')).map(inp => ({
            name: inp.getAttribute('name') || '',
            type: inp.getAttribute('type') || inp.tagName.toLowerCase(),
            placeholder: inp.getAttribute('placeholder') || '',
            label: inp.closest('.form-group')?.querySelector('label')?.innerText.trim() || ''
          }));
          return { id, modalTitle, inputs };
        });

        return {
          title: pageTitle,
          columns: Array.from(new Set(ths)),
          topButtons: topButtons.slice(0, 15),
          filterInputs,
          rowActions: Array.from(new Set(rowActions)),
          modals
        };
      }, target.name);

      // If modal wasn't rendered yet, let's see if clicking 'Tambah' button opens a modal or navigates to a create page
      let createPageOrModal = null;
      const tambahBtn = await page.$('a:has-text("Tambah"), button:has-text("Tambah"), a[href*="create"], a[href*="add"]');
      if (tambahBtn) {
        const btnHref = await tambahBtn.getAttribute('href');
        const btnText = await tambahBtn.innerText();
        createPageOrModal = { text: btnText.trim(), href: btnHref };

        // If it's a link to a separate create page, let's visit and inspect it!
        if (btnHref && btnHref !== '#' && !btnHref.startsWith('javascript:')) {
          console.log(`  Visiting create page: ${btnHref}`);
          const createPage = await context.newPage();
          try {
            await createPage.goto(btnHref, { waitUntil: 'networkidle', timeout: 15000 });
            const createFields = await createPage.evaluate(() => {
              return Array.from(document.querySelectorAll('form input, form select, form textarea')).map(inp => {
                const grp = inp.closest('.form-group, .row, div');
                return {
                  label: grp?.querySelector('label')?.innerText.trim() || '',
                  name: inp.getAttribute('name') || '',
                  type: inp.getAttribute('type') || inp.tagName.toLowerCase(),
                  placeholder: inp.getAttribute('placeholder') || ''
                };
              }).filter(f => f.name && f.name !== 'csrf_gs');
            });
            createPageOrModal.fields = createFields;
            await createPage.screenshot({ path: path.join(outDir, `${target.name}_create.png`) });
          } catch (e) {
            console.log(`  Error loading create page: ${e.message}`);
          } finally {
            await createPage.close();
          }
        } else {
          // It's a modal trigger, try clicking to open modal
          try {
            await tambahBtn.click();
            await page.waitForTimeout(800);
            const modalFields = await page.evaluate(() => {
              const activeModal = document.querySelector('.modal.show, .modal.in') || document.querySelector('.modal');
              if (!activeModal) return [];
              return Array.from(activeModal.querySelectorAll('input, select, textarea')).map(inp => {
                const grp = inp.closest('.form-group, .row, div');
                return {
                  label: grp?.querySelector('label')?.innerText.trim() || '',
                  name: inp.getAttribute('name') || '',
                  type: inp.getAttribute('type') || inp.tagName.toLowerCase(),
                  placeholder: inp.getAttribute('placeholder') || ''
                };
              }).filter(f => f.name && f.name !== 'csrf_gs');
            });
            createPageOrModal.modalFields = modalFields;
            await page.screenshot({ path: path.join(outDir, `${target.name}_modal.png`) });
            // Close modal
            const closeBtn = await page.$('.modal.show [data-dismiss="modal"], .modal.show .close');
            if (closeBtn) await closeBtn.click();
          } catch (e) {}
        }
      }

      results.push({
        ...target,
        ...pageInfo,
        createPageOrModal
      });
      console.log(`  Columns found: ${pageInfo.columns.join(' | ')}`);
    } catch (err) {
      console.error(`  Error auditing ${target.name}:`, err.message);
      results.push({ ...target, error: err.message });
    }
  }

  fs.writeFileSync(path.join(outDir, 'audit_fase1_results.json'), JSON.stringify(results, null, 2));
  console.log('Audit Fase 1 complete! Saved to artifacts/gserp_audit/fase1/audit_fase1_results.json');

  await browser.close();
}

main().catch(console.error);
