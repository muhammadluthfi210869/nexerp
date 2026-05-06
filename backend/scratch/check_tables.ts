import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables in public schema:', tables);
  } catch (e) {
    console.error('Error querying tables:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
