import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TABLES: Array<{ name: string; label: string }> = [
  { name: 'marketing_tasks', label: 'MarketingTask' },
  { name: 'marketing_task_histories', label: 'MarketingTaskHistory' },
  { name: 'marketing_task_attachments', label: 'MarketingTaskAttachment' },
  { name: 'marketing_task_comments', label: 'MarketingTaskComment' },
  { name: 'marketing_projects', label: 'MarketingProject' },
];

async function main() {
  console.log('Marketing DB status');
  console.log('='.repeat(60));

  for (const table of TABLES) {
    try {
      const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${table.name}"`,
      );
      const count = Number(result[0]?.count ?? 0);
      console.log(`  ${table.label.padEnd(30)} ${count.toString().padStart(8)} rows`);
    } catch (err) {
      console.log(`  ${table.label.padEnd(30)} ERROR: ${(err as Error).message.slice(0, 30)}`);
    }
  }

  console.log('='.repeat(60));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, roles: true },
  });
  console.log('Users in DB:');
  for (const u of users) {
    console.log(`  ${u.email.padEnd(25)} | ${(u.fullName ?? '').padEnd(15)} | ${u.roles.join(',')}`);
  }

  console.log('='.repeat(60));
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE marketing_tasks ADD COLUMN IF NOT EXISTS "assigneeId" UUID`);
    await prisma.$executeRawUnsafe(`ALTER TABLE marketing_tasks ADD COLUMN IF NOT EXISTS "description" TEXT`);
    
    const updated = await prisma.$executeRawUnsafe(`
      UPDATE marketing_tasks
      SET
        "taskCode" = COALESCE("taskCode", taskcode),
        "projectId" = COALESCE("projectId", projectid),
        "assignedById" = COALESCE("assignedById", assignedbyid),
        "picId" = COALESCE("picId", pic_id),
        "reviewerId" = COALESCE("reviewerId", reviewerid),
        "startDate" = COALESCE("startDate", startdate),
        "dueDate" = COALESCE("dueDate", duedate),
        "completedAt" = COALESCE("completedAt", completedat),
        "assigneeId" = COALESCE("assigneeId", pic_id, "picId"),
        "description" = COALESCE("description", brief)
      WHERE "dueDate" IS NULL OR "picId" IS NULL OR "taskCode" IS NULL OR "assigneeId" IS NULL
    `);
    console.log(`✅ Synced ${updated} rows from legacy columns to Prisma columns!`);

    const { MarketingPrototypeService } = await import('../src/modules/marketing/prototype/marketing-prototype.service');
    const service = new MarketingPrototypeService(prisma as any);
    const bundle = await service.getBundle({
      id: 'some-user-id',
      email: 'revita@nexerp.id',
      fullName: 'Revita Yustianawati',
      roles: ['DIGIMAR'],
    });
    console.log('GET BUNDLE AFTER SYNC SUCCESS!');
    console.log('Tasks returned:', bundle.tasks.length);
    console.log('Tasks with non-null pic:', bundle.tasks.filter((t: any) => t.pic).length);
    console.log('Tasks with non-empty dueDate:', bundle.tasks.filter((t: any) => t.dueDate).length);
    console.log('Performance members count:', bundle.performance.length);
    console.log('Performance names:', bundle.performance.map((p: any) => p.name).join(', '));
  } catch (e: any) {
    console.log('ERROR:', e.stack || e.message);
  }
  console.log('='.repeat(60));
  console.log('='.repeat(60));
}

main()
  .catch((err) => {
    console.error('[db-status] fatal:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
