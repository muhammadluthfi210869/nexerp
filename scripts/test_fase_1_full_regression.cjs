const { execSync } = require('child_process');

const tests = [
  { name: "Sub-Fase 1.1: Pemasok (Supplier)", script: "scripts/test_subfase_1_1_supplier.cjs" },
  { name: "Sub-Fase 1.2: Pelanggan (Customer)", script: "scripts/test_subfase_1_2_customer.cjs" },
  { name: "Sub-Fase 1.3: Barang Jadi & Bahan (Goods & Materials)", script: "scripts/test_subfase_1_3_goods.cjs" },
  { name: "Sub-Fase 1.4: Gudang & Lokasi (Warehouse & Storage)", script: "scripts/test_subfase_1_4_warehouse.cjs" },
  { name: "Sub-Fase 1.5: Bagan Akun & Kategori (COA & Accounting)", script: "scripts/test_subfase_1_5_coa.cjs" },
  { name: "Sub-Fase 1.6: Target Penjualan & Kategori Penjualan", script: "scripts/test_subfase_1_6_sales_target.cjs" },
  { name: "Sub-Fase 1.7: Hak Akses (Role) & Pengguna (User)", script: "scripts/test_subfase_1_7_users_roles.cjs" },
];

console.log("================================================================================");
console.log("🚀 MENJALANKAN FULL REGRESSION SUITE FASE 1: MASTER DATA & KONFIGURASI");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;

for (let i = 0; i < tests.length; i++) {
  const t = tests[i];
  console.log(`[${i + 1}/${tests.length}] Menjalankan: ${t.name}...`);
  try {
    const output = execSync(`node "${t.script}"`, { stdio: 'pipe' }).toString();
    console.log(`  ✅ LULUS: ${t.name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ GAGAL: ${t.name}`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
    failedCount++;
  }
}

console.log("\n================================================================================");
console.log(`HASIL AKHIR REGRESSION TEST FASE 1:`);
console.log(`  - Total Sub-Fase : ${tests.length}`);
console.log(`  - Lulus          : ${passedCount} / ${tests.length}`);
console.log(`  - Gagal          : ${failedCount} / ${tests.length}`);
if (failedCount === 0) {
  console.log(`🎉 100% SUKSES! SEMUA 7 SUB-FASE FASE 1 MASTER DATA LULUS TERVERIFIKASI!`);
} else {
  console.log(`⚠️ Ada pengujian yang gagal, silakan periksa rincian di atas.`);
  process.exitCode = 1;
}
console.log("================================================================================\n");
