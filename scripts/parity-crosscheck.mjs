#!/usr/bin/env node
/**
 * Cross-checks the parity report's "never called by frontend" buckets against the frontend's
 * actual api.* call strings.
 *
 * Why this exists: `screen_ops_never_called: 121` is a sum whose parts are not alike. A route
 * whose contract name was RENAMED cannot be called under that name by definition — so counting it
 * as "never called" may be double-counting a screen the frontend does reach under the new name.
 * Before the number can head a report, each bucket has to be checked against the real call list
 * rather than trusted.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V = path.join(ROOT, 'docs/legacy-erp/verification');
const parity = JSON.parse(fs.readFileSync(path.join(V, '_fe_be_parity.json'), 'utf8'));
const delta = JSON.parse(fs.readFileSync(path.join(V, '_FE_LEGACY_DELTA.json'), 'utf8'));

/** "GET /v1/qc/checklists/{id}" -> "GET qc/checklists/:p" — method first, then version, then ids. */
function norm(r) {
  const s = String(r ?? '').trim();
  const m = s.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.*)$/i);
  const method = m ? m[1].toUpperCase() : 'GET';
  let p = m ? m[2] : s;
  p = p
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/?api\//, '')
    .replace(/^v\d+\//, '')          // also matches after a leading slash below
    .replace(/^\//, '')
    .replace(/^v\d+\//, '')
    .replace(/\$\{[^}]*\}/g, ':p')   // `${id}` in a template literal carries a leading $
    .replace(/\{[^}]*\}/g, ':p')
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, ':p')
    .replace(/\$/g, '')              // any template fragment the regex above could not resolve
    .replace(/\?.*$/, '')            // drop the query string
    .replace(/\/+$/, '');
  return `${method} ${p}`;
}

const called = new Set();
for (const pg of delta.pages) for (const c of pg.calls) called.add(norm(c));

// The parity JSON carries Swagger paths (`suppliers`, `reports/trial-balance`) while the frontend
// calls them under a module prefix (`/master/suppliers`, `/finance/reports/trial-balance`). An exact
// string compare therefore reports a gap where none exists. Second pass: segment-aligned suffix.
const calledPaths = [...called].map((c) => {
  const i = c.indexOf(' ');
  return { method: c.slice(0, i), path: c.slice(i + 1).split('/') };
});
function suffixCalled(r) {
  const n = norm(r);
  const i = n.indexOf(' ');
  const method = n.slice(0, i);
  const seg = n.slice(i + 1).split('/');
  return calledPaths.some((c) => {
    if (c.method !== method) return false;
    if (c.path.length < seg.length) return false;
    const off = c.path.length - seg.length;
    return seg.every((s, k) => (s === ':p' ? c.path[off + k] !== undefined : s === c.path[off + k]));
  });
}

const byRoute = (list) => {
  const hit = [], miss = [], fuzzy = [];
  for (const e of list) {
    const r = e.route ?? e.target;
    if (called.has(norm(r))) hit.push(e);
    else if (suffixCalled(r)) fuzzy.push(e);
    else miss.push(e);
  }
  return { hit, miss, fuzzy };
};

const ncb = parity.screen_contract_reconciliation.never_called_breakdown;
const ren = parity.screen_contract_reconciliation.renamed;

// For a renamed route the contract name is uncallable; the question that matters is whether the
// frontend calls the TARGET it was renamed to.
const renamedTargetCalled = ren.filter((e) => called.has(norm(e.target)));
const renamedTargetMissed = ren.filter((e) => !called.has(norm(e.target)));

const unwired = byRoute(ncb.live_but_unwired);

const out = [];
const p = (...a) => out.push(a.join(''));
p('frontend call strings collected: ', called.size, '\n');
p('RENAMED (', ren.length, ')\n');
p('  target BARU dipanggil frontend : ', renamedTargetCalled.length, '\n');
p('  target BARU juga tidak dipanggil: ', renamedTargetMissed.length, '\n');
p('LIVE_BUT_UNWIRED (', ncb.live_but_unwired.length, ')\n');
p('  rute persis sama             : ', unwired.hit.length, '\n');
p('  cocok sebagai sufiks segmen  : ', unwired.fuzzy.length, '\n');
p('  benar-benar tidak dipanggil  : ', unwired.miss.length);
if (unwired.hit.length) for (const e of unwired.hit) p('\n      HIT  ', e.route);
if (unwired.fuzzy.length) for (const e of unwired.fuzzy) p('\n      SUF  ', e.route);
if (unwired.miss.length) for (const e of unwired.miss) p('\n      MISS ', e.route);
p('\nABSENT (', ncb.absent, ') — rutenya tidak ada di backend, jadi tidak bisa dipanggil\n');
p('\n--- ringkasan ---\n');
p('121 = ', ncb.live_but_unwired.length, ' live_but_unwired + ', ren.length, ' renamed + ', ncb.absent, ' absent + ', ncb.out_of_scope, ' out_of_scope\n');
p('dari ', ren.length, ' renamed, target BARU-nya sudah dipanggil : ', renamedTargetCalled.length, ' -> dihitung dua kali oleh angka 121\n');
p('dari ', ncb.live_but_unwired.length, ' live_but_unwired, ternyata SUDAH dipanggil  : ', unwired.hit.length + unwired.fuzzy.length, ' -> juga salah hitung\n');
p('sisa yang benar-benar tak dipanggil         : ', unwired.miss.length, ' live_but_unwired + ', renamedTargetMissed.length, ' renamed-tak-berpindah\n');
p('yang backend-nya memang tidak ada           : ', ncb.absent + ncb.out_of_scope, '\n');

fs.writeFileSync(path.join(ROOT, 'scripts/.parity-check.txt'), out.join(''));

// The report renders these; keeping them in one JSON means the headline cannot drift from the check.
fs.writeFileSync(
  path.join(V, '_PARITY_CROSSCHECK.json'),
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      called_strings: called.size,
      renamed: { total: ren.length, target_called: renamedTargetCalled.length, target_missed: renamedTargetMissed.length },
      unwired: { total: ncb.live_but_unwired.length, exact: unwired.hit.length, suffix: unwired.fuzzy.length, missed: unwired.miss.length },
      absent: ncb.absent,
      out_of_scope: ncb.out_of_scope,
      // What the report may say out loud, versus what the raw parity JSON claims.
      corrected: {
        really_unwired: unwired.miss.length + renamedTargetMissed.length,
        backend_missing: ncb.absent + ncb.out_of_scope,
        overstated_by: renamedTargetCalled.length + unwired.hit.length + unwired.fuzzy.length,
      },
    },
    null,
    1,
  ),
);

console.log(out.join(''));
