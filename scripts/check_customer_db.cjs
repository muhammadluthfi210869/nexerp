const { Pool } = require('../backend/node_modules/pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/erp_db_test?schema=public'
});

async function main() {
  const catRes = await pool.query("SELECT * FROM master_categories WHERE type = 'CUSTOMER'");
  console.log("Customer categories:", catRes.rows.map(r => ({ code: r.code, name: r.name })));

  const leadColumns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales_leads'");
  console.log("Sales leads columns count:", leadColumns.rows.length);
  const colNames = leadColumns.rows.map(r => r.column_name);
  console.log("Has birth_date / birthDate:", colNames.includes('birth_date'), colNames.includes('birthDate'));
  console.log("Has pic_id / picId:", colNames.includes('pic_id'), colNames.includes('picId'));

  const leadSample = await pool.query('SELECT id, "clientName", "brandName", "contactInfo", status, "picId" FROM sales_leads LIMIT 3');
  console.log("Sales leads sample:", leadSample.rows);

  const staffRes = await pool.query('SELECT id, name FROM bussdev_staff LIMIT 5');
  console.log("Bussdev staff sample:", staffRes.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
