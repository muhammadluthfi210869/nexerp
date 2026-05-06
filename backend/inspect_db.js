const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- WORK ORDERS ---');
    const workOrders = await prisma.workOrder.findMany({ 
      take: 5,
      include: { lead: true }
    });
    console.log(JSON.stringify(workOrders, null, 2));

    console.log('\n--- PRODUCTION LOGS ---');
    const logs = await prisma.productionLog.findMany({ 
      take: 5,
      include: { workOrder: true }
    });
    console.log(JSON.stringify(logs, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
