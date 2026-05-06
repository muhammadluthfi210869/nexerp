const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
  const staffs = await prisma.bussdevStaff.findMany({
    select: { id: true, name: true, userId: true }
  });
  const leads = await prisma.salesLead.findMany({
    take: 5,
    select: { id: true, picId: true, bdId: true }
  });
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, fullName: true }
  });
  
  const output = {
    staffs,
    leads,
    users
  };
  
  fs.writeFileSync('db_dump.json', JSON.stringify(output, null, 2));
  console.log('Dump complete');
}
main().catch(console.error).finally(() => prisma.$disconnect());
