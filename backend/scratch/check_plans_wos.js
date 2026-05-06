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
    console.log('--- PRODUCTION PLANS ---');
    const plans = await prisma.productionPlan.findMany({ 
      take: 5
    });
    console.log(JSON.stringify(plans, null, 2));

    console.log('\n--- WORK ORDERS ---');
    const wos = await prisma.workOrder.findMany({ 
      take: 5
    });
    console.log(JSON.stringify(wos, null, 2));

    console.log('\n--- MATERIAL REQUISITIONS ---');
    const reqs = await prisma.materialRequisition.findMany({ 
      take: 5,
      include: { wo: true }
    });
    console.log(JSON.stringify(reqs, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
