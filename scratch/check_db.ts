
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const staffs = await prisma.bussdevStaff.findMany();
    console.log('Bussdev Staff Count:', staffs.length);
    console.log('Staff Details:', JSON.stringify(staffs, null, 2));

    const leads = await prisma.salesLead.findMany({ take: 5 });
    console.log('Recent Leads Count:', leads.length);
  } catch (error) {
    console.error('Error checking DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
