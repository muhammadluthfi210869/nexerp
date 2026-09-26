#!/bin/bash
#
# Regression: every foreign key on the ledger tables must be indexed.
#
# Why this exists: measured against the live database on 2026-09-26, both ledger
# tables carried only their primary key.
#
#   journal_entries  1 index (pkey). All 11 source-document columns — soId, poId,
#                    paymentId, adjustmentId, returnId, purchaseReturnId, planId,
#                    requisitionId, invoiceId, billId, salesInvoiceId — are real
#                    foreign keys with a real relation and no index.
#   journal_lines    1 index (pkey). journalId and accountId unindexed, which is
#                    the join the trial balance and every ledger report performs.
#
# PostgreSQL does not index the referencing side of a foreign key, and Prisma does
# not add one for you. The relation reads as complete — `@relation(fields: [x],
# references: [id])` — so nothing in the schema suggests a missing index. The cost
# is invisible at 35 rows and is a full scan of the ledger per document at
# production volume.
#
# Scope: this checks the two ledger models only. The repo has 375 relations and
# 305 of them are unindexed, so a repo-wide rule would fail on day one and get
# muted. Ledger first, because it is the table every financial report reads.
#
# Exit 0 = every ledger foreign key is indexed. Exit 1 = at least one is not.

set -uo pipefail
cd "$(dirname "$0")/../.."

echo "Finance ledger foreign-key indexes (journal_entries, journal_lines)"

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const SCHEMA_DIR = 'backend/prisma/schema';
const LEDGER_MODELS = ['JournalEntry', 'JournalLine'];

// A `@relation(fields: [a, b], references: [..])` lives on the model that owns
// the foreign key, so the fields listed there are this model's own columns.
// `@unique` on the field, `@@unique([...])` and `@@index([...])` all satisfy the
// rule; a leading-column match is enough because Postgres uses the leftmost
// prefix of a composite index.
const models = new Map();
for (const f of fs.readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.prisma'))) {
  const lines = fs.readFileSync(path.join(SCHEMA_DIR, f), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^model\s+(\w+)/);
    if (!m) continue;
    const body = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\}/.test(lines[j])) break;
      body.push(lines[j]);
    }
    models.set(m[1], { file: f, body, firstLine: i + 1 });
  }
}

const problems = [];

for (const model of LEDGER_MODELS) {
  const entry = models.get(model);
  if (!entry) {
    problems.push(`${model}: model not found in ${SCHEMA_DIR}`);
    continue;
  }
  const { file, body, firstLine } = entry;

  // Columns covered by an index or a unique constraint.
  const covered = new Set();
  const uniques = new Set();
  for (const line of body) {
    const idx = line.match(/@@(?:index|unique)\(\[([^\]]*)\]/);
    if (idx) {
      for (const c of idx[1].split(',')) covered.add(c.trim());
      continue;
    }
    const uq = line.match(/^\s{2}(\w+)\s+.*@unique/);
    if (uq) covered.add(uq[1]);
  }

  // Foreign-key columns owned by this model.
  const fkColumns = new Map(); // column -> relation label or target
  for (const line of body) {
    const rel = line.match(/@relation\(\s*(?:"([^"]+)"\s*,\s*)?fields:\s*\[([^\]]*)\]/);
    if (!rel) continue;
    for (const c of rel[2].split(',')) {
      const col = c.trim();
      if (col) fkColumns.set(col, rel[1] || '');
    }
  }

  if (fkColumns.size === 0) {
    problems.push(`${model}: found no @relation(fields: [...]) — the parser is reading the wrong shape`);
    continue;
  }

  const missing = [...fkColumns.keys()].filter((c) => !covered.has(c));
  if (missing.length) {
    problems.push(
      `${model} (${file}:${firstLine}): ${missing.length} foreign key(s) with no index — ` +
        missing.join(', '),
    );
  }
  console.log(
    `  ${missing.length ? '❌' : '✅'} ${model}: ${fkColumns.size} foreign key(s), ` +
      `${fkColumns.size - missing.length} indexed`,
  );
}

// The migration must actually create the indexes, not just declare them in the
// schema: `prisma db push` is not the deployment path for this table (it tries to
// re-add the deliberately dropped `finished_goods_woId_fkey`), so a schema
// declaration alone would never reach production.
const migrationsDir = 'backend/prisma/migrations';
const migrations = fs.existsSync(migrationsDir)
  ? fs.readdirSync(migrationsDir).filter((d) => d.includes('fase2_ledger_indexes'))
  : [];
if (migrations.length === 0) {
  problems.push(`${migrationsDir}: no *fase2_ledger_indexes* migration — the schema would not reach the database`);
} else {
  const sql = fs.readFileSync(path.join(migrationsDir, migrations[0], 'migration.sql'), 'utf8');
  const created = new Set(
    [...sql.matchAll(/CREATE INDEX IF NOT EXISTS "?([A-Za-z_]+)"?\s+ON/g)].map((m) => m[1]),
  );
  const required = [
    'journal_entries_soId_idx',
    'journal_entries_poId_idx',
    'journal_entries_paymentId_idx',
    'journal_entries_adjustmentId_idx',
    'journal_entries_returnId_idx',
    'journal_entries_purchaseReturnId_idx',
    'journal_entries_planId_idx',
    'journal_entries_requisitionId_idx',
    'journal_entries_invoiceId_idx',
    'journal_entries_billId_idx',
    'journal_entries_salesInvoiceId_idx',
    'journal_lines_journalId_idx',
    'journal_lines_accountId_idx',
    'journal_lines_taxAccountId_idx',
    'accounts_parentId_idx',
  ];
  const absent = required.filter((r) => !created.has(r));
  if (absent.length) {
    problems.push(`${migrations[0]}/migration.sql does not CREATE: ${absent.join(', ')}`);
  } else {
    console.log(`  ✅ ${migrations[0]}: creates all ${required.length} indexes`);
  }
  // Idempotency is the contract for this repo's migrations: `migrate deploy` runs
  // on every container boot.
  const unguarded = [...sql.matchAll(/CREATE INDEX (?!IF NOT EXISTS)/g)];
  if (unguarded.length) {
    problems.push(`${migrations[0]}/migration.sql has ${unguarded.length} CREATE INDEX without IF NOT EXISTS`);
  }
}

if (problems.length) {
  console.log('');
  problems.forEach((p) => console.log(`  ❌ ${p}`));
  console.log(
    '\nA foreign key with no index is a sequential scan on every lookup by that\n' +
      'column, and Prisma does not add one for you.',
  );
  process.exit(1);
}
console.log('\nEvery ledger foreign key is indexed, in the schema and in a migration.');
NODE
