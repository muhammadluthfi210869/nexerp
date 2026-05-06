// @ts-nocheck
import 'dotenv/config';
import { PrismaClient, Division } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding HR V4 Master Data...');

  // 1. Factory Geofence Config
  await prisma.systemConfig.upsert({
    where: { key: 'FACTORY_LAT' },
    update: {},
    create: {
      key: 'FACTORY_LAT',
      value: '-6.200000', 
      group: 'HR_ATTENDANCE',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'FACTORY_LNG' },
    update: {},
    create: {
      key: 'FACTORY_LNG',
      value: '106.816666',
      group: 'HR_ATTENDANCE',
    },
  });

  // 2. KPI Metric Definitions (Passive Harvesting)
  const metrics = [
    { eventCode: 'sales.so.paid', label: 'SO Paid', points: 10, division: 'BD' },
    { eventCode: 'rnd.formula.submitted', label: 'Formula Submitted', points: 5, division: 'RND' },
    { eventCode: 'production.batch.done', label: 'Batch Mixing Done', points: 2, division: 'PRODUCTION' },
    { eventCode: 'qc.batch.rejected', label: 'Batch Rejected (Penalti)', points: -15, division: 'PRODUCTION' },
    { eventCode: 'qc.batch.approved', label: 'Batch Approved', points: 5, division: 'QC' },
    { eventCode: 'scm.po.generated', label: 'PO Generated', points: 1, division: 'SCM' },
    { eventCode: 'creative.design.locked', label: 'Design Locked', points: 10, division: 'CREATIVE' },
  ];

  for (const m of metrics) {
    await prisma.kpiMetricDefinition.upsert({
      where: { eventCode: m.eventCode },
      update: m,
      create: m,
    });
  }

  console.log('HR V4 Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
