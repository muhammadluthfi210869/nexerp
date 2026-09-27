#!/usr/bin/env node
/**
 * NEX ERP — FE <-> BE contract parity audit.
 *
 * WHY THIS EXISTS
 * ---------------
 * Nothing in scripts/ssot/ proves that a frontend screen actually reaches a backend
 * route. `06_SCREEN_CONTRACT.json` declares `data_source` per screen, but
 * validate_screen_mappings.js only checks the field's syntax, never that any
 * page issues that call. The 12 `p*-live-flow.behavior.test.tsx` files mock the
 * axios adapter, so they assert a mocked URL, not a live route.
 *
 * This script joins THREE independent sources:
 *   (a) backend/swagger-spec.json  — ground truth, emitted by NestJS itself
 *   (b) docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json `data_source`
 *   (c) every `api.<verb>(...)` call parsed out of frontend/src
 * and reports exactly where they disagree.
 *
 * Read-only. Writes one JSON report. Exits 1 when a contract is violated.
 *
 * Run: node scripts/ssot/audit_fe_be_parity.js [--json]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'legacy-erp', 'verification', '_fe_be_parity.json');
const SKIP_DIRS = new Set(['node_modules', '.next', '.turbo', 'dist', 'build', 'coverage', '.git']);

// ── helpers ────────────────────────────────────────────────────────────────
function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else out.push(p);
  }
  return out;
}

const isTest = p => /\.(test|spec)\.[tj]sx?$/.test(p) || /[\\/]__tests__[\\/]/.test(p);
const rel = p => p.replace(ROOT + path.sep, '').replace(/\\/g, '/');

/**
 * Normalize a URL path into a comparable key.
 *  - `/v1/master/customers/{id}`  (swagger)   -> `master/customers/:p`
 *  - `/api/master/customers/${id}` (frontend) -> `master/customers/:p`
 *  - drops query string, trailing slash, duplicate slashes
 */
function normPath(raw) {
  let p = String(raw).trim();
  p = p.replace(/^https?:\/\/[^/]+/i, '');      // absolute URL -> path

  // Replace balanced ${...} template holes with :p or strip if query-only
  let depth = 0;
  let out = '';
  let inHole = false;
  let holeBuf = '';
  for (let i = 0; i < p.length; i++) {
    if (p[i] === '$' && p[i + 1] === '{') {
      if (!inHole) {
        inHole = true;
        depth = 1;
        holeBuf = '';
        i++;
        continue;
      }
    }
    if (inHole) {
      if (p[i] === '{') depth++;
      else if (p[i] === '}') {
        depth--;
        if (depth === 0) {
          inHole = false;
          // If hole is an inline conditional query param (e.g. ${q ? `?search=...` : ""}), skip
          if (/^\s*\w+\s*\?\s*[`'"]\?/.test(holeBuf)) {
            // query string hole
          } else {
            out += ':p';
          }
        }
      } else {
        holeBuf += p[i];
      }
      continue;
    }
    out += p[i];
  }
  p = out;

  p = p.split('?')[0].split('#')[0];
  p = p.replace(/\{[^}]*\}/g, ':p');            // {id} -> :p
  p = p.replace(/\/:p(?=\/|$)/g, '/:p');
  p = p.replace(/^\/?(api|v1)(\/|$)/, '');      // strip one leading /api or /v1
  p = p.replace(/^\/?(api|v1)(\/|$)/, '');      // strip a second (api/v1)
  p = p.replace(/\/+/g, '/').replace(/\/$/, '');
  return p;
}

/** `%s` */
const key = (method, p) => method.toUpperCase() + ' ' + normPath(p);

/**
 * Balanced-argument reader for a decorator call. `@Get('a')` and
 * `@Get(['a','b'])` both work; a `[^)]*` regex silently truncates on args that
 * contain a nested call, which is how routes disappear from a naive parser.
 */
function decoratorArgs(src, name) {
  const out = [];
  const re = new RegExp('@' + name + '\\s*\\(', 'g');
  let m;
  while ((m = re.exec(src))) {
    let i = re.lastIndex - 1, depth = 0, j = i;
    for (; j < src.length; j++) {
      const ch = src[j];
      if (ch === '(') depth++;
      else if (ch === ')') { depth--; if (depth === 0) break; }
    }
    out.push({ args: src.slice(i + 1, j), at: m.index });
  }
  return out;
}

const stringLits = a => [...String(a).matchAll(/['"`]([^'"`]*)['"`]/g)].map(x => x[1]);

/** Compare two normalized paths: a param segment matches anything. */
function segMatch(a, b) {
  const A = a.split('/').filter(Boolean), B = b.split('/').filter(Boolean);
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) {
    if (A[i] === ':p' || B[i] === ':p') continue;
    if (A[i] !== B[i]) return false;
  }
  return true;
}

function sameRoute(k1, k2) {
  const s1 = k1.indexOf(' '), s2 = k2.indexOf(' ');
  if (k1.slice(0, s1) !== k2.slice(0, s2)) return false;
  return segMatch(k1.slice(s1 + 1), k2.slice(s2 + 1));
}

// ── (a) backend ground truth: swagger-spec.json ────────────────────────────
function loadSwagger() {
  const file = path.join(ROOT, 'backend', 'swagger-spec.json');
  if (!fs.existsSync(file)) throw new Error('backend/swagger-spec.json missing — run the backend once to emit it');
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const routes = new Set();
  for (const [p, ops] of Object.entries(spec.paths || {})) {
    for (const m of Object.keys(ops)) {
      if (!/^(get|post|put|patch|delete)$/.test(m)) continue;
      routes.add(key(m, p));
    }
  }
  return { routes };
}

// ── (a2) which controllers Nest actually serves ────────────────────────────
/**
 * A `@Controller` class only answers HTTP if some module REACHABLE FROM AppModule
 * lists it in `controllers: [...]`. A controller file that exists but is listed
 * in no reachable module is dead code: its routes 404 at runtime and therefore
 * do NOT appear in swagger-spec.json.
 *
 * This distinguishes the two reasons a source route can be missing from swagger:
 *   - parser blindness  (the route IS served, my regex missed it)  -> BAD
 *   - dead controller   (the route is never registered)            -> a finding
 * Without this, a dead controller looks identical to a broken parser.
 */
function parseReachableControllers() {
  const all = walk(path.join(ROOT, 'backend', 'src'));
  const modFiles = all.filter(p => /\.module\.ts$/.test(p));
  const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };

  // module class -> file, and file -> { imports[], controllers[] }
  const modClass = new Map();
  const info = new Map();
  for (const f of modFiles) {
    const src = read(f);
    const dec = decoratorArgs(src, 'Module')[0];
    if (!dec) continue;
    const sliceArray = field => {
      const i = dec.args.indexOf(field);
      if (i < 0) return [];
      const j = dec.args.indexOf('[', i);
      if (j < 0) return [];
      let depth = 0, k = j;
      for (; k < dec.args.length; k++) {
        if (dec.args[k] === '[') depth++;
        else if (dec.args[k] === ']') { depth--; if (!depth) break; }
      }
      return [...dec.args.slice(j + 1, k).matchAll(/\b(\w+)\b/g)].map(x => x[1]);
    };
    info.set(rel(f), { imports: sliceArray('imports'), controllers: sliceArray('controllers') });
    for (const c of src.matchAll(/export\s+class\s+(\w+Module)\b/g)) modClass.set(c[1], rel(f));
  }

  // BFS from AppModule
  const seen = new Set();
  const queue = ['AppModule'];
  while (queue.length) {
    const cls = queue.pop();
    if (seen.has(cls)) continue;
    seen.add(cls);
    const file = modClass.get(cls);
    if (!file) continue;
    for (const dep of info.get(file).imports) {
      if (modClass.has(dep) && !seen.has(dep)) queue.push(dep);
    }
  }

  // controller class -> is it listed by a reachable module?
  const listedByReachable = new Set();
  const listedByAny = new Set();
  for (const cls of seen) {
    const file = modClass.get(cls);
    for (const c of info.get(file).controllers) listedByReachable.add(c);
  }
  for (const [, v] of info) for (const c of v.controllers) listedByAny.add(c);

  // controller class -> file
  const ctrlFiles = all.filter(p => /\.controller\.ts$/.test(p));
  const classFile = new Map();
  for (const f of ctrlFiles) {
    for (const c of read(f).matchAll(/export\s+class\s+(\w+)/g)) classFile.set(c[1], rel(f));
  }

  const unserved = new Map();   // controller file -> classes
  for (const [cls, file] of classFile) {
    if (listedByReachable.has(cls)) continue;
    if (!unserved.has(file)) unserved.set(file, []);
    unserved.get(file).push(cls);
  }

  const unreachableModules = [...modClass.keys()].filter(k => !seen.has(k));

  // 0) sanity: two independent implementations of "is it served" must agree
  const servedByListing = new Set([...listedByReachable]);
  const sanity = [...servedByListing].filter(c => !classFile.has(c));

  return {
    unservedFiles: new Set(unserved.keys()),
    unserved: [...unserved].map(([file, classes]) => ({
      file, classes,
      listed_by_any_module: classes.some(c => listedByAny.has(c)),
    })),
    unreachableModules,
    reachableCount: seen.size,
    totalModules: modClass.size,
    sanityOrphanNames: sanity,
  };
}

// ── (b) backend by source parse — used only to CROSS-CHECK swagger ─────────
const ROUTE_DECORATORS = ['Get', 'Post', 'Put', 'Patch', 'Delete', 'Sse'];

function parseControllersBySource() {
  const files = walk(path.join(ROOT, 'backend', 'src')).filter(p => /\.controller\.ts$/.test(p));
  const routes = new Map();   // key -> Set(file)
  const multi = [];           // files declaring >1 @Controller
  const unregistered = [];    // controller classes no module references
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');

    // every @Controller(...) in file order, with its position
    const ctrls = [];
    for (const c of decoratorArgs(src, 'Controller')) {
      const lits = stringLits(c.args);
      ctrls.push({ at: c.at, bases: lits.length ? lits : [''] });
    }
    if (!ctrls.length) continue;
    if (ctrls.length > 1) multi.push(rel(f));

    // route decorators, each attributed to the NEAREST PRECEDING @Controller
    for (const name of ROUTE_DECORATORS) {
      for (const d of decoratorArgs(src, name)) {
        let owner = null;
        for (const c of ctrls) { if (c.at < d.at) owner = c; else break; }
        if (!owner) continue;
        const subs = stringLits(d.args);
        if (!subs.length) subs.push('');   // bare @Get() -> the controller base itself
        for (const s of subs) for (const b of owner.bases) {
          const k = key(name === 'Sse' ? 'get' : name, '/' + b + '/' + s);
          if (!routes.has(k)) routes.set(k, new Set());
          routes.get(k).add(rel(f));
        }
      }
    }
  }
  return { routes, multi, unregistered };
}

// ── (c) frontend calls ─────────────────────────────────────────────────────
/** Read the first string-ish argument of `api.<m>(`, honouring `${}` depth. */
function firstArg(s, from) {
  let i = from;
  while (i < s.length && /\s/.test(s[i])) i++;
  const q = s[i];
  if (q !== '`' && q !== "'" && q !== '"') return null;
  let depth = 0, j = i + 1, buf = '';
  for (; j < s.length; j++) {
    const ch = s[j];
    if (ch === '\\') { buf += ch + (s[j + 1] || ''); j++; continue; }
    if (q === '`' && ch === '$' && s[j + 1] === '{') { depth++; buf += '${'; j++; continue; }
    if (q === '`' && depth > 0 && ch === '}') { depth--; buf += '}'; continue; }
    if (ch === q && depth === 0) return { raw: buf, end: j };
    buf += ch;
  }
  return { raw: buf, end: j, truncated: true };
}

function parseFrontendCalls() {
  const files = walk(path.join(ROOT, 'frontend', 'src')).filter(p => /\.(ts|tsx)$/.test(p) && !isTest(p));
  const calls = new Map();   // key -> Set("file:line")
  const callRe = /\b(?:api|apiClient|client|axios)\s*\.\s*(get|post|put|patch|delete)\s*\(/g;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const lineOf = idx => src.slice(0, idx).split('\n').length;
    let m;
    while ((m = callRe.exec(src))) {
      const a = firstArg(src, callRe.lastIndex);
      if (!a) continue;
      let raw = a.raw;
      if (!raw || (!raw.startsWith('/') && !/^https?:/i.test(raw))) continue;
      const k = key(m[1], raw);
      if (!calls.has(k)) calls.set(k, new Set());
      calls.get(k).add(rel(f) + ':' + lineOf(m.index));
    }
  }
  return calls;
}

// ── (b2) legacy screen-contract reconciliation ─────────────────────────────
/**
 * `06_SCREEN_CONTRACT.json` is the LEGACY ERP's API vocabulary; the rebuilt
 * backend names its own routes differently. So a declared route that matches no
 * live route is not automatically a bug — it may be a rename (`coa` ->
 * `/finance/accounts`) or a surface this rebuild never carried over.
 *
 * Every such route is classified EXPLICITLY in screen_contract_reconciliation.json.
 * The gate blocks on any declared route that is neither matched nor classified,
 * so a new drift still fails; and on a RENAMED entry whose `target` does not
 * actually exist, so the table cannot rot into fiction.
 *
 * ABSENT / OUT_OF_SCOPE routes are reported but do not block — they are the
 * honest list of screens whose declared data source has no backend yet.
 */
function loadReconciliation() {
  const file = path.join(__dirname, 'screen_contract_reconciliation.json');
  if (!fs.existsSync(file)) return new Map();
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = new Map();
  for (const [route, v] of Object.entries(j.routes || {})) out.set(key(route.split(' ')[0], route.slice(route.indexOf(' ') + 1)), { route, ...v });
  return out;
}

// ── (b) screen contract data_source ────────────────────────────────────────
function loadScreenOps() {
  const file = path.join(ROOT, 'docs', 'legacy-erp', 'contracts', '06_SCREEN_CONTRACT.json');
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ops = new Map();     // key -> Set(screen_id)
  const verb = /^\s*(GET|POST|PUT|PATCH|DELETE)\s+\S+/i;
  let screensWithApi = 0;
  for (const s of j.screens || []) {
    const d = s.data_source;
    const list = typeof d === 'string' ? [d] : Array.isArray(d) ? d : [];
    let hit = false;
    for (const raw of list) {
      const m = verb.exec(String(raw));
      if (!m) continue;
      hit = true;
      const k = key(m[1], String(raw).replace(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+/i, ''));
      if (!ops.has(k)) ops.set(k, new Set());
      ops.get(k).add(s.screen_id);
    }
    if (hit) screensWithApi++;
  }
  return { ops, totalScreens: (j.screens || []).length, screensWithApi };
}

// ── main ───────────────────────────────────────────────────────────────────
function main() {
  const { routes: beRoutes } = loadSwagger();
  const { routes: srcRoutes, multi } = parseControllersBySource();
  const served = parseReachableControllers();
  const feCalls = parseFrontendCalls();
  const { ops: screenOps, totalScreens, screensWithApi } = loadScreenOps();

  // 0) validate the source parser against NestJS's own spec.
  // A source route missing from swagger is EXPLAINED (dead controller, whose
  // file no reachable module lists) or it is parser blindness. Only the latter
  // is a defect in this script, and it must be zero before the numbers below
  // mean anything.
  const srcKeys = [...srcRoutes.keys()];
  const beKeys = [...beRoutes];
  const srcNotInBe = srcKeys.filter(k => !beKeys.some(b => sameRoute(b, k)));
  const beNotInSrc = beKeys.filter(b => !srcKeys.some(k => sameRoute(k, b)));
  const unexplained = srcNotInBe.filter(k => {
    const files = srcRoutes.get(k) || new Set();
    return ![...files].some(f => served.unservedFiles.has(f));
  });

  // 1) frontend -> backend
  const feUnmatched = [...feCalls.keys()].filter(k => !beKeys.some(b => sameRoute(b, k))).sort();
  const feMethodMismatch = feUnmatched.filter(k => {
    const seg = normPath(k.slice(k.indexOf(' ') + 1));
    return beKeys.some(b => segMatch(normPath(b.slice(b.indexOf(' ') + 1)), seg));
  });

  // 2) screen contract -> backend
  const screenUnmatched = [...screenOps.keys()].filter(k => !beKeys.some(b => sameRoute(b, k))).sort();

  // 2b) classify each unmatched declared route — a route that is neither
  // matched nor classified is unclassified drift and blocks the gate.
  const recon = loadReconciliation();
  const classified = [];
  const unclassified = [];
  const badTarget = [];
  for (const k of screenUnmatched) {
    const e = recon.get(k);
    if (!e) { unclassified.push({ route: k, screens: [...screenOps.get(k)] }); continue; }
    // every `target` must be wildcard-expanded (`{id}` -> `:p`) before comparison
    const tgt = e.target ? key(e.target.split(' ')[0], e.target.slice(e.target.indexOf(' ') + 1)) : null;
    if (tgt && !beKeys.some(b => sameRoute(b, tgt))) {
      badTarget.push({ route: k, target: e.target, screens: [...screenOps.get(k)] });
    }
    classified.push({ route: k, status: e.status, target: e.target || null, note: e.note || null, screens: [...screenOps.get(k)] });
  }

  // 3) screen contract -> frontend (declared but never called)
  const screenNotCalled = [...screenOps.keys()].filter(k => ![...feCalls.keys()].some(f => sameRoute(f, k))).sort();

  // `never called by frontend` splits the same way the unmatched routes do: a
  // route that is ABSENT / RENAMED is uncalled for a reason already stated
  // above. What is left is a LIVE route the frontend never calls — the real
  // unwired backlog.
  const neverCalledBreakdown = {
    absent: screenNotCalled.filter(k => recon.get(k)?.status === 'ABSENT').length,
    renamed: screenNotCalled.filter(k => recon.get(k)?.status === 'RENAMED').length,
    out_of_scope: screenNotCalled.filter(k => recon.get(k)?.status === 'OUT_OF_SCOPE').length,
    live_but_unwired: screenNotCalled.filter(k => !recon.has(k)).map(k => ({ route: k, screens: [...screenOps.get(k)] })),
  };

  const report = {
    generated_at: new Date().toISOString(),
    sources: {
      backend_swagger: { path: 'backend/swagger-spec.json', ops: beRoutes.size, note: 'ground truth — emitted by NestJS at boot' },
      backend_source_parse: { ops: srcRoutes.size, files_with_multiple_controllers: multi },
      frontend_calls: feCalls.size,
      screen_contract: { total_screens: totalScreens, screens_with_data_source: screensWithApi, ops: screenOps.size },
    },
    parser_validation: {
      // explained = a controller no reachable module registers (dead code);
      // unexplained = the parser missed a route Nest really serves. Must be 0.
      source_routes_not_in_swagger_explained: srcNotInBe.length - unexplained.length,
      source_routes_not_in_swagger_unexplained: unexplained,
      swagger_routes_not_in_source: beNotInSrc,
      ok: unexplained.length === 0 && beNotInSrc.length === 0,
    },
    dead_controllers: {
      unserved_controller_files: served.unserved,
      unreachable_modules: served.unreachableModules,
      reachable_modules: served.reachableCount,
      total_modules: served.totalModules,
    },
    violations: {
      fe_calls_with_no_backend_route: feUnmatched.map(k => ({
        route: k,
        sites: [...feCalls.get(k)],
        // a source route exists but belongs to a controller Nest never registered
        cause: srcKeys.some(s => sameRoute(s, k)) ? 'DEAD_CONTROLLER' : 'NO_ROUTE',
      })),
      fe_method_mismatch: feMethodMismatch,
      screen_data_source_with_no_backend_route: screenUnmatched.map(k => ({ route: k, screens: [...screenOps.get(k)] })),
      screen_data_source_never_called_by_frontend: screenNotCalled.map(k => ({ route: k, screens: [...screenOps.get(k)] })),
    },
    screen_contract_reconciliation: {
      classified,
      unclassified,
      bad_target: badTarget,
      absent: classified.filter(c => c.status === 'ABSENT').map(c => ({ route: c.route, note: c.note, screens: c.screens })),
      out_of_scope: classified.filter(c => c.status === 'OUT_OF_SCOPE').map(c => ({ route: c.route, note: c.note, screens: c.screens })),
      renamed: classified.filter(c => c.status === 'RENAMED').map(c => ({ route: c.route, target: c.target, screens: c.screens })),
      // `never called by frontend` splits the same way: a route that is ABSENT /
      // RENAMED is uncalled for a reason already stated above. What is left is a
      // LIVE route the frontend never calls — the real unwired backlog.
      never_called_breakdown: neverCalledBreakdown,
    },
    counts: {
      fe_calls_unmatched: feUnmatched.length,
      fe_calls_unmatched_dead_controller: feUnmatched.filter(k => srcKeys.some(s => sameRoute(s, k))).length,
      fe_method_mismatch: feMethodMismatch.length,
      unserved_controller_files: served.unserved.length,
      unreachable_modules: served.unreachableModules.length,
      screen_ops_unmatched: screenUnmatched.length,
      screen_ops_unmatched_unclassified: unclassified.length,
      screen_ops_unmatched_bad_target: badTarget.length,
      screen_ops_renamed: classified.filter(c => c.status === 'RENAMED').length,
      screen_ops_absent: classified.filter(c => c.status === 'ABSENT').length,
      screen_ops_out_of_scope: classified.filter(c => c.status === 'OUT_OF_SCOPE').length,
      screen_ops_never_called: screenNotCalled.length,
      screen_ops_never_called_absent: neverCalledBreakdown.absent,
      screen_ops_never_called_renamed: neverCalledBreakdown.renamed,
      screen_ops_never_called_oos: neverCalledBreakdown.out_of_scope,
      screen_ops_live_but_unwired: neverCalledBreakdown.live_but_unwired.length,
    },
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

  const blocking =
    feUnmatched.length + feMethodMismatch.length + unclassified.length + badTarget.length + (report.parser_validation.ok ? 0 : 1);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report.counts, null, 2));
  } else {
    console.log('FE<->BE parity audit — ' + path.relative(ROOT, OUT).replace(/\\/g, '/'));
    console.log('');
    console.log('  backend ops (swagger, ground truth) : ' + beRoutes.size);
    console.log('  backend ops (source parse)          : ' + srcRoutes.size);
    console.log('  parser agrees with swagger          : ' + (report.parser_validation.ok ? 'YES' : 'NO'));
    console.log('  frontend distinct calls             : ' + feCalls.size);
    console.log('  screen contract ops                 : ' + screenOps.size);
    console.log('');
    console.log('  FE call with no backend route       : ' + feUnmatched.length);
    console.log('  FE call with wrong METHOD           : ' + feMethodMismatch.length);
    console.log('');
    console.log('  screen data_source with no BE route : ' + screenUnmatched.length);
    console.log('    -> RENAMED (live route known)     : ' + report.counts.screen_ops_renamed);
    console.log('    -> ABSENT  (no backend yet)       : ' + report.counts.screen_ops_absent);
    console.log('    -> OUT_OF_SCOPE                   : ' + report.counts.screen_ops_out_of_scope);
    console.log('    -> UNCLASSIFIED (blocking)        : ' + unclassified.length);
    console.log('    -> BAD TARGET   (blocking)        : ' + badTarget.length);
    console.log('  screen data_source never called by FE: ' + screenNotCalled.length);
    console.log('    -> route ABSENT / RENAMED / OOS   : ' + (report.counts.screen_ops_never_called_absent + report.counts.screen_ops_never_called_renamed + report.counts.screen_ops_never_called_oos));
    console.log('    -> LIVE route frontend never calls: ' + report.counts.screen_ops_live_but_unwired + '  (unwired backlog — not blocking)');
    if (unclassified.length) {
      console.log('');
      console.log('  !! unclassified declared routes — add them to scripts/ssot/screen_contract_reconciliation.json');
      for (const u of unclassified) console.log('     ' + u.route);
    }
    if (badTarget.length) {
      console.log('');
      console.log('  !! reconciliation target does not exist on the backend');
      for (const b of badTarget) console.log('     ' + b.route + ' -> ' + b.target);
    }
    if (!report.parser_validation.ok) {
      console.log('');
      console.log('  !! parser disagrees with swagger — fix the parser before trusting any number above');
      console.log('     source-not-in-swagger: ' + srcNotInBe.length + '  swagger-not-in-source: ' + beNotInSrc.length);
    }
  }
  process.exit(blocking > 0 ? 1 : 0);
}

main();