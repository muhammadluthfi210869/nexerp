import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Columns of marketing_task_histories
  const cols = await prisma.$queryRaw<
    Array<{ column_name: string; data_type: string; is_nullable: string }>
  >`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'marketing_task_histories'
    ORDER BY ordinal_position
  `;
  console.log('=== Columns of marketing_task_histories ===');
  for (const c of cols) console.log(`  ${c.column_name.padEnd(30)} ${c.data_type.padEnd(30)} nullable=${c.is_nullable}`);

  // FK constraints on marketing_task_histories
  const fks = await prisma.$queryRaw<
    Array<{ conname: string; conrelid: string; confrelid: string; pg_get_constraintdef: string }>
  >`
    SELECT conname, conrelid::regclass::text AS conrelid,
           confrelid::regclass::text AS confrelid,
           pg_get_constraintdef(oid) AS constraint_def
    FROM pg_constraint
    WHERE conrelid = '"marketing_task_histories"'::regclass
      AND contype = 'f'
  `;
  console.log('');
  console.log('=== FK constraints on marketing_task_histories ===');
  if (fks.length === 0) console.log('  (none)');
  for (const fk of fks) console.log(`  ${fk.conname}: ${fk.pg_get_constraintdef}`);

  // _prisma_migrations state
  const mig = await prisma.$queryRaw<
    Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null; logs: string | null }>
  >`
    SELECT migration_name, finished_at, rolled_back_at, logs
    FROM _prisma_migrations
    ORDER BY migration_name
  `;
  console.log('');
  console.log('=== _prisma_migrations state ===');
  for (const m of mig) {
    const state = m.rolled_back_at ? 'ROLLED_BACK' : m.finished_at ? 'APPLIED' : 'PENDING';
    console.log(`  ${m.migration_name.padEnd(60)} ${state}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
