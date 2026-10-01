const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('sales_targets', 'sales_categories', 'users', 'sales_orders', 'unified_invoices')
  `);
  console.log("Found tables:", tables.rows.map(r => r.table_name));

  const targetCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'sales_targets'
  `);
  console.log("sales_targets columns:", targetCols.rows);

  const userSamples = await pool.query(`
    SELECT id, name, email, role FROM users LIMIT 5
  `);
  console.log("Users sample:", userSamples.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
