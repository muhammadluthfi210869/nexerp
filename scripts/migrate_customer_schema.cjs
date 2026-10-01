const { Pool } = require('../backend/node_modules/pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("Adding birthDate to sales_leads if not exists...");
  await pool.query(`
    ALTER TABLE "sales_leads" 
    ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3) WITHOUT TIME ZONE;
  `);
  console.log("✅ Column birthDate added/ensured.");

  console.log("Seeding Customer categories into master_categories...");
  const categories = [
    { code: 'CUST-LEAD', name: 'Calon Pelanggan', description: 'Prospek aktif dalam pipeline / buku tamu' },
    { code: 'CUST-SMPL', name: 'Pelanggan Sample', description: 'Klien dalam tahap riset formulasi sample R&D' },
    { code: 'CUST-PROD', name: 'Pelanggan Produk', description: 'Klien maklon dengan pesanan batch produksi massal' },
    { code: 'CUST-RO', name: 'Pelanggan RO', description: 'Klien repeat order rutin maklon (> 1 batch produksi)' }
  ];

  for (const cat of categories) {
    const existing = await pool.query(
      "SELECT id FROM master_categories WHERE code = $1 AND type = 'CUSTOMER'",
      [cat.code]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO master_categories (id, code, name, description, type, "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'CUSTOMER', true, NOW(), NOW())`,
        [cat.code, cat.name, cat.description]
      );
      console.log(`  + Seeded customer category: ${cat.code} - ${cat.name}`);
    } else {
      console.log(`  = Already exists: ${cat.code} - ${cat.name}`);
    }
  }

  // Check categories count
  const allCats = await pool.query("SELECT id, code, name, type FROM master_categories WHERE type = 'CUSTOMER'");
  console.log("Total CUSTOMER categories in DB:", allCats.rows.length);

  await pool.end();
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
