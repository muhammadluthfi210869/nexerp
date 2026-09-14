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
  { name: 'marketing_brands', label: 'MarketingBrand' },
  { name: 'marketing_task_checklist_items', label: 'MarketingTaskChecklistItem' },
  { name: 'social_posts', label: 'SocialPost' },
  { name: 'social_checklist_items', label: 'SocialChecklistItem' },
  { name: 'social_post_media', label: 'SocialPostMedia' },
  { name: 'social_post_metric_snapshots', label: 'SocialPostMetricSnapshot' },
  { name: 'campaign_okrs', label: 'CampaignOkr' },
  { name: 'marketing_reporting_periods', label: 'MarketingReportingPeriod' },
  { name: 'brand_channel_metrics', label: 'BrandChannelMetric' },
  { name: 'weekly_social_reports', label: 'WeeklySocialReport' },
  { name: 'story_daily_metrics', label: 'StoryDailyMetric' },
  { name: 'marketing_channel_funnels', label: 'MarketingChannelFunnel' },
  { name: 'marketing_integration_connections', label: 'MarketingIntegrationConnection' },
  { name: 'marketing_integration_sync_jobs', label: 'MarketingIntegrationSyncJob' },
  { name: 'meta_account_configs', label: 'MetaAccountConfig' },
  { name: 'meta_insights_snapshots', label: 'MetaInsightsSnapshot' },
];

async function main() {
  console.log('Marketing DB status (READ ONLY)');
  console.log('='.repeat(60));

  const database = await prisma.$queryRaw<Array<{
    database_name: string;
    database_user: string;
    server_version: string;
  }>>`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      current_setting('server_version') AS server_version
  `;
  const target = database[0];
  console.log(`Database: ${target?.database_name ?? 'unknown'}`);
  console.log(`DB user:  ${target?.database_user ?? 'unknown'}`);
  console.log(`Postgres: ${target?.server_version ?? 'unknown'}`);
  console.log('='.repeat(60));

  for (const table of TABLES) {
    try {
      const relation = await prisma.$queryRawUnsafe<Array<{ relation_name: string | null }>>(
        `SELECT to_regclass('public.${table.name}')::text AS relation_name`,
      );
      if (!relation[0]?.relation_name) {
        console.log(`  ${table.label.padEnd(30)} ${'MISSING'.padStart(8)}`);
        continue;
      }
      const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${table.name}"`,
      );
      const count = Number(result[0]?.count ?? 0);
      console.log(`  ${table.label.padEnd(30)} ${count.toString().padStart(8)} rows`);
    } catch (err) {
      console.log(`  ${table.label.padEnd(30)} ERROR: ${(err as Error).message.split('\n')[0].slice(0, 60)}`);
    }
  }

  console.log('='.repeat(60));

  const userCount = await prisma.user.count();
  const marketingUsers = await prisma.user.count({
    where: {
      OR: [
        { roles: { has: 'DIGIMAR' } },
        { roles: { has: 'MARKETING' } },
        { roles: { has: 'SUPER_ADMIN' } },
      ],
    },
  });
  console.log(`Users: ${userCount} total, ${marketingUsers} with marketing/admin access`);
  console.log('='.repeat(60));
  console.log('No schema or data changes were performed.');
}

main()
  .catch((err) => {
    console.error('[db-status] fatal:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
