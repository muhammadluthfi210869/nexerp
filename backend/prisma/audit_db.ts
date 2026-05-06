import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const staffCount = await prisma.bussdevStaff.count();
  const leadsCount = await prisma.salesLead.count();
  const samplesCount = await prisma.sampleRequest.count();
  const woCount = await prisma.workOrder.count();

  console.log(`📊 DATABASE AUDIT REPORT 📊`);
  console.log(`--------------------------`);
  console.log(`Bussdev Staff: ${staffCount}`);
  console.log(`Sales Leads  : ${leadsCount}`);
  console.log(`Samples      : ${samplesCount}`);
  console.log(`Work Orders  : ${woCount}`);
  
  const staffs = await prisma.bussdevStaff.findMany();
  console.log(`Staff Names: ${staffs.map(s => s.name).join(', ')}`);
  
  if (leadsCount > 0) {
    const leadsByPic = await prisma.salesLead.groupBy({
      by: ['picId'],
      _count: { id: true }
    });
    console.log(`Leads Grouped by PIC ID:`, JSON.stringify(leadsByPic));
  }
}

check().finally(() => prisma.$disconnect());
