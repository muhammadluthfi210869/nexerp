import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// FK constraints that should have been added by migration
// 20260909034500_align_management_task_runtime_schema but were skipped
// due to orphan data. Now safe to add because we deleted 4 orphans.
const FK_CONSTRAINTS = [
  {
    table: 'marketing_tasks',
    constraint: 'marketing_tasks_projectId_fkey',
    sql: `ALTER TABLE "marketing_tasks" ADD CONSTRAINT "marketing_tasks_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "marketing_projects"("id") ON DELETE SET NULL`,
  },
  {
    table: 'marketing_task_histories',
    constraint: 'marketing_task_histories_taskId_fkey',
    sql: `ALTER TABLE "marketing_task_histories" ADD CONSTRAINT "marketing_task_histories_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE`,
  },
  {
    table: 'marketing_task_attachments',
    constraint: 'marketing_task_attachments_taskId_fkey',
    sql: `ALTER TABLE "marketing_task_attachments" ADD CONSTRAINT "marketing_task_attachments_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE`,
  },
  {
    table: 'marketing_task_comments',
    constraint: 'marketing_task_comments_taskId_fkey',
    sql: `ALTER TABLE "marketing_task_comments" ADD CONSTRAINT "marketing_task_comments_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "marketing_tasks"("id") ON DELETE CASCADE`,
  },
];

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log('');

  for (const fk of FK_CONSTRAINTS) {
    // Check if already exists
    const existing = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint WHERE conname = ${fk.constraint}
    `;
    if (existing.length > 0) {
      console.log(`[SKIP] ${fk.constraint} already exists`);
      continue;
    }

    // Check for orphan data first
    const orphanCheck = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "${fk.table}" t
       WHERE ${fk.sql.match(/FOREIGN KEY \(["']?(\w+)["']?\)/)?.[1]} IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM ${fk.sql.match(/REFERENCES ["']?(\w+)["']?\."?(\w+)"?/)?.[1]} x
                       WHERE x.id = ${fk.sql.match(/FOREIGN KEY \(["']?(\w+)["']?\)/)?.[1]})`,
    ).catch((e) => {
      console.log(`  [orphan-check failed for ${fk.table}]: ${e.message}`);
      return [{ count: 0n }];
    });

    const orphanCount = Number(orphanCheck[0]?.count ?? 0);

    if (orphanCount > 0) {
      console.log(`[BLOCKED] ${fk.constraint} - ${orphanCount} orphan rows. Resolve orphans first.`);
      continue;
    }

    console.log(`[${apply ? 'APPLY' : 'PLAN'}] ${fk.constraint}`);
    console.log(`  SQL: ${fk.sql}`);

    if (apply) {
      try {
        await prisma.$executeRawUnsafe(fk.sql);
        console.log(`  [OK] applied`);
      } catch (e: any) {
        console.log(`  [FAIL] ${e.message}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
