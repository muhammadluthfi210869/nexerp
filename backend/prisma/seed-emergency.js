const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Direct SEED via Node JS...');
  const lead = await prisma.salesLead.findFirst();
  if (!lead) return console.log('No Leads');
  
  await prisma.sampleRequest.updateMany({
    where: { leadId: lead.id },
    data: { 
      stage: 'READY_TO_SHIP'
    }
  });
  console.log('Updated first lead to READY_TO_SHIP');
}

main().finally(() => prisma.$disconnect());
