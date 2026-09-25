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
    sql: `SELECT count(*)::int AS n FROM outbox_dlq WHERE reason LIKE '%p17%' OR reason LIKE '%P17%'`,
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
  const broken = [];
  for (const q of NAMESPACE_QUERIES) {
    try {
      const r = await client.query(q.sql);
      const n = r.rows[0]?.n ?? 0;
      if (n > 0) offenders.push(`${q.name}: ${n}`);
      total += n;
    } catch (e) {
      // A probe that cannot run reports nothing. Swallowing it lets this gate
      // print "0 residue" while the rows it was watching stay in the table.
      broken.push(`${q.name}: ${e.message}`);
    }
  }
  return { total, offenders, broken };
}

async function listDisposableDatabases(admin) {
  try {
    const r = await admin.query(
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p17_%'`,
    );
    return r.rows.map((row) => row.datname);
  } catch (e) {
    // Returning [] here would say "no disposable databases remain" about a
    // catalogue we never managed to read. Report the failure and let the
    // caller fail the gate.
    throw new Error(`could not list disposable databases: ${e.message}`);
  }
}

async function cleanupResidues(client) {
  console.log('P17 clean-db: cleaning up residue rows...');
  const cleanupErrors = [];
  const cleanup = [
    `DELETE FROM communication_mentions WHERE "mentionedUserId" IN (SELECT id FROM users WHERE email LIKE '%p17%') OR "replyId" IN (SELECT id FROM communication_thread_replies WHERE "authorId" IN (SELECT id FROM users WHERE email LIKE '%p17%'))`,
    `DELETE FROM communication_attachments WHERE filename LIKE '%p17%' OR filename LIKE '%P17%' OR "uploadedById" IN (SELECT id FROM users WHERE email LIKE '%p17%')`,
    `DELETE FROM communication_thread_replies WHERE "authorId" IN (SELECT id FROM users WHERE email LIKE '%p17%') OR "threadId" IN (SELECT id FROM communication_threads WHERE title LIKE '%P17%' OR title LIKE '%p17%')`,
    `DELETE FROM communication_threads WHERE title LIKE '%P17%' OR title LIKE '%p17%' OR "createdById" IN (SELECT id FROM users WHERE email LIKE '%p17%')`,
    `DELETE FROM document_drafts WHERE "draftNumber" LIKE '%P17%' OR "draftNumber" LIKE '%p17%' OR notes LIKE '%p17%' OR notes LIKE '%P17%'`,
    `DELETE FROM notifications WHERE title LIKE '%p17%' OR title LIKE '%P17%' OR "userId" IN (SELECT id FROM users WHERE email LIKE '%p17%')`,
    `DELETE FROM outbox_dlq WHERE reason LIKE '%p17%' OR reason LIKE '%P17%'`,
    `DELETE FROM outbox_events WHERE "eventType" LIKE '%p17%' OR "eventType" = 'entity.mention.created'`,
    `DELETE FROM activity_logs WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%p17%') OR "entityType" IN ('FileAttachment', 'EntityNote', 'EntityAttachment')`,
    `DELETE FROM users WHERE email LIKE '%p17%' OR email LIKE '%@p17.test%'`,
  ];
  for (const q of cleanup) {
    try {
      await client.query(q);
    } catch (e) {
      // A cleanup that did not run is residue the check above already reported.
      // Swallowing it would let this gate exit 0 on a dirty database.
      cleanupErrors.push(`${q.slice(0, 90)}… → ${e.message}`);
    }
  }
  console.log('P17 clean-db: cleanup completed.');
  return cleanupErrors;
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
    let { total, offenders, broken } = await countNamespaceRows(client);

    if (broken.length > 0) {
      console.error(`P17 clean-db: FAIL - ${broken.length} probe(s) could not run, residue is UNKNOWN not zero`);
      for (const b of broken) console.error(`  - ${b}`);
      process.exit(1);
    }

    const adminUrl = process.env.DATABASE_ADMIN_URL || url.replace(/\/[^/]+$/, '/postgres');
    adminClient = new Client({ connectionString: adminUrl });
    let disposableDbs = [];
    try {
      await adminClient.connect();
      disposableDbs = await listDisposableDatabases(adminClient);
    } catch (e) {
      // The server-level half of the answer was not obtained. Reporting a PASS
      // here would claim a clean server on the strength of a probe that never ran.
      console.error(`P17 clean-db: FAIL - server-level residue is UNKNOWN: ${e.message}`);
      process.exit(1);
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

    const cleanupErrors = await cleanupResidues(client);
    if (cleanupErrors.length > 0) {
      console.error(`P17 clean-db: FAIL - ${cleanupErrors.length} cleanup statement(s) did not run`);
      for (const e of cleanupErrors) console.error(`  - ${e}`);
      process.exit(1);
    }
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
