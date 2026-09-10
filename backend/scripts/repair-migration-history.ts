import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

type LedgerRow = { migration_name: string; checksum: string };

function sha256(content: Buffer) {
  return createHash('sha256').update(content).digest('hex');
}

function gitCandidates(gitRoot: string, relativePath: string) {
  const revisions = execFileSync(
    'git',
    ['log', '--all', '--reflog', '--format=%H', '--', relativePath],
    { cwd: gitRoot, encoding: 'utf8' },
  )
    .split(/\r?\n/)
    .filter(Boolean);

  return [...new Set(revisions)];
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');

  const backendRoot = process.cwd();
  const migrationsRoot = path.resolve(backendRoot, 'prisma', 'migrations');
  const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: backendRoot,
    encoding: 'utf8',
  }).trim();
  const pool = new Pool({ connectionString, max: 1 });

  try {
    const ledger = await pool.query<LedgerRow>(`
      SELECT migration_name, checksum
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY started_at, migration_name
    `);

    let repaired = 0;
    for (const row of ledger.rows) {
      const target = path.resolve(migrationsRoot, row.migration_name, 'migration.sql');
      if (!target.startsWith(`${migrationsRoot}${path.sep}`)) {
        throw new Error(`Unsafe migration path: ${row.migration_name}`);
      }
      try {
        if (sha256(await readFile(target)) === row.checksum) continue;
      } catch {
        // Missing local files continue into checksum-verified Git recovery.
      }
      const relativePath = path.relative(gitRoot, target).replaceAll('\\', '/');

      let replacement: Buffer | null = null;
      for (const revision of gitCandidates(gitRoot, relativePath)) {
        let gitContent: Buffer;
        try {
          gitContent = execFileSync('git', ['show', `${revision}:${relativePath}`], {
            cwd: gitRoot,
            encoding: 'buffer',
            maxBuffer: 20 * 1024 * 1024,
          });
        } catch {
          continue;
        }

        const candidates = [
          gitContent,
          Buffer.from(gitContent.toString('utf8').replace(/\r?\n/g, '\r\n')),
        ];
        replacement = candidates.find((candidate) => sha256(candidate) === row.checksum) ?? null;
        if (replacement) break;
      }

      if (!replacement) continue;
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, replacement);
      repaired += 1;
      console.log(`REPAIRED  ${row.migration_name}`);
    }

    console.log(`Repaired ${repaired} migration file(s) from checksum-matched Git history.`);
    console.log('No database changes were performed.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[repair-migration-history] fatal:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
