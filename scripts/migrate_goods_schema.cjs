const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("Migrating material_items table for Sub-Fase 1.3...");

  await pool.query(`
    ALTER TABLE "material_items"
    ADD COLUMN IF NOT EXISTS "subCategory" TEXT,
    ADD COLUMN IF NOT EXISTS "description" TEXT,
    ADD COLUMN IF NOT EXISTS "coaMapping" JSONB;
  `);

  console.log("✅ Added subCategory, description, and coaMapping to material_items.");

  // Check categories with type 'GOODS' or 'MATERIAL'
  const cats = await pool.query(
    "SELECT id, code, name, type FROM master_categories WHERE type IN ('GOODS', 'MATERIAL', 'PRODUCT', 'RAW_MATERIAL') ORDER BY code ASC"
  );
  console.log("Found goods/material categories in DB:", cats.rows.length);

  // If no GOODS/MATERIAL categories exist in master_categories, seed the standard ones
  if (cats.rows.length === 0) {
    const defaultCats = [
      { code: 'CAT-BBK', name: 'Bahan Baku', description: 'Bahan baku kimia dan aktif formulasi kosmetik/skincare' },
      { code: 'CAT-KPR', name: 'Kemasan Primer', description: 'Botol, pot, jar, tube yang bersentuhan langsung dengan produk' },
      { code: 'CAT-KSR', name: 'Kemasan Sekunder', description: 'Box, karton, dus luar, stiker label, shrink wrap' },
      { code: 'CAT-BPB', name: 'Bahan Pembantu', description: 'Alkohol pembersih, sarung tangan, tissue, masker produksi' },
      { code: 'CAT-BJD', name: 'Barang Jadi', description: 'Produk kosmetik/skincare siap kirim ke customer' }
    ];

    for (const c of defaultCats) {
      await pool.query(
        `INSERT INTO master_categories (id, code, name, description, type, "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'GOODS', true, NOW(), NOW())`,
        [c.code, c.name, c.description]
      );
      console.log(`  + Seeded category: ${c.code} - ${c.name}`);
    }
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
