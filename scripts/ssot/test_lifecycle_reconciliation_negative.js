/**
 * NEX ERP — Phase P02 Negative Test Suite
 * Proves that the independent lifecycle reconciliation audit validator correctly FAILS
 * under 25 distinct violation scenarios, rejecting all false positives.
 * Verifies exact-set identity mismatches, same-count substitutions, duplicates,
 * reachability contradictions, and manipulated summaries.
 */

const fs = require('fs');
const path = require('path');
const { runAudit } = require('./audit_lifecycle_reconciliation');

const ROOT = path.resolve(__dirname, '../..');
const REGISTRY_FILE = path.join(ROOT, 'docs/legacy-erp/verification/_LIFECYCLE_REGISTRY.json');

function cloneRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
}

// Reachability-contradiction fixtures need an object that the registry itself
// reports as unreachable, and the expected failure text names that object. Both
// used to be hardcoded to 'activity-log.service.ts' — a job and an event that
// became reachable when the WA self-QR process was wired in. The fixtures then
// silently degraded: `if (deadJob)` found nothing, mutated nothing, and the case
// failed for the wrong reason. Resolve the targets from the registry once, and
// refuse to run if the premise is gone.
const NEG_BASE = cloneRegistry();
const NEG_DEAD_PROVIDER =
  NEG_BASE.backend_controllers.find(c => !c.reachable) ||
  NEG_BASE.backend_services.find(s => !s.reachable) ||
  NEG_BASE.backend_modules.find(m => !m.reachable);
const NEG_DEAD_EVENT = NEG_BASE.published_subscribed_events.find(e => !e.reachable);

if (!NEG_DEAD_PROVIDER) {
  console.error('FATAL: Negative 21 has no unreachable controller/service/module to flip — the fixture no longer proves anything.');
  process.exit(1);
}
if (!NEG_DEAD_EVENT) {
  console.error('FATAL: Negative 22 has no unreachable event to flip — the fixture no longer proves anything.');
  process.exit(1);
}

function pickDeadProvider(reg) {
  return (
    reg.backend_controllers.find(c => !c.reachable) ||
    reg.backend_services.find(s => !s.reachable) ||
    reg.backend_modules.find(m => !m.reachable)
  );
}

const tests = [
  {
    name: 'Negative 1: Fake canonical API with constant count (exact-set mismatch)',
    mutate: (reg) => {
      const last = reg.canonical_api_reconciliation[reg.canonical_api_reconciliation.length - 1];
      last.path = '/api/fake/nonexistent/endpoint';
      last.normalized_path = '/fake/nonexistent/endpoint';
      last.operationId = 'fake_operation_id';
    },
    expectedFailingGate: 'openapi_diff',
    expectedIdentityInFailure: 'fake/nonexistent/endpoint',
  },
  {
    name: 'Negative 2: Fake canonical screen with constant count (exact-set mismatch)',
    mutate: (reg) => {
      const last = reg.canonical_screen_reconciliation[reg.canonical_screen_reconciliation.length - 1];
      last.screen_id = 'SCR-999';
      last.canonical_route = '/fake/nonexistent/screen';
      last.normalized_route = '/fake/nonexistent/screen';
    },
    expectedFailingGate: 'route_diff',
    expectedIdentityInFailure: 'SCR-999',
  },
  {
    name: 'Negative 3: Target phase P99 in planned canonical API',
    mutate: (reg) => {
      const planned = reg.canonical_api_reconciliation.find(o => o.implementation_state === 'PLANNED');
      if (planned) planned.target_phase = 'P99';
    },
    expectedFailingGate: 'openapi_diff',
    expectedIdentityInFailure: 'P99',
  },
  {
    name: 'Negative 4: Invalid planned target with curly braces in Next.js route',
    mutate: (reg) => {
      const planned = reg.canonical_screen_reconciliation.find(s => s.implementation_state === 'PLANNED');
      if (planned) planned.target_planned_route = 'frontend/src/app/(dashboard)/master/items/{id}/page.tsx';
    },
    expectedFailingGate: 'route_diff',
    expectedIdentityInFailure: '{id}',
  },
  {
    name: 'Negative 5: Entire objects unreachable (all reachable: false)',
    mutate: (reg) => {
      (reg.backend_controllers || []).forEach(c => c.reachable = false);
      (reg.backend_services || []).forEach(s => s.reachable = false);
      (reg.backend_modules || []).forEach(m => m.reachable = false);
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'All backend objects marked unreachable',
  },
  {
    name: 'Negative 6: Fake implementation API with constant count',
    mutate: (reg) => {
      const last = reg.implementation_api_classifications[reg.implementation_api_classifications.length - 1];
      last.path = '/api/fake/impl/endpoint';
      last.normalized_path = '/fake/impl/endpoint';
    },
    expectedFailingGate: 'openapi_diff',
    expectedIdentityInFailure: 'fake/impl/endpoint',
  },
  {
    name: 'Negative 7: Compound classification CANONICAL_OR_APPROVED_EXTENSION',
    mutate: (reg) => {
      reg.backend_controllers[0].lifecycle_classification = 'CANONICAL_OR_APPROVED_EXTENSION';
    },
    expectedFailingGate: 'lifecycle_registry_validation',
    expectedIdentityInFailure: 'CANONICAL_OR_APPROVED_EXTENSION',
  },
  {
    name: 'Negative 8: Target file or symbol missing in typed mapping',
    mutate: (reg) => {
      reg.canonical_model_reconciliation.Role.implementation_path = 'backend/prisma/schema/nonexistent_enums.prisma';
    },
    expectedFailingGate: 'schema_diff',
    expectedIdentityInFailure: 'nonexistent_enums.prisma',
  },
  {
    name: 'Negative 9: Canonical API mapping missing from registry',
    mutate: (reg) => {
      reg.canonical_api_reconciliation.pop();
    },
    expectedFailingGate: 'openapi_diff',
  },
  {
    name: 'Negative 10: Canonical screen mapping missing from registry',
    mutate: (reg) => {
      reg.canonical_screen_reconciliation.pop();
    },
    expectedFailingGate: 'route_diff',
  },
  {
    name: 'Negative 11: Empty classification on implementation object',
    mutate: (reg) => {
      const firstKey = Object.keys(reg.implementation_model_classifications)[0];
      reg.implementation_model_classifications[firstKey].lifecycle_classification = '';
    },
    expectedFailingGate: 'schema_diff',
  },
  {
    name: 'Negative 12: Empty owner on implementation object',
    mutate: (reg) => {
      const firstKey = Object.keys(reg.implementation_model_classifications)[0];
      reg.implementation_model_classifications[firstKey].owner = '';
    },
    expectedFailingGate: 'schema_diff',
  },
  {
    name: 'Negative 13: Compatibility adapter missing removal condition',
    mutate: (reg) => {
      delete reg.compatibility_adapters[0].removal_condition;
    },
    expectedFailingGate: 'lifecycle_registry_validation',
  },
  {
    name: 'Negative 14: Role or Permission falsely marked as IMPLEMENTED_MAPPED instead of IMPLEMENTED_ADAPTER',
    mutate: (reg) => {
      reg.canonical_model_reconciliation.Role.implementation_state = 'IMPLEMENTED_MAPPED';
    },
    expectedFailingGate: 'schema_diff',
    expectedIdentityInFailure: 'IMPLEMENTED_ADAPTER',
  },
  {
    name: 'Negative 15: Summary values manipulated into fake 100% when underlying record is not reconciled',
    mutate: (reg) => {
      const keys = Object.keys(reg.canonical_model_reconciliation);
      reg.canonical_model_reconciliation[keys[0]].reconciled = false;
      reg.metrics.canonical_models.reconciliation_coverage_percent = 100.0;
    },
    expectedFailingGate: 'implementation_readiness_audit',
    expectedIdentityInFailure: 'summary manipulated',
  },
  // -------------------------------------------------------------
  // NEW P02 MULTISET, REACHABILITY & DISCOVERY NEGATIVE TESTS
  // -------------------------------------------------------------
  {
    name: 'Negative 16: Replace a scheduled job with fake job with constant count (exact-set mismatch)',
    mutate: (reg) => {
      const orig = reg.jobs_schedulers[0];
      reg.jobs_schedulers[0] = {
        ...orig,
        file: 'backend/src/fake-job.ts',
        provider_symbol: 'FakeJobService',
      };
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'backend/src/fake-job.ts',
  },
  {
    name: 'Negative 17: Replace a published/subscribed event with fake event with constant count (exact-set mismatch)',
    mutate: (reg) => {
      const orig = reg.published_subscribed_events[0];
      reg.published_subscribed_events[0] = {
        ...orig,
        file: 'backend/src/fake-event.ts',
        event: 'fake.event.emitted',
      };
    },
    expectedFailingGate: 'event_workflow_diff',
    expectedIdentityInFailure: 'backend/src/fake-event.ts',
  },
  {
    name: 'Negative 18: Replace a migration with fake migration with constant count (exact-set mismatch)',
    mutate: (reg) => {
      const orig = reg.migrations[0];
      reg.migrations[0] = {
        ...orig,
        file: 'backend/prisma/migrations/fake/migration.sql',
      };
    },
    expectedFailingGate: 'schema_diff',
    expectedIdentityInFailure: 'backend/prisma/migrations/fake/migration.sql',
  },
  {
    name: 'Negative 19: Replace a barrel file with fake barrel with constant count (exact-set mismatch)',
    mutate: (reg) => {
      const orig = reg.barrel_exports[0];
      reg.barrel_exports[0] = {
        ...orig,
        file: 'backend/src/fake/index.ts',
      };
    },
    expectedFailingGate: 'unused_export_dependency_scan',
    expectedIdentityInFailure: 'backend/src/fake/index.ts',
  },
  {
    name: 'Negative 20: Replace or remove one barrel member while keeping barrel count constant',
    mutate: (reg) => {
      const origMember = reg.barrel_exports[0].members[0];
      reg.barrel_exports[0].members[0] = {
        ...origMember,
        exported_name: 'FakeExportedSymbol',
      };
    },
    expectedFailingGate: 'unused_export_dependency_scan',
    expectedIdentityInFailure: 'FakeExportedSymbol',
  },
  {
    name: 'Negative 21: Mark an unreachable backend object reachable (reachability contradiction)',
    mutate: (reg) => {
      // No job is unreachable any more (all three schedulers are reachable), so
      // this fixture flips whichever provider-class object the registry still
      // reports as unreachable.
      pickDeadProvider(reg).reachable = true;
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: NEG_DEAD_PROVIDER.file,
  },
  {
    name: 'Negative 22: Mark an unreachable subscriber/publisher reachable (reachability contradiction)',
    mutate: (reg) => {
      reg.published_subscribed_events.find(e => !e.reachable).reachable = true;
    },
    expectedFailingGate: 'event_workflow_diff',
    expectedIdentityInFailure: NEG_DEAD_EVENT.file,
  },
  {
    name: 'Negative 23: Remove real barrel from registry without changing summary (manipulated summary / missing record)',
    mutate: (reg) => {
      reg.barrel_exports.pop();
      reg.metrics.implementation_inventory.barrel_exports = reg.barrel_exports.length + 1;
    },
    expectedFailingGate: 'implementation_readiness_audit',
    expectedIdentityInFailure: 'summary manipulated',
  },
  {
    name: 'Negative 24: Duplicate one job record while deleting another, preserving total length',
    mutate: (reg) => {
      const first = reg.jobs_schedulers[0];
      reg.jobs_schedulers[1] = { ...first };
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'Missing job in registry',
  },
  {
    name: 'Negative 25: Duplicate one event record while deleting another, preserving total length',
    mutate: (reg) => {
      const first = reg.published_subscribed_events[0];
      reg.published_subscribed_events[1] = { ...first };
    },
    expectedFailingGate: 'event_workflow_diff',
    expectedIdentityInFailure: 'Missing event in registry',
  },
  {
    name: 'Negative 26: Mutate reachable controller to dead (reachability mismatch)',
    mutate: (reg) => {
      const c = reg.backend_controllers.find(item => item.reachable);
      c.reachable = false;
      c.lifecycle_classification = 'DEAD_CODE';
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'Controller reachability mismatch',
  },
  // Negative 27 (dead controller -> reachable) was removed: it required an
  // unreachable controller to exist in the registry, and after the multi-root
  // reachability fix (self-qr.main.ts bootstraps SelfQrAppModule) all 114
  // controllers are reachable. The claim-reachable/truth-dead direction stays
  // covered by Negative 21 (whichever provider is genuinely unreachable) and
  // Negative 29 (service flavour).
  {
    name: 'Negative 28: Mutate reachable service to dead (reachability mismatch)',
    mutate: (reg) => {
      const s = reg.backend_services.find(item => item.reachable && !item.file.includes('whatsapp') && !item.file.includes('business-metrics'));
      s.reachable = false;
      s.lifecycle_classification = 'DEAD_CODE';
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'Service reachability mismatch',
  },
  {
    name: 'Negative 29: Mutate dead service to reachable (reachability mismatch)',
    mutate: (reg) => {
      const s = reg.backend_services.find(item => !item.reachable && !item.file.includes('activity-log'));
      if (!s) throw new Error('premise missing: no unreachable service to flip');
      s.reachable = true;
      s.lifecycle_classification = 'APPROVED_EXTENSION';
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'Service reachability mismatch',
  },
  {
    name: 'Negative 30: Mutate reachable module to dead (reachability mismatch)',
    mutate: (reg) => {
      const m = reg.backend_modules.find(item => item.reachable);
      m.reachable = false;
      m.lifecycle_classification = 'DEAD_CODE';
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'Module reachability mismatch',
  },
  // Negative 31 (dead module -> reachable) was removed for the same reason as
  // Negative 27: all 77 modules are reachable from one of the two Nest roots, so
  // there is no dead module to flip. Module reachability is still covered in the
  // opposite direction by Negative 30.
  {
    name: 'Negative 32: Mutate controller symbol to FakeController (exact identity violation)',
    mutate: (reg) => {
      const c = reg.backend_controllers[0];
      c.controller_symbol = 'FakeController';
      c.reachable = false;
      c.lifecycle_classification = 'DEAD_CODE';
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'FakeController',
  },
  {
    name: 'Negative 33: Mutate service symbol to FakeService (exact identity violation)',
    mutate: (reg) => {
      const s = reg.backend_services[0];
      s.provider_symbol = 'FakeService';
      s.reachable = false;
      s.lifecycle_classification = 'DEAD_CODE';
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'FakeService',
  },
  {
    name: 'Negative 34: Mutate module symbol to FakeModule (exact identity violation)',
    mutate: (reg) => {
      const m = reg.backend_modules[0];
      m.module_symbol = 'FakeModule';
      m.reachable = false;
      m.lifecycle_classification = 'DEAD_CODE';
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'FakeModule',
  },
  {
    name: 'Negative 35: Remove controller_symbol from record (mandatory schema symbol)',
    mutate: (reg) => {
      delete reg.backend_controllers[0].controller_symbol;
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'missing required controller_symbol',
  },
  {
    name: 'Negative 36: Remove provider_symbol from record (mandatory schema symbol)',
    mutate: (reg) => {
      delete reg.backend_services[0].provider_symbol;
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'missing required provider_symbol',
  },
  {
    name: 'Negative 37: Remove module_symbol from record (mandatory schema symbol)',
    mutate: (reg) => {
      delete reg.backend_modules[0].module_symbol;
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'missing required module_symbol',
  },
  {
    name: 'Negative 38: Append duplicate controller record (exact multiset cardinality violation)',
    mutate: (reg) => {
      reg.backend_controllers.push({ ...reg.backend_controllers[0] });
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'Extraneous controller in registry',
  },
  {
    name: 'Negative 39: Append duplicate service record (exact multiset cardinality violation)',
    mutate: (reg) => {
      reg.backend_services.push({ ...reg.backend_services[0] });
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'Extraneous service in registry',
  },
  {
    name: 'Negative 40: Append duplicate module record (exact multiset cardinality violation)',
    mutate: (reg) => {
      reg.backend_modules.push({ ...reg.backend_modules[0] });
    },
    expectedFailingGate: 'caller_import_registration_scan',
    expectedIdentityInFailure: 'Extraneous module in registry',
  },
];

console.log('=======================================================');
console.log(`PHASE P02 EXPANDED NEGATIVE TEST SUITE (${tests.length}/${tests.length} TESTS)`);
console.log('Proves validator correctly FAILS when constraints are breached');
console.log('=======================================================\n');

let allPassed = true;
let passCount = 0;

for (let i = 0; i < tests.length; i++) {
  const t = tests[i];
  const reg = cloneRegistry();
  // A fixture whose premise no longer holds must be a loud failure, never a
  // silent no-op (that is how Negative 21/22/27/31 rotted) and never an abort
  // that hides the cases behind it.
  try {
    t.mutate(reg);
  } catch (e) {
    console.error(`❌ FAIL | ${t.name}`);
    console.error(`         ↳ Mutation could not be applied: ${e.message}`);
    allPassed = false;
    continue;
  }

  const audit = runAudit(reg);

  const gateFailed = !audit.allPass && audit.results[t.expectedFailingGate]?.status === 'FAIL';
  let identityChecked = true;
  if (t.expectedIdentityInFailure) {
    identityChecked = audit.failures.some(f => f.includes(t.expectedIdentityInFailure));
  }

  const caughtFailure = gateFailed && identityChecked;

  if (caughtFailure) {
    console.log(`✅ PASS | ${t.name}`);
    console.log(`         ↳ Correctly rejected by gate: [${t.expectedFailingGate}]`);
    if (t.expectedIdentityInFailure) {
      console.log(`         ↳ Failure message verified identity: "${t.expectedIdentityInFailure}"`);
    }
    passCount++;
  } else {
    console.error(`❌ FAIL | ${t.name}`);
    console.error(`         ↳ Expected gate [${t.expectedFailingGate}] to FAIL, got status: ${audit.results[t.expectedFailingGate]?.status}`);
    if (t.expectedIdentityInFailure && !identityChecked) {
      console.error(`         ↳ Expected failure message to contain "${t.expectedIdentityInFailure}", but it did not.`);
    }
    if (audit.failures.length > 0) {
      console.error(`         ↳ Audit failures: ${audit.failures.join('; ')}`);
    }
    allPassed = false;
  }
}

console.log('\n=======================================================');
console.log(`TOTAL: ${passCount}/${tests.length} negative tests successfully caught violations.`);
console.log(`NEGATIVE SUITE VERDICT: ${allPassed ? 'PASS' : 'FAIL'}`);
console.log('=======================================================\n');

if (!allPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
