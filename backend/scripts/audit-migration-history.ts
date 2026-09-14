import 'dotenv/config';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

type AppliedMigration = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

const migrationsRoot = path.resolve(process.cwd(), 'prisma', 'migrations');

function findMatchingGitRevision(migrationName: string, expectedChecksum: string) {
  let gitRoot: string;
  try {
    gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
  const absolutePath = path.join(migrationsRoot, migrationName, 'migration.sql');
  const relativePath = path.relative(gitRoot, absolutePath).replaceAll('\\', '/');
  let revisions: string[] = [];

  try {
    revisions = execFileSync(
      'git',
      ['log', '--all', '--reflog', '--format=%H', '--', relativePath],
      { cwd: gitRoot, encoding: 'utf8' },
    )
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return null;
  }

  for (const revision of [...new Set(revisions)]) {
    try {
      const content = execFileSync('git', ['show', `${revision}:${relativePath}`], {
        cwd: gitRoot,
        encoding: 'buffer',
        maxBuffer: 20 * 1024 * 1024,
      });
      if (createHash('sha256').update(content).digest('hex') === expectedChecksum) {
        return { revision, lineEnding: 'LF' };
      }
      const crlfContent = Buffer.from(content.toString('utf8').replace(/\r?\n/g, '\r\n'));
      if (createHash('sha256').update(crlfContent).digest('hex') === expectedChecksum) {
        return { revision, lineEnding: 'CRLF' };
      }
    } catch {
      // The path may not exist in every commit returned by a rename/reflog walk.
    }
  }

  return null;
}

async function readLocalMigrations() {
  const entries = await readdir(migrationsRoot, { withFileTypes: true });
  const migrations = new Map<string, string>();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sql = await readFile(path.join(migrationsRoot, entry.name, 'migration.sql'));
    migrations.set(entry.name, createHash('sha256').update(sql).digest('hex'));
  }

  return migrations;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');

  const local = await readLocalMigrations();
  const pool = new Pool({ connectionString, max: 1 });

  try {
    const target = await pool.query<{ database_name: string }>('SELECT current_database() AS database_name');
    const applied = await pool.query<AppliedMigration>(`
      SELECT migration_name, checksum, finished_at, rolled_back_at
      FROM _prisma_migrations
      ORDER BY started_at, migration_name
    `);

    const appliedByName = new Map(applied.rows.map((row) => [row.migration_name, row]));
    let mismatchCount = 0;
    let databaseOnlyCount = 0;
    let failedCount = 0;

    console.log(`Migration ledger audit (READ ONLY): ${target.rows[0]?.database_name ?? 'unknown'}`);

    for (const row of applied.rows) {
      if (row.rolled_back_at || !row.finished_at) {
        failedCount += 1;
        console.log(`FAILED_OR_ROLLED_BACK  ${row.migration_name}`);
        continue;
      }

      const localChecksum = local.get(row.migration_name);
      if (!localChecksum) {
        databaseOnlyCount += 1;
        console.log(`DATABASE_ONLY          ${row.migration_name}`);
      } else if (localChecksum !== row.checksum) {
        mismatchCount += 1;
        const recoveryRevision = findMatchingGitRevision(row.migration_name, row.checksum);
        const recoveryHint = recoveryRevision
          ? ` (matching Git revision: ${recoveryRevision.revision}, ${recoveryRevision.lineEnding})`
          : '';
        console.log(`CHECKSUM_MISMATCH      ${row.migration_name}${recoveryHint}`);
      } else {
        console.log(`APPLIED_MATCH          ${row.migration_name}`);
      }
    }

    const pending = [...local.keys()].filter((name) => !appliedByName.has(name)).sort();
    for (const name of pending) console.log(`LOCAL_PENDING          ${name}`);

    console.log(
      `Summary: ${applied.rows.length} ledger rows, ${local.size} local migrations, ` +
        `${pending.length} pending, ${mismatchCount} checksum mismatches, ` +
        `${databaseOnlyCount} database-only, ${failedCount} failed/rolled back.`,
    );

    if (mismatchCount || databaseOnlyCount || failedCount) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[audit-migration-history] fatal:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
