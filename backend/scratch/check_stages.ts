
process.env.DATABASE_URL = "postgresql://postgres:66luthfi29@localhost:5432/erp_db?schema=public";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStages() {
  const stages = await prisma.salesLead.groupBy({
    by: ['stage'],
    _count: true,
  });
  console.log('Leads by stage:', stages);
  process.exit(0);
}

checkStages().catch(err => {
  console.error(err);
  process.exit(1);
});
