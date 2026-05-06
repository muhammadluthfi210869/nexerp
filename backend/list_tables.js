const { Client } = require('pg');
const connectionString = "postgresql://postgres:66luthfi29@localhost:5432/erp_db?schema=public";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Tables:', res.rows.map(r => r.table_name));
  await client.end();
}

main();
