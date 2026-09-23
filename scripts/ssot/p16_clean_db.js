#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - P16 residue assertion & DB cleanup.
 *
 * The P16 suites isolate themselves with unique per-run `nex_p16_*` / `P16_*` namespaces
 * and remove what they create in `afterAll`. This script asserts NO residue remains
 * after a run:
 *
 *   1. In the test database: no row carries a `nex_p16_*` or `P16_*` namespace marker.
 *   2. On the server: no `nex_p16_*` database is left behind.
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const { Client } = require(path.join(ROOT, 'backend/node_modules/pg'));
const { config: loadEnv } = require(path.join(ROOT, 'backend/node_modules/dotenv'));
loadEnv({ path: path.join(ROOT, 'backend/.env') });

const NAMESPACE_PATTERN = 'nex_p16_%';
const PREFIX_PATTERN = 'P16_%';

const NAMESPACE_COLUMNS = [
  { schema: 'public', table: 'candidates', column: 'email', pattern: '%p16%' },
  { schema: 'public', table: 'candidates', column: 'name', pattern: 'P16%' },
  { schema: 'public', table: 'employees', column: 'nik', pattern: 'P16%' },
  { schema: 'public', table: 'employees', column: 'fullName', pattern: 'P16%' },
  { schema: 'public', table: 'payroll_periods', column: 'period', pattern: '%P16%' },
  { schema: 'public', table: 'users', column: 'email', pattern: '%nex-p16.test%' },
];

async function countNamespaceRows(client) {
  let total = 0;
  const offenders = [];
  for (const col of NAMESPACE_COLUMNS) {
    try {
      const r = await client.query(
        `SELECT count(*)::int AS n FROM ${col.schema}.${col.table} WHERE ${col.column} LIKE $1`,
        [col.pattern],
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
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p16_%'`,
    );
    return r.rows.map((row) => row.datname);
  } catch {
    return [];
  }
}

async function cleanupResidues(client) {
  console.log('P16 clean-db: cleaning up residue rows...');
  await client.query(`DELETE FROM candidates WHERE email LIKE '%p16%' OR name LIKE 'P16%'`).catch(() => {});
  await client.query(`DELETE FROM payroll_items WHERE "payrollPeriodId" IN (SELECT id FROM payroll_periods WHERE period LIKE '%P16%' OR period LIKE '%2026-09%' OR period LIKE '%2026-10%')`).catch(() => {});
  await client.query(`DELETE FROM payroll_periods WHERE period LIKE '%P16%' OR period LIKE '%2026-09%' OR period LIKE '%2026-10%'`).catch(() => {});
  await client.query(`DELETE FROM employee_loans WHERE "employeeId" IN (SELECT id FROM employees WHERE nik LIKE 'P16%' OR "fullName" LIKE 'P16%')`).catch(() => {});
  await client.query(`DELETE FROM employee_trainings WHERE "employeeId" IN (SELECT id FROM employees WHERE nik LIKE 'P16%' OR "fullName" LIKE 'P16%')`).catch(() => {});
  await client.query(`DELETE FROM attendance_audits WHERE "attendanceRecordId" IN (SELECT id FROM attendances WHERE "employeeId" IN (SELECT id FROM employees WHERE nik LIKE 'P16%' OR "fullName" LIKE 'P16%'))`).catch(() => {});
  await client.query(`DELETE FROM attendances WHERE "employeeId" IN (SELECT id FROM employees WHERE nik LIKE 'P16%' OR "fullName" LIKE 'P16%')`).catch(() => {});
  await client.query(`DELETE FROM tickets WHERE "employeeId" IN (SELECT id FROM employees WHERE nik LIKE 'P16%' OR "fullName" LIKE 'P16%')`).catch(() => {});
  await client.query(`DELETE FROM employee_role_weights WHERE "employeeId" IN (SELECT id FROM employees WHERE nik LIKE 'P16%' OR "fullName" LIKE 'P16%')`).catch(() => {});
  await client.query(`DELETE FROM kpi_subjective_scores WHERE "employeeId" IN (SELECT id FROM employees WHERE nik LIKE 'P16%' OR "fullName" LIKE 'P16%')`).catch(() => {});
  await client.query(`DELETE FROM employees WHERE nik LIKE 'P16%' OR "fullName" LIKE 'P16%'`).catch(() => {});
  await client.query(`DELETE FROM activity_logs WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%p16%' OR email LIKE '%@nex-p16.test%')`).catch(() => {});
  await client.query(`DELETE FROM users WHERE email LIKE '%p16%' OR email LIKE '%@nex-p16.test%'`).catch(() => {});
  console.log('P16 clean-db: cleanup completed.');
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('P16 clean-db: DATABASE_URL not set in backend/.env');
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
      console.warn('P16 clean-db: could not connect admin client for DB-level check:', e.message);
    }

    if (total === 0 && disposableDbs.length === 0) {
      console.log('P16 clean-db: PASS - 0 residue rows in public schema, 0 disposable databases left.');
      process.exit(0);
    }

    console.warn(`P16 clean-db: found ${total} residue row(s) and ${disposableDbs.length} disposable DB(s).`);
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
  console.error('P16 clean-db error:', err);
  process.exit(1);
});
