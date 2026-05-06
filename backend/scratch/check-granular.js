
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const leads = await prisma.salesLead.findMany({
    include: {
      pic: true,
      sampleRequests: true,
      workOrders: true,
    }
  });
  console.log('QUERY_RESULT_COUNT:' + leads.length);
  if (leads.length > 0) {
    console.log('FIRST_LEAD_MAPPING:' + JSON.stringify({
        id: leads[0].id,
        picName: leads[0].pic?.name || "Unassigned",
        stage: leads[0].stage
    }));
  }
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
    pool.end();
});
