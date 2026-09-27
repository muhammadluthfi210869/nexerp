#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P18 residue assertion & DB cleanup.
 *
 * Verifies that zero leftover P18 test records remain in the database:
 * - sales_invoice_line_items
 * - sales_invoices
 * - payments
 * - invoices
 * - journal_lines
 * - journal_entries
 * - delivery_orders
 * - work_orders
 * - sales_order_items
 * - sales_orders
 * - sales_leads
 * - material_inventories
 * - material_items
 * - customers
 * - suppliers
 * - activity_logs
 * - bussdev_staffs
 * - users
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_QUERIES = [
  {
    name: 'sales_invoice_line_items',
    sql: `SELECT count(*)::int AS n FROM sales_invoice_line_items WHERE "invoiceId" IN (SELECT id FROM sales_invoices WHERE "invoiceNumber" LIKE '%P18%' OR "invoiceNumber" LIKE '%p18%')`,
  },
  {
    name: 'sales_invoices',
    sql: `SELECT count(*)::int AS n FROM sales_invoices WHERE "invoiceNumber" LIKE '%P18%' OR "invoiceNumber" LIKE '%p18%' OR notes LIKE '%p18%' OR notes LIKE '%P18%'`,
  },
  {
    name: 'payments',
    sql: `SELECT count(*)::int AS n FROM payments WHERE "invoiceId" IN (SELECT id FROM unified_invoices WHERE "invoiceNumber" LIKE '%P18%' OR "invoiceNumber" LIKE '%p18%')`,
  },
  {
    name: 'unified_invoices',
    sql: `SELECT count(*)::int AS n FROM unified_invoices WHERE "invoiceNumber" LIKE '%P18%' OR "invoiceNumber" LIKE '%p18%' OR description LIKE '%p18%' OR description LIKE '%P18%'`,
  },
  {
    name: 'journal_lines',
    sql: `SELECT count(*)::int AS n FROM journal_lines WHERE "journalId" IN (SELECT id FROM journal_entries WHERE description LIKE '%P18%' OR description LIKE '%p18%')`,
  },
  {
    name: 'journal_entries',
    sql: `SELECT count(*)::int AS n FROM journal_entries WHERE description LIKE '%P18%' OR description LIKE '%p18%'`,
  },
  {
    name: 'delivery_orders',
    sql: `SELECT count(*)::int AS n FROM delivery_orders WHERE "trackingNumber" LIKE '%P18%' OR "trackingNumber" LIKE '%p18%' OR "workOrderId" IN (SELECT id FROM work_orders WHERE "woNumber" LIKE '%P18%' OR "woNumber" LIKE '%p18%')`,
  },
  {
    name: 'work_orders',
    sql: `SELECT count(*)::int AS n FROM work_orders WHERE "woNumber" LIKE '%P18%' OR "woNumber" LIKE '%p18%'`,
  },
  {
    name: 'sales_order_items',
    sql: `SELECT count(*)::int AS n FROM sales_order_items WHERE "soId" IN (SELECT id FROM sales_orders WHERE "orderNumber" LIKE '%P18%' OR "orderNumber" LIKE '%p18%')`,
  },
  {
    name: 'sales_orders',
    sql: `SELECT count(*)::int AS n FROM sales_orders WHERE "orderNumber" LIKE '%P18%' OR "orderNumber" LIKE '%p18%'`,
  },
  {
    name: 'sales_leads',
    sql: `SELECT count(*)::int AS n FROM sales_leads WHERE "clientName" LIKE '%P18%' OR "contactInfo" LIKE '%p18%'`,
  },
  {
    name: 'material_inventories',
    sql: `SELECT count(*)::int AS n FROM material_inventories WHERE "batchNumber" LIKE '%P18%' OR "batchNumber" LIKE '%p18%'`,
  },
  {
    name: 'material_items',
    sql: `SELECT count(*)::int AS n FROM material_items WHERE name LIKE '%P18%' OR name LIKE '%p18%' OR code LIKE '%P18%' OR code LIKE '%p18%'`,
  },
  {
    name: 'customers',
    sql: `SELECT count(*)::int AS n FROM customers WHERE name LIKE '%P18%' OR name LIKE '%p18%' OR code LIKE '%P18%' OR code LIKE '%p18%'`,
  },
  {
    name: 'suppliers',
    sql: `SELECT count(*)::int AS n FROM suppliers WHERE name LIKE '%P18%' OR name LIKE '%p18%'`,
  },
  {
    name: 'activity_logs',
    sql: `SELECT count(*)::int AS n FROM activity_logs WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%p18%')`,
  },
  {
    name: 'users',
    sql: `SELECT count(*)::int AS n FROM users WHERE email LIKE '%p18%' OR email LIKE '%@p18.test%'`,
  },
];

async function countNamespaceRows(client) {
  let total = 0;
  const offenders = [];
  const broken = [];
  for (const q of NAMESPACE_QUERIES) {
    try {
      const r = await client.query(q.sql);
      const n = r.rows[0]?.n ?? 0;
      if (n > 0) offenders.push(`${q.name}: ${n}`);
      total += n;
    } catch (e) {
      // A probe that cannot run reports nothing. Swallowing it lets this gate
      // print "0 residue" while the rows it was watching stay in the table.
      broken.push(`${q.name}: ${e.message}`);
    }
  }
  return { total, offenders, broken };
}

async function listDisposableDatabases(admin) {
  try {
    const r = await admin.query(
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p18_%'`,
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
  console.log('P18 clean-db: cleaning up residue rows...');
  const p18Invoices = `SELECT id FROM unified_invoices WHERE "invoiceNumber" LIKE '%P18%' OR "invoiceNumber" LIKE '%p18%'`;
  const cleanupErrors = [];
  const cleanup = [
    `DELETE FROM sales_invoice_line_items WHERE "invoiceId" IN (SELECT id FROM sales_invoices WHERE "invoiceNumber" LIKE '%P18%' OR "invoiceNumber" LIKE '%p18%')`,
    `DELETE FROM sales_invoices WHERE "invoiceNumber" LIKE '%P18%' OR "invoiceNumber" LIKE '%p18%' OR notes LIKE '%p18%' OR notes LIKE '%P18%'`,
    `DELETE FROM payments WHERE "invoiceId" IN (${p18Invoices})`,
    `DELETE FROM unified_invoices WHERE "invoiceNumber" LIKE '%P18%' OR "invoiceNumber" LIKE '%p18%' OR description LIKE '%p18%' OR description LIKE '%P18%'`,
    `DELETE FROM journal_lines WHERE "journalId" IN (SELECT id FROM journal_entries WHERE description LIKE '%P18%' OR description LIKE '%p18%')`,
    `DELETE FROM journal_entries WHERE description LIKE '%P18%' OR description LIKE '%p18%'`,
    `DELETE FROM delivery_orders WHERE "trackingNumber" LIKE '%P18%' OR "trackingNumber" LIKE '%p18%' OR "workOrderId" IN (SELECT id FROM work_orders WHERE "woNumber" LIKE '%P18%' OR "woNumber" LIKE '%p18%')`,
    `DELETE FROM work_orders WHERE "woNumber" LIKE '%P18%' OR "woNumber" LIKE '%p18%'`,
    `DELETE FROM sales_order_items WHERE "soId" IN (SELECT id FROM sales_orders WHERE "orderNumber" LIKE '%P18%' OR "orderNumber" LIKE '%p18%')`,
    `DELETE FROM sales_orders WHERE "orderNumber" LIKE '%P18%' OR "orderNumber" LIKE '%p18%'`,
    `DELETE FROM sales_leads WHERE "clientName" LIKE '%P18%' OR "contactInfo" LIKE '%p18%'`,
    `DELETE FROM material_inventories WHERE "batchNumber" LIKE '%P18%' OR "batchNumber" LIKE '%p18%'`,
    `DELETE FROM material_items WHERE name LIKE '%P18%' OR name LIKE '%p18%' OR code LIKE '%P18%' OR code LIKE '%p18%'`,
    `DELETE FROM customers WHERE name LIKE '%P18%' OR name LIKE '%p18%' OR code LIKE '%P18%' OR code LIKE '%p18%'`,
    `DELETE FROM suppliers WHERE name LIKE '%P18%' OR name LIKE '%p18%'`,
    `DELETE FROM activity_logs WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%p18%')`,
    `DELETE FROM bussdev_staffs WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%p18%')`,
    `DELETE FROM users WHERE email LIKE '%p18%' OR email LIKE '%@p18.test%'`,
  ];
  for (const q of cleanup) {
    try {
      await client.query(q);
    } catch (e) {
      // A cleanup that did not run is residue the re-check below would then have
      // to explain away. Record it and fail instead of swallowing it.
      cleanupErrors.push(`${q.slice(0, 90)}… → ${e.message}`);
    }
  }
  console.log('P18 clean-db: cleanup completed.');
  return cleanupErrors;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('P18 clean-db: DATABASE_URL not set in backend/.env');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  let adminClient = null;
  const isApply = process.argv.includes('--apply');

  try {
    let { total, offenders, broken } = await countNamespaceRows(client);

    if (broken.length > 0) {
      console.error(`P18 clean-db: FAIL - ${broken.length} probe(s) could not run, residue is UNKNOWN not zero`);
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
      console.error(`P18 clean-db: FAIL - server-level residue is UNKNOWN: ${e.message}`);
      process.exit(1);
    }

    if (total === 0 && disposableDbs.length === 0) {
      console.log('P18 clean-db: PASS - 0 residue rows in public schema, 0 disposable databases left.');
      process.exit(0);
    }

    console.warn(`P18 clean-db: found ${total} residue row(s) and ${disposableDbs.length} disposable DB(s).`);
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
      console.error(`P18 clean-db: FAIL - ${cleanupErrors.length} cleanup statement(s) did not run`);
      for (const e of cleanupErrors) console.error(`  - ${e}`);
      process.exit(1);
    }

    // Re-verify after cleanup
    const after = await countNamespaceRows(client);
    if (after.broken.length > 0) {
      console.error(`P18 clean-db: FAIL - ${after.broken.length} probe(s) could not run after cleanup`);
      for (const b of after.broken) console.error(`  - ${b}`);
      process.exit(1);
    }
    if (after.total > 0) {
      console.error(`P18 clean-db: ${after.total} residues remaining after cleanup!`);
      for (const off of after.offenders) {
        console.error(`  - ${off}`);
      }
      process.exit(1);
    }

    console.log('P18 clean-db: PASS - 0 residue rows in public schema after cleanup.');
    process.exit(0);
  } finally {
    await client.end().catch(() => {});
    if (adminClient) await adminClient.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error('P18 clean-db error:', err);
  process.exit(1);
});
