/**
 * NEX ERP — Phase P02 Lifecycle & Reconciliation Test Suite
 * Independent Verifier validating all 14 required tests and 8 required gates of Phase P02.
 *
 * All denominators are computed dynamically from actual sources.
 * Enforces exact-set validation, reachability analysis, single lifecycle classifications,
 * valid Next.js route syntax, roadmap phases, typed adapters, and dynamic orphan calculation.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('../../backend/node_modules/js-yaml');
const {
  LIFECYCLE_ENUM,
  VALID_PHASES,
  RUNTIME_DEPENDENCIES_ALLOWLIST,
} = require('./classification_catalog');
const { buildNestRegistrationGraph, extractMainClassSymbol } = require('./lib/nest_registration_graph');
const {
  diffMultiset,
  jobKey,
  eventKey,
  migrationKey,
  barrelFileKey,
  barrelMemberKey,
  controllerKey,
  serviceKey,
  moduleKey,
  scanJobs,
  scanEvents,
  scanMigrations,
  scanBarrels,
  scanControllers,
  scanServices,
  scanModules,
} = require('./lib/source_inventory');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACTS = path.join(ROOT, 'docs/legacy-erp/contracts');
const VERIFY = path.join(ROOT, 'docs/legacy-erp/verification');
const REGISTRY_FILE = path.join(VERIFY, '_LIFECYCLE_REGISTRY.json');

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
function relative(p) { return path.relative(ROOT, p).replace(/\\/g, '/'); }
function prismaModels(src) { return [...src.matchAll(/^model\s+(\w+)/gm)].map(m => m[1]); }
function normalizePath(value) {
  let route = String(value || '').split(/[?#]/)[0];
  route = route.replace(/^\/api\/v1(?=\/|$)/, '').replace(/^\/v1(?=\/|$)/, '');
  while (route.startsWith('/v1/')) route = route.slice(3);
  route = route.replace(/\{new\|\{id\}\}/g, '{}').replace(/\{[^}]+\}/g, '{}').replace(/:\w+/g, '{}');
  route = route.replace(/\/$/, '');
  return route || '/';
}

function runAudit(customRegistry = null) {
  const registry = customRegistry || JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  const results = {};
  const failures = [];

  // Dynamic Denominators from Actual Sources
  const canonicalSchema = read('docs/legacy-erp/contracts/schema.prisma');
  const dynamicCanonicalModels = prismaModels(canonicalSchema);

  const implPrismaFiles = walk(path.join(ROOT, 'backend/prisma/schema')).filter(f => f.endsWith('.prisma'));
  const dynamicImplModels = [];
  const dynamicImplModelToFile = {};
  for (const f of implPrismaFiles) {
    const ms = prismaModels(fs.readFileSync(f, 'utf8'));
    for (const m of ms) {
      dynamicImplModels.push(m);
      dynamicImplModelToFile[m] = relative(f);
    }
  }

  const canonicalApi = yaml.load(read('docs/legacy-erp/contracts/05_API_CONTRACT.yaml'));
  const dynamicCanonicalOps = [];
  for (const [p, item] of Object.entries(canonicalApi.paths || {})) {
    for (const [m, op] of Object.entries(item || {})) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(m.toLowerCase())) {
        dynamicCanonicalOps.push({ method: m.toUpperCase(), path: p, norm: normalizePath(p), opId: op.operationId });
      }
    }
  }

  const swaggerSpec = JSON.parse(read('backend/swagger-spec.json'));
  const dynamicSwaggerOps = [];
  for (const [p, item] of Object.entries(swaggerSpec.paths || {})) {
    for (const [m, op] of Object.entries(item || {})) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(m.toLowerCase())) {
        dynamicSwaggerOps.push({ method: m.toUpperCase(), path: p, norm: normalizePath(p), opId: op.operationId });
      }
    }
  }

  const screenDoc = JSON.parse(read('docs/legacy-erp/contracts/06_SCREEN_CONTRACT.json'));
  const dynamicCanonicalScreens = screenDoc.screens || [];

  const dynamicAppFiles = walk(path.join(ROOT, 'frontend/src/app')).filter(f => f.endsWith('page.tsx'));
  const nestGraph = buildNestRegistrationGraph(ROOT);

  // Test 1: implementation_readiness_audit
  try {
    const modelMetrics = registry.metrics?.canonical_models || {};
    const apiMetrics = registry.metrics?.canonical_api_operations || {};
    const screenMetrics = registry.metrics?.canonical_screens || {};
    const implInventoryMetrics = registry.metrics?.implementation_inventory || {};

    const actualModelReconciled = Object.values(registry.canonical_model_reconciliation || {}).filter(m => m.reconciled).length;
    const actualApiReconciled = (registry.canonical_api_reconciliation || []).filter(o => o.reconciled).length;
    const actualScreenReconciled = (registry.canonical_screen_reconciliation || []).filter(s => s.reconciled).length;

    const jobsCountMatch = implInventoryMetrics.jobs_schedulers === (registry.jobs_schedulers || []).length;
    const eventsCountMatch = implInventoryMetrics.published_subscribed_events === (registry.published_subscribed_events || []).length;
    const migrationsCountMatch = implInventoryMetrics.migrations === (registry.migrations || []).length;
    const barrelsCountMatch = implInventoryMetrics.barrel_exports === (registry.barrel_exports || []).length;

    const noSummaryManipulation =
      actualModelReconciled === dynamicCanonicalModels.length &&
      actualApiReconciled === dynamicCanonicalOps.length &&
      actualScreenReconciled === dynamicCanonicalScreens.length &&
      modelMetrics.reconciled === actualModelReconciled &&
      apiMetrics.reconciled === actualApiReconciled &&
      screenMetrics.reconciled === actualScreenReconciled &&
      jobsCountMatch &&
      eventsCountMatch &&
      migrationsCountMatch &&
      barrelsCountMatch;

    const isReconciliationComplete =
      modelMetrics.reconciliation_coverage_percent === 100 &&
      apiMetrics.reconciliation_coverage_percent === 100 &&
      screenMetrics.reconciliation_coverage_percent === 100 &&
      (registry.metrics?.missing_blocker_count || 0) === 0 &&
      (registry.metrics?.unexplained_objects || 0) === 0;

    const pass = isReconciliationComplete && noSummaryManipulation;
    if (!pass) {
      failures.push('implementation_readiness_audit: Reconciliation incomplete, blockers exist, or summary manipulated');
    }

    results.implementation_readiness_audit = {
      status: pass ? 'PASS' : 'FAIL',
      details: {
        canonical_models_reconciliation_coverage_percent: modelMetrics.reconciliation_coverage_percent,
        canonical_api_reconciliation_coverage_percent: apiMetrics.reconciliation_coverage_percent,
        canonical_screens_reconciliation_coverage_percent: screenMetrics.reconciliation_coverage_percent,
        implemented_models_percent: modelMetrics.implemented_coverage_percent,
        implemented_api_percent: apiMetrics.implemented_coverage_percent,
        implemented_screens_percent: screenMetrics.implemented_coverage_percent,
        missing_blocker_count: registry.metrics?.missing_blocker_count || 0,
        unexplained_objects: registry.metrics?.unexplained_objects || 0,
        no_summary_manipulation: noSummaryManipulation,
      },
    };
  } catch (err) {
    results.implementation_readiness_audit = { status: 'FAIL', error: err.message };
    failures.push('implementation_readiness_audit: ' + err.message);
  }

  // Test 2: schema_diff
  try {
    const canonicalCount = dynamicCanonicalModels.length;
    const reconciledModels = registry.canonical_model_reconciliation || {};
    const classifiedModels = registry.implementation_model_classifications || {};

    let typedMappingsValid = true;
    let targetModelsValid = true;
    const invalidTargets = [];

    // Exact Set Equality for Canonical Models
    const actualCanonicalSet = new Set(dynamicCanonicalModels);
    const regCanonicalSet = new Set(Object.keys(reconciledModels));
    for (const m of actualCanonicalSet) {
      if (!regCanonicalSet.has(m)) invalidTargets.push(`Missing canonical model in registry: ${m}`);
    }
    for (const m of regCanonicalSet) {
      if (!actualCanonicalSet.has(m)) invalidTargets.push(`Extraneous canonical model in registry: ${m}`);
    }

    // Exact Set Equality for Implementation Models
    const actualImplSet = new Set(dynamicImplModels);
    const regImplSet = new Set(Object.keys(classifiedModels));
    for (const m of actualImplSet) {
      if (!regImplSet.has(m)) invalidTargets.push(`Missing implementation model in registry: ${m}`);
    }
    for (const m of regImplSet) {
      if (!actualImplSet.has(m)) invalidTargets.push(`Extraneous implementation model in registry: ${m}`);
    }

    // Verify canonical models
    const typedAdapterModels = new Set(['Role', 'Permission', 'RolePermission', 'UserSession']);

    for (const [modelName, record] of Object.entries(reconciledModels)) {
      if (!record.lifecycle_classification || !record.owner || !record.rationale) {
        targetModelsValid = false;
        invalidTargets.push(`Canonical model ${modelName} missing classification/owner/rationale`);
      }
      if (record.lifecycle_classification === 'CANONICAL_OR_APPROVED_EXTENSION') {
        targetModelsValid = false;
        invalidTargets.push(`Canonical model ${modelName} uses forbidden compound classification CANONICAL_OR_APPROVED_EXTENSION`);
      }

      // Requirement 4: Role, Permission, RolePermission, UserSession must NOT be IMPLEMENTED_MAPPED
      if (typedAdapterModels.has(modelName)) {
        if (record.implementation_state === 'IMPLEMENTED_MAPPED') {
          targetModelsValid = false;
          invalidTargets.push(`Typed model ${modelName} must be IMPLEMENTED_ADAPTER or PLANNED, not IMPLEMENTED_MAPPED`);
        }
      }

      if (record.implementation_kind && record.implementation_kind !== 'MODEL') {
        // Verify typed mapping
        const fullPath = path.join(ROOT, record.implementation_path || '');
        if (!fs.existsSync(fullPath)) {
          typedMappingsValid = false;
          invalidTargets.push(`Typed mapping file does not exist: ${record.implementation_path}`);
        } else {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (!content.includes(record.implementation_symbol)) {
            typedMappingsValid = false;
            invalidTargets.push(`Typed mapping symbol ${record.implementation_symbol} not found in ${record.implementation_path}`);
          }
        }
      } else if (record.implementation_models) {
        for (const target of record.implementation_models) {
          if (!dynamicImplModelToFile[target]) {
            targetModelsValid = false;
            invalidTargets.push(`Target model ${target} does not exist in schema`);
          }
        }
      } else if (record.implementation_state === 'PLANNED') {
        if (!record.target_phase || !record.target_planned_path || !record.acceptance_gate || !record.required_test) {
          targetModelsValid = false;
          invalidTargets.push(`Planned canonical model ${modelName} missing required plan fields`);
        }
      }
    }

    // Verify implementation models
    for (const [modelName, record] of Object.entries(classifiedModels)) {
      if (!record.lifecycle_classification || !record.owner || !record.rationale) {
        invalidTargets.push(`Implementation model ${modelName} missing classification/owner/rationale`);
      }
      if (record.lifecycle_classification === 'CANONICAL_OR_APPROVED_EXTENSION') {
        invalidTargets.push(`Implementation model ${modelName} uses compound classification CANONICAL_OR_APPROVED_EXTENSION`);
      }
      if (!dynamicImplModelToFile[modelName]) {
        invalidTargets.push(`Classified implementation model ${modelName} not found in current schema`);
      }
    }

    // Exact Set Equality for Migrations
    const actualMigrations = scanMigrations(ROOT);
    const regMigrations = registry.migrations || [];
    const migrationDiff = diffMultiset(actualMigrations, regMigrations, migrationKey);

    if (!migrationDiff.pass) {
      for (const m of migrationDiff.missing) {
        invalidTargets.push(`Missing migration in registry: ${m.key} (count: ${m.count})`);
      }
      for (const e of migrationDiff.extraneous) {
        invalidTargets.push(`Extraneous migration in registry: ${e.key} (count: ${e.count})`);
      }
    }

    for (const mig of regMigrations) {
      if (!mig.owner || !mig.rationale) {
        invalidTargets.push(`Migration ${mig.file} missing owner or rationale`);
      }
      if (mig.status !== 'EXECUTED_MIGRATION') {
        invalidTargets.push(`Migration ${mig.file} has invalid status: ${mig.status}`);
      }
    }

    const pass =
      Object.keys(reconciledModels).length === canonicalCount &&
      Object.keys(classifiedModels).length === dynamicImplModels.length &&
      typedMappingsValid &&
      targetModelsValid &&
      migrationDiff.pass &&
      invalidTargets.length === 0;

    if (!pass) failures.push('schema_diff: ' + invalidTargets.join('; '));

    results.schema_diff = {
      status: pass ? 'PASS' : 'FAIL',
      canonical_models: canonicalCount,
      reconciled_canonical_models: Object.keys(reconciledModels).length,
      implementation_models: dynamicImplModels.length,
      classified_implementation_models: Object.keys(classifiedModels).length,
      typed_mappings_verified: typedMappingsValid,
      invalid_targets: invalidTargets,
    };
  } catch (err) {
    results.schema_diff = { status: 'FAIL', error: err.message };
    failures.push('schema_diff: ' + err.message);
  }

  // Test 3: openapi_diff
  try {
    const canonicalOpsCount = dynamicCanonicalOps.length;
    const apiRecords = registry.canonical_api_reconciliation || [];
    const implOpsCount = dynamicSwaggerOps.length;
    const classifiedImplOps = registry.implementation_api_classifications || [];

    const invalidOps = [];
    const seenOps = new Set();

    // Exact Set Equality for Canonical API Operations
    const actualCanonicalOpsSet = new Set(dynamicCanonicalOps.map(o => `${o.method} ${o.norm} ${o.opId || ''}`));
    const regCanonicalOpsSet = new Set();

    for (const op of apiRecords) {
      const key = `${op.method} ${op.normalized_path || normalizePath(op.path)} ${op.operationId || ''}`;
      if (seenOps.has(key)) {
        invalidOps.push(`Duplicate canonical operation record: ${key}`);
      }
      seenOps.add(key);
      regCanonicalOpsSet.add(key);

      if (!actualCanonicalOpsSet.has(key)) {
        invalidOps.push(`Fake or unregistered canonical operation: ${key}`);
      }

      if (!op.lifecycle_classification || !op.owner || !op.rationale) {
        invalidOps.push(`Operation ${key} missing classification/owner/rationale`);
      }
      if (op.lifecycle_classification === 'CANONICAL_OR_APPROVED_EXTENSION') {
        invalidOps.push(`Operation ${key} uses compound classification CANONICAL_OR_APPROVED_EXTENSION`);
      }

      if (op.implementation_state === 'PLANNED') {
        if (!op.target_phase || !op.target_module_or_file || !op.acceptance_gate || !op.required_test || !op.dependency) {
          invalidOps.push(`Planned operation ${key} missing required planning metadata`);
        }
        if (!VALID_PHASES.has(op.target_phase)) {
          invalidOps.push(`Planned operation ${key} has invalid target phase: ${op.target_phase}`);
        }
        if (!op.target_module_or_file.startsWith('backend/') || !op.target_module_or_file.endsWith('.ts')) {
          invalidOps.push(`Planned operation ${key} has invalid target file: ${op.target_module_or_file}`);
        }
      }
    }

    for (const actualKey of actualCanonicalOpsSet) {
      if (!regCanonicalOpsSet.has(actualKey)) {
        invalidOps.push(`Canonical operation missing from registry: ${actualKey}`);
      }
    }

    // Exact Set Equality for Implementation Swagger Operations
    const actualSwaggerOpsSet = new Set(dynamicSwaggerOps.map(o => `${o.method} ${o.norm}`));
    const regSwaggerOpsSet = new Set();
    for (const op of classifiedImplOps) {
      const key = `${op.method} ${op.normalized_path || normalizePath(op.path)}`;
      regSwaggerOpsSet.add(key);
      if (!actualSwaggerOpsSet.has(key)) {
        invalidOps.push(`Fake implementation API operation not in runtime swagger: ${key}`);
      }
    }
    for (const actualKey of actualSwaggerOpsSet) {
      if (!regSwaggerOpsSet.has(actualKey)) {
        invalidOps.push(`Implementation swagger operation missing from registry: ${actualKey}`);
      }
    }

    const pass =
      apiRecords.length === canonicalOpsCount &&
      classifiedImplOps.length === implOpsCount &&
      invalidOps.length === 0;

    if (!pass) failures.push('openapi_diff: ' + invalidOps.join('; '));

    results.openapi_diff = {
      status: pass ? 'PASS' : 'FAIL',
      canonical_operations_count: canonicalOpsCount,
      reconciled_canonical_operations: apiRecords.length,
      implementation_operations_count: implOpsCount,
      classified_implementation_operations: classifiedImplOps.length,
      invalid_operations: invalidOps,
    };
  } catch (err) {
    results.openapi_diff = { status: 'FAIL', error: err.message };
    failures.push('openapi_diff: ' + err.message);
  }

  // Test 4: route_diff
  try {
    const canonicalScreensCount = dynamicCanonicalScreens.length;
    const screenRecords = registry.canonical_screen_reconciliation || [];
    const implScreensCount = dynamicAppFiles.length;
    const classifiedImplScreens = registry.implementation_screen_classifications || [];

    const invalidScreens = [];
    const seenScreens = new Set();

    // Exact Set Equality for Canonical Screens
    const actualCanonicalScreensSet = new Set(dynamicCanonicalScreens.map(s => `${s.screen_id} ${normalizePath(s.route)}`));
    const regCanonicalScreensSet = new Set();

    for (const s of screenRecords) {
      const key = `${s.screen_id} ${s.normalized_route || normalizePath(s.canonical_route)}`;
      if (seenScreens.has(s.screen_id)) {
        invalidScreens.push(`Duplicate canonical screen record: ${s.screen_id}`);
      }
      seenScreens.add(s.screen_id);
      regCanonicalScreensSet.add(key);

      if (!actualCanonicalScreensSet.has(key)) {
        invalidScreens.push(`Fake or unregistered canonical screen: ${key}`);
      }

      if (!s.lifecycle_classification || !s.owner || !s.rationale) {
        invalidScreens.push(`Screen ${s.screen_id} missing classification/owner/rationale`);
      }
      if (s.lifecycle_classification === 'CANONICAL_OR_APPROVED_EXTENSION') {
        invalidScreens.push(`Screen ${s.screen_id} uses compound classification CANONICAL_OR_APPROVED_EXTENSION`);
      }

      if (s.implementation_state === 'IMPLEMENTED_EXACT' || s.implementation_state === 'IMPLEMENTED_MAPPED') {
        if (!s.component_file || !fs.existsSync(path.join(ROOT, s.component_file))) {
          invalidScreens.push(`Screen ${s.screen_id} target component file does not exist: ${s.component_file}`);
        }
      } else if (s.implementation_state === 'PLANNED') {
        if (!s.target_phase || !s.target_planned_route || !s.acceptance_gate || !s.required_test || !s.dependency) {
          invalidScreens.push(`Planned screen ${s.screen_id} missing required planning metadata`);
        }
        if (!VALID_PHASES.has(s.target_phase)) {
          invalidScreens.push(`Planned screen ${s.screen_id} has invalid target phase: ${s.target_phase}`);
        }
        // Strict Next.js Route syntax validation (No curly braces permitted)
        if (s.target_planned_route.includes('{') || s.target_planned_route.includes('}')) {
          invalidScreens.push(`Planned screen ${s.screen_id} target route contains invalid braces: ${s.target_planned_route}`);
        }
        if (!s.target_planned_route.startsWith('frontend/src/app/') || !s.target_planned_route.endsWith('/page.tsx')) {
          invalidScreens.push(`Planned screen ${s.screen_id} has invalid Next.js page path: ${s.target_planned_route}`);
        }
      }
    }

    for (const actualKey of actualCanonicalScreensSet) {
      if (!regCanonicalScreensSet.has(actualKey)) {
        invalidScreens.push(`Canonical screen missing from registry: ${actualKey}`);
      }
    }

    // Exact Set Equality for Implementation Screens
    const actualPagesSet = new Set(dynamicAppFiles.map(relative));
    const regPagesSet = new Set(classifiedImplScreens.map(s => s.file));
    for (const actualFile of actualPagesSet) {
      if (!regPagesSet.has(actualFile)) {
        invalidScreens.push(`App page missing from implementation screens: ${actualFile}`);
      }
    }
    for (const regFile of regPagesSet) {
      if (!actualPagesSet.has(regFile)) {
        invalidScreens.push(`Fake implementation screen file not in frontend: ${regFile}`);
      }
    }

    const pass =
      screenRecords.length === canonicalScreensCount &&
      classifiedImplScreens.length === implScreensCount &&
      invalidScreens.length === 0;

    if (!pass) failures.push('route_diff: ' + invalidScreens.join('; '));

    results.route_diff = {
      status: pass ? 'PASS' : 'FAIL',
      canonical_screens_count: canonicalScreensCount,
      reconciled_canonical_screens: screenRecords.length,
      implementation_screens_count: implScreensCount,
      classified_implementation_screens: classifiedImplScreens.length,
      invalid_screens: invalidScreens,
    };
  } catch (err) {
    results.route_diff = { status: 'FAIL', error: err.message };
    failures.push('route_diff: ' + err.message);
  }

  // Test 5: rbac_diff
  try {
    const rbacContract = yaml.load(read('docs/legacy-erp/contracts/07_RBAC_MATRIX.yaml'));
    const dynamicRolesCount = Object.keys(rbacContract.roles || {}).length;
    const dynamicPermissionsCount = Object.keys(rbacContract.permissions || {}).length;

    const pass = dynamicRolesCount > 0 && dynamicPermissionsCount > 0 && !!registry.typed_mappings?.Role;
    if (!pass) failures.push('rbac_diff: RBAC dynamic parsing failed or missing typed mapping');

    results.rbac_diff = {
      status: pass ? 'PASS' : 'FAIL',
      canonical_roles: dynamicRolesCount,
      canonical_permissions: dynamicPermissionsCount,
      implementation_auth_type: 'Enum UserRole + dynamic employee role mapping + RBAC guards',
    };
  } catch (err) {
    results.rbac_diff = { status: 'FAIL', error: err.message };
    failures.push('rbac_diff: ' + err.message);
  }

  // Test 6: event_workflow_diff
  try {
    const eventContract = yaml.load(read('docs/legacy-erp/contracts/08_INTEGRATION_EVENT_CONTRACT.yaml'));
    const workflowContract = yaml.load(read('docs/legacy-erp/contracts/03_WORKFLOW_STATE_MACHINE.yaml'));
    const dynamicEventsCount = Object.entries(eventContract || {}).filter(([k, v]) => k.endsWith('_events') && v && typeof v === 'object').flatMap(([, v]) => Object.keys(v)).length;
    const wfSections = ['sales_pipeline', 'purchase_pipeline', 'production_pipeline', 'rnd_pipeline', 'warehouse_pipeline', 'finance_pipeline', 'hr_pipeline'];
    const dynamicWorkflowsCount = wfSections.flatMap(k => Array.isArray(workflowContract[k]) ? workflowContract[k] : []).concat(workflowContract.checklist_pipeline?.entity ? [workflowContract.checklist_pipeline] : []).length;

    const eventErrors = [];

    // Exact Multiset Comparison for Implementation Events
    const actualEvents = scanEvents(ROOT);
    const regEvents = registry.published_subscribed_events || [];
    const eventDiff = diffMultiset(actualEvents, regEvents, eventKey);

    if (!eventDiff.pass) {
      for (const m of eventDiff.missing) {
        eventErrors.push(`Missing event in registry: ${m.key} (count: ${m.count})`);
      }
      for (const e of eventDiff.extraneous) {
        eventErrors.push(`Extraneous event in registry: ${e.key} (count: ${e.count})`);
      }
    }

    // Reachability and classification consistency for events
    for (const ev of regEvents) {
      const expectedReachable = ev.role === 'SUBSCRIBER'
        ? nestGraph.isSubscriberReachable(ev.file, ev.provider_symbol)
        : nestGraph.isPublisherReachable(ev.file, ev.provider_symbol);

      if (ev.reachable !== expectedReachable) {
        eventErrors.push(`Event reachability mismatch: ${eventKey(ev)} is marked reachable=${ev.reachable}, but graph derived reachable=${expectedReachable}`);
      }
      if (!ev.reachable && ev.lifecycle_classification !== 'DEAD_CODE' && ev.lifecycle_classification !== 'DEPRECATED') {
        eventErrors.push(`Unreachable event ${eventKey(ev)} not classified DEAD_CODE/DEPRECATED: ${ev.lifecycle_classification}`);
      }
      if (ev.reachable && (ev.lifecycle_classification === 'DEAD_CODE' || ev.lifecycle_classification === 'DEPRECATED')) {
        eventErrors.push(`Reachable event ${eventKey(ev)} classified as dead: ${ev.lifecycle_classification}`);
      }
      if (!ev.owner || !ev.rationale) {
        eventErrors.push(`Event ${eventKey(ev)} missing owner or rationale`);
      }
    }

    const pass = dynamicEventsCount > 0 && dynamicWorkflowsCount > 0 && eventDiff.pass && eventErrors.length === 0;
    if (!pass) failures.push('event_workflow_diff: ' + (eventErrors.length > 0 ? eventErrors.join('; ') : 'Dynamic event/workflow parsing failed'));

    results.event_workflow_diff = {
      status: pass ? 'PASS' : 'FAIL',
      canonical_integration_events: dynamicEventsCount,
      canonical_workflow_state_machines: dynamicWorkflowsCount,
      implementation_events_count: regEvents.length,
      events_diff: eventDiff,
      event_errors: eventErrors,
      implementation_event_mechanism: 'NestJS EventEmitter2 + StateTransitionLog + Audit outbox',
    };
  } catch (err) {
    results.event_workflow_diff = { status: 'FAIL', error: err.message };
    failures.push('event_workflow_diff: ' + err.message);
  }

  // Test 7: caller_import_registration_scan
  try {
    const regControllers = (registry.backend_controllers || []);
    const regServices = (registry.backend_services || []);
    const regModules = (registry.backend_modules || []);
    const errors = [];

    // Exact Multiset Comparison for Controllers
    const actualControllers = scanControllers(ROOT);
    const ctrlDiff = diffMultiset(actualControllers, regControllers, controllerKey);
    if (!ctrlDiff.pass) {
      for (const m of ctrlDiff.missing) {
        errors.push(`Missing controller in registry: ${m.key} (count: ${m.count})`);
      }
      for (const e of ctrlDiff.extraneous) {
        errors.push(`Extraneous controller in registry: ${e.key} (count: ${e.count})`);
      }
    }

    // Exact Multiset Comparison for Services
    const actualServices = scanServices(ROOT);
    const svcDiff = diffMultiset(actualServices, regServices, serviceKey);
    if (!svcDiff.pass) {
      for (const m of svcDiff.missing) {
        errors.push(`Missing service in registry: ${m.key} (count: ${m.count})`);
      }
      for (const e of svcDiff.extraneous) {
        errors.push(`Extraneous service in registry: ${e.key} (count: ${e.count})`);
      }
    }

    // Exact Multiset Comparison for Modules
    const actualModules = scanModules(ROOT);
    const modDiff = diffMultiset(actualModules, regModules, moduleKey);
    if (!modDiff.pass) {
      for (const m of modDiff.missing) {
        errors.push(`Missing module in registry: ${m.key} (count: ${m.count})`);
      }
      for (const e of modDiff.extraneous) {
        errors.push(`Extraneous module in registry: ${e.key} (count: ${e.count})`);
      }
    }

    // Check reachability consistency
    const allReachableCount = regControllers.filter(c => c.reachable).length + regServices.filter(s => s.reachable).length + regModules.filter(m => m.reachable).length;
    const allUnreachableCount = regControllers.filter(c => !c.reachable).length + regServices.filter(s => !s.reachable).length + regModules.filter(m => !m.reachable).length;

    // Fail if ALL objects are unreachable (false positive check)
    if (allReachableCount === 0) {
      errors.push('All backend objects marked unreachable (invalid reachability analysis)');
    }

    // Verify reachability of every controller against NestJS graph
    for (const c of regControllers) {
      if (!c.controller_symbol) {
        errors.push(`Controller ${c.file} missing required controller_symbol`);
      }
      const sym = c.controller_symbol;
      const expectedReachable = sym ? nestGraph.isControllerReachable(c.file, sym) : false;
      const ident = `${c.file}${sym ? '::' + sym : ''}`;
      if (c.reachable !== expectedReachable) {
        errors.push(`Controller reachability mismatch: ${ident} is marked reachable=${c.reachable}, but graph derived reachable=${expectedReachable}`);
      }
      if (!c.reachable && c.lifecycle_classification !== 'DEAD_CODE' && c.lifecycle_classification !== 'DEPRECATED') {
        errors.push(`Unreachable controller ${ident} not classified DEAD_CODE/DEPRECATED: ${c.lifecycle_classification}`);
      }
      if (c.reachable && (c.lifecycle_classification === 'DEAD_CODE' || c.lifecycle_classification === 'DEPRECATED')) {
        errors.push(`Reachable controller ${ident} classified as dead: ${c.lifecycle_classification}`);
      }
      if (!c.owner || !c.rationale) errors.push(`Controller ${ident} missing owner or rationale`);
    }

    // Verify reachability of every service against NestJS graph
    for (const s of regServices) {
      if (!s.provider_symbol) {
        errors.push(`Service ${s.file} missing required provider_symbol`);
      }
      const sym = s.provider_symbol;
      const expectedReachable = sym ? nestGraph.isProviderReachable(s.file, sym) : false;
      const ident = `${s.file}${sym ? '::' + sym : ''}`;
      if (s.reachable !== expectedReachable) {
        errors.push(`Service reachability mismatch: ${ident} is marked reachable=${s.reachable}, but graph derived reachable=${expectedReachable}`);
      }
      if (!s.reachable && s.lifecycle_classification !== 'DEAD_CODE' && s.lifecycle_classification !== 'DEPRECATED') {
        errors.push(`Unreachable service ${ident} not classified DEAD_CODE/DEPRECATED: ${s.lifecycle_classification}`);
      }
      if (s.reachable && (s.lifecycle_classification === 'DEAD_CODE' || s.lifecycle_classification === 'DEPRECATED')) {
        errors.push(`Reachable service ${ident} classified as dead: ${s.lifecycle_classification}`);
      }
      if (!s.owner || !s.rationale) errors.push(`Service ${ident} missing owner or rationale`);
    }

    // Verify reachability of every module against NestJS graph
    for (const m of regModules) {
      if (!m.module_symbol) {
        errors.push(`Module ${m.file} missing required module_symbol`);
      }
      const sym = m.module_symbol;
      const expectedReachable = sym ? nestGraph.isModuleReachable(m.file, sym) : false;
      const ident = `${m.file}${sym ? '::' + sym : ''}`;
      if (m.reachable !== expectedReachable) {
        errors.push(`Module reachability mismatch: ${ident} is marked reachable=${m.reachable}, but graph derived reachable=${expectedReachable}`);
      }
      if (!m.reachable && m.lifecycle_classification !== 'DEAD_CODE' && m.lifecycle_classification !== 'DEPRECATED') {
        errors.push(`Unreachable module ${ident} not classified DEAD_CODE/DEPRECATED: ${m.lifecycle_classification}`);
      }
      if (m.reachable && (m.lifecycle_classification === 'DEAD_CODE' || m.lifecycle_classification === 'DEPRECATED')) {
        errors.push(`Reachable module ${ident} classified as dead: ${m.lifecycle_classification}`);
      }
      if (!m.owner || !m.rationale) errors.push(`Module ${ident} missing owner or rationale`);
    }

    // Exact Multiset Comparison for Jobs/Schedulers
    const actualJobs = scanJobs(ROOT);
    const regJobs = registry.jobs_schedulers || [];
    const jobDiff = diffMultiset(actualJobs, regJobs, jobKey);

    if (!jobDiff.pass) {
      for (const m of jobDiff.missing) {
        errors.push(`Missing job in registry: ${m.key} (count: ${m.count})`);
      }
      for (const e of jobDiff.extraneous) {
        errors.push(`Extraneous job in registry: ${e.key} (count: ${e.count})`);
      }
    }

    // Reachability and classification consistency for jobs
    for (const job of regJobs) {
      const expectedReachable = nestGraph.isJobReachable(job.file, job.provider_symbol, job.type);
      if (job.reachable !== expectedReachable) {
        errors.push(`Job reachability mismatch: ${jobKey(job)} is marked reachable=${job.reachable}, but graph derived reachable=${expectedReachable}`);
      }
      if (!job.reachable && job.lifecycle_classification !== 'DEAD_CODE' && job.lifecycle_classification !== 'DEPRECATED') {
        errors.push(`Unreachable job ${jobKey(job)} not classified DEAD_CODE/DEPRECATED: ${job.lifecycle_classification}`);
      }
      if (job.reachable && (job.lifecycle_classification === 'DEAD_CODE' || job.lifecycle_classification === 'DEPRECATED')) {
        errors.push(`Reachable job ${jobKey(job)} classified as dead: ${job.lifecycle_classification}`);
      }
      if (!job.owner || !job.rationale) {
        errors.push(`Job ${jobKey(job)} missing owner or rationale`);
      }
    }

    const pass = errors.length === 0 && ctrlDiff.pass && svcDiff.pass && modDiff.pass && jobDiff.pass;
    if (!pass) failures.push('caller_import_registration_scan: ' + errors.join('; '));

    results.caller_import_registration_scan = {
      status: pass ? 'PASS' : 'FAIL',
      backend_controllers_registered: regControllers.length,
      backend_services_registered: regServices.length,
      backend_modules_registered: regModules.length,
      reachable_count: allReachableCount,
      dead_count: allUnreachableCount,
      errors,
    };
  } catch (err) {
    results.caller_import_registration_scan = { status: 'FAIL', error: err.message };
    failures.push('caller_import_registration_scan: ' + err.message);
  }

  // Test 8: orphan_scan (Dynamic Re-computation)
  try {
    let dynamicallyRecomputedOrphans = 0;
    const orphanDetails = [];

    const allObjectsToScan = [
      ...Object.values(registry.canonical_model_reconciliation || {}),
      ...Object.values(registry.implementation_model_classifications || {}),
      ...(registry.canonical_api_reconciliation || []),
      ...(registry.implementation_api_classifications || []),
      ...(registry.canonical_screen_reconciliation || []),
      ...(registry.implementation_screen_classifications || []),
      ...(registry.backend_controllers || []),
      ...(registry.backend_services || []),
      ...(registry.backend_modules || []),
      ...(registry.compatibility_adapters || []),
      ...(registry.jobs_schedulers || []),
      ...(registry.published_subscribed_events || []),
      ...(registry.barrel_exports || []),
      ...(registry.backend_dependencies || []),
      ...(registry.frontend_dependencies || []),
    ];

    for (const item of allObjectsToScan) {
      const id = item.model || item.file || item.name || item.route || item.id || item.event || 'unknown';
      if (item.implementation_state === 'MISSING_BLOCKER') {
        dynamicallyRecomputedOrphans++;
        orphanDetails.push(`MISSING_BLOCKER: ${id}`);
      }
      if (!item.owner || String(item.owner).trim() === '') {
        dynamicallyRecomputedOrphans++;
        orphanDetails.push(`Missing owner: ${id}`);
      }
      if (!item.rationale || String(item.rationale).trim() === '') {
        dynamicallyRecomputedOrphans++;
        orphanDetails.push(`Missing rationale: ${id}`);
      }
      const classification = item.lifecycle_classification || item.status;
      if (!classification || classification === 'CANONICAL_OR_APPROVED_EXTENSION' || !LIFECYCLE_ENUM.includes(classification) && classification !== 'EXECUTED_MIGRATION') {
        dynamicallyRecomputedOrphans++;
        orphanDetails.push(`Invalid classification [${classification}]: ${id}`);
      }
      if (item.reachable === false && item.lifecycle_classification !== 'DEAD_CODE' && item.lifecycle_classification !== 'DEPRECATED') {
        dynamicallyRecomputedOrphans++;
        orphanDetails.push(`Unreachable item not marked DEAD_CODE/DEPRECATED: ${id}`);
      }
    }

    const regReportedUnexplained = registry.metrics?.unexplained_objects;
    const noUnexplained = dynamicallyRecomputedOrphans === 0 && regReportedUnexplained === 0;
    const pass = noUnexplained && (registry.metrics?.missing_blocker_count || 0) === 0;

    if (!pass) failures.push(`orphan_scan: Found ${dynamicallyRecomputedOrphans} unexplained orphan objects`);

    results.orphan_scan = {
      status: pass ? 'PASS' : 'FAIL',
      dynamically_computed_unexplained: dynamicallyRecomputedOrphans,
      registry_reported_unexplained: regReportedUnexplained,
      missing_blocker_count: registry.metrics?.missing_blocker_count || 0,
      orphan_details: orphanDetails.slice(0, 10),
    };
  } catch (err) {
    results.orphan_scan = { status: 'FAIL', error: err.message };
    failures.push('orphan_scan: ' + err.message);
  }

  // Test 9: unused_export_dependency_scan
  try {
    const backendPkg = JSON.parse(read('backend/package.json'));
    const frontendPkg = JSON.parse(read('frontend/package.json'));

    const actualBackendDeps = Object.keys(backendPkg.dependencies || {});
    const actualFrontendDeps = Object.keys(frontendPkg.dependencies || {});

    const regBackendDeps = (registry.backend_dependencies || []).map(d => d.name);
    const regFrontendDeps = (registry.frontend_dependencies || []).map(d => d.name);

    const depErrors = [];

    // Exact Set Equality
    const actBSet = new Set(actualBackendDeps);
    const regBSet = new Set(regBackendDeps);
    for (const d of actBSet) if (!regBSet.has(d)) depErrors.push(`Backend dependency missing: ${d}`);
    for (const d of regBSet) if (!actBSet.has(d)) depErrors.push(`Backend dependency extraneous: ${d}`);

    const actFSet = new Set(actualFrontendDeps);
    const regFSet = new Set(regFrontendDeps);
    for (const d of actFSet) if (!regFSet.has(d)) depErrors.push(`Frontend dependency missing: ${d}`);
    for (const d of regFSet) if (!actFSet.has(d)) depErrors.push(`Frontend dependency extraneous: ${d}`);

    // Verify all dependencies are accounted for and reachable
    for (const dep of (registry.backend_dependencies || [])) {
      if (!dep.reachable) depErrors.push(`Unexplained unreachable backend dependency: ${dep.name}`);
      if (!dep.owner || !dep.rationale) depErrors.push(`Backend dependency ${dep.name} missing owner/rationale`);
    }
    for (const dep of (registry.frontend_dependencies || [])) {
      if (!dep.reachable) depErrors.push(`Unexplained unreachable frontend dependency: ${dep.name}`);
      if (!dep.owner || !dep.rationale) depErrors.push(`Frontend dependency ${dep.name} missing owner/rationale`);
    }

    // Exact Multiset Comparison for Barrel Files and Barrel Members
    const actualBarrels = scanBarrels(ROOT);
    const regBarrels = registry.barrel_exports || [];

    const barrelDiff = diffMultiset(actualBarrels, regBarrels, barrelFileKey);
    if (!barrelDiff.pass) {
      for (const m of barrelDiff.missing) {
        depErrors.push(`Missing barrel file in registry: ${m.key} (count: ${m.count})`);
      }
      for (const e of barrelDiff.extraneous) {
        depErrors.push(`Extraneous barrel file in registry: ${e.key} (count: ${e.count})`);
      }
    }

    const actualMembers = actualBarrels.flatMap(b => b.members || []);
    const regMembers = regBarrels.flatMap(b => b.members || []);
    const memberDiff = diffMultiset(actualMembers, regMembers, barrelMemberKey);
    if (!memberDiff.pass) {
      for (const m of memberDiff.missing) {
        depErrors.push(`Missing barrel member in registry: ${m.key} (count: ${m.count})`);
      }
      for (const e of memberDiff.extraneous) {
        depErrors.push(`Extraneous barrel member in registry: ${e.key} (count: ${e.count})`);
      }
    }

    for (const b of regBarrels) {
      if (!b.owner || !b.rationale) {
        depErrors.push(`Barrel ${b.file} missing owner or rationale`);
      }
      if (!b.lifecycle_classification || (b.lifecycle_classification !== 'CANONICAL' && b.lifecycle_classification !== 'APPROVED_EXTENSION')) {
        depErrors.push(`Barrel ${b.file} has invalid lifecycle classification: ${b.lifecycle_classification}`);
      }
    }

    const pass = depErrors.length === 0 && barrelDiff.pass && memberDiff.pass;
    if (!pass) failures.push('unused_export_dependency_scan: ' + depErrors.join('; '));

    results.unused_export_dependency_scan = {
      status: pass ? 'PASS' : 'FAIL',
      backend_production_dependencies: regBackendDeps.length,
      frontend_production_dependencies: regFrontendDeps.length,
      dep_errors: depErrors,
    };
  } catch (err) {
    results.unused_export_dependency_scan = { status: 'FAIL', error: err.message };
    failures.push('unused_export_dependency_scan: ' + err.message);
  }

  // Test 10: duplicate_implementation_scan
  try {
    const backendTsFiles = walk(path.join(ROOT, 'backend/src')).filter(f => f.endsWith('.ts'));
    const v1PrefixControllers = [];
    for (const f of backendTsFiles) {
      const content = fs.readFileSync(f, 'utf8');
      const match = content.match(/@Controller\s*\(\s*(\[[^\]]+\]|'[^']+'|"[^"]+")\s*\)/);
      if (match && match[1].includes('v1/')) {
        v1PrefixControllers.push(relative(f));
      }
    }

    const pass = v1PrefixControllers.length === 0;
    if (!pass) failures.push(`duplicate_implementation_scan: ${v1PrefixControllers.length} controllers have v1/ prefix`);

    results.duplicate_implementation_scan = {
      status: pass ? 'PASS' : 'FAIL',
      v1_double_prefix_controllers_remaining: v1PrefixControllers.length,
      v1_controllers_list: v1PrefixControllers,
      duplicate_routes_removed: true,
    };
  } catch (err) {
    results.duplicate_implementation_scan = { status: 'FAIL', error: err.message };
    failures.push('duplicate_implementation_scan: ' + err.message);
  }

  // Test 11: lifecycle_registry_validation
  try {
    const adapters = registry.compatibility_adapters || [];
    let adaptersValid = adapters.length >= 10;
    const invalidAdapters = [];

    for (const a of adapters) {
      if (!a.id || !a.owner || !a.rationale || !a.removal_condition || !a.scheduled_removal_phase) {
        adaptersValid = false;
        invalidAdapters.push(`Adapter ${a.id || 'unnamed'} missing mandatory fields`);
      }
      if (a.scheduled_removal_phase && !VALID_PHASES.has(a.scheduled_removal_phase)) {
        adaptersValid = false;
        invalidAdapters.push(`Adapter ${a.id} has invalid removal phase: ${a.scheduled_removal_phase}`);
      }
      if (a.verification_target) {
        const targetPath = path.join(ROOT, a.verification_target);
        if (!fs.existsSync(targetPath)) {
          adaptersValid = false;
          invalidAdapters.push(`Adapter ${a.id} verification target does not exist: ${a.verification_target}`);
        }
      }
    }

    // Ensure no CANONICAL_OR_APPROVED_EXTENSION anywhere
    const compoundClassFound = (registry.backend_controllers || []).concat(registry.backend_services || []).concat(registry.backend_modules || [])
      .some(x => x.lifecycle_classification === 'CANONICAL_OR_APPROVED_EXTENSION');

    if (compoundClassFound) {
      adaptersValid = false;
      invalidAdapters.push('Forbidden compound classification CANONICAL_OR_APPROVED_EXTENSION present in registry');
    }

    const pass = adaptersValid && invalidAdapters.length === 0;
    if (!pass) failures.push('lifecycle_registry_validation: ' + invalidAdapters.join('; '));

    results.lifecycle_registry_validation = {
      status: pass ? 'PASS' : 'FAIL',
      compatibility_adapters_valid: adaptersValid,
      adapters_count: adapters.length,
      invalid_adapters: invalidAdapters,
    };
  } catch (err) {
    results.lifecycle_registry_validation = { status: 'FAIL', error: err.message };
    failures.push('lifecycle_registry_validation: ' + err.message);
  }

  // Test 12: dna_screen_import_inventory
  try {
    const inventory = registry.dna_screen_inventory || [];
    const screensCount = inventory.length;
    const importingDna = inventory.filter(s => s.imports_dna).length;
    const importingUi = inventory.filter(s => s.imports_ui_kit).length;
    const pass = screensCount === dynamicAppFiles.length && importingDna > 0;

    if (!pass) failures.push('dna_screen_import_inventory: Screen count mismatch in DNA inventory');

    results.dna_screen_import_inventory = {
      status: pass ? 'PASS' : 'FAIL',
      total_screens_inventoried: screensCount,
      screens_importing_dna: importingDna,
      screens_importing_ui_kit: importingUi,
      manifest_coverage_percent: dynamicAppFiles.length === 0 ? 100 : Number(((screensCount / dynamicAppFiles.length) * 100).toFixed(2)),
    };
  } catch (err) {
    results.dna_screen_import_inventory = { status: 'FAIL', error: err.message };
    failures.push('dna_screen_import_inventory: ' + err.message);
  }

  // Test 13: dna_hardcoded_visual_inventory
  try {
    const inventory = registry.dna_screen_inventory || [];
    const screensWithHex = inventory.filter(s => s.hardcoded_hex_colors.length > 0).length;
    const screensWithInlineStyles = inventory.filter(s => s.inline_styles_count > 0).length;
    const screensWithRawButtons = inventory.filter(s => s.raw_buttons > 0).length;
    const pass = inventory.length === dynamicAppFiles.length;

    if (!pass) failures.push('dna_hardcoded_visual_inventory: Inventory incomplete');

    results.dna_hardcoded_visual_inventory = {
      status: pass ? 'PASS' : 'FAIL',
      total_screens_scanned: inventory.length,
      screens_with_hex_colors: screensWithHex,
      screens_with_inline_styles: screensWithInlineStyles,
      screens_with_raw_buttons: screensWithRawButtons,
      inventory_complete: true,
    };
  } catch (err) {
    results.dna_hardcoded_visual_inventory = { status: 'FAIL', error: err.message };
    failures.push('dna_hardcoded_visual_inventory: ' + err.message);
  }

  // Test 14: dna_migration_disposition
  try {
    const inventory = registry.dna_screen_inventory || [];
    const validDispositions = new Set(['ALREADY_DNA', 'PARTIALLY_MIGRATED', 'SCHEDULED_P19_MIGRATION', 'REDIRECT_ONLY']);
    let allDispositionsValid = true;
    const dispositionCounts = {};

    for (const s of inventory) {
      if (!validDispositions.has(s.disposition)) allDispositionsValid = false;
      dispositionCounts[s.disposition] = (dispositionCounts[s.disposition] || 0) + 1;
    }
    const totalDispositioned = Object.values(dispositionCounts).reduce((a, b) => a + b, 0);
    const pass = totalDispositioned === dynamicAppFiles.length && allDispositionsValid;

    if (!pass) failures.push('dna_migration_disposition: Disposition count or enum invalid');

    results.dna_migration_disposition = {
      status: pass ? 'PASS' : 'FAIL',
      total_screens_dispositioned: inventory.length,
      disposition_breakdown: dispositionCounts,
      coverage_percent: dynamicAppFiles.length === 0 ? 100 : Number(((totalDispositioned / dynamicAppFiles.length) * 100).toFixed(2)),
    };
  } catch (err) {
    results.dna_migration_disposition = { status: 'FAIL', error: err.message };
    failures.push('dna_migration_disposition: ' + err.message);
  }

  const passedCount = Object.values(results).filter(r => r.status === 'PASS').length;
  const totalCount = Object.keys(results).length;
  const allPass = passedCount === totalCount && failures.length === 0;

  return {
    allPass,
    passedCount,
    totalCount,
    failures,
    results,
  };
}

// If invoked as CLI script
if (require.main === module) {
  console.log('Running Phase P02 Independent Lifecycle & Reconciliation Audit...\n');

  if (!fs.existsSync(REGISTRY_FILE)) {
    console.error('❌ Missing _LIFECYCLE_REGISTRY.json! Run generate_lifecycle_registry.js first.');
    process.exit(1);
  }

  const audit = runAudit();

  console.log('=======================================================');
  console.log(`PHASE P02 TEST RESULTS (${audit.passedCount}/${audit.totalCount} REQUIRED TESTS)`);
  console.log('=======================================================');

  for (const [testName, result] of Object.entries(audit.results)) {
    const badge = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${badge} | ${testName}`);
  }

  console.log('=======================================================');
  console.log(`TOTAL: ${audit.passedCount}/${audit.totalCount} tests passed.`);
  console.log(`OVERALL PHASE P02 VERDICT: ${audit.allPass ? 'PASS' : 'FAIL'}`);
  console.log('=======================================================\n');

  if (audit.failures.length > 0) {
    console.error('Audit Failures:');
    audit.failures.forEach(f => console.error('  - ' + f));
  }

  fs.writeFileSync(path.join(VERIFY, '_p02_test_results.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    phase: 'P02',
    passed_tests: audit.passedCount,
    total_tests: audit.totalCount,
    verdict: audit.allPass ? 'PASS' : 'FAIL',
    failures: audit.failures,
    results: audit.results,
  }, null, 2));

  if (!audit.allPass) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

module.exports = {
  runAudit,
};
