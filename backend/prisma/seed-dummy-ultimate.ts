
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { seedMaster } from './seeders/master.seeder';
import { seedBussdev } from './seeders/bussdev.seeder';
import { seedRnD } from './seeders/rnd.seeder';
import { seedProduction } from './seeders/production.seeder';
import { seedOrders } from './seeders/orders.seeder';
import { seedFinance } from './seeders/finance.seeder';
import { seedHR } from './seeders/hr.seeder';
import { seedMarketing } from './seeders/marketing.seeder';
import { seedCreative } from './seeders/creative.seeder';
import { seedLegal } from './seeders/legal.seeder';
import { seedWebsite } from './seeders/website.seeder';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 STARTING ULTIMATE DUMMY DATA INJECTION...');

  // 1. Cleanup
  console.log('🧹 Cleaning up database...');
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`
        );
      } catch (error) {
        console.log(`⚠️ Could not truncate ${tablename}:`, error);
      }
    }
  }

  // 2. Execution in Order
  await seedMaster(prisma);
  await seedBussdev(prisma);
  await seedRnD(prisma);
  await seedOrders(prisma);
  await seedProduction(prisma);
  await seedFinance(prisma);
  await seedHR(prisma);
  await seedMarketing(prisma);
  await seedCreative(prisma);
  await seedLegal(prisma);
  await seedWebsite(prisma);

  console.log('🏁 ULTIMATE DUMMY DATA INJECTION COMPLETED SUCCESSFULLY.');
}

main()
  .catch((e) => {
    console.error('❌ SEEDING FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
