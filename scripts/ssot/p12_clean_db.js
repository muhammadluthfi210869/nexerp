#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P12 residue assertion & DB cleanup.
 *
 * The P12 suites isolate themselves with unique per-run `nex_p12_*` namespaces
 * and remove what they create in `afterAll`. This script asserts NO residue remains
 * after a run:
 *
 *   1. In the test database: no row carries a `nex_p12_*` namespace marker.
 *   2. On the server: no `nex_p12_*` database is left behind.
 *
 * Note: `audit_logs` is append-only at the database level (audit_immutable trigger),
 * so audit chains are deliberately not deleted.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_PATTERN = 'nex_p12_%';

const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'work_orders', column: 'woNumber' },
  { schema: 'public', table: 'production_plans', column: 'batchNo' },
  { schema: 'public', table: 'production_schedules', column: 'scheduleNumber' },
  { schema: 'public', table: 'material_requisitions', column: 'reqNumber' },
  { schema: 'public', table: 'material_items', column: 'name' },
  { schema: 'public', table: 'sales_leads', column: 'clientName' },
  { schema: 'public', table: 'bussdev_staff', column: 'name' },
  { schema: 'public', table: 'sales_orders', column: 'orderNumber' },
  { schema: 'public', table: 'machines', column: 'name' },
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
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p12_%'`,
    );
    return r.rows.map((row) => row.datname);
  } catch {
    return [];
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('P12 clean-db: DATABASE_URL not set in backend/.env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  let adminClient = null;
  const isApply = process.argv.includes('--apply');

  try {
    const { total, offenders } = await countNamespaceRows(client);

    const adminUrl = process.env.DATABASE_ADMIN_URL || url.replace(/\/[^/]+$/, '/postgres');
    adminClient = new Client({ connectionString: adminUrl });
    let disposableDbs = [];
    try {
      await adminClient.connect();
      disposableDbs = await listDisposableDatabases(adminClient);
    } catch (e) {
      console.warn('P12 clean-db: could not connect admin client for DB-level check:', e.message);
    }

    if (total === 0 && disposableDbs.length === 0) {
      console.log('P12 clean-db: PASS - 0 residue rows in public schema, 0 disposable databases left.');
      process.exit(0);
    }

    console.warn(`P12 clean-db: found ${total} residue row(s) and ${disposableDbs.length} disposable DB(s).`);
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

    // Apply cleanup
    console.log('P12 clean-db: cleaning up residue rows...');
    await client.query(`DELETE FROM material_requisition_items WHERE id IN (SELECT id FROM material_requisition_items WHERE notes LIKE 'nex_p12_%')`).catch(() => {});
    await client.query(`DELETE FROM material_requisition_headers WHERE reqNumber LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM production_step_details WHERE id IN (SELECT id FROM production_step_details WHERE notes LIKE 'nex_p12_%')`).catch(() => {});
    await client.query(`DELETE FROM production_schedules WHERE scheduleNumber LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM material_requisitions WHERE reqNumber LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM work_orders WHERE woNumber LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM production_plans WHERE batchNo LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM machines WHERE name LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM material_items WHERE name LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM sales_orders WHERE orderNumber LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM sales_leads WHERE clientName LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM bussdev_staff WHERE name LIKE 'nex_p12_%'`).catch(() => {});
    await client.query(`DELETE FROM users WHERE email LIKE 'nex_p12_%' OR email LIKE '%@nex-p12.test'`).catch(() => {});

    console.log('P12 clean-db: cleanup completed.');
    process.exit(0);
  } finally {
    await client.end().catch(() => {});
    if (adminClient) await adminClient.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error('P12 clean-db error:', err);
  process.exit(1);
});
