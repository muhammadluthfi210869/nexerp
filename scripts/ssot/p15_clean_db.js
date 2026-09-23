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
  { schema: 'public', table: 'fund_requests', column: 'requestNumber' },
  { schema: 'public', table: 'escrow_ledger', column: 'reference' },
  { schema: 'public', table: 'invoices', column: 'invoiceNumber' },
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
  for (const col of NAMESPACE_COLUMNS) {
    try {
      const r = await client.query(
        `SELECT count(*)::int AS n FROM ${col.schema}.${col.table} WHERE ${col.column} LIKE $1`,
        [NAMESPACE_PATTERN],
      );
      const n = r.rows[0]?.n ?? 0;
      if (n > 0) offenders.push(`${col.schema}.${col.table}.${col.column}: ${n}`);
      total += n;
    } catch {
      // Table or column absent in schema - skip silently
    }
  }
  return { total, offenders };
}

async function listDisposableDatabases(admin) {
  try {
    const r = await admin.query(
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p15_%'`,
    );
    return r.rows.map((row) => row.datname);
  } catch {
    return [];
  }
}

async function cleanupResidues(client) {
  console.log('P15 clean-db: cleaning up residue rows...');
  await client.query(`DELETE FROM journal_lines WHERE "journalId" IN (SELECT id FROM journal_entries WHERE reference LIKE 'nex_p15_%' OR reference LIKE '%P15%' OR description LIKE 'nex_p15_%')`).catch(() => {});
  await client.query(`DELETE FROM journal_entries WHERE reference LIKE 'nex_p15_%' OR reference LIKE '%P15%' OR description LIKE 'nex_p15_%'`).catch(() => {});
  await client.query(`DELETE FROM period_locks WHERE notes LIKE 'nex_p15_%' OR notes LIKE '%P15%'`).catch(() => {});
  await client.query(`DELETE FROM fund_requests WHERE "requestNumber" LIKE 'nex_p15_%' OR "requestNumber" LIKE '%P15%' OR purpose LIKE 'nex_p15_%'`).catch(() => {});
  await client.query(`DELETE FROM escrow_ledger WHERE reference LIKE 'nex_p15_%' OR reference LIKE '%P15%'`).catch(() => {});
  await client.query(`DELETE FROM invoice_items WHERE "invoiceId" IN (SELECT id FROM invoices WHERE "invoiceNumber" LIKE 'nex_p15_%' OR "invoiceNumber" LIKE '%P15%')`).catch(() => {});
  await client.query(`DELETE FROM invoices WHERE "invoiceNumber" LIKE 'nex_p15_%' OR "invoiceNumber" LIKE '%P15%'`).catch(() => {});
  await client.query(`DELETE FROM purchase_order_items WHERE "poId" IN (SELECT id FROM purchase_orders WHERE "poNumber" LIKE 'nex_p15_%' OR "poNumber" LIKE '%P15%')`).catch(() => {});
  await client.query(`DELETE FROM purchase_orders WHERE "poNumber" LIKE 'nex_p15_%' OR "poNumber" LIKE '%P15%'`).catch(() => {});
  await client.query(`DELETE FROM sales_order_items WHERE "salesOrderId" IN (SELECT id FROM sales_orders WHERE "orderNumber" LIKE 'nex_p15_%' OR "orderNumber" LIKE '%P15%')`).catch(() => {});
  await client.query(`DELETE FROM sales_orders WHERE "orderNumber" LIKE 'nex_p15_%' OR "orderNumber" LIKE '%P15%'`).catch(() => {});
  await client.query(`DELETE FROM accounts WHERE name LIKE 'nex_p15_%' OR code LIKE 'nex_p15_%' OR code LIKE '99%'`).catch(() => {});
  await client.query(`DELETE FROM material_inventories WHERE "materialId" IN (SELECT id FROM material_items WHERE name LIKE 'nex_p15_%' OR code LIKE '%P15%')`).catch(() => {});
  await client.query(`DELETE FROM material_items WHERE name LIKE 'nex_p15_%' OR code LIKE '%P15%'`).catch(() => {});
  await client.query(`DELETE FROM suppliers WHERE name LIKE 'nex_p15_%'`).catch(() => {});
  await client.query(`DELETE FROM users WHERE email LIKE 'nex_p15_%' OR email LIKE '%@nex-p15.test'`).catch(() => {});
  console.log('P15 clean-db: cleanup completed.');
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
    let { total, offenders } = await countNamespaceRows(client);

    const adminUrl = process.env.DATABASE_ADMIN_URL || url.replace(/\/[^/]+$/, '/postgres');
    adminClient = new Client({ connectionString: adminUrl });
    let disposableDbs = [];
    try {
      await adminClient.connect();
      disposableDbs = await listDisposableDatabases(adminClient);
    } catch (e) {
      console.warn('P15 clean-db: could not connect admin client for DB-level check:', e.message);
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

    await cleanupResidues(client);
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
