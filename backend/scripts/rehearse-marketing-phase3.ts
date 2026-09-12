import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { CanonicalMarketingService } from '../src/modules/marketing/canonical/canonical-marketing.service';
import { SocialPlannerService } from '../src/modules/marketing/social-planner/social-planner.service';

const MANAGER_ID = '10000000-0000-4000-8000-000000000001';
const MEMBER_ID = '10000000-0000-4000-8000-000000000002';

async function main() {
  const activeUrl = process.env.DATABASE_URL;
  if (!activeUrl) throw new Error('DATABASE_URL is required.');
  const parsed = new URL(activeUrl);
  const activeDatabase = parsed.pathname.replace(/^\//, '');
  const databaseName = `erp_phase3_rehearsal_${Date.now()}`;
  if (!/^erp_phase3_rehearsal_[0-9]+$/.test(databaseName) || databaseName === activeDatabase) {
    throw new Error(`Unsafe rehearsal database target: ${databaseName}`);
  }

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

    const appPool = new Pool({ connectionString: rehearsalUrl.toString() });
    const prisma = new PrismaClient({ adapter: new PrismaPg(appPool) });
    try {
      await prisma.user.createMany({ data: [
        { id: MANAGER_ID, fullName: 'Marketing Manager', email: 'phase3.manager@nexerp.test', roles: ['MARKETING'], status: 'ACTIVE' },
        { id: MEMBER_ID, fullName: 'Digital Marketer', email: 'phase3.member@nexerp.test', roles: ['DIGIMAR'], status: 'ACTIVE' },
      ] });
      const brand = await prisma.marketingBrand.findUniqueOrThrow({ where: { code: 'DREAMLAB' } });
      const canonical = new CanonicalMarketingService(prisma as any);
      const manager = { id: MANAGER_ID, email: 'phase3.manager@nexerp.test', roles: ['MARKETING'] };
      const member = { id: MEMBER_ID, email: 'phase3.member@nexerp.test', roles: ['DIGIMAR'] };

      const taskInput = {
        type: 'DAILY' as const,
        title: 'Phase 3 database rehearsal',
        brandId: brand.id,
        channel: 'Instagram',
        category: 'content_operations',
        assigneeId: MEMBER_ID,
        priority: 'HIGH',
        startDate: '2026-09-11T00:00:00.000Z',
        dueDate: '2026-09-12T00:00:00.000Z',
        estimatedMinutes: 90,
        checklist: [{ text: 'Mandatory review', isRequired: true, sortOrder: 0 }],
      };
      console.log('Rehearsal: task create/idempotency');
      let task: any = await canonical.createTask(manager, taskInput, 'phase3-task-create-001');
      const replay: any = await canonical.createTask(manager, taskInput, 'phase3-task-create-001');
      if (replay.id !== task.id) throw new Error('Persistent idempotency replay created a duplicate task.');

      console.log('Rehearsal: task scope/workflow');
      const memberList = await canonical.listTasks(member, { page: 1, limit: 50 });
      if (memberList.total !== 1 || memberList.data[0]?.id !== task.id) throw new Error('DIGIMAR object scope did not return the assigned task.');
      task = await canonical.updateChecklist(member, task.id, task.checklist[0].id, { version: task.version, done: true });
      task = await canonical.updateTaskStatus(member, task.id, { version: task.version, status: 'IN_PROGRESS' });
      task = await canonical.updateTaskStatus(member, task.id, { version: task.version, status: 'IN_REVIEW' });
      task = await canonical.updateTaskStatus(member, task.id, { version: task.version, status: 'DONE' });
      if (task.status !== 'DONE' || task.history.length !== 4) throw new Error('Task workflow or audit history is incomplete.');

      console.log('Rehearsal: social workflow');
      const social = new SocialPlannerService(prisma as any, canonical);
      const createdPost: any = await social.createPost(member, {
        title: 'Phase 3 social rehearsal', platform: 'instagram', contentType: 'single_post',
        status: 'idea', brandId: brand.id, assigneeId: MEMBER_ID,
      }, 'phase3-social-create-001');
      const updatedPost: any = await social.updatePost(member, createdPost.post.id, { version: createdPost.post.version, status: 'DRAFT' });
      if (updatedPost.post.status !== 'DRAFT' || updatedPost.post.version !== 2) throw new Error('Social workflow/version update failed.');

      console.log('Rehearsal: encrypted integration/idempotency');
      process.env.MARKETING_INTEGRATION_KEY = '11'.repeat(32);
      const connection: any = await canonical.configureIntegration(manager, {
        brandId: brand.id, provider: 'META', secret: 'phase3-secret-value', config: { pageId: 'page-1' }, scopes: ['read_insights'],
      }, 'phase3-integration-001');
      const persisted = await prisma.marketingIntegrationConnection.findUniqueOrThrow({ where: { id: connection.id } });
      if (!persisted.secretCiphertext || persisted.secretCiphertext.includes('phase3-secret-value')) throw new Error('Integration secret was not encrypted.');
      const publicConnections: any[] = await canonical.listIntegrations(manager, brand.id);
      if ('secretCiphertext' in publicConnections[0]) throw new Error('Integration secret leaked into read response.');
      const job: any = await canonical.triggerIntegrationSync(member, { connectionId: connection.id }, 'phase3-sync-001');
      if (job.status !== 'QUEUED') throw new Error('Integration sync job was not queued.');

      const idempotencyRows = await prisma.marketingIdempotencyKey.count();
      if (idempotencyRows !== 4) throw new Error(`Expected 4 idempotency rows, found ${idempotencyRows}.`);
      console.log('Phase 3 rehearsal passed: scoped task workflow, audit, concurrency, social workflow, encrypted integration, and persistent idempotency.');
    } finally {
      await prisma.$disconnect();
      await appPool.end();
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
  console.error('[rehearse-marketing-phase3] fatal:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
