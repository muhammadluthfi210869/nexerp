#!/usr/bin/env node
/**
 * run-audit.mjs — Node-based audit runner
 * Scans page.tsx files, compares with SCR spec catalog, emits markdown.
 *
 * Usage:
 *   node scripts/audit/run-audit.mjs <module>            # e.g. "master"
 *   node scripts/audit/run-audit.mjs all                 # audit everything
 *   node scripts/audit/run-audit.mjs single <page> <scr> # audit one page
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, 'docs/legacy-erp/NEX_ERP_SCREEN_AND_API_CATALOG.json');
const PAGES_ROOT = path.join(ROOT, 'frontend/src/app/(dashboard)');
const AUDIT_OUT = path.join(ROOT, 'docs/audit/frontend-pages');

function loadCatalog() {
  const data = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  return data.screens || [];
}

function walkPageFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkPageFiles(full, results);
    else if (e.name === 'page.tsx') results.push(full);
  }
  return results;
}

function findScreenForPage(pageFile, screens) {
  const content = fs.readFileSync(pageFile, 'utf8');
  const specMatch = content.match(/SPEC:\s*(SCR-\d+)/);
  if (specMatch) {
    const found = screens.find(s => s.screenId === specMatch[1]);
    if (found) return { scr: specMatch[1], screen: found, method: 'spec-comment' };
  }
  const rel = pageFile.split('(dashboard)').pop();
  const routeFromFile = '/' + rel
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/page\.tsx$/, '');
  const found = screens.find(s => s.nexerpRoute && routeMatches(s.nexerpRoute, routeFromFile));
  if (found) return { scr: found.screenId, screen: found, method: 'route-match' };
  const suffix = path.basename(path.dirname(pageFile));
  const foundSuffix = screens.find(s =>
    s.nexerpRoute && (s.nexerpRoute.endsWith('/' + suffix) || s.nexerpRoute === '/' + suffix)
  );
  if (foundSuffix) return { scr: foundSuffix.screenId, screen: foundSuffix, method: 'route-suffix' };
  // Suffix-stem match (e.g. "goods" matches "/master/goods-manage")
  const stemMatch = screens.find(s => {
    if (!s.nexerpRoute) return false;
    const segs = s.nexerpRoute.split('/').filter(Boolean);
    return segs.some(seg => seg.toLowerCase().includes(suffix.toLowerCase()) || suffix.toLowerCase().includes(seg.toLowerCase()));
  });
  if (stemMatch) return { scr: stemMatch.screenId, screen: stemMatch, method: 'stem-match' };
  return { scr: null, screen: null, method: 'orphan' };
}

function routeMatches(specRoute, fileRoute) {
  const norm = r => r.toLowerCase().replace(/[^a-z0-9/-]/g, '');
  return norm(specRoute) === norm(fileRoute);
}

function scanPage(pageFile) {
  const content = fs.readFileSync(pageFile, 'utf8');
  const lines = content.split('\n');
  const totalLines = lines.length;
  const totalBytes = content.length;

  const uiBarrel = (content.match(/from\s+["']@\/components\/ui\/[a-z-]+["']/g) || []).length;
  const dnaBarrel = (content.match(/from\s+["']@\/components\/dna(\/[a-z-]+)?["']/g) || []).length;

  const mockArrays = [];
  lines.forEach((line, i) => {
    const m = line.match(/^(?:const|let|var)\s+(MOCK_|INITIAL_|STATIC_|SAMPLE_|DEFAULT_|SEED_)([A-Z0-9_]*)\s*[:=]/);
    if (m) mockArrays.push({ name: m[1] + m[2], line: i + 1 });
  });

  const dnaUsage = [...new Set(content.match(/\bDna[A-Z][a-zA-Z]*/g) || [])];

  const rpPrefix = (content.match(/Rp\s/g) || []).length;
  const locale = (content.match(/toLocaleString\(/g) || []).length;
  const hexColor = (content.match(/#[0-9a-fA-F]{6}/g) || []).length;

  const inputCount = (content.match(/<input\b/g) || []).length;
  const selectCount = (content.match(/<select\b/g) || []).length;
  const textareaCount = (content.match(/<textarea\b/g) || []).length;
  const tableCount = (content.match(/<table\b/g) || []).length;
  const dateInput = (content.match(/type=["']date["']/g) || []).length;

  const reactQuery = (content.match(/use(Query|Mutation)/g) || []).length;

  const dir = path.dirname(pageFile);
  const hasPrint = fs.existsSync(path.join(dir, '[id]/print/page.tsx')) ||
                   fs.existsSync(path.join(dir, 'print/page.tsx'));
  const hasDetail = fs.existsSync(path.join(dir, '[id]/page.tsx'));
  const hasUpdate = fs.existsSync(path.join(dir, '[id]/update/page.tsx')) ||
                    fs.existsSync(path.join(dir, '[id]/edit/page.tsx'));
  const hasCreate = fs.existsSync(path.join(dir, 'create/page.tsx'));

  const specMatch = content.match(/SPEC:\s*(SCR-\d+)/);
  const specRef = specMatch ? specMatch[1] : '';

  const rel = pageFile.split('(dashboard)').pop();
  let route = '/' + rel.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/page\.tsx$/, '');
  if (route === '/' || route === '') route = '/dashboard';

  return {
    path: pageFile,
    route,
    totalLines,
    totalBytes,
    specRef,
    imports_ui_barrel_count: uiBarrel,
    imports_dna_barrel_count: dnaBarrel,
    dna_components: dnaUsage.join(','),
    dna_component_count: dnaUsage.length,
    mock_arrays: mockArrays,
    mock_array_count: mockArrays.length,
    raw_inputs: {
      input: inputCount,
      select: selectCount,
      textarea: textareaCount,
      table: tableCount,
      date_input: dateInput
    },
    hardcoded_values: { rp_prefix: rpPrefix, toLocaleString: locale, hex_color: hexColor },
    has_print_route: hasPrint,
    has_detail_route: hasDetail,
    has_update_route: hasUpdate,
    has_create_route: hasCreate,
    react_query_hooks: reactQuery,
    content
  };
}

/**
 * presentInContent — multi-strategy spec-field matching
 * Tries several heuristics before declaring a field missing.
 */
function presentInContent(specField, content) {
  if (!specField) return false;
  const lower = content.toLowerCase();
  const norm = specField.toLowerCase();

  // Strategy 1: full normalized substring
  const normClean = norm.replace(/[^a-z0-9]/g, '');
  if (normClean.length >= 4 && lower.includes(normClean)) return true;

  // Strategy 2: any 4+ char token from spec appears in content
  const tokens4 = norm.match(/[a-z0-9]{4,}/g) || [];
  for (const t of tokens4) {
    if (lower.includes(t)) return true;
  }

  // Strategy 3: any 3+ char token (lenient fallback)
  const tokens3 = norm.match(/[a-z0-9]{3,}/g) || [];
  let hits = 0;
  for (const t of tokens3) {
    if (lower.includes(t)) hits++;
  }
  if (tokens3.length > 0 && hits >= Math.min(2, tokens3.length)) return true;

  return false;
}

function auditPage(pageFile, screens) {
  const scan = scanPage(pageFile);
  const match = findScreenForPage(pageFile, screens);
  const screen = match.screen;

  const result = {
    page: pageFile,
    route: scan.route,
    module: match.method,
    spec_ref: scan.specRef,
    scr_id: match.scr,
    has_spec: !!screen,
    spec: screen ? {
      screenId: screen.screenId,
      area: screen.area,
      page: screen.page,
      nexerpRoute: screen.nexerpRoute,
      moduleId: screen.moduleId,
      moduleName: screen.moduleName,
      type: screen.type,
      cards: screen.cards || [],
      tableColumns: screen.tableColumns || [],
      formInputs: screen.formInputs || [],
      actions: screen.actions || [],
      viewDetailModal: screen.viewDetailModal || null
    } : null,
    scan
  };

  if (screen) {
    const c = scan.content;
    const s = screen;
    result.conformance = {
      tableColumns: presentList(s.tableColumns || [], c),
      formInputs: presentList(s.formInputs || [], c),
      cards: presentList(s.cards || [], c),
      actions: presentList(s.actions || [], c),
      detail_modal: {
        spec: s.viewDetailModal,
        has_detail_route: scan.has_detail_route,
        has_modal_inline: /DnaModal|<Modal\b/i.test(c),
        present: scan.has_detail_route || /DnaModal/i.test(c)
      },
      edit_route: scan.has_update_route,
      print_route: scan.has_print_route,
      delete_flow: {
        confirmation: /DnaConfirmDialog|window\.confirm|confirm\(/i.test(c),
        delete_handler: /delete/i.test(c),
        audit_log: /audit|log/i.test(c)
      }
    };
  }

  return result;
}

function presentList(specFields, content) {
  let present = 0, missing = 0;
  const rows = [];
  for (const f of specFields) {
    const isPresent = presentInContent(f, content);
    if (isPresent) present++; else missing++;
    rows.push({ field: f, present: isPresent });
  }
  return { present, missing, total: specFields.length, rows };
}

function renderMarkdown(result) {
  const r = result;
  const scan = r.scan;
  const spec = r.spec;
  const c = r.conformance || {};
  const lines = [];

  lines.push(`# Page Audit — ${r.scr_id || 'ORPHAN'}`);
  lines.push('');
  lines.push(`- **Path**: \`${r.page}\``);
  lines.push(`- **Route**: \`${r.route}\``);
  if (spec) {
    lines.push(`- **Spec Route**: \`${spec.nexerpRoute || '-'}\``);
    lines.push(`- **Module**: ${spec.moduleName || '-'} (${spec.moduleId || '-'})`);
  } else {
    lines.push(`- **Spec**: ❌ ORPHAN — no SCR mapping (${r.module})`);
  }
  lines.push(`- **Match Method**: ${r.module}`);
  lines.push(`- **Total Lines**: ${scan.totalLines}`);
  lines.push(`- **DNA Components**: ${scan.dna_component_count}`);
  lines.push(`- **Raw UI Barrel Imports**: ${scan.imports_ui_barrel_count} (target: 0)`);
  lines.push(`- **Mock Arrays**: ${scan.mock_array_count} ${scan.mock_arrays.length ? '(' + scan.mock_arrays.map(m => m.name).join(', ') + ')' : ''}`);
  lines.push(`- **React Query Hooks**: ${scan.react_query_hooks}`);
  lines.push(`- **Hardcoded \`Rp\`**: ${scan.hardcoded_values.rp_prefix}`);
  lines.push(`- **Hardcoded \`toLocaleString\`**: ${scan.hardcoded_values.toLocaleString}`);
  lines.push('');

  if (!spec) {
    lines.push('## Orphan Page — No Spec Mapping');
    lines.push('');
    lines.push('This page does not map to any SCR in `NEX_ERP_SCREEN_AND_API_CATALOG.json`. Mark as **non-spec page** or backfill mapping.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('## 1. Table Columns');
  if (c.tableColumns && c.tableColumns.total > 0) {
    lines.push('| # | Spec Column | FE Present | Status |');
    lines.push('|---|---|---|---|');
    c.tableColumns.rows.forEach((row, i) => {
      lines.push(`| ${i + 1} | ${row.field} | ${row.present ? 'yes' : '-'} | ${row.present ? '✅' : '❌ missing'} |`);
    });
    lines.push('');
    lines.push(`**Score**: ${c.tableColumns.present}/${c.tableColumns.total} (${Math.round(c.tableColumns.present / c.tableColumns.total * 100)}%)`);
    lines.push('');
  } else {
    lines.push('_No table columns specified_');
    lines.push('');
  }

  lines.push('## 2. Form Inputs');
  if (c.formInputs && c.formInputs.total > 0) {
    lines.push('| # | Spec Field | FE Present | Status |');
    lines.push('|---|---|---|---|');
    c.formInputs.rows.forEach((row, i) => {
      lines.push(`| ${i + 1} | ${row.field} | ${row.present ? 'yes' : '-'} | ${row.present ? '✅' : '❌ missing'} |`);
    });
    lines.push('');
    lines.push(`**Score**: ${c.formInputs.present}/${c.formInputs.total} (${Math.round(c.formInputs.present / c.formInputs.total * 100)}%)`);
    lines.push('');
  } else {
    lines.push('_No form inputs specified_');
    lines.push('');
  }

  lines.push('## 3. Card Output');
  if (c.cards && c.cards.total > 0) {
    lines.push('| # | Spec Card | FE Present | Status |');
    lines.push('|---|---|---|---|');
    c.cards.rows.forEach((row, i) => {
      lines.push(`| ${i + 1} | ${row.field} | ${row.present ? 'yes' : '-'} | ${row.present ? '✅' : '❌ missing'} |`);
    });
    lines.push('');
    lines.push(`**Score**: ${c.cards.present}/${c.cards.total} (${Math.round(c.cards.present / c.cards.total * 100)}%)`);
    lines.push('');
  } else {
    lines.push('_No metric cards specified_');
    lines.push('');
  }

  lines.push('## 4. Actions');
  if (c.actions && c.actions.total > 0) {
    lines.push('| # | Spec Action | FE Present | Status |');
    lines.push('|---|---|---|---|');
    c.actions.rows.forEach((row, i) => {
      lines.push(`| ${i + 1} | ${row.field} | ${row.present ? 'yes' : '-'} | ${row.present ? '✅' : '❌ missing'} |`);
    });
    lines.push('');
    lines.push(`**Score**: ${c.actions.present}/${c.actions.total} (${Math.round(c.actions.present / c.actions.total * 100)}%)`);
    lines.push('');
  } else {
    lines.push('_No actions specified_');
    lines.push('');
  }

  lines.push('## 5. Detail Modal/Page');
  if (c.detail_modal) {
    lines.push(`- Spec: \`${c.detail_modal.spec || '(not specified)'}\``);
    lines.push(`- [id]/page.tsx: ${c.detail_modal.has_detail_route ? '✅' : '❌'}`);
    lines.push(`- Inline Modal: ${c.detail_modal.has_modal_inline ? '✅' : '❌'}`);
    lines.push(`- **Status**: ${c.detail_modal.present ? '✅ present' : '❌ missing'}`);
  }
  lines.push('');

  lines.push('## 6. Edit Route');
  lines.push(`- [id]/update or [id]/edit: ${c.edit_route ? '✅ present' : '❌ missing (inline edit only)'}`);
  lines.push('');

  lines.push('## 7. Print Template');
  lines.push(`- [id]/print or print/page: ${c.print_route ? '✅ present' : '❌ MISSING (Poin 4.3 Live Audit)'}`);
  lines.push('');

  lines.push('## 8. Delete Flow');
  if (c.delete_flow) {
    lines.push(`- Confirmation dialog: ${c.delete_flow.confirmation ? '✅' : '⚠️'}`);
    lines.push(`- Delete handler: ${c.delete_flow.delete_handler ? '✅' : '❌'}`);
    lines.push(`- Audit log reference: ${c.delete_flow.audit_log ? '✅' : '⚠️'}`);
  }
  lines.push('');

  const scores = [];
  if (c.tableColumns) scores.push({ name: 'Table Columns', p: c.tableColumns.present, t: c.tableColumns.total });
  if (c.formInputs) scores.push({ name: 'Form Inputs', p: c.formInputs.present, t: c.formInputs.total });
  if (c.cards) scores.push({ name: 'Cards', p: c.cards.present, t: c.cards.total });
  if (c.actions) scores.push({ name: 'Actions', p: c.actions.present, t: c.actions.total });
  if (c.detail_modal) scores.push({ name: 'Detail', p: c.detail_modal.present ? 1 : 0, t: 1 });
  if (c.edit_route !== undefined) scores.push({ name: 'Edit', p: c.edit_route ? 1 : 0, t: 1 });
  if (c.print_route !== undefined) scores.push({ name: 'Print', p: c.print_route ? 1 : 0, t: 1 });

  const totalP = scores.reduce((a, b) => a + b.p, 0);
  const totalT = scores.reduce((a, b) => a + b.t, 0);
  const pct = totalT > 0 ? Math.round((totalP / totalT) * 100) : 0;

  lines.push('## Conformance Score');
  lines.push('');
  lines.push('| Dimension | Score |');
  lines.push('|---|---|');
  scores.forEach(s => {
    const p = s.t > 0 ? Math.round((s.p / s.t) * 100) : 0;
    lines.push(`| ${s.name} | ${s.p}/${s.t} (${p}%) |`);
  });
  lines.push(`| **TOTAL** | **${totalP}/${totalT} (${pct}%)** |`);
  lines.push('');
  lines.push(`**DNA Component Adoption**: ${scan.dna_component_count} components`);
  lines.push(`**Mock State**: ${scan.mock_array_count > 0 ? '⚠️ YES' : '✅ NO'} (${scan.mock_arrays.map(m => m.name).join(', ') || 'none'})`);
  lines.push('');

  return lines.join('\n');
}

function runModule(moduleFilter, screens, date) {
  const pages = walkPageFiles(PAGES_ROOT);
  const filtered = moduleFilter === 'all'
    ? pages
    : pages.filter(p => {
        const rel = p.split('(dashboard)').pop().toLowerCase();
        return rel.includes('/' + moduleFilter.toLowerCase() + '/');
      });
  const results = [];
  for (const pageFile of filtered) {
    const r = auditPage(pageFile, screens);
    r.module_filter = moduleFilter;
    r.audit_date = date;
    results.push(r);
  }
  return results;
}

function writeAuditFile(result, date) {
  const r = result;
  const routeSlug = r.route.replace(/^\//, '').replace(/\//g, '-').replace(/\[|\]/g, '') || 'root';
  const scrId = r.scr_id || 'ORPHAN';
  const moduleSlug = (r.spec?.moduleId || 'orphan').toLowerCase().replace('mod-', 'mod');
  const fileName = `${date}-page-${moduleSlug}-${routeSlug}-${scrId}.md`;
  const outPath = path.join(AUDIT_OUT, fileName);
  const md = renderMarkdown(r);
  fs.writeFileSync(outPath, md);
  return outPath;
}

function main() {
  const argv = process.argv.slice(2);
  const date = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(AUDIT_OUT, { recursive: true });
  const screens = loadCatalog();

  let results = [];
  if (argv[0] === 'single' && argv[1] && argv[2]) {
    const [, pagePath, scrId] = argv;
    const screen = screens.find(s => s.screenId === scrId);
    const r = {
      page: pagePath,
      route: '/' + pagePath.split('(dashboard)').pop().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/page\.tsx$/, ''),
      module: 'manual',
      spec_ref: scrId,
      scr_id: scrId,
      has_spec: !!screen,
      spec: screen,
      scan: scanPage(pagePath)
    };
    if (screen) {
      const c = r.scan.content;
      r.conformance = {
        tableColumns: presentList(screen.tableColumns || [], c),
        formInputs: presentList(screen.formInputs || [], c),
        cards: presentList(screen.cards || [], c),
        actions: presentList(screen.actions || [], c),
        detail_modal: { spec: screen.viewDetailModal, has_detail_route: r.scan.has_detail_route, has_modal_inline: /DnaModal|<Modal\b/i.test(c), present: r.scan.has_detail_route || /DnaModal/i.test(c) },
        edit_route: r.scan.has_update_route,
        print_route: r.scan.has_print_route,
        delete_flow: { confirmation: /DnaConfirmDialog|window\.confirm|confirm\(/i.test(c), delete_handler: /delete/i.test(c), audit_log: /audit|log/i.test(c) }
      };
    }
    results = [r];
  } else {
    const module = argv[0] || 'all';
    results = runModule(module, screens, date);
  }

  let written = 0;
  const summary = [];
  for (const r of results) {
    const out = writeAuditFile(r, date);
    written++;
    const c = r.conformance;
    let pct = 0;
    if (c) {
      const scores = [];
      if (c.tableColumns) scores.push(c.tableColumns.present, c.tableColumns.total);
      if (c.formInputs) scores.push(c.formInputs.present, c.formInputs.total);
      if (c.cards) scores.push(c.cards.present, c.cards.total);
      if (c.actions) scores.push(c.actions.present, c.actions.total);
      const totalP = scores.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
      const totalT = scores.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
      pct = totalT > 0 ? Math.round((totalP / totalT) * 100) : 0;
    }
    summary.push({
      page: r.page,
      route: r.route,
      scr: r.scr_id,
      module: r.spec?.moduleName || 'orphan',
      moduleId: r.spec?.moduleId || 'orphan',
      pct,
      mock: r.scan.mock_array_count,
      dna: r.scan.dna_component_count,
      file: path.basename(out)
    });
  }

  const summaryPath = path.join(AUDIT_OUT, `summary-${date}-${argv[0] || 'all'}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${written} audit files. Summary: ${summaryPath}`);
}

main();