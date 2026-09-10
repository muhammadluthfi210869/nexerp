import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { Pool } from 'pg';

const REQUIRED_TABLES = [
  'marketing_brands',
  'marketing_task_checklist_items',
  'social_post_media',
  'social_post_metric_snapshots',
  'marketing_reporting_periods',
  'brand_channel_metrics',
  'weekly_social_reports',
  'story_daily_metrics',
  'marketing_channel_funnels',
  'marketing_integration_connections',
  'marketing_integration_sync_jobs',
];

const REQUIRED_COLUMNS: Array<[string, string]> = [
  ['marketing_tasks', 'taskType'],
  ['marketing_tasks', 'canonicalStatus'],
  ['marketing_tasks', 'estimatedMinutes'],
  ['marketing_tasks', 'actualMinutes'],
  ['marketing_tasks', 'version'],
  ['marketing_tasks', 'brandId'],
  ['marketing_projects', 'canonicalStatus'],
  ['marketing_projects', 'version'],
  ['marketing_projects', 'brandId'],
  ['social_posts', 'brandId'],
  ['social_posts', 'assigneeId'],
  ['social_posts', 'reviewerId'],
  ['social_posts', 'brief'],
  ['social_posts', 'referenceUrl'],
  ['social_posts', 'canonicalStatus'],
  ['social_posts', 'version'],
  ['social_posts', 'metricsSyncedAt'],
  ['campaign_okrs', 'brandId'],
];

async function main() {
  const activeUrl = process.env.DATABASE_URL;
  if (!activeUrl) throw new Error('DATABASE_URL is required.');

  const parsed = new URL(activeUrl);
  const activeDatabase = parsed.pathname.replace(/^\//, '');
  const databaseName = `erp_phase2_rehearsal_${Date.now()}_${randomBytes(3).toString('hex')}`;
  if (!/^erp_phase2_rehearsal_[a-z0-9_]+$/.test(databaseName)) {
    throw new Error(`Unsafe rehearsal database name: ${databaseName}`);
  }
  if (databaseName === activeDatabase) throw new Error('Refusing to use the active database as rehearsal target.');

  const adminUrl = new URL(activeUrl);
  adminUrl.pathname = '/postgres';
  const rehearsalUrl = new URL(activeUrl);
  rehearsalUrl.pathname = `/${databaseName}`;
  const admin = new Pool({ connectionString: adminUrl.toString(), max: 1 });
  let created = false;

  try {
    console.log(`Creating disposable database: ${databaseName}`);
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    created = true;

    const prismaCli = path.resolve(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
    execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', 'prisma/schema'], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: rehearsalUrl.toString() },
      stdio: 'inherit',
    });

    const rehearsal = new Pool({ connectionString: rehearsalUrl.toString(), max: 1 });
    try {
      const relations = await rehearsal.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)`,
        [REQUIRED_TABLES],
      );
      const found = new Set(relations.rows.map((row) => row.table_name));
      const missing = REQUIRED_TABLES.filter((table) => !found.has(table));
      if (missing.length) throw new Error(`Missing Phase 2 tables: ${missing.join(', ')}`);

      const columns = await rehearsal.query<{ table_name: string; column_name: string }>(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
      `);
      const foundColumns = new Set(columns.rows.map((row) => `${row.table_name}.${row.column_name}`));
      const missingColumns = REQUIRED_COLUMNS.filter(
        ([table, column]) => !foundColumns.has(`${table}.${column}`),
      );
      if (missingColumns.length) {
        throw new Error(
          `Missing Phase 2 columns: ${missingColumns.map(([table, column]) => `${table}.${column}`).join(', ')}`,
        );
      }

      const integrity = await rehearsal.query<{
        brands: string;
        tasks_without_status: string;
        invalid_task_statuses: string;
        invalid_project_statuses: string;
        invalid_social_statuses: string;
        phase2_migration_count: string;
      }>(`
        SELECT
          (SELECT COUNT(*)::text FROM marketing_brands) AS brands,
          (SELECT COUNT(*)::text FROM marketing_tasks WHERE "canonicalStatus" IS NULL) AS tasks_without_status,
          (SELECT COUNT(*)::text FROM marketing_tasks
            WHERE "canonicalStatus" NOT IN ('NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'REVISION', 'DONE', 'CANCELLED'))
            AS invalid_task_statuses,
          (SELECT COUNT(*)::text FROM marketing_projects
            WHERE "canonicalStatus" NOT IN ('PLANNED', 'ON_TRACK', 'AT_RISK', 'ON_HOLD', 'COMPLETED', 'CANCELLED'))
            AS invalid_project_statuses,
          (SELECT COUNT(*)::text FROM social_posts
            WHERE "canonicalStatus" NOT IN ('IDEA', 'DRAFT', 'SCRIPTING', 'PRODUCTION', 'IN_REVIEW', 'REVISION', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'))
            AS invalid_social_statuses,
          (SELECT COUNT(*)::text FROM _prisma_migrations
            WHERE finished_at IS NOT NULL
              AND migration_name = '20260910150000_marketing_task_social_foundation') AS phase2_migration_count
      `);
      const result = integrity.rows[0];
      if (Number(result?.brands ?? 0) < 2) throw new Error('Brand seed/backfill did not create both canonical brands.');
      if (Number(result?.tasks_without_status ?? 0) !== 0) throw new Error('Canonical task status backfill is incomplete.');
      if (Number(result?.invalid_task_statuses ?? 0) !== 0) throw new Error('Invalid canonical task status found.');
      if (Number(result?.invalid_project_statuses ?? 0) !== 0) throw new Error('Invalid canonical project status found.');
      if (Number(result?.invalid_social_statuses ?? 0) !== 0) throw new Error('Invalid canonical social status found.');
      if (Number(result?.phase2_migration_count ?? 0) !== 1) throw new Error('Phase 2 migration was not applied.');

      console.log(
        `Rehearsal passed: ${found.size} required tables, ${REQUIRED_COLUMNS.length} required columns, ` +
          `${result.brands} brands, canonical task status complete.`,
      );
    } finally {
      await rehearsal.end();
    }
  } finally {
    if (created) {
      console.log(`Dropping disposable database: ${databaseName}`);
      await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    }
    await admin.end();
  }
}

main().catch((error) => {
  console.error('[rehearse-marketing-phase2] fatal:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
