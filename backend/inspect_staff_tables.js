const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('--- TABLE: users ---');
  const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true } });
  console.table(users);

  console.log('\n--- TABLE: bussdev_staffs ---');
  const staffs = await prisma.bussdevStaff.findMany();
  console.table(staffs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
