#!/usr/bin/env node
/**
 * Renders the frontend ⇄ legacy parity report from _FE_LEGACY_DELTA.json and _fe_be_parity.json.
 *
 * Generated rather than hand-written on purpose: this report existed once as prose, the numbers in
 * it drifted from the tree, and nobody could tell. Every figure below is read from the two JSON
 * files at build time, so re-running the joiner and this script is the whole update path.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V = path.join(ROOT, 'docs/legacy-erp/verification');
const d = JSON.parse(fs.readFileSync(path.join(V, '_FE_LEGACY_DELTA.json'), 'utf8'));
const parity = JSON.parse(fs.readFileSync(path.join(V, '_fe_be_parity.json'), 'utf8'));
const sc = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json'), 'utf8'));

const titleOf = new Map(sc.screens.map((s) => [s.screen_id, s.title]));
const dc = parity.dead_controllers;
const ncb = parity.screen_contract_reconciliation.never_called_breakdown;
// The raw parity JSON counts a renamed route as "never called" even when the frontend already calls
// the target it was renamed TO. parity-crosscheck.mjs re-checks every bucket against the actual
// frontend call strings and is the only source for the headline figures — see _PARITY_CROSSCHECK.json.
const xc = JSON.parse(fs.readFileSync(path.join(V, '_PARITY_CROSSCHECK.json'), 'utf8'));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (n) => new Intl.NumberFormat('id-ID').format(n);

const pages = d.pages;
const rows = d.rows;
const noCall = pages.filter((p) => p.calls.length === 0);
// A page that redirects somewhere we cannot find on disk is a dead link, not a stub — lumping the
// two together overstates the stub count and hides a broken navigation.
const dangling = noCall.filter((p) => p.redirect_to.length > 0);
const realNoCall = noCall.filter((p) => p.redirect_to.length === 0);
const stubs = realNoCall.filter((p) => p.lines < 80).sort((a, b) => a.lines - b.lines);
const bigNoCall = realNoCall.filter((p) => p.lines >= 80).sort((a, b) => b.lines - a.lines);
const withCalls = pages.length - noCall.length;
const inputRows = rows.filter((r) => r.inputs && r.inputs !== '—');
const createScreens = rows.filter((r) => /\/create$/.test(r.url));
const modalDetail = rows.filter((r) => /modal/i.test(r.view_detail || ''));
const modalPages = pages.filter((p) => p.hasModal);
const legend = {
  EXACT: ['Cocok persis', 'ok', 'Path frontend sama dengan path legacy.'],
  FUZZY: ['Nama mirip', 'warn', 'Tidak ada path yang sama; kandidat ini cocok sebagian oleh nama/heading. BELUM DIVERIFIKASI.'],
  NONE: ['Tidak ketemu', 'dim', 'Tidak ada kandidat di atas ambang. Ini BUKAN bukti layarnya tidak ada — rute kita banyak yang bernama Indonesia dan legacy Inggris.'],
};
const verdictLabel = {
  OK: ['terpasang', 'ok'],
  DS_RENAMED: ['rute berganti nama', 'info'],
  DS_ABSENT: ['rute memang tidak ada', 'bad'],
  DS_UNWIRED: ['rute backend hidup, tidak dipanggil FE', 'warn'],
  DS_NOT_CALLED_BY_PAGE: ['halaman ini tidak memanggil data source-nya', 'bad'],
  NAME_DIFFERS: ['nama layar berbeda', 'warn'],
  NO_PAGE: ['tidak ketemu padanannya', 'dim'],
  PAGE_NO_CONTRACT: ['tidak ada di kontrak', 'dim'],
};

// ---------------------------------------------------------------- fragments
function chips(list) {
  if (!list.length) return '<span class="muted">—</span>';
  return list.map(([label, kind]) => `<span class="chip ${kind}">${esc(label)}</span>`).join(' ');
}

function kpi(label, value, sub, kind = '') {
  return `<div class="kpi ${kind}"><div class="kpi-v">${esc(value)}</div><div class="kpi-l">${esc(label)}</div><div class="kpi-s">${sub}</div></div>`;
}

// The 45 routes that already answer — the cheapest wins in the whole report.
const unwiredRows = ncb.live_but_unwired
  .map((e) => {
    const screens = (e.screens || []).map((s) => `${s}${titleOf.has(s) ? ' · ' + titleOf.get(s) : ''}`).join('<br>');
    return `<tr><td class="mono">${esc(e.route)}</td><td class="sm">${screens || '<span class="muted">—</span>'}</td></tr>`;
  })
  .join('\n');

const absentRows = parity.screen_contract_reconciliation.absent
  .map((e) => {
    const screens = (e.screens || []).map((s) => `${s} · ${titleOf.get(s) ?? '?'}`).join('<br>');
    return `<tr><td class="mono">${esc(e.route)}</td><td class="sm">${screens}</td><td class="sm">${esc(e.note)}</td></tr>`;
  })
  .join('\n');

const renamedRows = parity.screen_contract_reconciliation.renamed
  .map((e) => `<tr><td class="mono">${esc(e.route)}</td><td class="mono ok-t">${esc(e.target)}</td><td class="sm">${(e.screens || []).map((s) => s + ' · ' + (titleOf.get(s) ?? '?')).join('<br>')}</td></tr>`)
  .join('\n');

// ------------------------------------------------ our pages, grouped by module
const pageGroups = {};
for (const p of pages) {
  const top = p.route.split('/').filter(Boolean)[0] ?? '(root)';
  (pageGroups[top] = pageGroups[top] ?? []).push(p);
}
const pageRows = Object.entries(pageGroups)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([mod, list]) => {
    const body = list
      .sort((a, b) => a.route.localeCompare(b.route))
      .map((p) => {
        const dead = p.calls.length === 0;
        // A page whose destination could not be resolved on disk is a redirect to a route that does
        // not exist — a dead link, which is a different defect from a stub. Say which.
        const dangling = dead && p.redirect_to.length > 0;
        const kind = dead ? (dangling ? 'warn' : p.lines < 80 ? 'bad' : 'warn') : 'ok';
        const note = !dead
          ? `${p.calls.length} panggilan`
          : dangling
            ? `dialihkan ke ${p.redirect_to.join(', ')} — tidak ada halamannya`
            : p.lines < 80 ? 'stub — tidak memanggil API apa pun' : 'tidak memanggil API apa pun';
        const cell = dangling
          ? `<span class="muted">→ ${esc(p.redirect_to.join(', '))}</span>`
          : `${p.calls.slice(0, 3).map(esc).join('<br>')}${p.calls.length > 3 ? `<br><span class="muted">+${p.calls.length - 3} lagi</span>` : ''}`;
        return `<tr class="${dead ? 'row-dead' : ''}"><td class="mono">${esc(p.route)}</td><td class="r">${num(p.lines)}</td><td>${p.hasModal ? '<span class="dot on" title="ada modal/dialog"></span>' : '<span class="dot"></span>'}</td><td>${p.hasTable ? '<span class="dot on"></span>' : '<span class="dot"></span>'}</td><td class="r">${p.deadlines}</td><td><span class="chip ${kind}">${esc(note)}</span></td><td class="sm mono">${cell}</td></tr>`;
      })
      .join('\n');
    return `<tr class="mod"><td colspan="7">${esc(mod)} <span class="muted">· ${list.length} halaman</span></td></tr>\n${body}`;
  })
  .join('\n');

// ------------------------------------------------ legacy screens per area
const areaGroups = {};
for (const r of rows) (areaGroups[r.area] = areaGroups[r.area] ?? []).push(r);
const legacySections = Object.entries(areaGroups)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([area, list]) => {
    const body = list
      .map((r) => {
        const [vl, vk] = verdictLabel[r.verdict] ?? [r.verdict, 'dim'];
        const dsBadge = r.contract.length === 0
          ? '<span class="muted">tidak ada di kontrak</span>'
          : r.contract.map((c) => `<div class="mono sm">${esc(c.data_source ?? '—')} ${c.ds_unwired ? '<span class="chip warn">live, tak dipanggil</span>' : ''}</div>`).join('');
        const fe = r.fe.length ? r.fe.map((f) => `<div class="mono sm">${esc(f.route)}</div>`).join('') : '<span class="muted">—</span>';
        const inputs = r.inputs && r.inputs !== '—' ? `<div class="sm">${esc(r.inputs)}</div>` : '<span class="muted">—</span>';
        const createMark = /\/create$/.test(r.url) ? ' <span class="chip info">halaman input</span>' : '';
        return `<tr><td class="mono">${esc(r.url)}${createMark}<div class="sm muted">${esc(r.menu)}</div></td><td>${chips([[vl, vk]])}</td><td>${fe}</td><td>${inputs}</td><td>${dsBadge}</td></tr>`;
      })
      .join('\n');
    return `<details class="area"><summary><span>${esc(area)}</span><span class="muted">${list.length} layar</span></summary>
<table class="t"><thead><tr><th>Layar legacy</th><th>Status</th><th>Padanan di rebuild</th><th>Input (kolom crawl)</th><th>data_source kontrak</th></tr></thead><tbody>${body}</tbody></table></details>`;
  })
  .join('\n');

// ------------------------------------------------ input pages
const inputTable = inputRows
  .map((r) => {
    const modal = r.fe.some((f) => f.hasModal);
    const create = /\/create$/.test(r.url);
    return `<tr><td class="mono">${esc(r.url)}</td><td class="sm">${esc(r.inputs)}</td><td>${create ? '<span class="chip info">halaman</span>' : ''} ${modal ? '<span class="chip ok">modal</span>' : '<span class="muted">—</span>'}</td></tr>`;
  })
  .join('\n');

const stubTable = stubs
  .map((p) => `<tr><td class="mono">${esc(p.route)}</td><td class="r">${num(p.lines)}</td><td class="mono sm">${esc(p.file.replace('frontend/src/app/(dashboard)/', ''))}</td></tr>`)
  .join('\n');

const bigTable = bigNoCall
  .map((p) => `<tr><td class="mono">${esc(p.route)}</td><td class="r">${num(p.lines)}</td></tr>`)
  .join('\n');

const danglingTable = dangling
  .map((p) => `<tr><td class="mono">${esc(p.route)}</td><td class="r">${num(p.lines)}</td><td class="mono sm">${esc(p.redirect_to.join(', '))}</td></tr>`)
  .join('\n');

// ---------------------------------------------------------------- page
const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FE vs Legacy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f4f6fb; --bg2:#e9eef7;
  --panel:rgba(255,255,255,.82); --panel2:rgba(255,255,255,.6);
  --bd:rgba(24,50,90,.14); --bd2:rgba(24,50,90,.24);
  --tx:#0e1a2c; --dim:#4c6079; --faint:#7d8ea6; --body:#26374d;
  --ok:#0f9d63; --warn:#a9701a; --bad:#c9364f; --info:#2f6fd0; --acc:#0e8f80;
  --shadow:0 8px 30px rgba(20,40,80,.10);
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#05080f; --bg2:#080d18;
    --panel:rgba(18,26,42,.72); --panel2:rgba(24,34,54,.55);
    --bd:rgba(122,164,224,.16); --bd2:rgba(122,164,224,.28);
    --tx:#e8eef9; --dim:#8ea4c2; --faint:#5f7391; --body:#cfdcee;
    --ok:#3ddc97; --warn:#f5b955; --bad:#ff6b81; --info:#6aa8ff; --acc:#38e0c8;
    --shadow:0 10px 40px rgba(0,0,0,.45);
  }
}
:root[data-theme="dark"]{
  --bg:#05080f; --bg2:#080d18;
  --panel:rgba(18,26,42,.72); --panel2:rgba(24,34,54,.55);
  --bd:rgba(122,164,224,.16); --bd2:rgba(122,164,224,.28);
  --tx:#e8eef9; --dim:#8ea4c2; --faint:#5f7391; --body:#cfdcee;
  --ok:#3ddc97; --warn:#f5b955; --bad:#ff6b81; --info:#6aa8ff; --acc:#38e0c8;
  --shadow:0 10px 40px rgba(0,0,0,.45);
}
*{box-sizing:border-box}
html,body{max-width:100%;overflow-x:hidden}
body{
  margin:0;padding:0 16px 72px;background:linear-gradient(180deg,var(--bg),var(--bg2) 60%,var(--bg));
  color:var(--tx);font:15px/1.6 Inter,system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.wrap{max-width:1180px;margin:0 auto}
header.top{padding:44px 0 20px;border-bottom:1px solid var(--bd)}
h1{margin:0;font-size:clamp(24px,4.4vw,40px);font-weight:700;letter-spacing:-.02em;line-height:1.1}
h1 span{color:var(--acc)}
.sub{color:var(--dim);margin-top:10px;font-size:15px;max-width:74ch}
.meta{margin-top:14px;font:12px/1.5 'JetBrains Mono',monospace;color:var(--faint);word-break:break-all}
.verdict{
  margin:26px 0 0;padding:18px 20px;border-radius:14px;
  border:1px solid rgba(255,107,129,.35);background:linear-gradient(135deg,rgba(255,107,129,.10),rgba(255,107,129,.03));
}
.verdict b{color:var(--bad);font-size:17px;letter-spacing:.01em}
.verdict p{margin:8px 0 0;color:var(--dim);font-size:14px}
section{margin:52px 0 0;scroll-margin-top:20px}
h2{font-size:clamp(18px,2.6vw,25px);margin:0 0 6px;font-weight:650;letter-spacing:-.01em}
h2 .n{color:var(--acc);font-family:'JetBrains Mono',monospace;font-size:.78em;margin-right:10px}
h3{font-size:16px;margin:30px 0 8px;font-weight:600;color:var(--tx)}
p{margin:10px 0;max-width:80ch;color:var(--body)}
.lead{color:var(--dim)}
a{color:var(--info)}
ul{margin:10px 0;padding-left:20px;max-width:82ch}
li{margin:5px 0;color:var(--dim)}
li b,li strong{color:var(--tx)}
.kpis{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));margin:22px 0 0}
.kpi{padding:16px;border-radius:13px;border:1px solid var(--bd);background:var(--panel);backdrop-filter:blur(10px);box-shadow:var(--shadow)}
.kpi-v{font:700 27px/1 'JetBrains Mono',monospace;letter-spacing:-.02em}
.kpi-l{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--dim);margin-top:9px;font-weight:600}
.kpi-s{font-size:12px;color:var(--faint);margin-top:5px}
.kpi.ok .kpi-v{color:var(--ok)} .kpi.warn .kpi-v{color:var(--warn)} .kpi.bad .kpi-v{color:var(--bad)} .kpi.info .kpi-v{color:var(--info)}
.scroll{overflow-x:auto;border:1px solid var(--bd);border-radius:13px;background:var(--panel);box-shadow:var(--shadow);margin:16px 0}
.scroll.narrow table{min-width:0}
table{border-collapse:collapse;width:100%;min-width:760px}
th,td{padding:9px 12px;text-align:left;border-bottom:1px solid var(--bd);vertical-align:top;font-size:13.5px}
th{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--dim);font-weight:650;position:sticky;top:0;background:var(--bg2);backdrop-filter:blur(8px);white-space:nowrap}
tbody tr:last-child td{border-bottom:0}
tr.mod td{background:var(--panel2);font-weight:650;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--acc)}
tr.row-dead td{background:rgba(255,107,129,.05)}
td.r{text-align:right;font-family:'JetBrains Mono',monospace}
td.sm,.sm{font-size:12.5px}
.mono{font-family:'JetBrains Mono',monospace;font-size:12.5px}
.muted{color:var(--faint)}
.ok-t{color:var(--ok)}
.chip{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;white-space:nowrap;border:1px solid transparent}
.chip.ok{color:var(--ok);background:rgba(61,220,151,.10);border-color:rgba(61,220,151,.28)}
.chip.warn{color:var(--warn);background:rgba(245,185,85,.10);border-color:rgba(245,185,85,.30)}
.chip.bad{color:var(--bad);background:rgba(255,107,129,.10);border-color:rgba(255,107,129,.30)}
.chip.info{color:var(--info);background:rgba(106,168,255,.10);border-color:rgba(106,168,255,.28)}
.chip.dim{color:var(--dim);background:var(--panel2);border-color:var(--bd2)}
.dot{display:inline-block;width:9px;height:9px;border-radius:3px;border:1px solid var(--bd2);background:transparent}
.dot.on{background:var(--acc);border-color:var(--acc)}
details.area{border:1px solid var(--bd);border-radius:13px;background:var(--panel);margin:12px 0;overflow:hidden;box-shadow:var(--shadow)}
details.area>summary{cursor:pointer;padding:13px 16px;display:flex;justify-content:space-between;gap:12px;font-weight:600;font-size:14px;list-style:none}
details.area>summary::-webkit-details-marker{display:none}
details.area>summary::before{content:"▸";color:var(--acc);margin-right:9px;transition:transform .15s}
details.area[open]>summary::before{transform:rotate(90deg)}
details.area>summary>span:first-child{flex:1}
details.area .scroll{border:0;border-top:1px solid var(--bd);border-radius:0;box-shadow:none;margin:0;background:transparent}
details.area table{min-width:900px}
.note{padding:14px 16px;border-radius:12px;border:1px solid var(--bd2);background:var(--panel2);margin:16px 0;font-size:13.5px;color:var(--dim)}
.note b{color:var(--tx)}
.note.warn{border-color:rgba(245,185,85,.34);background:rgba(245,185,85,.06)}
.note.bad{border-color:rgba(255,107,129,.34);background:rgba(255,107,129,.06)}
.legend{display:flex;flex-wrap:wrap;gap:16px;margin:14px 0}
.legend div{font-size:12.5px;color:var(--dim);max-width:34ch}
nav.toc{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0}
nav.toc a{font-size:12.5px;text-decoration:none;color:var(--dim);border:1px solid var(--bd);border-radius:99px;padding:5px 12px;background:var(--panel)}
nav.toc a:hover{color:var(--acc);border-color:var(--bd2)}
code{font-family:'JetBrains Mono',monospace;font-size:12.5px;background:var(--panel2);border:1px solid var(--bd);border-radius:5px;padding:1px 5px}
pre{font-family:'JetBrains Mono',monospace;font-size:12.5px;background:var(--panel);border:1px solid var(--bd);border-radius:11px;padding:14px;overflow-x:auto;color:var(--dim)}
footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--bd);color:var(--faint);font-size:12.5px}
@media (max-width:640px){body{padding:0 16px 56px}.kpis{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<div class="wrap">

<header class="top">
  <h1>Frontend <span>vs</span> Legacy</h1>
  <p class="sub">Rebuild diukur terhadap crawler live <code>kil.gserp.id</code> (${num(rows.length)} layar), kontrak ${num(sc.screens.length)} layar, dan apa yang sebenarnya dilakukan berkas di <code>frontend/src/app</code>. Semua angka di halaman ini dibaca dari dua berkas JSON saat halaman ini dibuat — bukan diketik tangan.</p>
  <div class="meta">digenerate ${esc(d.generated_at)} · sources: ${esc(d.sources.legacy_crawl)}, ${esc(d.sources.screen_contract)}, ${esc(d.sources.fe_be_parity)}</div>
  <div class="verdict">
    <b>BELUM SIAP KIRIM — frontend belum menyambung ke backend, dan itu bisa dihitung.</b>
    <p>Arah FE→BE <b>bersih dan terverifikasi</b>: ${num(parity.counts.fe_calls_unmatched)} panggilan frontend tanpa rute, ${num(parity.counts.fe_method_mismatch)} method mismatch, ${num(dc.reachable_modules)}/${num(dc.total_modules)} modul backend terjangkau. Yang bocor arah sebaliknya — dan ini angka hasil pemeriksaan ulang, bukan angka mentah: <b>${num(xc.corrected.really_unwired)} rute layar legacy yang belum tersambung</b> (batas atas), ${num(xc.corrected.backend_missing)} rute kontrak yang backendnya memang belum ada, dan ${num(noCall.length)} halaman yang tidak memanggil API apa pun.</p>
  </div>
  <nav class="toc">
    <a href="#cara">Cara membaca</a><a href="#angka">Angka</a><a href="#unwired">Rute hidup tak dipanggil</a>
    <a href="#rename">Bukan 76 fitur hilang</a><a href="#stub">Halaman kosong</a><a href="#halaman">Inventaris halaman</a><a href="#input">Halaman input</a>
    <a href="#checklist">Checklist Tracking</a><a href="#matriks">Matriks per layar</a><a href="#batas">Batas pengukuran</a>
  </nav>
</header>

<section id="cara">
  <h2><span class="n">01</span>Cara membaca laporan ini</h2>
  <p class="lead">Dua kolom diukur dengan cara yang berbeda dan tidak boleh dicampur.</p>
  <ul>
    <li><b>Kolom data source (kanan) itu pasti.</b> Ia hasil membandingkan string rute di Swagger backend dengan string rute di kontrak layar. Tidak ada tebakan.</li>
    <li><b>Kolom "padanan di rebuild" itu tebakan yang dilabeli.</b> Rute kami banyak yang bernama Indonesia (<code>/finance/jurnal-umum</code>) sementara crawl legacy berbahasa Inggris (<code>/general-journal</code>). Pencocokan lintas bahasa mustahil pasti.</li>
    <li><b>"Tidak ketemu" ≠ "tidak dibangun".</b> Itu artinya pencocokan otomatis gagal, dan seseorang perlu melihat layarnya.</li>
  </ul>
  <div class="legend">
    ${Object.entries(legend).map(([, [l, k, why]]) => `<div><span class="chip ${k}">${esc(l)}</span><br>${esc(why)}</div>`).join('\n    ')}
  </div>
</section>

<section id="angka">
  <h2><span class="n">02</span>Angka yang tidak bisa dibantah</h2>
  <div class="kpis">
    ${kpi('rute backend hidup, tak dipanggil FE', num(xc.unwired.total), `hasil pemeriksaan ulang: ${num(xc.unwired.missed)} benar-benar tak dipanggil`, 'warn')}
    ${kpi('rute yang perlu disambung frontend', num(xc.corrected.really_unwired), 'angka mentah 121 melebihkan 30 — lihat catatan di bawah', 'bad')}
    ${kpi('halaman tanpa panggilan API', num(noCall.length), `dari ${num(pages.length)} halaman — ${num(stubs.length)} di antaranya stub di bawah 80 baris`, 'bad')}
    ${kpi('rute kontrak yang benar-benar tidak ada', num(xc.corrected.backend_missing), `bukan ${num(parity.counts.screen_ops_unmatched)} — lihat bagian 04`, 'info')}
    ${kpi('panggilan FE tanpa rute backend', num(parity.counts.fe_calls_unmatched), 'arah ini bersih', 'ok')}
    ${kpi('modul backend terjangkau', `${num(dc.reachable_modules)}/${num(dc.total_modules)}`, 'setiap modul backend dipanggil minimal sekali', 'ok')}
    ${kpi('halaman yang benar-benar memanggil API', num(withCalls), `dari ${num(pages.length)}`, 'ok')}
  </div>
  <div class="note">Angka ${num(parity.counts.screen_ops_unmatched)} "screen_ops_unmatched" yang sering dikutip adalah gabungan, bukan ${num(parity.counts.screen_ops_unmatched)} fitur hilang: ${num(parity.counts.screen_ops_renamed)} rute berganti nama, ${num(parity.counts.screen_ops_absent)} memang tidak ada, ${num(parity.counts.screen_ops_out_of_scope)} di luar cakupan. Menyebutnya "${num(parity.counts.screen_ops_unmatched)} fitur hilang" akan salah.</div>
  <div class="note bad"><b>Koreksi terhadap angka ${num(parity.counts.screen_ops_never_called)}.</b> Angka mentah <code>screen_ops_never_called</code> = ${num(parity.counts.screen_ops_never_called)} menghitung rute hasil <i>rename</i> sebagai "tidak pernah dipanggil" — padahal rute yang berganti nama tidak mungkin dipanggil dengan nama lamanya, dan ${num(xc.renamed.target_called)} dari ${num(xc.renamed.total)} sudah dipanggil di nama barunya. Dari ${num(xc.unwired.total)} rute <code>live_but_unwired</code>, ${num(xc.unwired.exact + xc.unwired.suffix)} juga terbukti sudah dipanggil. Total kelebihan: <b>${num(xc.corrected.overstated_by)}</b>. Angka ${num(parity.counts.screen_ops_never_called)} tidak boleh lagi dikutip; yang dipakai di laporan ini adalah <b>${num(xc.corrected.really_unwired)}</b>, dan itu pun batas atas (lihat bagian 10).</div>
</section>

<section id="unwired">
  <h2><span class="n">03</span>${num(ncb.live_but_unwired.length)} rute sudah hidup — ${num(xc.unwired.missed)} di antaranya kandidat yang belum tersambung</h2>
  <p class="lead">Ini daftar kerja termurah di seluruh laporan. Backend sudah menjawab; yang belum ada hanya halaman yang memanggilnya. Termasuk seluruh <code>GET dashboards/*</code> (14 dashboard departemen), laporan keuangan (trial balance, laba rugi, general ledger, arus kas, AP aging, budget vs actual), dan rincian transaksi yang halaman daftarnya sudah ada.</p>
  <div class="note warn"><b>Daftar ini batas atas, bukan bukti kerusakan.</b> Pemeriksaan ulang menemukan ${num(xc.unwired.exact + xc.unwired.suffix)} dari ${num(xc.unwired.total)} rute di bawah <i>sudah</i> dipanggil frontend (parity JSON menyimpan path Swagger <code>suppliers</code> sementara halaman memanggil <code>/master/suppliers</code>). Sisa ${num(xc.unwired.missed)} juga belum pasti: deteksi hanya melihat literal <code>api.get(...)</code>, sehingga halaman yang memanggil lewat hook (<code>useErpFlow</code>, <code>useGranularData</code>) terbaca seolah tidak memanggil apa pun. Sebelum mengerjakan satu baris di daftar ini, cek halamannya dulu.</div>
  <div class="scroll"><table><thead><tr><th>Rute backend (hidup)</th><th>Layar kontrak yang menunggunya</th></tr></thead><tbody>
${unwiredRows}
  </tbody></table></div>
</section>

<section id="rename">
  <h2><span class="n">04</span>"76 rute tanpa backend" bukan 76 fitur hilang</h2>
  <p>Angka ${num(parity.violations.screen_data_source_with_no_backend_route.length)} itu jumlah rute kontrak yang tidak ketemu persis di backend. Dipecah, isinya:</p>
  <div class="kpis">
    ${kpi('berganti nama', num(parity.screen_contract_reconciliation.renamed.length), 'rutenya ada, namanya beda', 'ok')}
    ${kpi('benar-benar tidak ada', num(parity.screen_contract_reconciliation.absent.length), 'masing-masing ada alasannya', 'bad')}
    ${kpi('di luar cakupan', num(parity.screen_contract_reconciliation.out_of_scope.length), '', 'dim')}
  </div>
  <h3>Sudah berganti nama (${num(parity.screen_contract_reconciliation.renamed.length)})</h3>
  <div class="scroll"><table><thead><tr><th>Rute di kontrak</th><th>Rute hidup di rebuild</th><th>Layar</th></tr></thead><tbody>
${renamedRows}
  </tbody></table></div>
  <h3>Benar-benar tidak ada (${num(parity.screen_contract_reconciliation.absent.length)})</h3>
  <p class="lead">Setiap baris punya alasan tertulis. Yang perlu kamu putuskan cuma apakah alasannya kamu terima.</p>
  <div class="scroll"><table><thead><tr><th>Rute</th><th>Layar</th><th>Alasan</th></tr></thead><tbody>
${absentRows}
  </tbody></table></div>
</section>

<section id="stub">
  <h2><span class="n">05</span>${num(stubs.length)} halaman kosong + ${num(bigNoCall.length)} halaman besar tanpa data + ${num(dangling.length)} navigasi mati</h2>
  <p>Dihitung dari berkasnya: halaman yang tidak memuat satu pun panggilan <code>api.get/post/put/patch/delete</code> maupun <code>fetch("/api/v1/...")</code>, termasuk berkas komponen di dalam folder rutenya dan halaman yang di-<em>re-export</em>. Ini bukan soal tampilan kurang mirip — layarnya tidak mengambil data sama sekali.</p>
  <h3>Stub di bawah 80 baris (${num(stubs.length)})</h3>
  <p class="lead">Hampir seluruh modul <code>/marketing</code> ada di sini: ${num(pageGroups.marketing ? pageGroups.marketing.filter((p) => p.calls.length === 0 && p.lines < 80 && p.redirect_to.length === 0).length : 0)} dari ${num(pageGroups.marketing?.length ?? 0)} halamannya adalah placeholder 4–61 baris.</p>
  <div class="scroll narrow"><table><thead><tr><th>Halaman</th><th class="r">Baris</th><th>Berkas</th></tr></thead><tbody>
${stubTable}
  </tbody></table></div>
  <h3>Besar tapi tidak mengambil data (${num(bigNoCall.length)})</h3>
  <div class="scroll narrow"><table><thead><tr><th>Halaman</th><th class="r">Baris</th></tr></thead><tbody>
${bigTable}
  </tbody></table></div>
  <h3>Dialihkan ke rute yang halamannya tidak ada (${num(dangling.length)})</h3>
  <p class="lead">Halaman ini <code>router.replace</code>/<code>redirect</code> ke sebuah rute, dan berkas <code>page.tsx</code> untuk rute tujuan itu tidak ditemukan. Navigasinya mati, bukan sekadar tidak memuat data.</p>
  <div class="scroll narrow"><table><thead><tr><th>Halaman</th><th class="r">Baris</th><th>Tujuan</th></tr></thead><tbody>
${danglingTable}
  </tbody></table></div>
  <div class="note warn"><b>Perlu diperiksa manual.</b> Sebagian halaman besar ini mungkin memakai hook bersama (<code>useErpFlow</code>, <code>useApiQuery</code>, <code>useGranularData</code>) yang berkasnya berada di luar folder rutenya, sehingga pembaca berkas ini tidak melihatnya. <code>/penjualan/sales-target</code> (554 baris) dan <code>/settings/templates</code> (206 baris) masuk kategori ini dan <b>harus dicek sebelum diklaim rusak</b>.</div>
</section>

<section id="halaman">
  <h2><span class="n">06</span>Inventaris halaman kita (${num(pages.length)})</h2>
  <p class="lead">Apa yang benar-benar ada di <code>frontend/src/app/(dashboard)</code>, dibaca dari berkasnya. Baris merah = halaman tidak memanggil API apa pun. Kolom modal/table menunjukkan apakah halaman punya dialog dan <code>&lt;th&gt;</code>; kolom <code>dl</code> menghitung kemunculan kata "deadline".</p>
  <div class="scroll"><table><thead><tr><th>Halaman</th><th class="r">Baris</th><th title="modal/dialog">Modal</th><th title="tabel">&lt;th&gt;</th><th class="r" title="kemunculan kata deadline">dl</th><th>Status</th><th>Panggilan API</th></tr></thead><tbody>
${pageRows}
  </tbody></table></div>
</section>

<section id="input">
  <h2><span class="n">07</span>Halaman input — bentuk window floating</h2>
  <p>Legacy punya dua pola input yang jelas dari crawl:</p>
  <ul>
    <li><b>Halaman <code>/create</code> tersendiri</b> — ${num(createScreens.length)} layar di crawl memakai <code>/xxx/create</code> sebagai halaman penuh (mis. <code>/sales/create</code>, <code>/checklist/create</code>, <code>/goods-manage/create</code>), bukan modal.</li>
    <li><b>Detail berupa modal AJAX</b> — ${num(modalDetail.length)} layar memakai pola <code>Modal Detail via AJAX (ajaxDetail('4289','modal-lg'))</code>. Ini window floating legacy: satu baris tabel diklik, jendela detail menumpuk di atas halaman.</li>
  </ul>
  <p>Sisi kita: <b>${num(modalPages.length)} dari ${num(pages.length)} halaman</b> memuat modal/dialog — jadi polanya <i>ada</i>, tetapi dipakai untuk <b>form input</b>, bukan untuk detail. Di legacy, <code>/create</code> adalah halaman penuh dan modalnya untuk <i>melihat</i>; di kita, modalnya untuk <i>mengisi</i>.</p>
  <div class="note"><b>Kolom "Kontrol"</b> di bawah adalah kolom <code>Inputs</code> hasil crawl legacy, apa adanya. Baris dengan <span class="chip info">halaman</span> artinya legacy memakai halaman <code>/create</code> penuh untuk itu; <span class="chip ok">modal</span> artinya halaman kita yang cocok memiliki modal. Kolom ini adalah daftar field yang harus ada di form — dipakai sebagai checklist UAT form.</div>
  <div class="scroll"><table><thead><tr><th>Layar legacy</th><th>Kontrol input (crawl)</th><th>Bentuk di kita</th></tr></thead><tbody>
${inputTable}
  </tbody></table></div>
</section>

<section id="checklist">
  <h2><span class="n">08</span>Checklist Tracking — dibahas terpisah, dicatat di sini</h2>
  <p class="lead">Ini belum dikerjakan. Bagian ini mencatat temuan supaya tidak hilang, bukan mengusulkan solusi final.</p>
  <table class="t"><thead><tr><th>Sumber</th><th>Yang dikatakan</th></tr></thead><tbody>
    <tr><td>Crawl live <code>kil.gserp.id</code> — <code>/checklist-tracking</code></td><td>Kartu: Total Project Maklon, On Track, Menunggu Approval, Tertunda. Kolom: #, Pelanggan, Brand/Produk, Sales Order, BusDev, Mulai, Berakhir, <b>Deadline SO</b>, <b>Deadline per PIC</b>, <b>Estimasi Deadline</b>, Progress, <b>Status Projek</b>, <b>Matriks Milestone</b> (Desain Logo, HKI, BPOM NA, MoU, Desain Kemas, Bahan Baku, Pelunasan, Mixing, Bahan Kemas, Filling, Label, Box, Packing, Delivery), Foto Kemasan. Aksi: Lihat Timeline, Halal Uji Lab, Riwayat Status, Upload Foto Kemasan.</td></tr>
    <tr><td>Kontrak <code>SCR-121</code></td><td>"Per-user completion matrix. Tracking detail shows item-level timestamps." — <b>berbeda bentuk</b> dari crawl di atas.</td></tr>
    <tr><td><code>/quality/checklist-tracking</code> (${num(pageGroups.quality?.find((p) => p.route === '/quality/checklist-tracking')?.lines ?? 0)} baris)</td><td>Hanya <code>GET /qc/checklists/completed</code>. KPI: Total Checklist Selesai, Terverifikasi Penuh, Rata-rata Pass Rate, PIC &amp; Analis Aktif. Kolom: Kode QC, Judul Audit Checklist, Kategori, Tanggal, PIC Analis, Verifikator, Pass Rate, Status. <b>Layar audit QC</b>, bukan project maklon. Kata <code>deadline</code> muncul 0 kali.</td></tr>
    <tr><td><code>/samples/project-control/checklist-tracking</code> (${num(pageGroups.samples?.find((p) => p.route === '/samples/project-control/checklist-tracking')?.lines ?? 0)} baris)</td><td>Membaca <code>/rnd/samples</code>. Mempunyai <code>expandedRowIds</code> (panah ke bawah) — <b>inilah layar yang kamu maksud</b>.</td></tr>
    <tr><td>Model <code>QCChecklist.items</code></td><td>Array JSON tak bertipe: <code>{ id, label, isRequired, checked }</code>. Tidak ada PIC, lama hari, deadline, status per butir, timestamp selesai, urutan, maupun dependency. Matriks milestone legacy <b>tidak bisa dirender</b> dari bentuk ini.</td></tr>
    <tr><td><code>CHECKLIST_CATEGORIES</code></td><td>Konstanta hardcode 9 entri di <code>qc-checklists.service.ts</code> (Box, Label, Desain, Formula, BPOM, Mixing, Filling, Packing, Delivery). Legacy <code>/checklist-category</code> butuh Urutan + Lama Hari (default dan per kategori penjualan) + Setelah Kategori, dan <code>/checklist/create</code> memuat 18 milestone. Himpunannya pun berbeda.</td></tr>
  </tbody></table>
  <div class="note bad"><b>Konflik referensi yang harus kamu putuskan.</b> Crawl live dan <code>06_SCREEN_CONTRACT.json</code> SCR-121 mendeskripsikan layar yang berbeda (matriks milestone per Sales Order vs matriks penyelesaian per pengguna). Memilih yang salah berarti membangun ulang dengan meleset lagi.</div>
</section>

<section id="matriks">
  <h2><span class="n">09</span>Matriks lengkap per layar legacy (${num(rows.length)})</h2>
  <p class="lead">Dikelompokkan per Area. Klik untuk membuka. Kolom input berisi daftar field crawl; kolom paling kanan berisi data source kontrak beserta status keterhubungannya.</p>
${legacySections}
</section>

<section id="batas">
  <h2><span class="n">10</span>Batas pengukuran — apa yang laporan ini TIDAK tahu</h2>
  <ul>
    <li><b>Pencocokan layar lintas bahasa tidak diverifikasi.</b> ${num(rows.filter((r) => r.match_confidence === 'FUZZY').length)} layar berstatus "nama mirip" dan ${
      num(rows.filter((r) => r.match_confidence === 'NONE').length)
    } berstatus "tidak ketemu". Keduanya perlu dilihat manusia sebelum dipakai sebagai bukti.</li>
    <li><b>Hook internal tidak dilacak.</b> Halaman yang memanggil API lewat hook (bukan <code>api.*</code> langsung) dihitung sebagai "tanpa panggilan". Lihat peringatan di bagian 05.</li>
    <li><b>Tidak ada satu pun gerbang runtime di sini.</b> Tidak ada build, tidak ada <code>scripts/test-deploy.sh</code>, tidak ada smoke test live, tidak ada rollback teruji. Menurut CLAUDE.md itu berarti verdict tetap <b>BELUM SIAP KIRIM</b> apa pun isi halaman ini.</li>
    <li><b>Data source kontrak ≠ tampilan.</b> Backend punya rutenya tidak berarti kolom, filter, dan aksi legacy sudah ada. Itu hanya menjawab "datanya tersedia".</li>
  </ul>
  <h3>Cara membangun ulang laporan ini</h3>
  <pre>node scripts/legacy-fe-delta.mjs          # join tiga sumber -> _FE_LEGACY_DELTA.json
node scripts/parity-crosscheck.mjs       # periksa ulang bucket "tak dipanggil" -> _PARITY_CROSSCHECK.json
node scripts/build-fe-legacy-report.mjs  # render halaman ini dari kedua JSON itu</pre>
  <p class="lead">Setelah ada perubahan frontend atau backend, jalankan tiga perintah itu lagi. Angka di halaman ini ikut berubah; tidak ada yang perlu diedit tangan.</p>
</section>

<footer>
  Sumber: <code>${esc(d.sources.legacy_crawl)}</code> (${num(rows.length)} layar) · <code>${esc(d.sources.screen_contract)}</code> (${num(sc.screens.length)} layar) · <code>${esc(d.sources.fe_be_parity)}</code> (dibuat ${esc(parity.generated_at)}) · ${num(pages.length)} halaman frontend dari <code>frontend/src/app/(dashboard)</code>.
</footer>
</div>
</body>
</html>`;

const dest = path.join(V, 'FE-LEGACY-PARITY.html');
fs.writeFileSync(dest, html);
console.log('wrote', path.relative(ROOT, dest), (fs.statSync(dest).size / 1024).toFixed(0) + 'KB');
