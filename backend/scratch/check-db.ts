
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.salesLead.count();
  const leads = await prisma.salesLead.findMany({
    include: { pic: true }
  });
  console.log('Total Leads:', count);
  console.log('Leads:', JSON.stringify(leads, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
