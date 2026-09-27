#!/bin/bash
#
# Regression: every table a `scripts/ssot/pNN_clean_db.js` gate probes must be
# CREATED by a migration in `backend/prisma/migrations/`.
#
# Why this exists: `p16_clean_db.js` probes `candidates`, `employee_trainings`
# and `employee_loans`. All three are declared in `backend/prisma/schema/` and
# present in the live database — because the live database was shaped by
# `prisma db push`, which does not need a migration. But NO migration ever
# created them, and CI builds its database with `prisma migrate deploy` only.
#
# Measured 2026-09-25 by rehearsing CI's exact step on a scratch database:
#   LIVE (db push)          208 tables, all three present
#   MIGRATIONS ONLY         206 tables, all three MISSING
# and then running the gate against that migrations-only database:
#   P16 clean-db: FAIL - 2 probe(s) could not run, residue is UNKNOWN not zero
#     - public.candidates.email: relation "public.candidates" does not exist
#     - public.candidates.name: relation "public.candidates" does not exist
#
# So the gate could never pass in CI, which is why CI ran no `verify:pNN` at all.
# The sibling test `clean-db-phantom-tables.test.sh` proves the gates only
# reference real schema names; this test proves those names are reachable from
# the migration history that CI and a fresh production database actually run.
# Together: gate-probed tables ⊆ (schema ∩ migrations).
#
# Exit 0 = every gate-probed table is created by a migration. Exit 1 = at least
# one is not, i.e. that gate cannot run on a migrations-only database.

set -uo pipefail
cd "$(dirname "$0")/../.."

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = 'backend/prisma/migrations';
const SSOT_DIR = 'scripts/ssot';

// ── M: tables created by the migration history ───────────────────────────────
// Comments are stripped first: several migrations mention CREATE TABLE in prose
// ("CREATE TABLE is", "CREATE TABLE statement"), which is not DDL.
const stripComments = (sql) =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');

// Unquoted identifiers fold to lower case in Postgres; quoted ones keep their
// case. `CREATE TABLE lead_captures` and `CREATE TABLE "lead_captures"` are the
// same table, so both are normalised to lower case for comparison.
const norm = (name) => name.replace(/"/g, '').toLowerCase();

const created = new Map(); // table -> migration dir that creates it
const migrationDirs = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((d) => fs.statSync(path.join(MIGRATIONS_DIR, d)).isDirectory());

for (const dir of migrationDirs) {
  const file = path.join(MIGRATIONS_DIR, dir, 'migration.sql');
  if (!fs.existsSync(file)) continue;
  const sql = stripComments(fs.readFileSync(file, 'utf8'));
  // Skip `format('ALTER TABLE %I ...')` inside DO blocks — those are dynamic
  // templates, not real identifiers.
  if (/%I/.test(sql)) {
    // fall through; the CREATE TABLE regex below cannot match `%`
  }
  for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?("?)([A-Za-z_][A-Za-z0-9_]*)\1/gi)) {
    if (m[2].includes('%')) continue;
    const t = norm(m[2]);
    if (!created.has(t)) created.set(t, dir);
  }
}

// ── G: tables the clean-db gates probe ───────────────────────────────────────
// Two probe shapes exist in these gates; both are read here so the test cannot
// be satisfied by only knowing about one of them.
//   1. `{ schema: 'public', table: 'candidates', column: 'email', ... }`
//   2. raw SQL for the residue/cleanup sweep: `DELETE FROM candidates WHERE ...`
const probed = new Map(); // table -> Set(gate file)
const KEYWORDS = new Set(['select', 'where', 'set', 'values', 'public']);
const addProbe = (t, file) => {
  if (!t || KEYWORDS.has(t)) return;
  if (!probed.has(t)) probed.set(t, new Set());
  probed.get(t).add(file);
};

const gateFiles = fs
  .readdirSync(SSOT_DIR)
  .filter((f) => /^p\d+_clean_db\.js$/.test(f))
  .sort();

for (const file of gateFiles) {
  const lines = fs.readFileSync(path.join(SSOT_DIR, file), 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

    // Shape 1 — a declared probe.
    const dTable = (line.match(/\btable\s*:\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]/) || [])[1];
    if (dTable) addProbe(norm(dTable), file);

    // Shape 2 — raw SQL. `FROM public.x` and `FROM x` both occur.
    for (const m of line.matchAll(/\bFROM\s+(?:public\.)?("?)([A-Za-z_][A-Za-z0-9_]*)\1/gi)) {
      addProbe(norm(m[2]), file);
    }
    for (const m of line.matchAll(/\bALTER\s+TABLE\s+(?:public\.)?("?)([A-Za-z_][A-Za-z0-9_]*)\1/gi)) {
      addProbe(norm(m[2]), file);
    }
  }
}

// System catalogs are legitimately queried (the disposable-database check).
const IGNORE = new Set(['pg_database', 'information_schema', 'pg_catalog']);

const problems = [];
for (const [table, files] of [...probed.entries()].sort()) {
  if (IGNORE.has(table)) continue;
  if (created.has(table)) continue;
  problems.push(
    `${table} — probed by ${[...files].sort().join(', ')} but never created by any migration`,
  );
}

console.log(`migrations create ${created.size} table(s) across ${migrationDirs.length} migration(s)`);
console.log(`clean-db gates probe ${probed.size} table(s)`);

if (problems.length) {
  console.log('');
  problems.forEach((p) => console.log(`FAIL ${p}`));
  console.log(
    `\n${problems.length} table(s) are probed by a residue gate but no migration creates ` +
      `them. CI and a freshly provisioned database run \`prisma migrate deploy\` only, so ` +
      `those tables do not exist there and the gate fails with ` +
      `\`relation "<table>" does not exist\` — reporting residue as UNKNOWN, never zero. ` +
      `Add a guarded (idempotent) CREATE TABLE for each.`,
  );
  process.exit(1);
}
console.log('\nEvery table probed by a clean-db gate is created by the migration history.');
NODE