#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P14 residue assertion & DB cleanup.
 *
 * The P14 suites isolate themselves with unique per-run `nex_p14_*` namespaces
 * and remove what they create in `afterAll`. This script asserts NO residue remains
 * after a run:
 *
 *   1. In the test database: no row carries a `nex_p14_*` namespace marker.
 *   2. On the server: no `nex_p14_*` database is left behind.
 *
 * Note: `audit_logs` is append-only at the database level (audit_immutable trigger),
 * so audit chains are deliberately not deleted.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_PATTERN = 'nex_p14_%';

const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'work_orders', column: 'woNumber' },
  { schema: 'public', table: 'production_plans', column: 'batchNo' },
  { schema: 'public', table: 'production_schedules', column: 'scheduleNumber' },
  { schema: 'public', table: 'material_requisitions', column: 'reqNumber' },
  { schema: 'public', table: 'material_items', column: 'name' },
  { schema: 'public', table: 'sales_leads', column: 'clientName' },
  { schema: 'public', table: 'bussdev_staffs', column: 'name' },
  { schema: 'public', table: 'sales_orders', column: 'orderNumber' },
  { schema: 'public', table: 'machines', column: 'name' },
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
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p14_%'`,
    );
    return r.rows.map((row) => row.datname);
  } catch (e) {
    // Returning [] here would say "no disposable databases remain" about a
    // catalogue we never managed to read. Report the failure and let the
    // caller fail the gate.
    throw new Error(`could not list disposable databases: ${e.message}`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('P14 clean-db: DATABASE_URL not set in backend/.env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  let adminClient = null;
  const isApply = process.argv.includes('--apply');

  try {
    const { total, offenders, broken } = await countNamespaceRows(client);

    if (broken.length > 0) {
      console.error(`P14 clean-db: FAIL - ${broken.length} probe(s) could not run, residue is UNKNOWN not zero`);
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
      console.error(`P14 clean-db: FAIL - server-level residue is UNKNOWN: ${e.message}`);
      process.exit(1);
    }

    if (total === 0 && disposableDbs.length === 0) {
      console.log('P14 clean-db: PASS - 0 residue rows in public schema, 0 disposable databases left.');
      process.exit(0);
    }

    console.warn(`P14 clean-db: found ${total} residue row(s) and ${disposableDbs.length} disposable DB(s).`);
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
    console.log('P14 clean-db: cleaning up residue rows...');
    const cleanupErrors = [];
    const cleanup = [
      `DELETE FROM finished_goods WHERE "woId" IN (SELECT id FROM work_orders WHERE "woNumber" LIKE 'nex_p14_%' OR "woNumber" LIKE '%P14%')`,
      `DELETE FROM delivery_orders WHERE "workOrderId" IN (SELECT id FROM work_orders WHERE "woNumber" LIKE 'nex_p14_%' OR "woNumber" LIKE '%P14%')`,
      `DELETE FROM copq_records WHERE reason LIKE '%nex_p14_%' OR reason LIKE '%P14%'`,
      `DELETE FROM qc_audits WHERE notes LIKE '%nex_p14_%' OR notes LIKE '%P14%'`,
      `DELETE FROM production_logs WHERE notes LIKE '%nex_p14_%'`,
      `DELETE FROM production_step_details WHERE id IN (SELECT id FROM production_step_details WHERE notes LIKE 'nex_p14_%' OR notes LIKE '%P14%')`,
      `DELETE FROM production_schedules WHERE "scheduleNumber" LIKE 'nex_p14_%' OR "scheduleNumber" LIKE '%P14%'`,
      `DELETE FROM material_requisitions WHERE "reqNumber" LIKE 'nex_p14_%'`,
      `DELETE FROM work_orders WHERE "woNumber" LIKE 'nex_p14_%' OR "woNumber" LIKE '%P14%'`,
      `DELETE FROM reject_executions WHERE "planId" IN (SELECT id FROM production_plans WHERE "batchNo" LIKE 'nex_p14_%' OR "batchNo" LIKE '%P14%')`,
      `DELETE FROM production_plans WHERE "batchNo" LIKE 'nex_p14_%' OR "batchNo" LIKE '%P14%'`,
      `DELETE FROM material_inventories WHERE "materialId" IN (SELECT id FROM material_items WHERE name LIKE 'nex_p14_%' OR code LIKE '%P14%') OR "supplierId" IN (SELECT id FROM suppliers WHERE name LIKE 'nex_p14_%') OR "batchNumber" LIKE '%P14%'`,
      `DELETE FROM suppliers WHERE name LIKE 'nex_p14_%'`,
      `DELETE FROM machines WHERE name LIKE 'nex_p14_%'`,
      `DELETE FROM material_items WHERE name LIKE 'nex_p14_%' OR code LIKE '%P14%'`,
      `DELETE FROM sales_orders WHERE "orderNumber" LIKE 'nex_p14_%' OR "orderNumber" LIKE '%P14%'`,
      `DELETE FROM sample_requests WHERE "sampleCode" LIKE 'nex_p14_%' OR "sampleCode" LIKE '%P14%'`,
      `DELETE FROM sales_leads WHERE "clientName" LIKE 'nex_p14_%' OR "clientName" LIKE '%P14%'`,
      `DELETE FROM bussdev_staffs WHERE name LIKE 'nex_p14_%'`,
      `DELETE FROM users WHERE email LIKE 'nex_p14_%' OR email LIKE '%@nex-p14.test'`,
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
    if (cleanupErrors.length > 0) {
      console.error(`P14 clean-db: FAIL - ${cleanupErrors.length} cleanup statement(s) did not run`);
      for (const e of cleanupErrors) console.error(`  - ${e}`);
      process.exit(1);
    }

    console.log('P14 clean-db: cleanup completed.');
    process.exit(0);
  } finally {
    await client.end().catch(() => {});
    if (adminClient) await adminClient.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error('P14 clean-db error:', err);
  process.exit(1);
});
