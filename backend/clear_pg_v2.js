const { Client } = require('pg');
const connectionString = "postgresql://postgres:66luthfi29@localhost:5432/erp_db?schema=public";

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Resetting Production Data...');

    const tables = [
      'production_logs',
      'production_step_logs',
      'production_plans',
      'production_schedules',
      'work_orders',
      'material_requisitions',
      'qc_audits'
    ];

    for (const table of tables) {
      await client.query(`TRUNCATE TABLE ${table} CASCADE;`);
      console.log(`✓ Table ${table} cleared.`);
    }

    console.log('--- RESET COMPLETED: Dashboard is now empty. ---');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
