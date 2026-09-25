#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P07 residue assertion.
 *
 * P07 tests use unique per-test namespaces (or unique disposable databases)
 * and clean what they create in `finally`. This script asserts NO residue
 * remains after a run:
 *   1. In the test database: no row carries a `nex_p07_*` namespace marker.
 *   2. On the server: only disposable databases created by THIS run remain
 *      (other concurrent runs' `nex_p07_*` databases are flagged, not dropped).
 *
 * The script never drops databases belonging to other concurrent runs.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const PROTECTED = new Set([
  'postgres', 'template0', 'template1',
  'erp_db', 'erp_database', 'erp_production', 'erp_db_test',
  'erp_preview_kil', 'erp_staging', 'dreamlab',
]);

// Tables whose string columns may carry P07 namespace markers. Each entry
// is { schema, table, column }. Namespaced rows are deleted by the test
// itself; this script only verifies the cleanup was complete.
const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'lead_captures', column: 'trackingCode' },
  { schema: 'public', table: 'lead_messages', column: 'phone' },
  { schema: 'public', table: 'lead_attributes', column: 'key' },
  { schema: 'public', table: 'sales_leads', column: 'clientName' },
  { schema: 'public', table: 'sales_leads', column: 'contactInfo' },
  { schema: 'public', table: 'lead_activities', column: 'notes' },
  { schema: 'public', table: 'lead_timeline_logs', column: 'notes' },
  { schema: 'public', table: 'crm_leads', column: 'phone' },
  { schema: 'public', table: 'crm_leads', column: 'displayName' },
  { schema: 'public', table: 'guestbook_events', column: 'approverNote' },
  { schema: 'public', table: 'marketing_tasks', column: 'title' },
  { schema: 'public', table: 'round_robin_agents', column: 'name' },
  { schema: 'public', table: 'users', column: 'email' },
];

async function countNamespaceRows(client) {
  const PATTERN = 'nex_p07_%';
  let total = 0;
  const offenders = [];
  const broken = [];
  for (const col of NAMESPACE_COLUMNS) {
    const label = `${col.schema}.${col.table}.${col.column}`;
    try {
      const r = await client.query(
        `SELECT count(*)::int AS n FROM ${col.schema}.${col.table} WHERE "${col.column}" LIKE $1`,
        [PATTERN],
      );
      const n = r.rows[0]?.n ?? 0;
      if (n > 0) {
        offenders.push(`${label}: ${n}`);
      }
      total += n;
    } catch (e) {
      // A probe that cannot run reports nothing. Swallowing it would let this
      // gate print "0 residue" while the row it was watching sits in the table,
      // which is exactly how a real `payrolls` leak passed for a whole phase.
      // Record it and fail the gate instead.
      broken.push(`${label}: ${e.message}`);
    }
  }
  return { total, offenders, broken };
}

async function listDisposableDatabases(admin) {
  const r = await admin.query(
    `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p07_%'`
  );
  return r.rows.map((row) => row.datname).filter((n) => !PROTECTED.has(n.toLowerCase()));
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // 1. Verify no namespace residue in the test database.
  const client = new Client({ connectionString: url });
  client.on('error', () => {});
  await client.connect();
  const residue = await countNamespaceRows(client);
  await client.end();

  if (residue.broken.length > 0) {
    console.error(`[P07] FAIL: ${residue.broken.length} probe(s) could not run — residue is UNKNOWN, not zero`);
    for (const b of residue.broken) console.error(`  - ${b}`);
    process.exit(1);
  }

  if (residue.total > 0) {
    console.error(`[P07] FAIL: ${residue.total} P07-namespace row(s) remain`);
    for (const o of residue.offenders) console.error(`  - ${o}`);
    process.exit(1);
  }
  console.log(`[P07] test-DB residue: 0`);

  // 2. Report disposable databases but do NOT bulk-drop.
  const adminUrl = url.replace(/\/[^/]+(\?|$)/, '/postgres$1');
  const admin = new Client({ connectionString: adminUrl });
  admin.on('error', () => {});
  await admin.connect();
  const dbs = await listDisposableDatabases(admin);
  await admin.end();

  if (dbs.length > 0) {
    // A leftover disposable database is residue like any other. Warning and
    // exiting 0 meant `verify:p07` could be green while the server kept the
    // database the phase was supposed to have dropped.
    console.error(`[P07] FAIL: ${dbs.length} nex_p07_* database(s) remain on the server`);
    for (const n of dbs) console.error(`  - ${n}`);
    console.error(`[P07] This script does not drop them (they may belong to a concurrent run) — drop or rename, then re-run.`);
    process.exit(1);
  }

  console.log(`[P07] server residue: 0 nex_p07_* databases`);
  console.log(`[P07] cleanup PASS`);
}

main().catch((err) => {
  console.error(`[P07] cleanup error: ${err.message}`);
  process.exit(1);
});
