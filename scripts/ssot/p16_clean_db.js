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
  { schema: 'public', table: 'employees', column: 'name', pattern: 'P16%' },
  { schema: 'public', table: 'users', column: 'email', pattern: '%nex-p16.test%' },
];

// The P16 payroll suites do not name their financial period after the phase: they
// upsert `financial_periods.name = '2026-09'` / `'2026-10'` (p16-s5, p16-golden-thread)
// and generate a payroll against it. `Payroll.period` is a relation, not a column, so
// no LIKE on `payrolls` can see that row: the old gate reported 0 residue while real
// payroll rows stayed behind. `--apply` removes only payrolls whose every line belongs
// to a P16 employee, so a real payroll in the same period is reported, never deleted.
const PERIOD_PROBES = [
  {
    label: 'payrolls.periodId → financial_periods.name(P16 test periods)',
    sql: `SELECT count(*)::int AS n FROM public.payrolls p
          JOIN public.financial_periods f ON f.id = p."periodId"
          WHERE f.name LIKE '2026-09%' OR f.name LIKE '2026-10%'`,
  },
  {
    label: 'payroll_items.payrollId → payrolls/financial_periods(P16 test periods)',
    sql: `SELECT count(*)::int AS n FROM public.payroll_items i
          JOIN public.payrolls p ON p.id = i."payrollId"
          JOIN public.financial_periods f ON f.id = p."periodId"
          WHERE f.name LIKE '2026-09%' OR f.name LIKE '2026-10%'`,
  },
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
        [col.pattern],
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
  for (const probe of PERIOD_PROBES) {
    try {
      const r = await client.query(probe.sql);
      const n = r.rows[0]?.n ?? 0;
      if (n > 0) offenders.push(`${probe.label}: ${n}`);
      total += n;
    } catch (e) {
      broken.push(`${probe.label}: ${e.message}`);
    }
  }
  return { total, offenders, broken };
}

async function listDisposableDatabases(admin) {
  try {
    const r = await admin.query(
      `SELECT datname FROM pg_database WHERE datname LIKE 'nex_p16_%'`,
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
  console.log('P16 clean-db: cleaning up residue rows...');
  const p16Employees = `SELECT id FROM employees WHERE nik LIKE 'P16%' OR name LIKE 'P16%'`;
  const testPeriods = `SELECT id FROM financial_periods WHERE name LIKE '2026-09%' OR name LIKE '2026-10%'`;
  const cleanupErrors = [];
  const cleanup = [
    `DELETE FROM candidates WHERE email LIKE '%p16%' OR name LIKE 'P16%'`,
    `DELETE FROM payroll_items WHERE "payrollId" IN (SELECT id FROM payrolls WHERE "periodId" IN (${testPeriods})) OR "employeeId" IN (${p16Employees})`,
    `DELETE FROM payrolls WHERE "periodId" IN (${testPeriods})`,
    `DELETE FROM employee_loans WHERE "employeeId" IN (${p16Employees})`,
    `DELETE FROM employee_trainings WHERE "employeeId" IN (${p16Employees})`,
    `DELETE FROM kpi_scores WHERE "employeeId" IN (${p16Employees})`,
    `DELETE FROM attendances WHERE "employeeId" IN (${p16Employees})`,
    `DELETE FROM tickets WHERE "employeeId" IN (${p16Employees})`,
    `DELETE FROM employees WHERE id IN (${p16Employees})`,
    `DELETE FROM activity_logs WHERE "userId" IN (SELECT id FROM users WHERE email LIKE '%p16%' OR email LIKE '%@nex-p16.test%')`,
    `DELETE FROM users WHERE email LIKE '%p16%' OR email LIKE '%@nex-p16.test%'`,
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
  console.log('P16 clean-db: cleanup completed.');
  return cleanupErrors;
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
    let { total, offenders, broken } = await countNamespaceRows(client);

    if (broken.length > 0) {
      console.error(`P16 clean-db: FAIL - ${broken.length} probe(s) could not run, residue is UNKNOWN not zero`);
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
      console.error(`P16 clean-db: FAIL - server-level residue is UNKNOWN: ${e.message}`);
      process.exit(1);
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

    const cleanupErrors = await cleanupResidues(client);
    if (cleanupErrors.length > 0) {
      console.error(`P16 clean-db: FAIL - ${cleanupErrors.length} cleanup statement(s) did not run`);
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
  console.error('P16 clean-db error:', err);
  process.exit(1);
});
