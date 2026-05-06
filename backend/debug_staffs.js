const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const staffs = await prisma.bussdevStaff.findMany();
  console.log('CURRENT STAFFS:', JSON.stringify(staffs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
