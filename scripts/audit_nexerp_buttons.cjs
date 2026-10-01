const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, '../frontend/src/app/(dashboard)');

const ALLOWED_CREATE_ROUTES = [
  // 12 Entry points sah dari GSERP:
  'samples/sample-sales', // or penjualan/sample-sales (/sales-sample)
  'penjualan/sales-orders', // (/sales)
  'penjualan/retur-penjualan', // (/sales-return)
  'pembelian/scm-pembelian', // or purchasing (/purchase)
  'pembelian/purchasing', // (/purchase)
  'pembelian/purchase-requests', // (/purchase-request)
  'pembelian/kebutuhan', // (/need-for-goods)
  'production/material-requisition', // (/goods-request)
  'production/batch-records', // (/batch-record)
  'finance/cogs-request', // (/request-cogs)
  'master/goods', // (/goods-manage)
  'master/suppliers', // (/supplier-manage)
  'master/customers', // (/customer-manage)
  'master/users', // user manage
];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '_components' && entry.name !== '_hooks' && entry.name !== '_types' && entry.name !== 'node_modules') {
        scanDir(fullPath);
      }
    } else if (entry.name === 'page.tsx') {
      checkPage(fullPath);
    }
  }
}

const suspiciousButtons = [];

function checkPage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(dashboardDir, filePath).replace(/\\/g, '/').replace('/page.tsx', '');

  // Regex to look for DnaPageHeader actions or buttons with Plus/Tambah/Buat
  const regex = /<DnaButton[^>]*>([\s\S]*?)<\/DnaButton>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const btnContent = match[1];
    if (/(Plus|Tambah|Buat|Input|Create|\+ )/i.test(btnContent) && !/Import|Export|Upload|Download/i.test(btnContent)) {
      suspiciousButtons.push({
        relPath,
        btnText: btnContent.replace(/\s+/g, ' ').trim(),
        filePath
      });
    }
  }
}

scanDir(dashboardDir);

console.log(`=== AUDIT NEXERP: DETEKSI TOMBOL CREATE/INPUT DI SELURUH HALAMAN (${suspiciousButtons.length} Ditemukan) ===`);

const unauthorized = [];
const authorized = [];

suspiciousButtons.forEach(item => {
  const isAllowed = ALLOWED_CREATE_ROUTES.some(allowed => item.relPath.includes(allowed));
  if (isAllowed) {
    authorized.push(item);
  } else {
    unauthorized.push(item);
  }
});

console.log(`\n🚨 TOMBOL INPUT PADA HALAMAN YANG DI GSERP HARUS BERSIH/NON-INPUT (${unauthorized.length}):`);
unauthorized.forEach(x => {
  console.log(`  [${x.relPath}] -> "${x.btnText.slice(0, 80)}"`);
});

console.log(`\n✅ TOMBOL INPUT PADA HALAMAN ENTRY POINT SAH (${authorized.length}):`);
authorized.forEach(x => {
  console.log(`  [${x.relPath}] -> "${x.btnText.slice(0, 80)}"`);
});
