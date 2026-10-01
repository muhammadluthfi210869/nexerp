const { Pool } = require('../backend/node_modules/pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  const cols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'material_items'"
  );
  const names = cols.rows.map(r => r.column_name);
  console.log("Material items column count:", names.length);
  console.log("Has coaMapping:", names.includes('coaMapping'), names.includes('coa_mapping'));
  console.log("Has subCategory:", names.includes('subCategory'), names.includes('sub_category'));
  console.log("Has cogsAccountId:", names.includes('cogsAccountId'));
  console.log("Has inventoryAccountId:", names.includes('inventoryAccountId'));
  console.log("Has salesAccountId:", names.includes('salesAccountId'));

  const sample = await pool.query(
    'SELECT id, code, name, unit, "unitPrice", "minLevel", "reorderPoint", "categoryId" FROM material_items LIMIT 3'
  );
  console.log("Sample materials:", sample.rows);

  // Check accounts
  const accs = await pool.query('SELECT id, code, name, type FROM accounts LIMIT 5');
  console.log("Sample accounts:", accs.rows);

  await pool.end();
}

main().catch(console.error);
