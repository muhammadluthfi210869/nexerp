#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P08 residue assertion.
 *
 * The P08 suites isolate themselves with unique per-run `nex_p08_*` namespaces
 * (or a unique disposable database) and remove what they create in `finally` /
 * `afterAll`. This script asserts NO residue remains after a run:
 *
 *   1. In the test database: no row carries a `nex_p08_*` namespace marker.
 *   2. On the server: no `nex_p08_*` database is left behind.
 *
 * It asserts only. No business logic, no PASS token, no gate engine, and it never
 * drops anything — a leftover is reported and fails the run, it is not cleaned up
 * silently.
 *
 * Note: `audit_logs` is append-only at the database level (audit_immutable
 * trigger, migration 20260918_p05_platform_controls), so the audit chain written
 * by a legitimate run is expected to persist and is deliberately NOT scanned for
 * namespace markers. Rows are only counted in columns the suites actually clear.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_PATTERN = 'nex_p08_%';

// { schema, table, column }. Table and column names are the LIVE PostgreSQL
// names (camelCase where the Prisma model has no @@map on the field).
const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'sample_requests', column: 'productName' },
  { schema: 'public', table: 'sample_requests', column: 'sampleCode' },
  { schema: 'public', table: 'formulas', column: 'formulaCode' },
  { schema: 'public', table: 'design_tasks', column: 'brief' },
  { schema: 'public', table: 'bpom_records', column: 'bpomId' },
  { schema: 'public', table: 'bpom_records', column: 'productName' },
  { schema: 'public', table: 'hki_records', column: 'hkiId' },
  { schema: 'public', table: 'hki_records', column: 'brandName' },
  { schema: 'public', table: 'halal_records', column: 'halalId' },
  { schema: 'public', table: 'halal_records', column: 'productName' },
  { schema: 'public', table: 'halal_records', column: 'manufacturer' },
  { schema: 'public', table: 'sales_leads', column: 'clientName' },
  { schema: 'public', table: 'bussdev_staffs', column: 'name' },
  { schema: 'public', table: 'legal_staffs', column: 'name' },
  { schema: 'public', table: 'material_items', column: 'name' },
  { schema: 'public', table: 'users', column: 'email' },
  { schema: 'public', table: 'users', column: 'fullName' },
];

async function countNamespaceRows(client) {
  let total = 0;
  const offenders = [];
  const broken = [];
  for (const col of NAMESPACE_COLUMNS) {
    const label = `${col.schema}.${col.table}.${col.column}`;
    try {
      const r = await client.query(
        `SELECT count(*)::int AS n FROM ${col.schema}.${col.table} WHERE "${col.column}" LIKE $1`,
        [NAMESPACE_PATTERN],
      );
      const n = r.rows[0]?.n ?? 0;
      if (n > 0) offenders.push(`${label}: ${n}`);
      total += n;
    } catch (e) {
      // A probe that cannot run reports nothing. Skipping it silently let this
      // gate print "0 residue" while the row it was watching sat in the table.
      // Record it and fail the gate instead.
      broken.push(`${label}: ${e.message}`);
    }
  }
  return { total, offenders, broken };
}

async function listDisposableDatabases(admin) {
  const r = await admin.query(
    `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p08_%'`,
  );
  return r.rows.map((row) => row.datname);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // 1. No namespace residue in the test database.
  const client = new Client({ connectionString: url });
  client.on('error', () => {});
  await client.connect();
  const residue = await countNamespaceRows(client);
  await client.end();

  if (residue.broken.length > 0) {
    console.error(`[P08] FAIL: ${residue.broken.length} probe(s) could not run — residue is UNKNOWN, not zero`);
    for (const b of residue.broken) console.error(`  - ${b}`);
    process.exit(1);
  }

  if (residue.total > 0) {
    console.error(`[P08] FAIL: ${residue.total} P08-namespace row(s) remain`);
    for (const o of residue.offenders) console.error(`  - ${o}`);
    process.exit(1);
  }
  console.log('[P08] test-DB residue: 0');

  // 2. No disposable database left behind. The unique `nex_p08_*` databases are
  //    created and dropped by the suites themselves; a leftover is a failure.
  const adminUrl = url.replace(/\/[^/]+(\?|$)/, '/postgres$1');
  const admin = new Client({ connectionString: adminUrl });
  admin.on('error', () => {});
  await admin.connect();
  const dbs = await listDisposableDatabases(admin);
  await admin.end();

  if (dbs.length > 0) {
    console.error(`[P08] FAIL: ${dbs.length} nex_p08_* database(s) remain on the server`);
    for (const n of dbs) console.error(`  - ${n}`);
    process.exit(1);
  }
  console.log('[P08] server residue: 0 nex_p08_* databases');

  console.log('[P08] cleanup verified: no namespace rows, no residue databases');
}

main().catch((err) => {
  console.error(`[P08] cleanup error: ${err.message}`);
  process.exit(1);
});
