#!/bin/bash
#
# Regression: every table AND column a `scripts/ssot/pNN_clean_db.js` gate touches
# must exist in the Prisma schema.
#
# Why this exists: `p16_clean_db.js` asserted on and cleaned `payroll_periods`, a
# table that has NO model and NO migration — the real model is `Payroll` (mapped to
# `payrolls`) hanging off `FinancialPeriod`. The lookup threw, a bare `catch {}`
# swallowed it, and the gate printed "0 residue". It reported a clean DB while two
# real `payrolls` rows were left behind, which then failed the next run's
# "Draft payroll already exists" guard five tests deep.
#
# It is not only tables. Invalid COLUMN probes throw the same way and vanish the
# same way: p07 probed `sales_leads.client_name` (real column `clientName`) and
# `crm_leads.email` (no such column), p15 probed `fund_requests.requestNumber`
# (does not exist), p18 probed `payments."reference"` (does not exist) and
# `journal_lines."journalEntryId"` (real column `journalId`), p16 probed the bare
# identifier `"fullName"` on `employees` (real column `name`). Every one of those
# probes reports zero unconditionally.
#
# So: a gate that asserts on a name the schema does not define is not a gate. This
# test parses the live schema and fails on any reference it cannot resolve.
#
# Exit 0 = every referenced table/column is real. Exit 1 = at least one phantom.

set -uo pipefail
cd "$(dirname "$0")/../.."

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const SCHEMA_DIR = 'backend/prisma/schema';
const SSOT_DIR = 'scripts/ssot';

// ── Live schema: table -> Set(columns). In this repo every model carries
//    @@map, so the map is the table name; the model name is accepted too.
const cols = new Map();
for (const f of fs.readdirSync(SCHEMA_DIR).filter((f) => f.endsWith('.prisma'))) {
  const lines = fs.readFileSync(path.join(SCHEMA_DIR, f), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const model = lines[i].match(/^model\s+(\w+)/);
    if (!model) continue;
    let table = model[1];
    const set = new Set();
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\}/.test(lines[j])) break;
      const map = lines[j].match(/@@map\("([^"]+)"\)/);
      if (map) table = map[1];
      const col = lines[j].match(/^\s{2}(\w+)\s/);
      if (col) set.add(col[1]);
    }
    cols.set(table, set);
    if (table !== model[1]) cols.set(model[1], set);
  }
}

// System catalogs are legitimately queried (the disposable-DB check), not residue.
const IGNORE = new Set(['pg_database', 'information_schema', 'pg_catalog']);
// SQL keywords that can sit on the left of LIKE if a statement is ever written
// without quoting; kept tiny and explicit so it cannot mask a real typo.
const KEYWORDS = new Set(['cast', 'coalesce', 'lower', 'upper', 'concat', 'any', 'all']);
const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const problems = [];
const files = fs.readdirSync(SSOT_DIR).filter((f) => /^p\d+_clean_db\.js$/.test(f)).sort();

for (const file of files) {
  const lines = fs.readFileSync(path.join(SSOT_DIR, file), 'utf8').split('\n');
  const bad = new Set();

  lines.forEach((line, idx) => {
    const at = `${file}:${idx + 1}`;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    // The second gate shape: a declared probe table, e.g. p07's
    // `{ schema: 'public', table: 'sales_leads', column: 'clientName' }`. These
    // lines carry no FROM, so the sweep below never sees them — and when one of
    // these probes is wrong, `countNamespaceRows` swallows the throw and the gate
    // reports 0 while the row stays behind.
    const decl = (k) =>
      (line.match(new RegExp(`\\b${k}\\s*:\\s*['"\`]([A-Za-z_][A-Za-z0-9_]*)['"\`]`)) || [])[1];
    const dTable = decl('table');
    const dColumn = decl('column');
    if (dTable && dColumn) {
      const colsOf = cols.get(dTable);
      if (!colsOf) {
        bad.add(`${at} table '${dTable}' does not exist in any prisma schema`);
      } else if (!colsOf.has(dColumn)) {
        const alt = camel(dColumn);
        bad.add(
          `${at} ${dTable}.${dColumn} — no such column` +
            (colsOf.has(alt) ? ` (real column: '${alt}')` : ' (and no camelCase equivalent)'),
        );
      }
    }

    if (!/\bFROM\b/.test(line)) return;

    // Attribute a LIKE'd identifier to the nearest preceding FROM taken at the
    // SAME paren depth. A predicate after a nested `IN (SELECT .. FROM b ..)`
    // still belongs to the outer query:
    //   DELETE FROM a WHERE x IN (SELECT .. FROM b WHERE y LIKE ..) OR z LIKE ..
    // must check b.y against b and a.z against a. Depth is what separates them;
    // ordering alone would give a.z to b.
    const depthAt = [];
    let d = 0;
    for (let i = 0; i < line.length; i++) {
      depthAt[i] = d;
      if (line[i] === '(') d++;
      else if (line[i] === ')') d--;
    }
    const froms = [];
    for (const m of line.matchAll(/\bFROM\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi)) {
      froms.push({ table: m[1], start: m.index, depth: depthAt[m.index] });
    }
    for (const from of froms) {
      if (IGNORE.has(from.table)) continue;
      if (!cols.get(from.table)) {
        bad.add(`${at} table '${from.table}' does not exist in any prisma schema`);
      }
    }

    for (const m of line.matchAll(/("?)([A-Za-z_][A-Za-z0-9_]*)\1\s+LIKE/g)) {
      const col = m[2];
      if (KEYWORDS.has(col.toLowerCase())) continue;
      // The query level this identifier belongs to, and the FROM that opened it.
      const owner = [...froms]
        .reverse()
        .find((f) => f.depth === depthAt[m.index] && f.start < m.index);
      if (!owner) continue;
      const colsOf = cols.get(owner.table);
      if (!colsOf || colsOf.has(col)) continue;
      const alt = camel(col);
      bad.add(
        `${at} ${owner.table}.${col} — no such column` +
          (colsOf.has(alt) ? ` (real column: '${alt}')` : ' (and no camelCase equivalent)'),
      );
    }
  });

  const list = [...bad];
  if (list.length) problems.push(...list);
  console.log(list.length ? `FAIL ${file}` : `ok   ${file}`);
  list.forEach((b) => console.log(`       ${b}`));
}

if (problems.length) {
  console.log(
    `\n${problems.length} phantom table/column reference(s). A residue gate that ` +
      `asserts on or cleans a name the schema does not define cannot detect residue: ` +
      `the lookup throws, the bare catch swallows it, and the gate reports 0 ` +
      `unconditionally while real rows stay behind.`,
  );
  process.exit(1);
}
console.log('\nAll clean-db scripts reference only tables and columns that exist in the Prisma schema.');
NODE