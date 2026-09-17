/**
 * Static NEX ERP implementation-readiness baseline.
 *
 * This intentionally measures exact identity/alignment, not feature equivalence.
 * A low exact-match percentage may mean a missing capability, a legacy alias, or
 * an implementation-only feature. Each mismatch must be classified before it is
 * counted as functional coverage.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('../../backend/node_modules/js-yaml');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACTS = path.join(ROOT, 'docs/legacy-erp/contracts');
const VERIFY = path.join(ROOT, 'docs/legacy-erp/verification');
const HTTP = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function uniq(values) { return [...new Set(values)]; }
function pct(n, d) { return d ? Number(((n / d) * 100).toFixed(1)) : 0; }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}
function relative(file) { return path.relative(ROOT, file).replace(/\\/g, '/'); }
function prismaModels(source) { return [...source.matchAll(/^model\s+(\w+)/gm)].map(match => match[1]); }
function normalizePath(value) {
  let route = String(value || '').split(/[?#]/)[0];
  route = route.replace(/^\/api\/v1(?=\/|$)/, '').replace(/^\/v1(?=\/|$)/, '');
  while (route.startsWith('/v1/')) route = route.slice(3);
  route = route.replace(/\{new\|\{id\}\}/g, '{}').replace(/\{[^}]+\}/g, '{}').replace(/:\w+/g, '{}');
  route = route.replace(/\/$/, '');
  return route || '/';
}
function operations(document) {
  return uniq(Object.entries(document.paths || {}).flatMap(([route, item]) =>
    Object.keys(item || {})
      .filter(method => HTTP.has(method.toLowerCase()))
      .map(method => `${method.toUpperCase()} ${normalizePath(route)}`)));
}
function pageRoute(file) {
  let route = relative(file)
    .replace(/^frontend\/src\/app/, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\/\([^/]+\)/g, '')
    .replace(/\[([^\]]+)\]/g, '{}');
  return normalizePath(route);
}
function countMatchingFiles(files, pattern) {
  return files.filter(file => pattern.test(relative(file))).length;
}
function filesContaining(files, regex) {
  return files.filter(file => {
    try { return regex.test(fs.readFileSync(file, 'utf8')); }
    catch { return false; }
  }).map(relative);
}

const ssot = JSON.parse(read('docs/legacy-erp/verification/_ssot_validation.json'));
const canonicalModels = prismaModels(read('docs/legacy-erp/contracts/schema.prisma'));
const implementationSchemaFiles = walk(path.join(ROOT, 'backend/prisma/schema')).filter(file => file.endsWith('.prisma'));
const implementationModels = uniq(prismaModels(implementationSchemaFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n')));
const canonicalModelSet = new Set(canonicalModels);
const implementationModelSet = new Set(implementationModels);

const canonicalApi = yaml.load(read('docs/legacy-erp/contracts/05_API_CONTRACT.yaml'));
const implementationApi = JSON.parse(read('backend/swagger-spec.json'));
const canonicalOperations = operations(canonicalApi);
const implementationOperations = operations(implementationApi);
const implementationOperationSet = new Set(implementationOperations);
const canonicalOperationSet = new Set(canonicalOperations);

const screenContract = JSON.parse(read('docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json'));
const canonicalRoutes = uniq((screenContract.screens || []).map(screen => normalizePath(screen.route)).filter(Boolean));
const allFiles = walk(ROOT).filter(file => !relative(file).includes('/node_modules/'));
const implementationRoutes = uniq(allFiles
  .filter(file => /^frontend\/src\/app\/.+\/page\.tsx$/.test(relative(file)) || relative(file) === 'frontend/src/app/page.tsx')
  .map(pageRoute));
const implementationRouteSet = new Set(implementationRoutes);
const canonicalRouteSet = new Set(canonicalRoutes);

const sourceFiles = allFiles.filter(file => /^(frontend\/src\/.+\.(ts|tsx)|backend\/src\/.+\.ts)$/.test(relative(file)));
const frontendSource = sourceFiles.filter(file => relative(file).startsWith('frontend/src/'));
const backendSource = sourceFiles.filter(file => relative(file).startsWith('backend/src/'));

const report = {
  generated_at: new Date().toISOString(),
  measurement_semantics: {
    exact_identity_only: true,
    warning: 'Exact mismatch is a reconciliation queue, not proof that the capability is absent.',
    production_readiness: 'Not inferred from file counts; runtime gates and business-flow tests are required.',
  },
  ssot: {
    passed_gates: ssot.summary.pass,
    failed_gates: ssot.summary.fail,
    pass_percent: pct(ssot.summary.pass, ssot.summary.pass + ssot.summary.fail),
    certification: ssot.summary.certification,
    open_decisions: ssot.unresolved.open_decisions,
  },
  exact_alignment: {
    models: {
      canonical: canonicalModels.length,
      implementation: implementationModels.length,
      exact_shared: canonicalModels.filter(name => implementationModelSet.has(name)).length,
      canonical_exact_percent: pct(canonicalModels.filter(name => implementationModelSet.has(name)).length, canonicalModels.length),
      canonical_only: canonicalModels.filter(name => !implementationModelSet.has(name)),
      implementation_only: implementationModels.filter(name => !canonicalModelSet.has(name)),
    },
    api_operations: {
      canonical: canonicalOperations.length,
      implementation_unique: implementationOperations.length,
      exact_shared: canonicalOperations.filter(operation => implementationOperationSet.has(operation)).length,
      canonical_exact_percent: pct(canonicalOperations.filter(operation => implementationOperationSet.has(operation)).length, canonicalOperations.length),
      canonical_only: canonicalOperations.filter(operation => !implementationOperationSet.has(operation)),
      implementation_only: implementationOperations.filter(operation => !canonicalOperationSet.has(operation)),
    },
    screen_routes: {
      canonical: canonicalRoutes.length,
      implementation: implementationRoutes.length,
      exact_shared: canonicalRoutes.filter(route => implementationRouteSet.has(route)).length,
      canonical_exact_percent: pct(canonicalRoutes.filter(route => implementationRouteSet.has(route)).length, canonicalRoutes.length),
      canonical_only: canonicalRoutes.filter(route => !implementationRouteSet.has(route)),
      implementation_only: implementationRoutes.filter(route => !canonicalRouteSet.has(route)),
    },
  },
  code_inventory: {
    backend_controllers: countMatchingFiles(allFiles, /^backend\/src\/.+\.controller\.ts$/),
    backend_services: countMatchingFiles(allFiles, /^backend\/src\/.+\.service\.ts$/),
    backend_unit_spec_files: countMatchingFiles(allFiles, /^backend\/.+\.spec\.ts$/),
    backend_e2e_spec_files: countMatchingFiles(allFiles, /^backend\/.+\.e2e-spec\.ts$/),
    frontend_pages: implementationRoutes.length,
    frontend_test_files: countMatchingFiles(allFiles, /^frontend\/.+\.(test|spec)\.(ts|tsx)$/),
    root_playwright_spec_files: countMatchingFiles(allFiles, /^tests\/e2e\/.+\.spec\.ts$/),
    migration_files: countMatchingFiles(allFiles, /^backend\/prisma\/migrations\/.+\/migration\.sql$/),
    ci_workflows: countMatchingFiles(allFiles, /^\.github\/workflows\/.+\.ya?ml$/),
  },
  risk_markers: {
    frontend_files_with_mock_fallback_dummy: filesContaining(frontendSource, /\b(mock|fallback|dummy|hardcoded)\b/i),
    frontend_files_with_todo_fixme_hack: filesContaining(frontendSource, /\b(TODO|FIXME|HACK)\b/i),
    backend_files_with_todo_fixme_hack: filesContaining(backendSource, /\b(TODO|FIXME|HACK)\b/i),
    frontend_files_with_local_storage: filesContaining(frontendSource, /localStorage/),
    frontend_files_with_console_calls: filesContaining(frontendSource, /console\.(log|warn|error)/),
    backend_files_with_console_calls: filesContaining(backendSource, /console\.(log|warn|error)/),
  },
};

fs.mkdirSync(VERIFY, { recursive: true });
fs.writeFileSync(path.join(VERIFY, '_IMPLEMENTATION_READINESS_BASELINE.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  ssot: report.ssot,
  alignment: {
    models: report.exact_alignment.models.canonical_exact_percent,
    api: report.exact_alignment.api_operations.canonical_exact_percent,
    screens: report.exact_alignment.screen_routes.canonical_exact_percent,
  },
  inventory: report.code_inventory,
  risk_marker_file_counts: Object.fromEntries(Object.entries(report.risk_markers).map(([key, files]) => [key, files.length])),
}, null, 2));
