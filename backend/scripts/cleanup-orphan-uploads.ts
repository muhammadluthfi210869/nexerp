/**
 * cleanup-orphan-uploads.ts
 *
 * Removes task attachment directories in `uploads/tasks/<taskId>/` whose
 * parent task no longer exists in the database. Safe to re-run; logs
 * what it removed and what it kept.
 *
 * Usage: npx ts-node backend/scripts/cleanup-orphan-uploads.ts
 *   or:  cd backend && npm run cleanup:uploads
 *
 * Safe-by-default: dry-run mode is on unless --apply is passed.
 */
import { PrismaClient } from '@prisma/client';
import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import { join } from 'path';

const UPLOADS_ROOT = join(process.cwd(), 'uploads');
const TASKS_DIR = join(UPLOADS_ROOT, 'tasks');
const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

async function main() {
  if (!existsSync(TASKS_DIR)) {
    console.log(`[cleanup-orphan-uploads] no tasks dir at ${TASKS_DIR} — nothing to do`);
    return;
  }

  const taskDirs = readdirSync(TASKS_DIR).filter((name) => {
    const full = join(TASKS_DIR, name);
    return statSync(full).isDirectory();
  });

  if (taskDirs.length === 0) {
    console.log('[cleanup-orphan-uploads] no task subdirs — nothing to do');
    return;
  }

  // Map existing task IDs (uuids) for fast lookup.
  const existing = await prisma.marketingTask.findMany({ select: { id: true } });
  const liveIds = new Set(existing.map((t) => t.id));

  const orphan: string[] = [];
  const live: string[] = [];
  for (const dir of taskDirs) {
    if (liveIds.has(dir)) live.push(dir);
    else orphan.push(dir);
  }

  console.log(`[cleanup-orphan-uploads] mode=${APPLY ? 'APPLY' : 'dry-run'}`);
  console.log(`[cleanup-orphan-uploads] live=${live.length}, orphan=${orphan.length}`);
  for (const id of orphan) {
    const full = join(TASKS_DIR, id);
    if (APPLY) {
      try {
        rmSync(full, { recursive: true, force: true });
        console.log(`  removed ${id}`);
      } catch (err) {
        console.warn(`  FAILED to remove ${id}:`, err);
      }
    } else {
      console.log(`  would remove ${id}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('[cleanup-orphan-uploads] fatal:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
