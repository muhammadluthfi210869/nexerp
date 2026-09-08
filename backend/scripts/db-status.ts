import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
}

main()
  .catch((err) => {
    console.error('[db-status] fatal:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
