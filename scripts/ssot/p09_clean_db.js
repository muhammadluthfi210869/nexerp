#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P09 residue assertion.
 *
 * The P09 suites isolate themselves with unique per-run `nex_p09_*` namespaces
 * and remove what they create in `afterAll`. This script asserts NO residue remains
 * after a run:
 *
 *   1. In the test database: no row carries a `nex_p09_*` namespace marker.
 *   2. On the server: no `nex_p09_*` database is left behind.
 *
 * Note: `audit_logs` is append-only at the database level (audit_immutable trigger),
 * so audit chains are deliberately not deleted. Rows are only counted in columns
 * the suites actually clear.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_PATTERN = 'nex_p09_%';

const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'sales_orders', column: 'orderNumber' },
  { schema: 'public', table: 'sales_orders', column: 'brandName' },
  { schema: 'public', table: 'sales_leads', column: 'clientName' },
  { schema: 'public', table: 'sample_requests', column: 'productName' },
  { schema: 'public', table: 'sample_requests', column: 'sampleCode' },
  { schema: 'public', table: 'material_items', column: 'name' },
  { schema: 'public', table: 'bussdev_staffs', column: 'name' },
  { schema: 'public', table: 'warehouses', column: 'name' },
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
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p09_%'`,
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
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const applyClean = process.argv.includes('--apply') || process.argv.includes('--clean');

  // 1. No namespace residue in test database.
  const client = new Client({ connectionString: url });
  client.on('error', () => {});
  await client.connect();

  if (applyClean) {
    const cleanupQueries = [
      `DELETE FROM public.sales_order_items WHERE "soId" IN (SELECT id FROM public.sales_orders WHERE "orderNumber" LIKE 'SO%' OR "brandName" LIKE 'nex_p09_%')`,
      `DELETE FROM public.sales_returns WHERE "soId" IN (SELECT id FROM public.sales_orders WHERE "orderNumber" LIKE 'SO%' OR "brandName" LIKE 'nex_p09_%')`,
      `DELETE FROM public.shipments WHERE "soId" IN (SELECT id FROM public.sales_orders WHERE "orderNumber" LIKE 'SO%' OR "brandName" LIKE 'nex_p09_%')`,
      `DELETE FROM public.payments WHERE "invoiceId" IN (SELECT id FROM public.unified_invoices WHERE id LIKE 'INV-%' OR id LIKE 'DPJ-%')`,
      `DELETE FROM public.unified_invoices WHERE id LIKE 'INV-%' OR id LIKE 'DPJ-%'`,
      `DELETE FROM public.sales_orders WHERE "orderNumber" LIKE 'SO%' OR "brandName" LIKE 'nex_p09_%'`,
      `DELETE FROM public.sample_fees WHERE "feeNumber" LIKE 'SF-%'`,
      `DELETE FROM public.sample_requests WHERE "productName" LIKE 'nex_p09_%' OR "sampleCode" LIKE 'SMP-%'`,
      `DELETE FROM public.sales_leads WHERE "clientName" LIKE 'nex_p09_%'`,
      `DELETE FROM public.bussdev_staffs WHERE "name" LIKE 'nex_p09_%'`,
      `DELETE FROM public.material_items WHERE "name" LIKE 'nex_p09_%'`,
      `DELETE FROM public.warehouses WHERE "name" LIKE 'nex_p09_%'`,
      `DELETE FROM public.payments WHERE "verifiedBy" IN (SELECT id FROM public.users WHERE "email" LIKE '%nex-p09.test')`,
      `DELETE FROM public.shipments WHERE "logisticsId" IN (SELECT id FROM public.users WHERE "email" LIKE '%nex-p09.test')`,
      `DELETE FROM public.notifications WHERE "userId" IN (SELECT id FROM public.users WHERE "email" LIKE '%nex-p09.test' OR "email" LIKE 'nex_p09_%')`,
      `DELETE FROM public.users WHERE "email" LIKE '%nex-p09.test' OR "email" LIKE 'nex_p09_%'`,
    ];
    const cleanupErrors = [];
    for (const q of cleanupQueries) {
      try {
        await client.query(q);
      } catch (e) {
        // Not optional any more: a cleanup that did not run is residue the check
        // below would then have to explain. Record it and fail instead of letting
        // a partial cleanup read as a clean database.
        cleanupErrors.push(`${q.slice(0, 90)}… → ${e.message}`);
      }
    }
    if (cleanupErrors.length > 0) {
      console.error(`[P09] FAIL: ${cleanupErrors.length} cleanup statement(s) did not run`);
      for (const e of cleanupErrors) console.error(`  - ${e}`);
      process.exit(1);
    }
  }

  const residue = await countNamespaceRows(client);
  await client.end();

  if (residue.broken.length > 0) {
    console.error(`[P09] FAIL: ${residue.broken.length} probe(s) could not run — residue is UNKNOWN, not zero`);
    for (const b of residue.broken) console.error(`  - ${b}`);
    process.exit(1);
  }

  if (residue.total > 0) {
    console.error(`[P09] FAIL: ${residue.total} P09-namespace row(s) remain`);
    for (const o of residue.offenders) console.error(`  - ${o}`);
    process.exit(1);
  }
  console.log('[P09] test-DB residue: 0');

  // 2. No disposable databases left behind.
  const adminUrl = url.replace(/\/[^/]+(\?|$)/, '/postgres$1');
  const admin = new Client({ connectionString: adminUrl });
  admin.on('error', () => {});
  try {
    await admin.connect();
    const dbs = await listDisposableDatabases(admin);
    await admin.end();

    if (dbs.length > 0) {
      console.error(`[P09] FAIL: ${dbs.length} nex_p09_* database(s) remain on server`);
      for (const n of dbs) console.error(`  - ${n}`);
      process.exit(1);
    }
    console.log('[P09] server residue: 0 nex_p09_* databases');
  } catch (e) {
    // The server-level half of the answer was not obtained. Continuing would
    // print "cleanup verified" on the strength of a probe that never ran.
    console.error(`[P09] FAIL: server residue is UNKNOWN — ${e.message}`);
    process.exit(1);
  }

  console.log('[P09] cleanup verified: no namespace rows, no residue databases');
}

main().catch((err) => {
  console.error(`[P09] cleanup error: ${err.message}`);
  process.exit(1);
});
