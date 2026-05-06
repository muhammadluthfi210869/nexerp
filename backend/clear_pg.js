const { Client } = require('pg');

const connectionString = "postgresql://postgres:66luthfi29@localhost:5432/erp_db?schema=public";

async function main() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to DB. Resetting Production Dashboard...');

    const tables = [
      'ProductionLog',
      'MaterialRequisitionItem',
      'MaterialRequisition',
      'WorkOrder'
    ];

    for (const table of tables) {
      // Use quotes for case-sensitive table names created by Prisma
      await client.query(`TRUNCATE TABLE "${table}" CASCADE;`);
      console.log(`✓ Table "${table}" cleared.`);
    }

    console.log('--- RESET COMPLETED: Production data is now empty. ---');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await client.end();
  }
}

main();
