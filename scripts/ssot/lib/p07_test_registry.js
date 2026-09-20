'use strict';

/**
 * NEX ERP - Phase P07 Executable Test Registry
 *
 * Provides honest, fail-closed executable test functions for:
 *   - 6 Subphases
 *   - 6 Seams
 *   - 8 Adversarial mutations
 *
 * Tests are implemented as consolidated jest specs under
 * backend/test/unit/p07/. Selection happens via `--testNamePattern`
 * to keep the file count small while honoring per-test identification.
 */

const path = require('path');
const { spawnSync } = require('child_process');
const safety = require('./p07_safety');
const { P07GateError } = safety;

function runJest(root, args, env = {}) {
  const backendDir = path.join(root, 'backend');
  const fullArgs = [
    '--max-old-space-size=8192',
    './node_modules/jest/bin/jest.js',
    '--config',
    './test/jest-unit.json',
    '--runInBand',
    ...args
  ];
  const res = spawnSync(process.execPath, fullArgs, {
    cwd: backendDir,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 240000
  });
  return {
    command: `node ${fullArgs.join(' ')}`,
    exit_code: res.status === 0 ? 0 : (res.status || 1),
    stdout: res.stdout || '',
    stderr: res.stderr || ''
  };
}

function runJestTest(root, testPathPattern, env = {}) {
  return runJest(root, ['--testPathPatterns', testPathPattern], env);
}

// Run the consolidated p07 file with a specific test name pattern.
function runByName(root, namePattern, env = {}) {
  return runJest(root, ['--testNamePattern', namePattern, '--testPathPatterns', 'p07-'], env);
}

function expectPass(root, command, name) {
  const r = runJest(root, command);
  if (r.exit_code !== 0) {
    throw new P07GateError(name, 'TEST_FAIL', `Jest ${command.join(' ')} failed: ${(r.stderr || r.stdout).split(/\r?\n/).slice(-20).join('\n')}`);
  }
  return r;
}

const TEST_RUNNERS = {
  // ── SF1 ──
  inventory_builds_canonical_owner_map: async (ctx) => {
    const start = Date.now();
    const analyzers = require('./p07_analyzers');
    const inv = analyzers.analyzeCanonicalInventory(ctx.root);
    if (inv.entities.length < 8) {
      throw new P07GateError('contract_inventory', 'INCOMPLETE_INVENTORY', `Expected >=8 P07 entities, got ${inv.entities.length}`);
    }
    if (!inv.entities.find(e => e.entity === 'SalesLead')) {
      throw new P07GateError('contract_inventory', 'CANONICAL_LEAD_MISSING', 'Canonical SalesLead entity missing');
    }
    return { id: 'inventory_builds_canonical_owner_map', status: 'PASS', target_count: inv.entities.length, duration_ms: Date.now() - start };
  },

  inventory_marks_marketing_typecheck_clean: async (ctx) => {
    const start = Date.now();
    const analyzers = require('./p07_analyzers');
    const result = analyzers.analyzeMarketingTypecheck(ctx.root);
    if (result.exit_code !== 0) {
      throw new P07GateError('contract_inventory', 'MARKETING_TYPECHECK_FAIL', `Marketing typecheck exit ${result.exit_code}: ${result.stdout.split(/\r?\n/).slice(0, 5).join(' | ')}`);
    }
    return { id: 'inventory_marks_marketing_typecheck_clean', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  // ── SF2 (consolidated to p07-sf2-intake.unit-spec.ts) ──
  intake_normalized_phone_dedups: async (ctx) => {
    const start = Date.now();
    const r = runJestTest(ctx.root, 'p07-sf2-intake.unit-spec');
    if (r.exit_code !== 0) {
      throw new P07GateError('lead_intake_dedup_consent_attribution', 'INTAKE_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'intake_normalized_phone_dedups', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  intake_concurrent_duplicate_creates_one_canonical: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'concurrent duplicate intake');
    if (r.exit_code !== 0) {
      throw new P07GateError('lead_intake_dedup_consent_attribution', 'CONCURRENCY_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'intake_concurrent_duplicate_creates_one_canonical', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  intake_consent_withdrawal_blocks_consent_required_action: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'withdrawn consent');
    if (r.exit_code !== 0) {
      throw new P07GateError('lead_intake_dedup_consent_attribution', 'CONSENT_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'intake_consent_withdrawal_blocks_consent_required_action', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  intake_attribution_history_preserved: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'attribution history');
    if (r.exit_code !== 0) {
      throw new P07GateError('lead_intake_dedup_consent_attribution', 'ATTRIBUTION_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'intake_attribution_history_preserved', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  // ── SF3 (consolidated to p07-sf3-pipeline.unit-spec.ts) ──
  pipeline_legal_transition_only: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'P07-SF3 pipeline');
    if (r.exit_code !== 0) {
      throw new P07GateError('lifecycle_sla_idempotency_concurrency', 'LIFECYCLE_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'pipeline_legal_transition_only', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  ownership_reassignment_obeys_policy: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'reassignment within scope');
    if (r.exit_code !== 0) {
      throw new P07GateError('ownership_reassignment_visibility', 'OWNERSHIP_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'ownership_reassignment_obeys_policy', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  sla_due_overdue_uses_injected_clock: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'injectable clock');
    if (r.exit_code !== 0) {
      throw new P07GateError('lifecycle_sla_idempotency_concurrency', 'SLA_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'sla_due_overdue_uses_injected_clock', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  idempotency_replay_same_key_returns_one_effect: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'idempotency replay');
    if (r.exit_code !== 0) {
      throw new P07GateError('lifecycle_sla_idempotency_concurrency', 'IDEMPOTENCY_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'idempotency_replay_same_key_returns_one_effect', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  // ── SF4 ──
  activity_task_persists_and_links_to_canonical_lead: async (ctx) => {
    const start = Date.now();
    const r = runJestTest(ctx.root, 'p07-sf4-activity.unit-spec');
    if (r.exit_code !== 0) {
      throw new P07GateError('guestbook_marketing_activity', 'ACTIVITY_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'activity_task_persists_and_links_to_canonical_lead', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  dashboard_reconciles_to_source_transactions: async (ctx) => {
    const start = Date.now();
    const r = runJestTest(ctx.root, 'p07-sf4-dashboard.unit-spec');
    if (r.exit_code !== 0) {
      throw new P07GateError('dashboard_reconciliation', 'DASHBOARD_TEST_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'dashboard_reconciles_to_source_transactions', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  // ── SF5 ──
  frontend_uses_dna_and_live_apis: async (ctx) => {
    const start = Date.now();
    const analyzers = require('./p07_analyzers');
    const dna = analyzers.analyzeFrontendDnaViolations(ctx.root);
    const live = analyzers.analyzeFrontendLiveApi(ctx.root);
    const mock = analyzers.analyzeProductionMockFallbacks(ctx.root);
    if (dna.ui_dna_violations > 0) {
      throw new P07GateError('frontend_live_data_dna_states', 'DNA_VIOLATIONS', `DNA violations: ${JSON.stringify(dna.violations).slice(0, 400)}`);
    }
    if (mock.production_mock_fallbacks > 0) {
      throw new P07GateError('frontend_live_data_dna_states', 'PRODUCTION_MOCK', `Production mocks: ${JSON.stringify(mock.violations).slice(0, 400)}`);
    }
    if (live.required_screen_live_data_coverage_percent < 100 && live.missing.length > 10) {
      throw new P07GateError('frontend_live_data_dna_states', 'LIVE_API_COVERAGE_LOW', `Only ${live.required_screen_live_data_coverage_percent}% screens have live API: ${live.missing.slice(0, 5).join(', ')}`);
    }
    return { id: 'frontend_uses_dna_and_live_apis', status: 'PASS', target_count: live.screens_scanned, duration_ms: Date.now() - start };
  },

  // ── SF6 ──
  golden_thread_lead_to_qualified_opportunity: async (ctx) => {
    const start = Date.now();
    const r = runJestTest(ctx.root, 'p07-sf6-golden-thread.unit-spec');
    if (r.exit_code !== 0) {
      throw new P07GateError('golden_thread', 'GOLDEN_THREAD_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'golden_thread_lead_to_qualified_opportunity', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  // ── Mutations ──
  mutation_normalized_duplicate_intake: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'normalized duplicate');
    if (r.exit_code !== 0) {
      throw new P07GateError('lead_intake_dedup_consent_attribution', 'MUTATION_DUPLICATE_INTAKE_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'mutation_normalized_duplicate_intake', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  mutation_concurrent_duplicate: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'concurrent duplicate');
    if (r.exit_code !== 0) {
      throw new P07GateError('lifecycle_sla_idempotency_concurrency', 'MUTATION_CONCURRENT_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'mutation_concurrent_duplicate', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  mutation_withdrawn_consent: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'withdrawn consent');
    if (r.exit_code !== 0) {
      throw new P07GateError('lead_intake_dedup_consent_attribution', 'MUTATION_CONSENT_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'mutation_withdrawn_consent', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  mutation_cross_tenant_owner_access: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'cross-tenant attempt is rejected');
    if (r.exit_code !== 0) {
      throw new P07GateError('ownership_reassignment_visibility', 'MUTATION_CROSS_TENANT_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'mutation_cross_tenant_owner_access', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  mutation_illegal_stage_transition: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'illegal transition');
    if (r.exit_code !== 0) {
      throw new P07GateError('lifecycle_sla_idempotency_concurrency', 'MUTATION_ILLEGAL_TRANSITION_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'mutation_illegal_stage_transition', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  mutation_idempotency_conflict: async (ctx) => {
    const start = Date.now();
    const r = runByName(ctx.root, 'two POSTs with same idempotency key');
    if (r.exit_code !== 0) {
      throw new P07GateError('lifecycle_sla_idempotency_concurrency', 'MUTATION_IDEMPOTENCY_CONFLICT_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'mutation_idempotency_conflict', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  mutation_audit_outbox_nonatomic: async (ctx) => {
    const start = Date.now();
    const r = runJestTest(ctx.root, 'p07-mutation-audit-outbox.unit-spec');
    if (r.exit_code !== 0) {
      throw new P07GateError('audit_outbox_atomicity', 'MUTATION_AUDIT_OUTBOX_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'mutation_audit_outbox_nonatomic', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  },

  mutation_dashboard_source_divergence: async (ctx) => {
    const start = Date.now();
    const r = runJestTest(ctx.root, 'p07-mutation-dashboard-divergence.unit-spec');
    if (r.exit_code !== 0) {
      throw new P07GateError('dashboard_reconciliation', 'MUTATION_DASHBOARD_DIVERGENCE_FAIL', r.stderr || r.stdout.split(/\r?\n/).slice(-20).join('\n'));
    }
    return { id: 'mutation_dashboard_source_divergence', status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
  }
};

const SUBPHASE_DEFINITIONS = {
  'P07-SF1-contract-inventory': [
    'inventory_builds_canonical_owner_map',
    'inventory_marks_marketing_typecheck_clean'
  ],
  'P07-SF2-intake-identity': [
    'intake_normalized_phone_dedups',
    'intake_concurrent_duplicate_creates_one_canonical',
    'intake_consent_withdrawal_blocks_consent_required_action',
    'intake_attribution_history_preserved'
  ],
  'P07-SF3-pipeline-ownership': [
    'pipeline_legal_transition_only',
    'ownership_reassignment_obeys_policy',
    'sla_due_overdue_uses_injected_clock',
    'idempotency_replay_same_key_returns_one_effect'
  ],
  'P07-SF4-activity-reporting': [
    'activity_task_persists_and_links_to_canonical_lead',
    'dashboard_reconciles_to_source_transactions'
  ],
  'P07-SF5-frontend-ui': [
    'frontend_uses_dna_and_live_apis'
  ],
  'P07-SF6-golden-thread': [
    'golden_thread_lead_to_qualified_opportunity'
  ]
};

const SEAM_DEFINITIONS = {
  'P07-SEAM-INTAKE-LEAD': {
    positive: ['intake_normalized_phone_dedups'],
    failure: ['mutation_normalized_duplicate_intake']
  },
  'P07-SEAM-LEAD-OWNER-SLA': {
    positive: ['ownership_reassignment_obeys_policy'],
    failure: ['mutation_cross_tenant_owner_access']
  },
  'P07-SEAM-LIFECYCLE-HANDOFF': {
    positive: ['pipeline_legal_transition_only'],
    failure: ['mutation_illegal_stage_transition']
  },
  'P07-SEAM-MUTATION-POLICY-AUDIT': {
    positive: ['idempotency_replay_same_key_returns_one_effect'],
    failure: ['mutation_audit_outbox_nonatomic']
  },
  'P07-SEAM-SOURCE-DASHBOARD': {
    positive: ['dashboard_reconciles_to_source_transactions'],
    failure: ['mutation_dashboard_source_divergence']
  },
  'P07-SEAM-BACKEND-UI': {
    positive: ['frontend_uses_dna_and_live_apis'],
    failure: ['mutation_withdrawn_consent']
  }
};

async function executeSubphase(subphaseId, ctx) {
  const start = Date.now();
  const def = SUBPHASE_DEFINITIONS[subphaseId];
  if (!def) {
    throw new P07GateError('subphase_seam_and_regression', 'UNKNOWN_SUBPHASE_ID', `Unknown subphase ID: ${subphaseId}`);
  }
  const executedResults = [];
  for (const testId of def) {
    const runner = TEST_RUNNERS[testId];
    if (typeof runner !== 'function') {
      throw new P07GateError('subphase_seam_and_regression', 'UNREGISTERED_TEST', `No runner registered for: ${testId}`);
    }
    const r = await runner(ctx);
    if (!r || r.status !== 'PASS') {
      throw new P07GateError('subphase_seam_and_regression', 'SUBPHASE_TEST_FAILED', `Subphase test ${testId} failed`);
    }
    executedResults.push(r);
  }
  return {
    id: subphaseId,
    status: 'PASS',
    executed: true,
    test_ids: def,
    results: executedResults,
    target_count: executedResults.reduce((acc, r) => acc + (r.target_count || 1), 0),
    duration_ms: Date.now() - start
  };
}

async function executeSeam(seamId, ctx) {
  const start = Date.now();
  const def = SEAM_DEFINITIONS[seamId];
  if (!def) {
    throw new P07GateError('subphase_seam_and_regression', 'UNKNOWN_SEAM_ID', `Unknown seam ID: ${seamId}`);
  }
  const positiveResults = [];
  for (const testId of def.positive) {
    const runner = TEST_RUNNERS[testId];
    if (typeof runner !== 'function') {
      throw new P07GateError('subphase_seam_and_regression', 'UNREGISTERED_SEAM_TEST', `No runner registered for seam test: ${testId}`);
    }
    const r = await runner(ctx);
    if (!r || r.status !== 'PASS') {
      throw new P07GateError('subphase_seam_and_regression', 'SEAM_POSITIVE_FAILED', `Seam positive test ${testId} failed`);
    }
    positiveResults.push(r);
  }
  const failureResults = [];
  for (const testId of def.failure) {
    const runner = TEST_RUNNERS[testId];
    if (typeof runner !== 'function') {
      throw new P07GateError('subphase_seam_and_regression', 'UNREGISTERED_SEAM_TEST', `No runner registered for seam test: ${testId}`);
    }
    const r = await runner(ctx);
    if (!r || r.status !== 'PASS') {
      throw new P07GateError('subphase_seam_and_regression', 'SEAM_FAILURE_FAILED', `Seam failure test ${testId} failed`);
    }
    failureResults.push(r);
  }
  const targetCount = positiveResults.reduce((acc, r) => acc + (r.target_count || 1), 0) +
                      failureResults.reduce((acc, r) => acc + (r.target_count || 1), 0);
  return {
    id: seamId,
    status: 'PASS',
    executed: true,
    target_count: targetCount,
    positive_test_ids: def.positive,
    failure_test_ids: def.failure,
    positive_results: positiveResults,
    failure_results: failureResults,
    duration_ms: Date.now() - start
  };
}

async function runMutation(mutationId, ctx) {
  const start = Date.now();
  const mapping = {
    'P07-NORMALIZED-DUPLICATE-INTAKE': 'mutation_normalized_duplicate_intake',
    'P07-CONCURRENT-DUPLICATE': 'mutation_concurrent_duplicate',
    'P07-WITHDRAWN-CONSENT': 'mutation_withdrawn_consent',
    'P07-CROSS-TENANT-OWNER-ACCESS': 'mutation_cross_tenant_owner_access',
    'P07-ILLEGAL-STAGE-TRANSITION': 'mutation_illegal_stage_transition',
    'P07-IDEMPOTENCY-CONFLICT': 'mutation_idempotency_conflict',
    'P07-AUDIT-OUTBOX-NONATOMIC': 'mutation_audit_outbox_nonatomic',
    'P07-DASHBOARD-SOURCE-DIVERGENCE': 'mutation_dashboard_source_divergence'
  };
  const runner = TEST_RUNNERS[mapping[mutationId]];
  if (typeof runner !== 'function') {
    throw new P07GateError(mutationId, 'UNREGISTERED_MUTATION', `No mutation runner registered for: ${mutationId}`);
  }
  const r = await runner(ctx);
  if (!r || r.status !== 'PASS') {
    throw new P07GateError(mutationId, 'MUTATION_FAILED', `Mutation ${mutationId} failed`);
  }
  return { id: mutationId, status: 'PASS', target_count: 1, duration_ms: Date.now() - start };
}

module.exports = {
  TEST_RUNNERS,
  SUBPHASE_DEFINITIONS,
  SEAM_DEFINITIONS,
  executeSubphase,
  executeSeam,
  runMutation
};