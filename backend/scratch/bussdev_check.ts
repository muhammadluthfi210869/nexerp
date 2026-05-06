import { PrismaClient, WorkflowStatus } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  try {
    console.log('--- BUSSDEV HEALTH CHECK ---');
    const leadCount = await prisma.salesLead.count();
    const latestLeads = await prisma.salesLead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { pic: true }
    });
    
    console.log(`Total SalesLeads: ${leadCount}`);
    latestLeads.forEach((l, i) => {
      console.log(`Lead ${i+1}: ${l.clientName} | Brand: ${l.brandName} | Status: ${l.status} | PIC: ${l.pic?.name || 'NONE'}`);
    });

    const guestCount = await prisma.guestLog.count();
    const latestGuests = await prisma.guestLog.findMany({
      take: 5,
      orderBy: { visitDate: 'desc' }
    });
    console.log(`Total GuestLogs: ${guestCount}`);
    latestGuests.forEach((g, i) => {
      console.log(`Guest ${i+1}: ${g.clientName} | BD: ${g.bdId}`);
    });

    const staffCount = await prisma.bussdevStaff.count();
    console.log(`Total BussdevStaff: ${staffCount}`);

    const newLeadsCount = await prisma.salesLead.count({ where: { status: WorkflowStatus.NEW_LEAD } });
    console.log(`Leads with status NEW_LEAD: ${newLeadsCount}`);

  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
