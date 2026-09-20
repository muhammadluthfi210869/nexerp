/**
 * NEX ERP canonical SSOT validator.
 * Deterministic only: parsing, identifiers, cross-references, status gates,
 * generated counts, and generated lineage. It does not make business decisions.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('../../backend/node_modules/js-yaml');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACTS = path.join(ROOT, 'docs/legacy-erp/contracts');
const VERIFY = path.join(ROOT, 'docs/legacy-erp/verification');
const GENERATED = path.join(ROOT, 'docs/legacy-erp/generated');
const YAML_FILES = ['02_DATA_OWNERSHIP.yaml', '03_WORKFLOW_STATE_MACHINE.yaml', '05_API_CONTRACT.yaml', '07_RBAC_MATRIX.yaml', '08_INTEGRATION_EVENT_CONTRACT.yaml', '10_TRACEABILITY_MATRIX.yaml'];
const JSON_FILES = ['06_SCREEN_CONTRACT.json'];
const HTTP = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
const result = { generated_at: new Date().toISOString(), gates: {}, counts: {}, unresolved: {}, files: {}, summary: {} };
const errors = [];
const warnings = [];

function read(name) { return fs.readFileSync(path.join(CONTRACTS, name), 'utf8'); }
function uniq(xs) { return [...new Set(xs)]; }
function dupes(xs) { const c = new Map(); xs.forEach(x => c.set(x, (c.get(x) || 0) + 1)); return [...c].filter(([, n]) => n > 1).map(([id, count]) => ({ id, count })); }
function gate(name, ok, details = {}) { result.gates[name] = { status: ok ? 'PASS' : 'FAIL', ...details }; if (!ok) errors.push(name); }
function normalizeEndpoint(s) {
  if (typeof s !== 'string') return null;
  const m = s.trim().match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+([^\s?#]+)/i);
  if (!m) return null;
  const p = m[2].replace(/^\/api\/v1(?=\/|$)/, '').replace(/\{[^}]+\}|:\w+/g, '{}').replace(/\/$/, '') || '/';
  return `${m[1].toUpperCase()} ${p}`;
}
function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(v => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => collectStrings(v, out));
  return out;
}
function markdownList(xs, empty = 'None') { return xs.length ? xs.map(x => `- \`${x}\``).join('\n') : `- ${empty}`; }

const data = {};
for (const file of YAML_FILES) {
  try { data[file] = yaml.load(read(file), { json: false }); result.files[file] = { parse: 'PASS' }; }
  catch (e) { result.files[file] = { parse: 'FAIL', error: e.message }; errors.push(`parse:${file}`); }
}
for (const file of JSON_FILES) {
  try { data[file] = JSON.parse(read(file)); result.files[file] = { parse: 'PASS' }; }
  catch (e) { result.files[file] = { parse: 'FAIL', error: e.message }; errors.push(`parse:${file}`); }
}
gate('yaml_parse', YAML_FILES.every(f => result.files[f]?.parse === 'PASS'), { files: YAML_FILES.length });
gate('json_parse', JSON_FILES.every(f => result.files[f]?.parse === 'PASS'), { files: JSON_FILES.length });

const prismaText = read('schema.prisma');
const models = [...prismaText.matchAll(/^model\s+(\w+)\s*\{/gm)].map(m => m[1]);
result.counts.prisma_models = models.length;
const prismaCli = path.join(ROOT, 'backend/node_modules/prisma/build/index.js');
let prismaOk = false;
let prismaMessage = 'Prisma CLI unavailable';
if (fs.existsSync(prismaCli)) {
  let p = spawnSync(process.execPath, [prismaCli, 'validate', '--schema', path.join(CONTRACTS, 'schema.prisma')], {
    cwd: path.join(ROOT, 'backend'), encoding: 'utf8', env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgresql://validator:validator@localhost:5432/validator' }
  });
  let combined = `${p.stdout || ''}${p.stderr || ''}`;
  if (p.status !== 0 && combined.includes('datasource property `url` is no longer supported')) {
    const tempSchema = path.join(ROOT, 'tmp', 'ssot-prisma7-compat.schema.prisma');
    fs.mkdirSync(path.dirname(tempSchema), { recursive: true });
    fs.writeFileSync(tempSchema, prismaText.replace(/^\s*url\s*=\s*env\("DATABASE_URL"\)\s*$/m, ''));
    p = spawnSync(process.execPath, [prismaCli, 'validate', '--schema', tempSchema], { cwd: path.join(ROOT, 'backend'), encoding: 'utf8' });
    combined = `${p.stdout || ''}${p.stderr || ''}`;
    try { fs.unlinkSync(tempSchema); } catch {}
    if (p.status === 0) combined += '\nValidated through Prisma 7 compatibility projection; canonical schema targets Prisma 5.';
  }
  prismaOk = p.status === 0;
  prismaMessage = combined.trim().split(/\r?\n/).slice(-4).join(' | ');
}
gate('prisma_validate', prismaOk, { message: prismaMessage });

const api = data['05_API_CONTRACT.yaml'] || {};
const endpoints = [];
const operationIds = [];
for (const [p, methods] of Object.entries(api.paths || {})) for (const [method, op] of Object.entries(methods || {})) {
  if (!HTTP.has(method.toLowerCase()) || !op || typeof op !== 'object') continue;
  endpoints.push(normalizeEndpoint(`${method} ${p}`));
  if (op.operationId) operationIds.push(op.operationId);
}
const endpointSet = new Set(endpoints);
const componentSchemas = new Set(Object.keys(api.components?.schemas || {}));
const badOpenApiRefs = uniq(collectStrings(api).filter(x => x.startsWith('#/components/schemas/')).filter(x => !componentSchemas.has(x.split('/').pop())));
result.counts.api_operations = endpoints.length;
gate('openapi_structure', !!api.openapi && !!api.info && !!api.paths && dupes(operationIds).length === 0 && badOpenApiRefs.length === 0, { duplicate_operation_ids: dupes(operationIds), dangling_schema_refs: badOpenApiRefs });

const rbac = data['07_RBAC_MATRIX.yaml'] || {};
const roles = rbac.roles || [];
const roleIds = roles.map(r => r.id);
const roleNames = roles.map(r => r.name);
const roleSet = new Set([...roleIds, ...roleNames]);
const permissionSlugs = (rbac.permissions || []).map(p => p.slug);
const permissionSet = new Set(permissionSlugs);
const actions = new Set(rbac.actions || []);
const assignments = rbac.role_permission_assignments || [];
const danglingInheritance = [];
roles.forEach(r => (r.inherits_from || []).forEach(parent => { if (!roleSet.has(parent)) danglingInheritance.push(`${r.name}->${parent}`); }));
const danglingAssignments = assignments.filter(a => !roleSet.has(a.role)).map(a => a.role);
const danglingAssignedPermissions = [];
assignments.forEach(a => (a.permission_slugs || []).forEach(p => { if (p !== '*' && !permissionSet.has(p)) danglingAssignedPermissions.push(`${a.role}:${p}`); }));
result.counts.roles = roles.length;
result.counts.permissions = permissionSlugs.length;
gate('rbac_ids_and_inheritance', dupes(roleIds).length === 0 && dupes(roleNames).length === 0 && dupes(permissionSlugs).length === 0 && danglingInheritance.length === 0 && danglingAssignments.length === 0 && danglingAssignedPermissions.length === 0, {
  duplicate_role_ids: dupes(roleIds), duplicate_role_names: dupes(roleNames), duplicate_permissions: dupes(permissionSlugs), dangling_inheritance: danglingInheritance, dangling_assignment_roles: danglingAssignments, dangling_assignment_permissions: danglingAssignedPermissions
});

const screens = data['06_SCREEN_CONTRACT.json']?.screens || [];
const screenIds = screens.map(s => s.screen_id);
const screenSet = new Set(screenIds);
const screenApiRefs = [];
const screenPermRefs = [];
for (const s of screens) {
  const addApi = (v, where) => { const n = normalizeEndpoint(v); if (n) screenApiRefs.push({ ref: n, where }); };
  addApi(s.data_source, `${s.screen_id}.data_source`);
  (s.forms || []).forEach(f => addApi(f.submit_action, `${s.screen_id}.form:${f.name}`));
  (s.actions || []).forEach(a => { addApi(a.api || a.endpoint || a.action, `${s.screen_id}.action:${a.text || '?'}`); if (a.permission) screenPermRefs.push({ ref: a.permission, where: s.screen_id }); });
  (s.permissions_required || []).forEach(p => screenPermRefs.push({ ref: p, where: s.screen_id }));
}
const danglingScreenApis = screenApiRefs.filter(x => !endpointSet.has(x.ref));
function permissionResolves(p) {
  if (p === 'public' || p === '*') return true;
  if (permissionSet.has(p)) return true;
  const i = p.lastIndexOf('.');
  return i > 0 && permissionSet.has(p.slice(0, i)) && actions.has(p.slice(i + 1));
}
const danglingScreenPerms = screenPermRefs.filter(x => !permissionResolves(x.ref));
result.counts.screens = screens.length;
result.counts.screen_api_refs = screenApiRefs.length;
result.counts.screen_permission_refs = screenPermRefs.length;
gate('screen_ids', dupes(screenIds).length === 0, { duplicates: dupes(screenIds) });
gate('screen_api_refs', danglingScreenApis.length === 0, { checked: screenApiRefs.length, dangling: danglingScreenApis });
gate('screen_rbac_refs', danglingScreenPerms.length === 0, { checked: screenPermRefs.length, dangling: danglingScreenPerms });

const ruleText = read('04_BUSINESS_RULES.md');
const ruleIds = [...ruleText.matchAll(/^###\s+(BUS-RULE-\d{3})\b/gm)].map(m => m[1]);
const ruleSet = new Set(ruleIds);
result.counts.business_rules = ruleIds.length;
gate('business_rule_ids', dupes(ruleIds).length === 0, { duplicates: dupes(ruleIds) });

const wf = data['03_WORKFLOW_STATE_MACHINE.yaml'] || {};
const wfSections = ['sales_pipeline', 'purchase_pipeline', 'production_pipeline', 'rnd_pipeline', 'warehouse_pipeline', 'finance_pipeline', 'hr_pipeline', 'creative_pipeline'];
const workflows = wfSections.flatMap(k => Array.isArray(wf[k]) ? wf[k] : []).concat(wf.checklist_pipeline?.entity ? [wf.checklist_pipeline] : []);
const workflowEntities = workflows.map(w => w.entity);
const modelSet = new Set(models);
const danglingWorkflowEntities = workflowEntities.filter(e => !modelSet.has(e));
const actorAliases = new Set(['system', 'system_auto', 'system_auto_post', 'any_with_PRM_create_perm', 'any_employee', 'stage_owner_per_stage', 'DivisionHead', 'receiving_division_head', 'employee', 'User']);
const danglingActors = [];
function actorsFrom(a) {
  if (!a || typeof a !== 'object') return [];
  return uniq([a.role, ...(a.roles || []), ...(a.all_of || []), ...(a.any_of || []), ...(a.actors || []), ...(a.tiers || []).flatMap(t => t.roles || [])].filter(Boolean));
}
workflows.forEach(w => (w.transitions || []).forEach(t => actorsFrom(t.authorized_actor).forEach(a => { if (!roleSet.has(a) && !actorAliases.has(a)) danglingActors.push(`${w.entity}:${a}`); })));
const eventContract = data['08_INTEGRATION_EVENT_CONTRACT.yaml'] || {};
const eventNames = Object.entries(eventContract).filter(([k, v]) => k.endsWith('_events') && v && typeof v === 'object').flatMap(([, v]) => Object.keys(v));
const eventSet = new Set(eventNames);
const workflowEventRefs = (wf.triggers || []).map(t => t.event).filter(Boolean);
const danglingWorkflowEvents = workflowEventRefs.filter(e => !eventSet.has(e));
const workflowStrings = collectStrings(workflows);
const danglingWorkflowRules = [];
for (const s of workflowStrings) for (const m of s.matchAll(/BUS-RULE-\d{3}/g)) if (!ruleSet.has(m[0])) danglingWorkflowRules.push(m[0]);
result.counts.workflows = workflows.length;
result.counts.integration_events = eventNames.length;
gate('workflow_ids_entities_actors', dupes(workflowEntities).length === 0 && danglingWorkflowEntities.length === 0 && danglingActors.length === 0, { duplicate_entities: dupes(workflowEntities), dangling_entities: danglingWorkflowEntities, dangling_actors: uniq(danglingActors) });
gate('workflow_event_refs', danglingWorkflowEvents.length === 0, { checked: workflowEventRefs.length, dangling: uniq(danglingWorkflowEvents) });
gate('workflow_rule_refs', danglingWorkflowRules.length === 0, { checked: workflowStrings.length, dangling: uniq(danglingWorkflowRules) });
gate('event_ids', dupes(eventNames).length === 0, { duplicates: dupes(eventNames) });

const ownership = data['02_DATA_OWNERSHIP.yaml'] || {};
const ownershipSections = ['master_data', 'sales_pipeline', 'purchase_pipeline', 'production', 'inventory', 'finance', 'auth', 'hr', 'checklist', 'communication', 'creative_design', 'legalitas_permits'];
const ownershipRows = ownershipSections.flatMap(k => ownership[k] || []);
const ownershipText = ownershipRows.map(x => x.entity).join(' | ');
const missingOwnership = models.filter(m => !new RegExp(`\\b${m}\\b`).test(ownershipText));
const ownershipWithoutWriter = ownershipRows.filter(x => !x.authoritative_writer).map(x => x.entity);
gate('data_ownership_coverage', missingOwnership.length === 0 && ownershipWithoutWriter.length === 0, { schema_models_checked: models.length, missing_models: missingOwnership, entries_without_writer: ownershipWithoutWriter });

const trace = data['10_TRACEABILITY_MATRIX.yaml'] || {};
const reqIds = (trace.requirements || []).map(x => x.id);
const traceRuleIds = (trace.business_rules || []).map(x => x.id);
const traceWorkflowIds = (trace.workflows || []).map(x => x.id);
const traceEntityIds = (trace.entities || []).map(x => x.name || String(x.id || '').replace(/^E-/, ''));
const traceScreenIds = (trace.screens || []).map(x => x.id);
const traceTestIds = (trace.tests || []).map(x => x.id);
const testedRuleIds = new Set((trace.tests || []).flatMap(x => x.refs || []).filter(x => /^BUS-RULE-\d{3}$/.test(x)));
const rulesWithoutTests = ruleIds.filter(x => !testedRuleIds.has(x));
const danglingTrace = [];
for (const r of trace.requirements || []) {
  (r.rules || []).forEach(x => { if (!ruleSet.has(x)) danglingTrace.push(`${r.id}:rule:${x}`); });
  (r.ents || []).forEach(x => { if (x !== 'All' && !modelSet.has(x)) danglingTrace.push(`${r.id}:entity:${x}`); });
  (r.apis || []).forEach(x => { const n = normalizeEndpoint(x); if (n && !/\*$/.test(n) && n !== 'ALL' && !endpointSet.has(n)) danglingTrace.push(`${r.id}:api:${x}`); });
  (r.screens || []).forEach(x => { if (x !== 'ALL' && !screenSet.has(x)) danglingTrace.push(`${r.id}:screen:${x}`); });
}
for (const r of trace.business_rules || []) {
  if (!ruleSet.has(r.id)) danglingTrace.push(`trace-rule:not-canonical:${r.id}`);
  (r.ents || []).forEach(x => { if (x !== 'All' && !modelSet.has(x)) danglingTrace.push(`${r.id}:entity:${x}`); });
  (r.apis || []).forEach(x => { const n = normalizeEndpoint(x); if (n && !/\*$/.test(n) && n !== 'ALL' && !endpointSet.has(n)) danglingTrace.push(`${r.id}:api:${x}`); });
  (r.screens || []).forEach(x => { if (x !== 'ALL' && !screenSet.has(x)) danglingTrace.push(`${r.id}:screen:${x}`); });
}
result.counts.requirements = reqIds.length;
result.counts.trace_tests = traceTestIds.length;
gate('traceability_ids', [reqIds, traceRuleIds, traceWorkflowIds, traceEntityIds, traceScreenIds, traceTestIds].every(xs => dupes(xs).length === 0), { duplicate_requirements: dupes(reqIds), duplicate_rules: dupes(traceRuleIds), duplicate_workflows: dupes(traceWorkflowIds), duplicate_entities: dupes(traceEntityIds), duplicate_screens: dupes(traceScreenIds), duplicate_tests: dupes(traceTestIds) });
gate('traceability_refs', danglingTrace.length === 0, { checked_requirements: reqIds.length, dangling: uniq(danglingTrace) });
gate('business_rule_test_refs', rulesWithoutTests.length === 0, { checked_rules: ruleIds.length, rules_without_tests: rulesWithoutTests });

let structuredDecisions = [];
try { structuredDecisions = yaml.load(fs.readFileSync(path.join(VERIFY, '_DECISIONS_REQUIRED.yaml'), 'utf8')).decisions || []; } catch {}
const openDecisionIds = [
  ...(wf.open_questions || []).map(x => x.id || x.q || x.question),
  ...(eventContract.open_questions || []).map((x, i) => x.id || `EVENT-DECISION-${String(i + 1).padStart(2, '0')}`),
  ...[...read('00_MASTER_SPEC.md').matchAll(/^\|\s*(OD-\d+)\s*\|[^\n]*\|\s*PENDING\b[^\n]*$/gm)].map(m => m[1]),
  ...structuredDecisions.filter(x => x.blocking !== false).map(x => x.id)
];
result.unresolved.open_decisions = uniq(openDecisionIds);
gate('blocking_decisions_zero', result.unresolved.open_decisions.length === 0, { decisions: result.unresolved.open_decisions });

const authoritativeFiles = ['00_MASTER_SPEC.md', '01_DOMAIN_MODEL.md', '02_DATA_OWNERSHIP.yaml', '03_WORKFLOW_STATE_MACHINE.yaml', '04_BUSINESS_RULES.md', '05_API_CONTRACT.yaml', '06_SCREEN_CONTRACT.json', '07_RBAC_MATRIX.yaml', '08_INTEGRATION_EVENT_CONTRACT.yaml', '09_NON_FUNCTIONAL_CONTRACT.md', '10_TRACEABILITY_MATRIX.yaml'];
const lockedWithOpen = [];
for (const f of authoritativeFiles) {
  const t = read(f);
  const header = t.slice(0, 1200);
  const locked = /(?:^|\n)status:\s*LOCKED\b/im.test(header) || /\*\*Status:\*\*\s*(?:\*\*)?LOCKED\b/i.test(header) || /\*\*Status\*\*:\s*(?:\*\*)?LOCKED\b/i.test(header);
  if (locked && /\b(?:TBD|OPEN_QUESTIONS?|DECISION_REQUIRED)\b/i.test(t)) lockedWithOpen.push(f);
}
gate('locked_status_integrity', lockedWithOpen.length === 0, { locked_with_open_markers: lockedWithOpen });

result.summary = { pass: Object.values(result.gates).filter(x => x.status === 'PASS').length, fail: Object.values(result.gates).filter(x => x.status === 'FAIL').length, certification: errors.length ? 'NOT CERTIFIED' : 'CERTIFIED', warnings: uniq(warnings) };
fs.mkdirSync(VERIFY, { recursive: true });
fs.mkdirSync(GENERATED, { recursive: true });
fs.writeFileSync(path.join(VERIFY, '_ssot_validation.json'), JSON.stringify(result, null, 2) + '\n');

const failed = Object.entries(result.gates).filter(([, v]) => v.status === 'FAIL');
const report = `# NEX ERP — SSOT Validation Report\n\n> GENERATED — DO NOT EDIT DIRECTLY. Run \`node scripts/ssot/validate_ssot.js\`.\n\nGenerated: ${result.generated_at}\n\n## Result\n\n**${result.summary.certification}** — ${result.summary.pass} gates passed; ${result.summary.fail} failed.\n\n## Deterministic gates\n\n| Gate | Status |\n|---|---|\n${Object.entries(result.gates).map(([k, v]) => `| ${k} | ${v.status} |`).join('\n')}\n\n## Generated counts\n\n${Object.entries(result.counts).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n## Exact failed gates\n\n${failed.length ? failed.map(([k, v]) => `### ${k}\n\n\`\`\`json\n${JSON.stringify(v, null, 2)}\n\`\`\``).join('\n\n') : 'None.'}\n`;
fs.writeFileSync(path.join(VERIFY, '_SSOT_VALIDATION_REPORT.md'), report);

const lineageRows = (trace.requirements || []).map(r => `| ${r.id} | ${(r.rules || []).join(', ') || '—'} | ${(r.ents || []).join(', ') || '—'} | ${(r.apis || []).join('<br>') || '—'} | ${(r.screens || []).join(', ') || '—'} |`).join('\n');
fs.writeFileSync(path.join(GENERATED, 'INPUT_OUTPUT_LINEAGE.md'), `# NEX ERP — Input/Output Lineage\n\n> GENERATED VIEW — NOT AUTHORITATIVE. DO NOT EDIT DIRECTLY. Edit the owning contracts and run \`node scripts/ssot/validate_ssot.js\`.\n\nThis compact projection exposes the currently available requirement-to-interface lineage. Missing actor, owner, event, permission, or test links remain certification blockers and must be added to canonical source contracts, not here.\n\n| Requirement | Rules | Entities / storage | API input/output interface | Screens / actors |\n|---|---|---|---|---|\n${lineageRows}\n`);

console.log(JSON.stringify(result, null, 2));
process.exitCode = errors.length ? 1 : 0;
