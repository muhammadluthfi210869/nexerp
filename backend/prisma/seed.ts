// @ts-nocheck
import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { seedPersonnel } from './seeders/personnel.seeder';
import { seedKpiMetrics } from './seeders/kpi-metrics.seeder';
import { seedKpiScores } from './seeders/kpi-scores.seeder';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 RESETTING DATABASE...');
  
  // Cleanup — daftar manual dulu sering basi (mis. "sample_revisions" sudah tidak
  // ada di schema → seed gagal total). Ambil daftar tabel LANGSUNG dari DB,
  // selalu sinkron dengan schema yang terpasang. _prisma_migrations dikecualikan.
  const publicTables: Array<{ tablename: string }> = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
  );
  if (publicTables.length > 0) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${publicTables.map(t => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`
    );
  }

  console.log('');
  console.log('🌱 FASE 1: Seeding Personnel (24 Real Users)...');
  await seedPersonnel(prisma);

  console.log('');
  console.log('🌱 FASE 2: Seeding KPI Metric Definitions...');
  await seedKpiMetrics(prisma);

  console.log('');
  console.log('🌱 FASE 3: Seeding KPI Scores & Attendance...');
  await seedKpiScores(prisma);

  console.log('');
  console.log('🌱 FASE 4: Syncing Bussdev Staff...');
  const marketingUsers = await prisma.user.findMany({
    where: { roles: { hasSome: [UserRole.MARKETING, UserRole.COMMERCIAL, UserRole.SUPER_ADMIN] } },
  });
  for (const user of marketingUsers) {
    const existing = await prisma.bussdevStaff.findUnique({ where: { userId: user.id } });
    if (!existing) {
      await prisma.bussdevStaff.create({
        data: {
          userId: user.id,
          name: user.fullName || user.email,
          targetRevenue: 1000000000,
          isActive: true,
        },
      });
      console.log(`  ✅ Bussdev Staff: ${user.fullName}`);
    }
  }

  console.log('');
  console.log('💎 SEEDING COMPLETE.');
  console.log('   🔐 Password untuk semua akun: password123');
  console.log('   📧 Format email: nama@dreamlab.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
