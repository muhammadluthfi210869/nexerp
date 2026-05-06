
process.env.DATABASE_URL = "postgresql://postgres:66luthfi29@localhost:5432/erp_db?schema=public";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPipeline() {
  console.log('--- START DEBUG PIPELINE ---');
  
  const totalLeads = await prisma.salesLead.count();
  console.log('Total Leads in DB:', totalLeads);

  const leads = await prisma.salesLead.findMany({
    include: {
      pic: true,
      sampleRequests: {
        include: {
          revisions: {
            orderBy: { revisionNumber: 'asc' },
          },
        },
        orderBy: { requestedAt: 'desc' },
        take: 1,
      },
      workOrders: {
        include: {
          invoices: {
            where: { status: 'PAID' },
            take: 1,
          },
        },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  console.log('Leads found in Granular Query:', leads.length);
  if (leads.length > 0) {
     leads.forEach((l, i) => {
        console.log(`[${i}] Lead: ${l.clientName}, Stage: ${l.stage}, PIC: ${l.pic?.name || 'NULL'}`);
     });
  }

  process.exit(0);
}

checkPipeline().catch(err => {
  console.error(err);
  process.exit(1);
});
