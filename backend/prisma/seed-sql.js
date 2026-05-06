const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('SQL Seed for Sample Hub...');
  // Force update one sample to READY_TO_SHIP via raw SQL
  await prisma.$executeRaw`UPDATE "SampleRequest" SET stage = 'READY_TO_SHIP' WHERE id IN (SELECT id FROM "SampleRequest" LIMIT 1)`;
  console.log('✅ Done');
}

main().finally(() => prisma.$disconnect());
