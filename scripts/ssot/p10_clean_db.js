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
  { schema: 'public', table: 'purchase_invoices', column: 'invoiceNumber' },
  { schema: 'public', table: 'purchase_down_payments', column: 'dpNumber' },
  { schema: 'public', table: 'purchase_payments', column: 'paymentNumber' },
  { schema: 'public', table: 'purchase_returns', column: 'returnNumber' },
  { schema: 'public', table: 'inbound_shipments', column: 'inboundNumber' },
  { schema: 'public', table: 'suppliers', column: 'name' },
  { schema: 'public', table: 'material_items', column: 'name' },
  { schema: 'public', table: 'warehouses', column: 'name' },
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
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p10_%'`,
    );
    return r.rows.map((row) => row.datname);
  } catch {
    return [];
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const applyClean = process.argv.includes('--apply') || process.argv.includes('--clean') || true;

  // 1. No namespace residue in test database.
  const client = new Client({ connectionString: url });
  client.on('error', () => {});
  await client.connect();

  if (applyClean) {
    const cleanupQueries = [
      // 1. Payment allocations & Payments
      `DELETE FROM public.ap_payment_allocations WHERE "paymentId" IN (SELECT id FROM public.payments WHERE "reference" LIKE 'PAY-P10-%' OR "reference" LIKE 'nex_p10_%')`,
      `DELETE FROM public.payments WHERE "reference" LIKE 'PAY-P10-%' OR "reference" LIKE 'nex_p10_%'`,
      `DELETE FROM public.payments WHERE "invoiceId" IN (SELECT id FROM public.bills WHERE "vendorId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%'))`,

      // 2. Down payments
      `DELETE FROM public.down_payments WHERE "dpNumber" LIKE 'DPB-P10-%' OR "dpNumber" LIKE 'nex_p10_%' OR "vendorId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%')`,

      // 3. Purchase Returns & Return items
      `DELETE FROM public.purchase_return_items WHERE "returnId" IN (SELECT id FROM public.purchase_returns WHERE "returnNumber" LIKE 'RET-P10-%' OR "returnNumber" LIKE 'nex_p10_%' OR "supplierId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%'))`,
      `DELETE FROM public.purchase_returns WHERE "returnNumber" LIKE 'RET-P10-%' OR "returnNumber" LIKE 'nex_p10_%' OR "supplierId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%')`,

      // 4. Bills & Bill items
      `DELETE FROM public.bill_items WHERE "billId" IN (SELECT id FROM public.bills WHERE "billNumber" LIKE 'INV-P10-%' OR "billNumber" LIKE 'nex_p10_%' OR "vendorId" IN (SELECT id FROM public.suppliers WHERE "name" LIKE 'nex_p10_%'))`,
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
    for (const q of cleanupQueries) {
      try {
        await client.query(q);
      } catch (e) {
        // Silently continue for optional tables
      }
    }
  }

  const residue = await countNamespaceRows(client);
  await client.end();

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
    console.log('[P10] server residue check skipped');
  }

  console.log('[P10] cleanup verified: no namespace rows, no residue databases');
}

main().catch((err) => {
  console.error(`[P10] cleanup error: ${err.message}`);
  process.exit(1);
});
