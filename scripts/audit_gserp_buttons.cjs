const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, 'kil_audit_summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error("kil_audit_summary.json not found");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

console.log("=== AUDIT KIL GSERP: HALAMAN DENGAN INPUT vs TANPA INPUT ===");
const withCreate = [];
const withoutCreate = [];

for (const [route, info] of Object.entries(data)) {
  const buttons = info.buttons || [];
  const hasCreate = buttons.some(b => /buat|tambah|input|new|create/i.test(b));
  if (hasCreate) {
    withCreate.push({ route, title: info.title, buttons });
  } else {
    withoutCreate.push({ route, title: info.title, buttons });
  }
}

console.log(`\n📌 TOTAL HALAMAN DENGAN TOMBOL BUAT/INPUT (${withCreate.length}):`);
withCreate.forEach(x => {
  console.log(`  • ${x.route.padEnd(25)} -> ${x.title} [Tombol: ${x.buttons.join(', ')}]`);
});

console.log(`\n📌 TOTAL HALAMAN TANPA TOMBOL BUAT/INPUT (${withoutCreate.length}) [Hanya Action Per Baris / Auto / Rekap]:`);
withoutCreate.forEach(x => {
  console.log(`  • ${x.route.padEnd(25)} -> ${x.title} [Tombol: ${x.buttons.join(', ')}]`);
});
