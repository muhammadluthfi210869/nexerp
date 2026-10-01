const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  console.log("Applying sales schema migration...");
  
  // 1. Add notes to sales_targets if missing
  await pool.query(`
    ALTER TABLE sales_targets ADD COLUMN IF NOT EXISTS notes text;
  `);
  console.log("✅ Added 'notes' column to sales_targets");

  // 2. Create sales_categories table if missing
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text UNIQUE NOT NULL,
      description text,
      "createdAt" timestamp without time zone DEFAULT now(),
      "updatedAt" timestamp without time zone DEFAULT now()
    );
  `);
  console.log("✅ Created 'sales_categories' table");

  // 3. Seed initial 5 standard G-SERP sales categories if empty
  const countRes = await pool.query(`SELECT count(*)::int as cnt FROM sales_categories`);
  if (countRes.rows[0].cnt === 0) {
    const defaultCategories = [
      { name: 'Maklon Baru', description: 'Proyek Maklon Produk Baru / New Product Development (NPD)' },
      { name: 'Repeat Order', description: 'Produksi Ulang Formula / Produk Maklon Eksisting' },
      { name: 'Sample RnD', description: 'Pengembangan dan Pengujian Sampel RnD Skincare/Kosmetik' },
      { name: 'Jasa Maklon', description: 'Jasa Pengolahan, Filling, dan Packaging Bahan dari Client' },
      { name: 'Produk Ruahan', description: 'Penjualan Produk Bulk / Curah Siap Kemas' },
    ];
    for (const cat of defaultCategories) {
      await pool.query(
        `INSERT INTO sales_categories (name, description, "createdAt", "updatedAt") 
         VALUES ($1, $2, NOW(), NOW()) 
         ON CONFLICT (name) DO NOTHING`,
        [cat.name, cat.description]
      );
    }
    console.log("✅ Seeded 5 standard G-SERP sales categories");
  }

  await pool.end();
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
