#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P10 residue assertion & DB cleanup.
 *
 * The P10 suites isolate themselves with unique per-run `nex_p10_*` namespaces
 * and remove what they create in `afterAll`. This script asserts NO residue remains
 * after a run:
 *
 *   1. In the test database: no row carries a `nex_p10_*` namespace marker.
 *   2. On the server: no `nex_p10_*` database is left behind.
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

const NAMESPACE_PATTERN = 'nex_p10_%';

const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'purchase_orders', column: 'poNumber' },
  { schema: 'public', table: 'purchase_requests', column: 'requestNumber' },
  { schema: 'public', table: 'bills', column: 'billNumber' },
  { schema: 'public', table: 'down_payments', column: 'dpNumber' },
  { schema: 'public', table: 'ap_payments', column: 'paymentNumber' },
  { schema: 'public', table: 'purchase_returns', column: 'returnNumber' },
  { schema: 'public', table: 'warehouse_inbounds', column: 'inboundNumber' },
  { schema: 'public', table: 'suppliers', column: 'name' },
  { schema: 'public', table: 'material_items', column: 'name' },
  { schema: 'public', table: 'warehouses', column: 'name' },
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
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p10_%'`,
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
      // 1. Payment allocations & Payments
      `DELETE FROM public.bill_allocations WHERE "paymentId" IN (SELECT id FROM public.ap_payments WHERE "paymentNumber" LIKE 'PAY-P10-%' OR "paymentNumber" LIKE 'nex_p10_%')`,
      `DELETE FROM public.ap_payments WHERE "paymentNumber" LIKE 'PAY-P10-%' OR "paymentNumber" LIKE 'nex_p10_%'`,
      `DELETE FROM public.ap_payments WHERE "vendorId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%')`,

      // 2. Down payments
      `DELETE FROM public.down_payments WHERE "dpNumber" LIKE 'DPB-P10-%' OR "dpNumber" LIKE 'nex_p10_%' OR "vendorId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%')`,

      // 3. Purchase Returns & Return items
      `DELETE FROM public.purchase_return_items WHERE "returnId" IN (SELECT id FROM public.purchase_returns WHERE "returnNumber" LIKE 'RET-P10-%' OR "returnNumber" LIKE 'nex_p10_%' OR "supplierId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%'))`,
      `DELETE FROM public.purchase_returns WHERE "returnNumber" LIKE 'RET-P10-%' OR "returnNumber" LIKE 'nex_p10_%' OR "supplierId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%')`,

      // 4. Bills & Bill items
      `DELETE FROM public.bill_line_items WHERE "billId" IN (SELECT id FROM public.bills WHERE "billNumber" LIKE 'INV-P10-%' OR "billNumber" LIKE 'nex_p10_%' OR "vendorId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%'))`,
      `DELETE FROM public.bills WHERE "billNumber" LIKE 'INV-P10-%' OR "billNumber" LIKE 'nex_p10_%' OR "vendorId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%')`,

      // 5. Inbounds & Inbound items
      `DELETE FROM public.inbound_items WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p10_%' OR "code" LIKE 'MAT-P10-%')`,
      `DELETE FROM public.inbound_items WHERE "inboundId" IN (SELECT id FROM public.warehouse_inbounds WHERE "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p10_%') OR "inboundNumber" LIKE 'INB-P10-%' OR "inboundNumber" LIKE 'nex_p10_%')`,
      `DELETE FROM public.warehouse_inbounds WHERE "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p10_%') OR "inboundNumber" LIKE 'INB-P10-%' OR "inboundNumber" LIKE 'nex_p10_%'`,

      // 6. Purchase Orders & PO Items
      `DELETE FROM public.purchase_order_items WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p10_%' OR "code" LIKE 'MAT-P10-%')`,
      `DELETE FROM public.purchase_orders WHERE "poNumber" LIKE 'PO-P10-%' OR "poNumber" LIKE 'nex_p10_%' OR "supplierId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%')`,

      // 7. Purchase Requests & PR Items
      `DELETE FROM public.purchase_request_items WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p10_%' OR "code" LIKE 'MAT-P10-%')`,
      `DELETE FROM public.purchase_requests WHERE "requestNumber" LIKE 'PR-P10-%' OR "requestNumber" LIKE 'nex_p10_%' OR "supplierId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%')`,

      // 8. Inventories / Stock Movements
      `DELETE FROM public.inventory_transactions WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p10_%' OR "code" LIKE 'MAT-P10-%')`,
      `DELETE FROM public.material_inventories WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p10_%' OR "code" LIKE 'MAT-P10-%')`,
      `DELETE FROM public.material_inventories WHERE "locationId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p10_%')`,

      // 9. Base Entities
      `DELETE FROM public.material_items WHERE "name" LIKE 'nex_p10_%' OR "code" LIKE 'MAT-P10-%'`,
      `DELETE FROM public.suppliers WHERE "name" LIKE 'nex_p10_%'`,
      `DELETE FROM public.warehouses WHERE "name" LIKE 'nex_p10_%'`,

      // 10. Users & Notifications
      `DELETE FROM public.notifications WHERE "userId" IN (SELECT id FROM public.users WHERE "email" LIKE '%nex-p10.test' OR "email" LIKE 'nex_p10_%')`,
      `DELETE FROM public.users WHERE "email" LIKE '%nex-p10.test' OR "email" LIKE 'nex_p10_%'`,
    ];
    const cleanupErrors = [];
    for (const q of cleanupQueries) {
      try {
        await client.query(q);
      } catch (e) {
        // Not optional any more: a cleanup that did not run is residue the check
        // below would then have to explain. Record it and fail instead.
        cleanupErrors.push(`${q.slice(0, 90)}… → ${e.message}`);
      }
    }
    if (cleanupErrors.length > 0) {
      console.error(`[P10] FAIL: ${cleanupErrors.length} cleanup statement(s) did not run`);
      for (const e of cleanupErrors) console.error(`  - ${e}`);
      process.exit(1);
    }
  }

  const residue = await countNamespaceRows(client);
  await client.end();

  if (residue.broken.length > 0) {
    console.error(`[P10] FAIL: ${residue.broken.length} probe(s) could not run — residue is UNKNOWN, not zero`);
    for (const b of residue.broken) console.error(`  - ${b}`);
    process.exit(1);
  }

  if (residue.total > 0) {
    console.error(`[P10] FAIL: ${residue.total} P10-namespace row(s) remain`);
    for (const o of residue.offenders) console.error(`  - ${o}`);
    process.exit(1);
  }
  console.log('[P10] test-DB residue: 0');

  // 2. No disposable databases left behind.
  const adminUrl = url.replace(/\/[^/]+(\?|$)/, '/postgres$1');
  const admin = new Client({ connectionString: adminUrl });
  admin.on('error', () => {});
  try {
    await admin.connect();
    const dbs = await listDisposableDatabases(admin);
    await admin.end();

    if (dbs.length > 0) {
      console.error(`[P10] FAIL: ${dbs.length} nex_p10_* database(s) remain on server`);
      for (const n of dbs) console.error(`  - ${n}`);
      process.exit(1);
    }
    console.log('[P10] server residue: 0 nex_p10_* databases');
  } catch (e) {
    // The server-level half of the answer was not obtained. Continuing would
    // print "cleanup verified" on the strength of a probe that never ran.
    console.error(`[P10] FAIL: server residue is UNKNOWN — ${e.message}`);
    process.exit(1);
  }

  console.log('[P10] cleanup verified: no namespace rows, no residue databases');
}

main().catch((err) => {
  console.error(`[P10] cleanup error: ${err.message}`);
  process.exit(1);
});
