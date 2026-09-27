#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P15 residue assertion & DB cleanup.
 *
 * The P15 suites isolate themselves with unique per-run `nex_p15_*` namespaces
 * and remove what they create in `afterAll`. This script asserts NO residue remains
 * after a run:
 *
 *   1. In the test database: no row carries a `nex_p15_*` namespace marker.
 *   2. On the server: no `nex_p15_*` database is left behind.
 *
 * Note: `audit_logs` is append-only at the database level (audit_immutable trigger),
 * so audit chains are deliberately not deleted.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_PATTERN = 'nex_p15_%';

const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'journal_entries', column: 'reference' },
  { schema: 'public', table: 'period_locks', column: 'notes' },
  { schema: 'public', table: 'fund_requests', column: 'reason' },
  { schema: 'public', table: 'client_escrows', column: 'notes' },
  { schema: 'public', table: 'unified_invoices', column: 'invoiceNumber' },
  { schema: 'public', table: 'purchase_orders', column: 'poNumber' },
  { schema: 'public', table: 'sales_orders', column: 'orderNumber' },
  { schema: 'public', table: 'accounts', column: 'name' },
  { schema: 'public', table: 'accounts', column: 'code' },
  { schema: 'public', table: 'material_items', column: 'name' },
  { schema: 'public', table: 'suppliers', column: 'name' },
  { schema: 'public', table: 'users', column: 'email' },
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
      // A probe that cannot run reports nothing. Swallowing it lets this gate
      // print "0 residue" while the rows it was watching stay in the table.
      broken.push(`${label}: ${e.message}`);
    }
  }
  return { total, offenders, broken };
}

async function listDisposableDatabases(admin) {
  try {
    const r = await admin.query(
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p15_%'`,
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
  console.log('P15 clean-db: cleaning up residue rows...');
  const cleanupErrors = [];
  const cleanup = [
    `DELETE FROM journal_lines WHERE "journalId" IN (SELECT id FROM journal_entries WHERE reference LIKE 'nex_p15_%' OR reference LIKE '%P15%' OR description LIKE 'nex_p15_%')`,
    `DELETE FROM journal_entries WHERE reference LIKE 'nex_p15_%' OR reference LIKE '%P15%' OR description LIKE 'nex_p15_%'`,
    `DELETE FROM period_locks WHERE notes LIKE 'nex_p15_%' OR notes LIKE '%P15%'`,
    `DELETE FROM fund_requests WHERE reason LIKE 'nex_p15_%' OR reason LIKE '%P15%'`,
    `DELETE FROM client_escrows WHERE notes LIKE 'nex_p15_%' OR notes LIKE '%P15%' OR purpose LIKE 'nex_p15_%'`,
    `DELETE FROM payments WHERE "invoiceId" IN (SELECT id FROM unified_invoices WHERE "invoiceNumber" LIKE 'nex_p15_%' OR "invoiceNumber" LIKE '%P15%')`,
    `DELETE FROM unified_invoices WHERE "invoiceNumber" LIKE 'nex_p15_%' OR "invoiceNumber" LIKE '%P15%'`,
    `DELETE FROM purchase_order_items WHERE "poId" IN (SELECT id FROM purchase_orders WHERE "poNumber" LIKE 'nex_p15_%' OR "poNumber" LIKE '%P15%')`,
    `DELETE FROM purchase_orders WHERE "poNumber" LIKE 'nex_p15_%' OR "poNumber" LIKE '%P15%'`,
    `DELETE FROM sales_order_items WHERE "salesOrderId" IN (SELECT id FROM sales_orders WHERE "orderNumber" LIKE 'nex_p15_%' OR "orderNumber" LIKE '%P15%')`,
    `DELETE FROM sales_orders WHERE "orderNumber" LIKE 'nex_p15_%' OR "orderNumber" LIKE '%P15%'`,
    `DELETE FROM accounts WHERE name LIKE 'nex_p15_%' OR code LIKE 'nex_p15_%' OR code LIKE '99%'`,
    `DELETE FROM material_inventories WHERE "materialId" IN (SELECT id FROM material_items WHERE name LIKE 'nex_p15_%' OR code LIKE '%P15%')`,
    `DELETE FROM material_items WHERE name LIKE 'nex_p15_%' OR code LIKE '%P15%'`,
    `DELETE FROM suppliers WHERE name LIKE 'nex_p15_%'`,
    `DELETE FROM users WHERE email LIKE 'nex_p15_%' OR email LIKE '%@nex-p15.test'`,
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
  console.log('P15 clean-db: cleanup completed.');
  return cleanupErrors;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('P15 clean-db: DATABASE_URL not set in backend/.env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  let adminClient = null;
  const isApply = process.argv.includes('--apply');

  try {
    let { total, offenders, broken } = await countNamespaceRows(client);

    if (broken.length > 0) {
      console.error(`P15 clean-db: FAIL - ${broken.length} probe(s) could not run, residue is UNKNOWN not zero`);
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
      console.error(`P15 clean-db: FAIL - server-level residue is UNKNOWN: ${e.message}`);
      process.exit(1);
    }

    if (total === 0 && disposableDbs.length === 0) {
      console.log('P15 clean-db: PASS - 0 residue rows in public schema, 0 disposable databases left.');
      process.exit(0);
    }

    console.warn(`P15 clean-db: found ${total} residue row(s) and ${disposableDbs.length} disposable DB(s).`);
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
      console.error(`P15 clean-db: FAIL - ${cleanupErrors.length} cleanup statement(s) did not run`);
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
  console.error('P15 clean-db error:', err);
  process.exit(1);
});
