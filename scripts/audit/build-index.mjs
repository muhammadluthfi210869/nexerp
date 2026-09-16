#!/usr/bin/env node
/**
 * build-index.mjs — Generate docs/audit/frontend-pages/INDEX.md from summary JSON
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const AUDIT_OUT = path.join(ROOT, 'docs/audit/frontend-pages');
const date = new Date().toISOString().slice(0, 10);

const summaryPath = path.join(AUDIT_OUT, `summary-${date}-all.json`);
if (!fs.existsSync(summaryPath)) {
  console.error(`Missing summary: ${summaryPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

// Aggregate per module
const moduleAgg = {};
let orphans = 0;
let withSpec = 0;
let mockPages = 0;
let totalPct = 0;

for (const r of data) {
  const m = r.moduleId || 'orphan';
  if (!moduleAgg[m]) {
    moduleAgg[m] = {
      total: 0,
      sum: 0,
      mock: 0,
      dna: 0,
      pages: []
    };
  }
  moduleAgg[m].total++;
  moduleAgg[m].sum += r.pct;
  moduleAgg[m].mock += r.mock;
  moduleAgg[m].dna += r.dna;
  moduleAgg[m].pages.push(r);

  if (r.moduleId === 'orphan') orphans++;
  else {
    withSpec++;
    totalPct += r.pct;
  }
  if (r.mock > 0) mockPages++;
}

const avgOverall = withSpec > 0 ? Math.round(totalPct / withSpec) : 0;

// Sort per-module page list by conformance asc
Object.values(moduleAgg).forEach(m => m.pages.sort((a, b) => a.pct - b.pct));

// Critical findings
const criticalPages = data.filter(d => d.moduleId !== 'orphan' && d.pct < 50).sort((a, b) => a.pct - b.pct);

const lines = [];
lines.push('# Frontend Audit Index — ' + date);
lines.push('');
lines.push(`**Total Pages Audited**: ${data.length}`);
lines.push(`**Pages with SCR Spec Mapping**: ${withSpec}`);
lines.push(`**Orphan Pages (no spec mapping)**: ${orphans}`);
lines.push(`**Pages with Mock Arrays**: ${mockPages}`);
lines.push(`**Average Conformance** (excluding orphans): ${avgOverall}%`);
lines.push('');
lines.push('## Conformance Score per Module');
lines.push('');
lines.push('| Module ID | Pages | Avg Conformance | Critical Gaps |');
lines.push('|---|---:|---:|---|');

const moduleOrder = Object.keys(moduleAgg).sort();
const moduleNames = {
  'MOD-01': 'Master Data',
  'MOD-02': 'Business Development & CRM',
  'MOD-03': 'R&D / Samples',
  'MOD-04': 'SCM / Purchasing',
  'MOD-05': 'Warehouse / Inventory',
  'MOD-06': 'Production',
  'MOD-07': 'Quality Control',
  'MOD-08': 'Design / Packaging',
  'MOD-09': 'Legality / Compliance',
  'MOD-10': 'Finance',
  'MOD-11': 'HR',
  'MOD-12': 'Executive',
  'orphan': 'Non-spec / Dashboard / Marketing'
};
for (const m of moduleOrder) {
  const agg = moduleAgg[m];
  const avg = agg.total > 0 ? Math.round(agg.sum / agg.total) : 0;
  const crit = agg.pages.filter(p => p.moduleId !== 'orphan' && p.pct < 50).length;
  const name = moduleNames[m] || m;
  lines.push(`| ${m} | ${agg.total} | ${avg}% | ${crit} |`);
}
lines.push('');

lines.push('## Per-Page Detail (Sorted by Conformance Asc)');
lines.push('');
lines.push('| Module | Route | SCR | Conformance | Mock | DNA | File |');
lines.push('|---|---|---|---:|---:|---:|---|');
for (const m of moduleOrder) {
  for (const p of moduleAgg[m].pages) {
    const icon = p.moduleId === 'orphan' ? '🚫' : (p.pct >= 80 ? '✅' : (p.pct >= 50 ? '⚠️' : '🔴'));
    lines.push(`| ${icon} ${p.moduleId} | \`${p.route}\` | ${p.scr} | ${p.pct}% | ${p.mock} | ${p.dna} | ${p.file} |`);
  }
}
lines.push('');

lines.push('## Critical Pages (Conformance < 50%, with Spec)');
lines.push('');
if (criticalPages.length === 0) {
  lines.push('_None_');
} else {
  lines.push('| Route | SCR | Conformance | Module | Mock | File |');
  lines.push('|---|---|---:|---|---:|---|');
  for (const p of criticalPages) {
    lines.push(`| \`${p.route}\` | ${p.scr} | ${p.pct}% | ${p.moduleId} | ${p.mock} | ${p.file} |`);
  }
}
lines.push('');

lines.push('## Orphan Pages (No SCR Mapping — Review & Decide)');
lines.push('');
lines.push('| Route | Mock | DNA | File |');
lines.push('|---|---:|---:|---|');
const orphansList = data.filter(d => d.moduleId === 'orphan').sort((a, b) => a.route.localeCompare(b.route));
for (const p of orphansList) {
  lines.push(`| \`${p.route}\` | ${p.mock} | ${p.dna} | ${p.file} |`);
}
lines.push('');

lines.push('## Audit Methodology');
lines.push('');
lines.push('- Each page scanned via `scripts/audit/run-audit.mjs`');
lines.push('- Spec fields extracted from `docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json` (176 screens)');
lines.push('- Field matching: substring match on normalized spec tokens (4+ chars, then 3+ chars with multi-token agreement)');
lines.push('- 8 dimensions per page: Table Columns, Form Inputs, Cards, Actions, Detail, Edit, Print, Delete');
lines.push('- Conformance % = (present / total) × 100 across all 8 dimensions');
lines.push('');
lines.push('## Verification');
lines.push('');
lines.push('```bash');
lines.push('# Re-run full audit');
lines.push('node scripts/audit/run-audit.mjs all');
lines.push('');
lines.push('# Re-run single page');
lines.push('node scripts/audit/run-audit.mjs single "frontend/src/app/(dashboard)/master/goods/page.tsx" SCR-029');
lines.push('');
lines.push('# Determinism check: re-run should produce identical summary');
lines.push('md5sum docs/audit/frontend-pages/summary-*.json');
lines.push('```');
lines.push('');

const out = path.join(AUDIT_OUT, 'INDEX.md');
fs.writeFileSync(out, lines.join('\n'));
console.log('Wrote', out);
console.log('Modules:', moduleOrder.length);
console.log('Pages:', data.length);
console.log('Avg conformance:', avgOverall + '%');
console.log('Orphans:', orphans);
console.log('Critical (<50%):', criticalPages.length);