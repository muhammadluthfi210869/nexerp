
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.salesLead.count();
  console.log('COUNT:' + count);
  const leads = await prisma.salesLead.findMany({
    select: { id: true, clientName: true, stage: true }
  });
  console.log('LEADS:' + JSON.stringify(leads));
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
    pool.end();
});
