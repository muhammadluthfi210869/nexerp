
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const content = await prisma.contentAsset.count();
  const health = await prisma.accountHealthLog.count();
  const ads = await prisma.dailyAdsMetric.count();
  const leads = await prisma.salesLead.count();
  const targets = await prisma.marketingTarget.count();
  console.log({ content, health, ads, leads, targets });
}
main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
