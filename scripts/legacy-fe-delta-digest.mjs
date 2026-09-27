#!/usr/bin/env node
/** Prints the digest sections the parity report is written from. Reads only _FE_LEGACY_DELTA.json. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/verification/_FE_LEGACY_DELTA.json'), 'utf8'));
const what = process.argv[2] ?? 'all';
const out = [];
const p = (...a) => out.push(a.join(''));

const parity = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/verification/_fe_be_parity.json'), 'utf8'));
const ncb = parity.screen_contract_reconciliation.never_called_breakdown;

if (what === 'all' || what === 'unwired') {
  p('\n## LIVE_BUT_UNWIRED (', ncb.live_but_unwired.length, ')');
  for (const e of ncb.live_but_unwired) p('  ', e.route, '  <--  ', (e.screens ?? []).join(','));
}
if (what === 'all' || what === 'absent') {
  p('\n## ABSENT (', parity.screen_contract_reconciliation.absent.length, ')');
  for (const e of parity.screen_contract_reconciliation.absent) p('  ', e.route, '  |  ', e.note ?? '');
}
if (what === 'all' || what === 'renamed') {
  p('\n## RENAMED (', parity.screen_contract_reconciliation.renamed.length, ')');
  for (const e of parity.screen_contract_reconciliation.renamed) p('  ', e.route, ' -> ', e.target, '  (', (e.screens ?? []).join(','), ')');
}
if (what === 'all' || what === 'noBackend') {
  const nb = parity.violations.screen_data_source_with_no_backend_route;
  const grouped = {};
  for (const e of nb) {
    const top = String(e.route).split(' ').pop().split('/')[0];
    grouped[top] = (grouped[top] ?? 0) + 1;
  }
  const perRoute = {};
  for (const e of nb) perRoute[e.route] = e.screens ?? [];
  p('\n## NO_BACKEND_ROUTE (', nb.length, ') by first segment:');
  p('  ', Object.entries(grouped).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '));
  p('\n  routes:');
  p('  ', Object.keys(perRoute).sort().join('\n   '));
}
if (what === 'all' || what === 'legacyByArea') {
  const g = {};
  for (const r of d.rows) (g[r.area] = g[r.area] ?? []).push(r);
  p('\n## LEGACY SCREENS BY AREA (', d.rows.length, ')');
  for (const [a, list] of Object.entries(g).sort((x, y) => y[1].length - x[1].length)) {
    p('  [', a, '] ', list.length);
    for (const r of list) p('     ', r.verdict.padEnd(18), r.url.padEnd(38), r.menu);
  }
}
if (what === 'all' || what === 'verdicts') {
  const g = {};
  for (const r of d.rows) (g[r.verdict] = g[r.verdict] ?? []).push(r);
  for (const v of Object.keys(g).sort()) {
    p('\n## VERDICT ', v, ' (', g[v].length, ')');
    for (const r of g[v]) p('  ', r.area, ' | ', r.menu, ' | ', r.url, r.match_confidence === 'FUZZY' ? `  ~${r.match_score}` : '', r.fe.length ? `  -> ${r.fe.map((f) => f.route).join(' , ')}` : '');
  }
}
if (what === 'all' || what === 'inputs') {
  p('\n## LEGACY INPUT COLUMN (', d.rows.filter((r) => r.inputs && r.inputs !== '—').length, ' rows)');
  for (const r of d.rows) {
    if (!r.inputs || r.inputs === '—') continue;
    p('  ', r.url.padEnd(38), '|', r.inputs.slice(0, 150), '|| FE_modal=', r.fe.some((f) => f.hasModal));
  }
}
if (what === 'all' || what === 'forms') {
  const forms = d.rows.flatMap((r) => r.contract.map((c) => ({ url: r.url, ...c }))).filter((c) => c.forms.length);
  p('\n## CONTRACT FORMS (', forms.length, ' screens )');
  for (const c of forms) {
    p('  ', c.screen_id, c.url, '|', c.title);
    for (const f of c.forms) p('      form ', f.name, ' -> ', f.fieldCount ?? '', f.fields.join(', '), '  submit=', f.submit);
  }
}
if (what === 'all' || what === 'pages') {
  const g = {};
  for (const pg of d.pages) {
    const top = pg.route.split('/').filter(Boolean)[0] ?? '(root)';
    (g[top] = g[top] ?? []).push(pg);
  }
  p('\n## OUR PAGES BY MODULE (', d.pages.length, ')');
  for (const [k, list] of Object.entries(g).sort()) {
    p('  [', k, '] ', list.length);
    for (const pg of list) p('     ', pg.route.padEnd(52), String(pg.lines).padStart(4), 'ln  modal=', pg.hasModal ? 'Y' : '.', ' table=', pg.hasTable ? 'Y' : '.', ' kpi=', pg.hasKpi ? 'Y' : '.', ' dl=', pg.deadlines, ' calls=', pg.calls.slice(0, 4).join(' '));
  }
}
const dest = process.argv[3] ?? path.join(ROOT, 'docs/legacy-erp/verification/_digest.txt');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out.join('\n'));
console.log('wrote', dest, (Buffer.byteLength(out.join('\n')) / 1024).toFixed(0) + 'KB', out.length, 'lines');
