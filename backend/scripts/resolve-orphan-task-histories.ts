/**
 * Script: resolve-orphan-task-histories.ts
 * Tanggal: 2026-09-10
 * Tujuan: Backup & hapus 8 marketing_task_histories rows yang reference
 *          marketing_tasks.id yang sudah tidak ada (orphan FK).
 *
 * Alasan: Migration 20260909034500_align_management_task_runtime_schema gagal
 * karena 8 history rows punya taskId pointing ke tasks yang sudah dihapus duluan
 * (legacy data inconsistency). PostgreSQL menolak add FK constraint ke data orphan.
 *
 * Keputusan: User pilih Opsi A (hapus orphan) per evidence/2026-09-10/
 *            SUMMARY.md discussion. Backup dulu sebelum hapus untuk audit trail.
 *
 * Cara pakai:
 *   cd backend
 *   npx ts-node scripts/resolve-orphan-task-histories.ts        # dry-run (default)
 *   npx ts-node scripts/resolve-orphan-task-histories.ts --apply # execute
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const BACKUP_FILE = path.join(
  __dirname,
  '..',
  '..',
  'evidence',
  '2026-09-10',
  '06-migrations',
  'orphan-task-histories-backup.json',
);

async function findOrphans() {
  // Find history rows whose taskId doesn't exist in marketing_tasks.
  // Note: legacy schema has no createdAt/updatedAt on marketing_task_histories.
  // We use SELECT only the columns that exist in legacy schema.
  const orphans = await prisma.$queryRaw<
    Array<{
      id: string;
      taskId: string | null;
      byId: string | null;
      fromStatus: string | null;
      toStatus: string | null;
    }>
  >`
    SELECT h.id, h."taskId", h."byId", h."fromStatus", h."toStatus"
    FROM "marketing_task_histories" h
    LEFT JOIN "marketing_tasks" t ON h."taskId" = t.id
    WHERE h."taskId" IS NOT NULL AND t.id IS NULL
  `;

  return orphans;
}

async function backupOrphans(orphans: any[]) {
  // Ensure evidence dir exists
  const dir = path.dirname(BACKUP_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const backup = {
    capturedAt: new Date().toISOString(),
    reason:
      'Pre-delete backup. 8 history rows referenced non-existent marketing_tasks (orphan FK). User chose Opsi A (hapus orphan) per Phase 0 decision.',
    count: orphans.length,
    rows: orphans,
  };

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`[BACKUP] ${orphans.length} orphan rows saved to ${BACKUP_FILE}`);
}

async function deleteOrphans(orphans: any[]) {
  const ids = orphans.map((o) => o.id);
  const result = await prisma.marketingTaskHistory.deleteMany({
    where: { id: { in: ids } },
  });
  console.log(`[DELETE] Removed ${result.count} orphan history rows`);
  return result.count;
}

async function main() {
  const apply = process.argv.includes('--apply');

  console.log('=== Resolve Orphan Task Histories ===');
  console.log(`Mode: ${apply ? 'APPLY (akan hapus)' : 'DRY-RUN (preview saja)'}`);
  console.log('');

  const orphans = await findOrphans();
  console.log(`Found ${orphans.length} orphan rows (taskId tidak ada di marketing_tasks):`);
  for (const o of orphans) {
    console.log(
      `  - id=${o.id} taskId=${o.taskId} fromStatus=${o.fromStatus} toStatus=${o.toStatus}`,
    );
  }
  console.log('');

  if (orphans.length === 0) {
    console.log('No orphan rows. Migration can apply directly.');
    return;
  }

  if (!apply) {
    console.log('DRY-RUN complete. Jalankan dengan --apply untuk eksekusi.');
    return;
  }

  // Backup FIRST
  await backupOrphans(orphans);

  // Then delete
  const deleted = await deleteOrphans(orphans);
  console.log('');
  console.log(`Done. ${deleted} rows dihapus, backup tersimpan di:`);
  console.log(`  ${BACKUP_FILE}`);
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
