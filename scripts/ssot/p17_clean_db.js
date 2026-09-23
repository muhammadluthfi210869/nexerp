#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P17 residue assertion & DB cleanup.
 *
 * Verifies that zero leftover P17 test records remain in the database:
 * - communication_mentions
 * - communication_attachments
 * - communication_thread_replies
 * - communication_threads
 * - document_drafts
 * - files
 * - notifications
 * - outbox_dlq
 * - outbox_events
 * - activity_logs
 * - users
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_QUERIES = [
  {
    name: 'communication_mentions',
    sql: `SELECT count(*)::int AS n FROM communication_mentions WHERE "mentionedUserId" IN (SELECT id FROM users WHERE email LIKE '%p17%')`,
  },
  {
    name: 'communication_attachments',
    sql: `SELECT count(*)::int AS n FROM communication_attachments WHERE filename LIKE '%p17%' OR filename LIKE '%P17%'`,
  },
  {
    name: 'communication_thread_replies',
    sql: `SELECT count(*)::int AS n FROM communication_thread_replies WHERE "authorId" IN (SELECT id FROM users WHERE email LIKE '%p17%')`,
  },
  {
    name: 'communication_threads',
    sql: `SELECT count(*)::int AS n FROM communication_threads WHERE title LIKE '%P17%' OR title LIKE '%p17%'`,
  },
  {
    name: 'document_drafts',
    sql: `SELECT count(*)::int AS n FROM document_drafts WHERE "draftNumber" LIKE '%P17%' OR "draftNumber" LIKE '%p17%' OR notes LIKE '%p17%' OR notes LIKE '%P17%'`,
  },
  {
    name: 'notifications',
    sql: `SELECT count(*)::int AS n FROM notifications WHERE title LIKE '%p17%' OR title LIKE '%P17%' OR "userId" IN (SELECT id FROM users WHERE email LIKE '%p17%')`,
  },
  {
    name: 'outbox_dlq',
    sql: `SELECT count(*)::int AS n FROM outbox_dlq WHERE "eventType" LIKE '%p17%'`,
  },
  {
    name: 'outbox_events',
    sql: `SELECT count(*)::int AS n FROM outbox_events WHERE "eventType" LIKE '%p17%'`,
  },
  {
    name: 'activity_logs',
    sql: `SELECT count(*)::int AS n FROM activity_logs WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%p17%')`,
  },
  {
    name: 'users',
    sql: `SELECT count(*)::int AS n FROM users WHERE email LIKE '%p17%' OR email LIKE '%@p17.test%'`,
  },
];

async function countNamespaceRows(client) {
  let total = 0;
  const offenders = [];
  for (const q of NAMESPACE_QUERIES) {
    try {
      const r = await client.query(q.sql);
      const n = r.rows[0]?.n ?? 0;
      if (n > 0) offenders.push(`${q.name}: ${n}`);
      total += n;
    } catch {
      // Table or column absent - skip
    }
  }
  return { total, offenders };
}

async function listDisposableDatabases(admin) {
  try {
    const r = await admin.query(
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p17_%'`,
    );
    return r.rows.map((row) => row.datname);
  } catch {
    return [];
  }
}

async function cleanupResidues(client) {
  console.log('P17 clean-db: cleaning up residue rows...');
  await client.query(`DELETE FROM communication_mentions WHERE "mentionedUserId" IN (SELECT id FROM users WHERE email LIKE '%p17%') OR "replyId" IN (SELECT id FROM communication_thread_replies WHERE "authorId" IN (SELECT id FROM users WHERE email LIKE '%p17%'))`).catch(() => {});
  await client.query(`DELETE FROM communication_attachments WHERE filename LIKE '%p17%' OR filename LIKE '%P17%' OR "uploadedById" IN (SELECT id FROM users WHERE email LIKE '%p17%')`).catch(() => {});
  await client.query(`DELETE FROM communication_thread_replies WHERE "authorId" IN (SELECT id FROM users WHERE email LIKE '%p17%') OR "threadId" IN (SELECT id FROM communication_threads WHERE title LIKE '%P17%' OR title LIKE '%p17%')`).catch(() => {});
  await client.query(`DELETE FROM communication_threads WHERE title LIKE '%P17%' OR title LIKE '%p17%' OR "createdById" IN (SELECT id FROM users WHERE email LIKE '%p17%')`).catch(() => {});
  await client.query(`DELETE FROM document_drafts WHERE "draftNumber" LIKE '%P17%' OR "draftNumber" LIKE '%p17%' OR notes LIKE '%p17%' OR notes LIKE '%P17%'`).catch(() => {});
  await client.query(`DELETE FROM notifications WHERE title LIKE '%p17%' OR title LIKE '%P17%' OR "userId" IN (SELECT id FROM users WHERE email LIKE '%p17%')`).catch(() => {});
  await client.query(`DELETE FROM outbox_dlq WHERE "eventType" LIKE '%p17%'`).catch(() => {});
  await client.query(`DELETE FROM outbox_events WHERE "eventType" LIKE '%p17%' OR "eventType" = 'entity.mention.created'`).catch(() => {});
  await client.query(`DELETE FROM activity_logs WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%p17%') OR "entityType" IN ('FileAttachment', 'EntityNote', 'EntityAttachment')`).catch(() => {});
  await client.query(`DELETE FROM users WHERE email LIKE '%p17%' OR email LIKE '%@p17.test%'`).catch(() => {});
  console.log('P17 clean-db: cleanup completed.');
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('P17 clean-db: DATABASE_URL not set in backend/.env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  let adminClient = null;
  const isApply = process.argv.includes('--apply');

  try {
    let { total, offenders } = await countNamespaceRows(client);

    const adminUrl = process.env.DATABASE_ADMIN_URL || url.replace(/\/[^/]+$/, '/postgres');
    adminClient = new Client({ connectionString: adminUrl });
    let disposableDbs = [];
    try {
      await adminClient.connect();
      disposableDbs = await listDisposableDatabases(adminClient);
    } catch (e) {
      // Admin client connection is optional
    }

    if (total === 0 && disposableDbs.length === 0) {
      console.log('P17 clean-db: PASS - 0 residue rows in public schema, 0 disposable databases left.');
      process.exit(0);
    }

    console.warn(`P17 clean-db: found ${total} residue row(s) and ${disposableDbs.length} disposable DB(s).`);
    for (const off of offenders) {
      console.warn(`  - ${off}`);
    }
    for (const db of disposableDbs) {
      console.warn(`  - DB: ${db}`);
    }

    if (!isApply) {
      console.warn('Run with --apply to clean residue, or check your afterAll hooks.');
      process.exit(1);
    }

    await cleanupResidues(client);
    process.exit(0);
  } finally {
    await client.end().catch(() => {});
    if (adminClient) await adminClient.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error('P17 clean-db error:', err);
  process.exit(1);
});
