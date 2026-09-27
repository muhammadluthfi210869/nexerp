#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P11 residue assertion & DB cleanup.
 *
 * The P11 suites isolate themselves with unique per-run `nex_p11_*` namespaces
 * and remove what they create in `afterAll`. This script asserts NO residue remains
 * after a run:
 *
 *   1. In the test database: no row carries a `nex_p11_*` namespace marker.
 *   2. On the server: no `nex_p11_*` database is left behind.
 *
 * Note: `audit_logs` is append-only at the database level (audit_immutable trigger),
 * so audit chains are deliberately not deleted.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_PATTERN = 'nex_p11_%';

const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'stock_opnames', column: 'opnameNumber' },
  { schema: 'public', table: 'stock_adjustments', column: 'notes' },
  { schema: 'public', table: 'transfer_orders', column: 'transferNumber' },
  { schema: 'public', table: 'warehouse_inbounds', column: 'inboundNumber' },
  { schema: 'public', table: 'material_inventories', column: 'batchNumber' },
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
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p11_%'`,
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

  const client = new Client({ connectionString: url });
  client.on('error', () => {});
  await client.connect();

  if (applyClean) {
    const cleanupQueries = [
      // 1. General Journals from Opname/Adjustment
      `DELETE FROM public.journal_lines WHERE "journalId" IN (SELECT id FROM public.journal_entries WHERE reference LIKE 'OPN-P11-%' OR reference LIKE 'ADJ-P11-%' OR reference LIKE 'nex_p11_%')`,
      `DELETE FROM public.journal_entries WHERE reference LIKE 'OPN-P11-%' OR reference LIKE 'ADJ-P11-%' OR reference LIKE 'nex_p11_%'`,

      // 2. Stock Opnames & Items
      `DELETE FROM public.stock_opname_items WHERE "opnameId" IN (SELECT id FROM public.stock_opnames WHERE "opnameNumber" LIKE 'OPN-P11-%' OR "opnameNumber" LIKE 'nex_p11_%' OR "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%'))`,
      `DELETE FROM public.stock_opnames WHERE "opnameNumber" LIKE 'OPN-P11-%' OR "opnameNumber" LIKE 'nex_p11_%' OR "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%')`,

      // 3. Stock Adjustments & Items
      `DELETE FROM public.stock_adjustment_items WHERE "adjustmentId" IN (SELECT id FROM public.stock_adjustments WHERE notes LIKE 'ADJ-P11-%' OR notes LIKE 'P11%' OR notes LIKE 'nex_p11_%' OR "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%'))`,
      `DELETE FROM public.stock_adjustments WHERE notes LIKE 'ADJ-P11-%' OR notes LIKE 'P11%' OR notes LIKE 'nex_p11_%' OR "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%')`,

      // 4. Transfer Orders & Items
      `DELETE FROM public.transfer_order_items WHERE "transferOrderId" IN (SELECT id FROM public.transfer_orders WHERE "transferNumber" LIKE 'TRF-P11-%' OR "transferNumber" LIKE 'nex_p11_%' OR "sourceWarehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%') OR "destWarehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%'))`,
      `DELETE FROM public.transfer_orders WHERE "transferNumber" LIKE 'TRF-P11-%' OR "transferNumber" LIKE 'nex_p11_%' OR "sourceWarehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%') OR "destWarehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%')`,

      // 5. Inbounds & Items
      `DELETE FROM public.inbound_items WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p11_%' OR "code" LIKE 'MAT-P11-%')`,
      `DELETE FROM public.inbound_items WHERE "inboundId" IN (SELECT id FROM public.warehouse_inbounds WHERE "inboundNumber" LIKE 'GRN-P11-%' OR "inboundNumber" LIKE 'INB-P11-%' OR "inboundNumber" LIKE 'nex_p11_%' OR "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%'))`,
      `DELETE FROM public.warehouse_inbounds WHERE "inboundNumber" LIKE 'GRN-P11-%' OR "inboundNumber" LIKE 'INB-P11-%' OR "inboundNumber" LIKE 'nex_p11_%' OR "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%')`,

      // 6. Warehouse Access
      `DELETE FROM public.warehouse_access WHERE "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%') OR "userId" IN (SELECT id FROM public.users WHERE "email" LIKE '%nex-p11.test' OR "email" LIKE 'nex_p11_%')`,

      // 7. Transactions, Batches & Inventories
      `DELETE FROM public.inventory_transactions WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p11_%' OR "code" LIKE 'MAT-P11-%') OR "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%')`,
      `DELETE FROM public.material_inventories WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p11_%' OR "code" LIKE 'MAT-P11-%') OR "batchNumber" LIKE 'LOT-P11-%' OR "batchNumber" LIKE 'nex_p11_%' OR "batchNumber" LIKE 'BATCH-P11-%'`,
      `DELETE FROM public.material_inventories WHERE "materialId" IN (SELECT id FROM public.material_items WHERE "name" LIKE 'nex_p11_%' OR "code" LIKE 'MAT-P11-%')`,
      `DELETE FROM public.material_inventories WHERE "locationId" IN (SELECT id FROM public.warehouse_locations WHERE "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%'))`,

      // 8. Storage Locations & Warehouses
      `DELETE FROM public.warehouse_locations WHERE "warehouseId" IN (SELECT id FROM public.warehouses WHERE "name" LIKE 'nex_p11_%')`,
      `DELETE FROM public.warehouses WHERE "name" LIKE 'nex_p11_%'`,

      // 9. Materials
      `DELETE FROM public.material_items WHERE "name" LIKE 'nex_p11_%' OR "code" LIKE 'MAT-P11-%'`,

      // 10. Users & Notifications
      `DELETE FROM public.notifications WHERE "userId" IN (SELECT id FROM public.users WHERE "email" LIKE '%nex-p11.test' OR "email" LIKE 'nex_p11_%')`,
      `DELETE FROM public.users WHERE "email" LIKE '%nex-p11.test' OR "email" LIKE 'nex_p11_%'`,
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
      console.error(`[P11] FAIL: ${cleanupErrors.length} cleanup statement(s) did not run`);
      for (const e of cleanupErrors) console.error(`  - ${e}`);
      process.exit(1);
    }
  }

  const residue = await countNamespaceRows(client);
  await client.end();

  if (residue.broken.length > 0) {
    console.error(`[P11] FAIL: ${residue.broken.length} probe(s) could not run — residue is UNKNOWN, not zero`);
    for (const b of residue.broken) console.error(`  - ${b}`);
    process.exit(1);
  }

  if (residue.total > 0) {
    console.error(`[P11] FAIL: ${residue.total} P11-namespace row(s) remain`);
    for (const o of residue.offenders) console.error(`  - ${o}`);
    process.exit(1);
  }
  console.log('[P11] test-DB residue: 0');

  // 2. No disposable databases left behind.
  const adminUrl = url.replace(/\/[^/]+(\?|$)/, '/postgres$1');
  const admin = new Client({ connectionString: adminUrl });
  admin.on('error', () => {});
  try {
    await admin.connect();
    const dbs = await listDisposableDatabases(admin);
    await admin.end();

    if (dbs.length > 0) {
      console.error(`[P11] FAIL: ${dbs.length} nex_p11_* database(s) remain on server`);
      for (const n of dbs) console.error(`  - ${n}`);
      process.exit(1);
    }
    console.log('[P11] server residue: 0 nex_p11_* databases');
  } catch (e) {
    // The server-level half of the answer was not obtained. Continuing would
    // print "cleanup verified" on the strength of a probe that never ran.
    console.error(`[P11] FAIL: server residue is UNKNOWN — ${e.message}`);
    process.exit(1);
  }

  console.log('[P11] cleanup verified: no namespace rows, no residue databases');
}

main().catch((err) => {
  console.error(`[P11] cleanup error: ${err.message}`);
  process.exit(1);
});
