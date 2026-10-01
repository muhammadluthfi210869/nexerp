const { Pool } = require('../backend/node_modules/pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public' });

const cats = [
  { code: 'SUP-BBK', name: 'Bahan Baku', description: 'Pemasok zat aktif, pelarut, dan bahan dasar kimia', type: 'SUPPLIER' },
  { code: 'SUP-KPR', name: 'Kemasan Primer', description: 'Pemasok botol, pot, tube, sachet yang kontak langsung dengan produk', type: 'SUPPLIER' },
  { code: 'SUP-KSR', name: 'Kemasan Sekunder', description: 'Pemasok box, karton master, label stiker, shrink film', type: 'SUPPLIER' },
  { code: 'SUP-BPB', name: 'Bahan Pembantu', description: 'Pemasok perlengkapan lab, sanitasi, dan material pendukung proses', type: 'SUPPLIER' },
  { code: 'SUP-MAK', name: 'Jasa Maklon', description: 'Penyedia jasa sub-kontrak manufaktur dan pengujian laboratorium', type: 'SUPPLIER' }
];

async function seed() {
  for (const c of cats) {
    await pool.query(
      'INSERT INTO master_categories (id, code, name, description, type, "isActive", "createdAt", "updatedAt") ' +
      'VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW()) ' +
      'ON CONFLICT (code) DO UPDATE SET name = $2, description = $3, type = $4;',
      [c.code, c.name, c.description, c.type]
    );
  }
  console.log('Seeded supplier categories successfully');
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  pool.end();
});
