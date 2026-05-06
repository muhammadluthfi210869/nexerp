const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Resetting Production Dashboard...');
  try {
    // List of tables to clear
    const tables = [
      'ProductionLog',
      'MaterialRequisitionItem',
      'MaterialRequisition',
      'WorkOrder'
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`✓ Table ${table} cleared.`);
      } catch (e) {
        console.log(`- Table ${table} not found or error. Trying lowercase...`);
        try {
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table.toLowerCase()} CASCADE;`);
          console.log(`✓ Table ${table.toLowerCase()} cleared.`);
        } catch (e2) {
          console.log(`x Failed to clear ${table}: ${e2.message}`);
        }
      }
    }
    console.log('READY FOR NEW DATA');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
