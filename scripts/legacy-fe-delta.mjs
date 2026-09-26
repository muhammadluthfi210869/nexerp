#!/usr/bin/env node
/**
 * Builds the front-end ⇄ legacy delta dataset.
 *
 * Three sources, none of which is authoritative alone:
 *   docs/legacy-erp/reference/kil_erp_full_inventory_v2.csv   — live crawl of kil.gserp.id (what the user sees today)
 *   docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json         — 184 screen contracts (columns/forms/kpis/permissions)
 *   docs/legacy-erp/verification/_fe_be_parity.json           — per-route reconciliation FE ↔ BE
 *
 * Joins them onto our real frontend pages so "is this screen built, and does it call anything"
 * is answered by files on disk rather than by impression. Writes _FE_LEGACY_DELTA.json and
 * prints only aggregates — the per-screen detail stays in the file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/legacy-erp/verification/_FE_LEGACY_DELTA.json');

// ---------------------------------------------------------------- parse CSV
// Line 176 carries 21 fields against 11 headers (a multi-line cell in the crawl), so the
// parser must not fail the whole file on that row.
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const csvRaw = fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/reference/kil_erp_full_inventory_v2.csv'), 'utf8');
const csvRows = parseCsv(csvRaw).filter((r) => r.length > 1);
const header = csvRows.shift().map((h) => h.trim());
const legacy = csvRows.map((r) => {
  const o = {};
  header.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
  return o;
});

// ---------------------------------------------------------------- screen contract
const sc = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json'), 'utf8'));
const screens = sc.screens ?? [];

// ---------------------------------------------------------------- parity
const parity = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/verification/_fe_be_parity.json'), 'utf8'));
const byScreenId = new Map();   // SCR-xxx -> [{route, status, target, note}]
for (const c of Object.values(parity.screen_contract_reconciliation.classified ?? {})) {
  if (!c || !c.screens) continue;
  for (const sid of c.screens) {
    if (!byScreenId.has(sid)) byScreenId.set(sid, []);
    byScreenId.get(sid).push({ route: c.route, status: c.status, target: c.target ?? null, note: c.note ?? null });
  }
}
const liveButUnwired = new Set(
  (parity.screen_contract_reconciliation.never_called_breakdown?.live_but_unwired ?? []).map((e) => e.route),
);

// ---------------------------------------------------------------- our frontend pages
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === 'page.tsx') acc.push(p);
  }
  return acc;
}
// A route's data does not have to live in page.tsx. `/master/personnel` is a 10-line page that
// renders an 876-line PersonnelRegistry sibling — reading only page.tsx called it "no API call"
// and put a working screen on the build list. Scan the whole route directory instead.
function routeSources(pageFile) {
  const out = [pageFile];
  const stack = [path.dirname(pageFile)];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!/^(__tests__|node_modules)$/.test(e.name)) stack.push(p);
      } else if (/\.tsx?$/.test(e.name) && p !== pageFile && !/\.(test|spec)\.tsx?$/.test(e.name)) {
        out.push(p);
      }
    }
  }
  return out;
}
const APP = path.join(ROOT, 'frontend/src/app/(dashboard)');
const pageFiles = fs.existsSync(APP) ? walk(APP) : [];

// Wrapper routes re-export another page (`import MRP from "../kebutuhan/page"`) and hold no call of
// their own, so they read as "no API call" — the false positive that put a working /master/personnel
// on the build list. Cross-directory page imports are followed.
//
// `router.replace` is deliberately NOT treated as a redirect here: /master/suppliers calls it to
// switch tabs, and following that made a 321-line page with 5 real calls absorb 37 calls from
// unrelated pages. Route redirects are handled separately below, and only for a page that is small
// and calls nothing at all.
function delegateTargets(file, src) {
  const out = [];
  const dir = path.dirname(file);
  for (const m of src.matchAll(/(?:from\s*|import\(\s*)['"`](\.[^'"`]+)['"`]/g)) {
    const p = path.resolve(dir, m[1]);
    for (const cand of [p + '.tsx', path.join(p, 'page.tsx'), path.join(p, 'index.tsx')]) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile() && cand !== file) { out.push(cand); break; }
    }
  }
  return out;
}

/** Collect `redirect("/x")` and `router.replace("/x")` targets — only applied to a page that is
 *  small and calls nothing, so a tab-switch inside a real page can never masquerade as a redirect. */
function redirectTargets(src) {
  const out = new Set();
  for (const m of src.matchAll(/(?:redirect|router\.(?:replace|push))\(\s*['"`](\/[^'"`]*)/g)) out.add(m[1].split('?')[0]);
  return [...out];
}

/** Resolve a redirect target like `/master/goods?tab=categories` back to a page.tsx on disk. */
function pageForRoute(to) {
  const rel = to.split('?')[0].replace(/^\//, '');
  const p = path.join(APP, rel, 'page.tsx');
  return fs.existsSync(p) ? p : null;
}

const CALL_RE = /api\.(get|post|put|patch|delete)(?:<[^>]*>)?\(\s*[`'"]([^`'"]+)[`'"]/g;
// Bare `fetch()` is a second calling convention in this codebase, and it writes the version prefix
// itself: fetch("/api/v1/users"). Without this pattern 876 lines of working PersonnelRegistry read
// as an unwired route.
const FETCH_RE = /fetch\(\s*[`'"]([^`'"]+)[`'"]/g;
// Our routes are named in Indonesian (jurnal-umum, bayar-penjualan) while the legacy crawl is
// English (general-journal, sales-payment), so a path comparison alone reports "missing" for
// screens that exist. The rendered heading is language-independent evidence of what a page is.
const HEAD_RE = /<(?:h1|h2|h3|title)[^>]*>\s*([^<>{}]{3,80}?)\s*<\//g;

/** Strip host, `/api` and `/v1` so a fetch() call joins the same set as an api.* call. */
function canonical(method, raw) {
  let p = String(raw)
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/?api\//, '')
    .replace(/^\/?v\d+\//, '');
  if (!p.startsWith('/')) p = '/' + p;
  return `${method} ${p}`;
}

const fePages = pageFiles.map((f) => {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(APP, f).replace(/[\\/]page\.tsx$/, '').replace(/\\/g, '/');
  const calls = new Set();
  const followed = [];
  const seen = new Set();
  let totalLines = 0;
  // depth 0 = this route's own files; depth 1..3 = pages it re-exports.
  let frontier = routeSources(f);
  frontier.forEach((x) => seen.add(x));
  for (let depth = 0; frontier.length && depth < 4; depth++) {
    const next = new Set();
    for (const file of frontier) {
      const body = file === f ? src : fs.readFileSync(file, 'utf8');
      totalLines += body.split('\n').length;
      for (const m of body.matchAll(CALL_RE)) calls.add(canonical(m[1].toUpperCase(), m[2]));
      for (const m of body.matchAll(FETCH_RE)) {
        // fetch() carries no method in the URL; look just past it for `method: "POST"`.
        const tail = body.slice(m.index, m.index + 200);
        const mm = tail.match(/method:\s*['"]([A-Z]+)['"]/);
        calls.add(canonical(mm ? mm[1] : 'GET', m[1]));
      }
      for (const target of delegateTargets(file, body)) {
        if (seen.has(target)) continue;
        seen.add(target);
        followed.push(path.relative(ROOT, target).replace(/\\/g, '/'));
        next.add(target);
      }
    }
    frontier = [...next];
  }
  // A small page that calls nothing and pushes somewhere is a route redirect, not a gap: count the
  // destination's calls so the screen is judged by the page it actually shows.
  const ownLines = src.split('\n').length;
  const redirectTo = (calls.size === 0 && ownLines < 60) ? redirectTargets(src) : [];
  for (const to of redirectTo) {
    const dest = pageForRoute(to);
    if (!dest || seen.has(dest)) continue;
    seen.add(dest);
    followed.push(path.relative(ROOT, dest).replace(/\\/g, '/'));
    for (const df of routeSources(dest)) {
      const body = fs.readFileSync(df, 'utf8');
      for (const m of body.matchAll(CALL_RE)) calls.add(canonical(m[1].toUpperCase(), m[2]));
      for (const m of body.matchAll(FETCH_RE)) {
        const tail = body.slice(m.index, m.index + 200);
        const mm = tail.match(/method:\s*['"]([A-Z]+)['"]/);
        calls.add(canonical(mm ? mm[1] : 'GET', m[1]));
      }
    }
  }
  const headings = new Set();
  for (const m of src.matchAll(HEAD_RE)) {
    const t = m[1].trim();
    if (t && !t.startsWith('{')) headings.add(t);
  }
  return {
    route: '/' + rel,
    file: path.relative(ROOT, f).replace(/\\/g, '/'),
    segment: rel.split('/').pop(),
    lines: src.split('\n').length,
    total_lines: totalLines,
    call_files: seen.size,
    redirect_to: redirectTo,
    delegates: [...new Set(followed)],
    calls: [...calls],
    headings: [...headings].slice(0, 12),
    hasModal: /Modal|Dialog|drawer|Drawer/.test(src),
    hasTable: /<th[\s>]|TableHead/.test(src),
    hasKpi: /KPI|kpi/i.test(src),
    expandedRows: /expandedRow/.test(src),
    deadlines: (src.match(/deadline/gi) ?? []).length,
  };
});

const feBySegment = new Map();
for (const p of fePages) {
  if (!feBySegment.has(p.segment)) feBySegment.set(p.segment, []);
  feBySegment.get(p.segment).push(p);
}

// The rebuild renamed routes: legacy /dashboard-guest-book vs our /executive/dashboard. A
// segment-only match therefore reports "no page" for screens that plainly exist. Tokens make
// renames visible, and the confidence label keeps a guess from reading as a verified hit.
const STOP = new Set(['dashboard', 'd', 'page', 'list', 'detail', 'view', 'master', 'data', 'laporan', 'dan', 'aplikasi']);
function tokens(s) {
  return new Set(
    String(s || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t && !STOP.has(t)),
  );
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
const candidates = fePages.map((p) => ({
  p,
  tokens: new Set([...tokens(p.segment), ...tokens(p.route)]),
  nameTokens: new Set(p.headings.flatMap((h) => [...tokens(h)])),
}));

function matchPages(legacyUrl, menu, page) {
  const s = seg(legacyUrl);
  const exact = s ? (feBySegment.get(s) ?? []) : [];
  if (exact.length) return { pages: exact, confidence: 'EXACT', score: 1 };
  const wantPath = new Set([...tokens(s), ...tokens(menu), ...tokens(page)]);
  const wantName = new Set([...tokens(menu), ...tokens(page)]);
  const scored = candidates
    .map((c) => {
      const pathScore = jaccard(wantPath, c.tokens);
      const nameScore = jaccard(wantName, c.nameTokens);
      return { page: c.p, score: Math.max(pathScore, nameScore), nameScore, pathScore };
    })
    .filter((x) => x.score >= 0.34)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return { pages: [], confidence: 'NONE', score: 0 };
  const top = scored[0];
  const near = scored.filter((x) => x.score >= top.score - 0.02).slice(0, 3);
  return { pages: near.map((x) => x.page), confidence: 'FUZZY', score: Number(top.score.toFixed(2)) };
}

// ---------------------------------------------------------------- join
function normRoute(u) {
  return (u || '')
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/\{[^}]*\}/g, ':p')
    .replace(/:[A-Za-z_]+/g, ':p')
    .replace(/\/+$/, '')
    .replace(/^(?!\/)/, '/');
}
function seg(u) {
  return normRoute(u).split('/').filter(Boolean).pop() ?? '';
}

const scByRoute = new Map();
for (const s of screens) {
  const k = normRoute(s.route);
  if (!scByRoute.has(k)) scByRoute.set(k, []);
  scByRoute.get(k).push(s);
}
const scBySeg = new Map();
for (const s of screens) {
  const k = seg(s.route);
  if (!scBySeg.has(k)) scBySeg.set(k, []);
  scBySeg.get(k).push(s);
}

const rows = legacy.map((l) => {
  const url = normRoute(l.URL);
  const s = seg(l.URL);
  const m = url === '/' ? { pages: [], confidence: 'EXACT', score: 1 } : matchPages(l.URL, l.Menu, l.Page);
  const fe = m.pages;
  const contract = scByRoute.get(url) ?? scBySeg.get(s) ?? [];
  const ds = contract.map((c) => ({
    screen_id: c.screen_id,
    title: c.title,
    module: c.module,
    type: c.type,
    data_source: c.data_source,
    ds_status: c.data_source ? (byScreenId.get(c.screen_id) ?? []).map((x) => x.status) : [],
    ds_unwired: c.data_source ? liveButUnwired.has(normRoute(c.data_source).replace(/^\/?v1\//, '').replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/, '')) : false,
    forms: (c.forms ?? []).map((fo) => ({ name: fo.name, fields: (fo.fields ?? []).map((fi) => fi.name), submit: fo.submit_action ?? null })),
    columns: (c.columns ?? []).map((co) => (typeof co === 'string' ? co : co.name ?? co.key ?? '')),
    kpis: (c.kpis ?? []).map((k) => k.label),
    actions: (c.actions ?? []).map((a) => a.text),
    permissions: c.permissions_required ?? [],
    screen_notes: c.notes ?? null,
  }));
  return {
    area: l.Area, menu: l.Menu, page: l.Page, url, url_raw: l.URL, type: l.Type,
    cards: l.Cards, columns: l['Table Columns'], inputs: l.Inputs,
    view_detail: l['View / Detail'], actions: l.Actions, notes: l.Notes,
    fe: fe.map((p) => ({ route: p.route, file: p.file, lines: p.lines, calls: p.calls, hasModal: p.hasModal, hasTable: p.hasTable, hasKpi: p.hasKpi, deadlines: p.deadlines, expandedRows: p.expandedRows })),
    match_confidence: m.confidence,
    match_score: m.score,
    contract: ds,
  };
});

// ---------------------------------------------------------------- classify
function classify(r) {
  const hasFe = r.fe.length > 0;
  const statuses = new Set(r.contract.flatMap((c) => c.ds_status));
  if (!hasFe) return 'NO_PAGE';
  // A fuzzy hit is a name match, not proof the screen exists. Kept separate so the report can
  // say "needs eyeballing" instead of counting a guess as coverage.
  if (r.match_confidence === 'FUZZY') return 'NAME_DIFFERS';
  if (r.contract.length === 0) return 'PAGE_NO_CONTRACT';
  if (statuses.has('ABSENT')) return 'DS_ABSENT';
  if (statuses.has('RENAMED')) return 'DS_RENAMED';
  if (r.contract.some((c) => c.ds_unwired)) return 'DS_UNWIRED';
  const calls = new Set(r.fe.flatMap((f) => f.calls.map((c) => c.split(' ')[1])));
  const wanted = r.contract.map((c) => (c.data_source ?? '').split(' ').pop());
  if (wanted.some((w) => w && ![...calls].some((c) => c.includes(w.split('/')[0])))) return 'DS_NOT_CALLED_BY_PAGE';
  return 'OK';
}
for (const r of rows) r.verdict = classify(r);

const byVerdict = {};
for (const r of rows) byVerdict[r.verdict] = (byVerdict[r.verdict] ?? 0) + 1;

const inputScreens = rows.filter((r) => r.inputs && r.inputs.trim() !== '' && r.inputs.trim() !== '—');
const formStrings = screens.filter((s) => (s.forms ?? []).length > 0);

const doc = {
  generated_at: new Date().toISOString(),
  sources: {
    legacy_crawl: 'docs/legacy-erp/reference/kil_erp_full_inventory_v2.csv',
    screen_contract: 'docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json',
    fe_be_parity: 'docs/legacy-erp/verification/_fe_be_parity.json',
  },
  totals: {
    legacy_screens: rows.length,
    contract_screens: screens.length,
    frontend_pages: fePages.length,
    verdicts: byVerdict,
    legacy_screens_with_inputs: inputScreens.length,
    contract_screens_with_forms: formStrings.length,
    contract_form_fields_total: formStrings.reduce((a, s) => a + (s.forms ?? []).reduce((b, f) => b + (f.fields ?? []).length, 0), 0),
    frontend_pages_with_modal: fePages.filter((p) => p.hasModal).length,
  },
  parity_counts: parity.counts,
  pages: fePages,
  rows,
};
fs.writeFileSync(OUT, JSON.stringify(doc, null, 1));
console.log('wrote', path.relative(ROOT, OUT), (fs.statSync(OUT).size / 1024).toFixed(0) + 'KB');
console.log('verdicts:', JSON.stringify(byVerdict));
console.log('frontend pages:', fePages.length, '| with modal:', doc.totals.frontend_pages_with_modal);
console.log('legacy rows with Inputs:', inputScreens.length, '| contract screens with forms:', formStrings.length, '| form fields total:', doc.totals.contract_form_fields_total);
