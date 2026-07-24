// @ts-nocheck
import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 RESETTING DATABASE (Production Light)...');

  // Cleanup — hanya tabel yang masih ada di skema aktif
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE
    users, employees, employee_role_mappings, kpi_point_logs, kpi_scores,
    kpi_metric_definitions, attendances, payroll_items, payrolls, tickets,
    daily_ads_metrics, marketing_targets, content_assets, search_visibility_metrics,
    account_health_logs, rnd_daily_tasks, rnd_projects, rnd_weekly_performances,
    rnd_failed_trials, rnd_head_trackers, rnd_monthly_kpis
  RESTART IDENTITY CASCADE`);

  console.log('');
  console.log('🌱 Seeding Users...');
  const PASSWORD = await bcrypt.hash('password123', 10);
  const users = [
    { email: 'admin@dreamlab.com', fullName: 'Super Admin', roles: [UserRole.SUPER_ADMIN] },
    { email: 'rnd@dreamlab.com', fullName: 'RND User', roles: [UserRole.RND] },
    { email: 'marketing@dreamlab.com', fullName: 'Marketing User', roles: [UserRole.MARKETING, UserRole.DIGIMAR] },
    { email: 'hr@dreamlab.com', fullName: 'HR User', roles: [UserRole.HR] },
    { email: 'panca@dreamlab.com', fullName: 'Panca', roles: [UserRole.RND] },
    { email: 'amira@dreamlab.com', fullName: 'Amira', roles: [UserRole.RND] },
    { email: 'nisa@dreamlab.com', fullName: 'Nisa', roles: [UserRole.MARKETING] },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { roles: u.roles },
      create: { email: u.email, fullName: u.fullName, passwordHash: PASSWORD, roles: u.roles },
    });
    console.log(`  ✅ ${u.fullName} (${u.email})`);
  }

  console.log('');
  console.log('💎 SEEDING COMPLETE.');
  console.log('   🔐 Password untuk semua akun: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
