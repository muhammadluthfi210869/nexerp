'use strict';

/**
 * NEX ERP - Phase P04 Canonical Database and Migration Chain Certification
 *
 * Implements certifyP04({ root, contract, candidateSha }) called by the frozen
 * entrypoint scripts/ssot/certify_p04_phase.js.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const safety = require('./p04_safety');
const analyzers = require('./p04_analyzers');
const gates = require('./p04_gates');
const { runAllMutations } = require('../test_p04_database_migrations_negative');
const { P04GateError } = safety;

function assert(condition, message) {
  if (!condition) {
    throw new P04GateError('contract_consistency', 'EVIDENCE_VALIDATION_FAILED', message);
  }
}

/**
 * Internal evidence validator to guarantee frozen-contract compliance before return.
 */
function validateP04Evidence(result, contract) {
  assert(result && typeof result === 'object', 'Missing structured certification result');
  assert(result.phase === 'P04', 'Result phase must be P04');
  assert(result.level === 'PHASE_GATE', 'Result level must be PHASE_GATE');
  assert(result.verdict === 'PASS', 'Result verdict must be PASS');
  assert(result.phase_base_sha === contract.phase_base_sha, 'Base SHA mismatch');
  assert(result.candidate_sha && result.candidate_sha.length === 40, 'Invalid candidate SHA');
  assert(result.synthetic === false, 'Synthetic result is strictly forbidden');
  assert(result.skipped_count === 0, 'Skipped count must be 0');

  // Verify all required checks exist
  assert(Array.isArray(result.checks) && result.checks.length === contract.required_checks.length, `Check count mismatch: expected ${contract.required_checks.length}, got ${result.checks.length}`);
  const checkMap = new Map(result.checks.map(c => [c.id, c]));

  for (const id of contract.required_checks) {
    const c = checkMap.get(id);
    assert(c, `Missing required check: ${id}`);
    assert(c.status === 'PASS', `Check ${id} status is not PASS`);
    assert(c.executed === true, `Check ${id} was not executed`);
    assert(c.synthetic === false, `Check ${id} is marked synthetic`);
    assert(c.skipped === false, `Check ${id} is marked skipped`);
    assert(typeof c.duration_ms === 'number' && c.duration_ms > 0, `Check ${id} missing duration_ms`);
    assert(c.timeout_state === 'NONE', `Check ${id} timeout_state must be NONE`);
    assert(c.phase_base_sha === contract.phase_base_sha, `Check ${id} base SHA mismatch`);
    assert(c.candidate_sha === result.candidate_sha, `Check ${id} candidate SHA mismatch`);
    assert(typeof c.command === 'string' && c.command.length > 0, `Check ${id} missing command`);
    assert(Array.isArray(c.commands) && c.commands.length > 0, `Check ${id} missing commands array`);
    for (const cmd of c.commands) {
      assert(typeof cmd.command === 'string' && cmd.command.length > 0, `Check ${id} invalid command entry`);
      assert(cmd.exit_code === 0, `Check ${id} command exit_code is not 0: ${cmd.command}`);
    }
    assert(typeof c.database === 'string' && c.database.length > 0, `Check ${id} missing database`);
    assert(!c.database.includes('://'), `Check ${id} database must not contain a URL scheme: ${c.database}`);
    assert(!c.database.includes('@'), `Check ${id} database must not contain user-info: ${c.database}`);
    assert(c.host_class === 'loopback', `Check ${id} host_class must be loopback: got ${c.host_class}`);
    assert(c.postgres_major === 15 || c.postgres_major === 16, `Check ${id} postgres_major must be 15 or 16: got ${c.postgres_major}`);
    assert(!c.baseline_db_url, `Check ${id} must not contain baseline_db_url`);
    assert(!c.empty_db_url, `Check ${id} must not contain empty_db_url`);
    assert(!c.dbUrl, `Check ${id} must not contain dbUrl`);
    assert(!c.connection_string, `Check ${id} must not contain connection_string`);
  }

  // Check-specific assertions
  const chk1 = checkMap.get('predecessor_and_target_safety');
  assert(chk1.source_database_fingerprint && chk1.source_database_fingerprint.length === 64, 'Invalid source database fingerprint in check 1');
  assert(chk1.source_database_tables > 0, 'Source database tables count must be > 0');

  const chk4 = checkMap.get('migration_chain_integrity');
  assert(chk4.candidate_migrations_scanned > 0, 'Candidate migrations scanned must be > 0');
  assert(chk4.affected_tables && chk4.affected_tables.length > 0, 'Affected tables must not be empty');

  const chk6 = checkMap.get('baseline_upgrade');
  assert(chk6.baseline_schema_digest && chk6.candidate_schema_digest, 'Missing schema digests in baseline_upgrade');
  assert(Array.isArray(chk6.ledger_before) && Array.isArray(chk6.ledger_after), 'Missing ledger in baseline_upgrade');
  assert(chk6.backfill_digests && chk6.backfill_digests.stable === true, 'Backfill digests must be stable');

  const chk7 = checkMap.get('migration_idempotency');
  assert(chk7.concurrency_verified === true, 'Concurrency must be verified in migration_idempotency');
  assert(chk7.competing_deploy_processes === 2, 'competing_deploy_processes must be 2');
  assert(chk7.candidate_applied_once === true, 'Candidate migration must be applied exactly once');

  const chk8 = checkMap.get('rollback_rehearsal');
  assert(chk8.baseline_schema_digest && chk8.rolled_back_schema_digest, 'Missing rollback schema digests');
  assert(chk8.baseline_fixture_digest && chk8.rolled_back_fixture_digest, 'Missing rollback fixture digests');
  assert(chk8.rollback_and_rollforward_verified === true, 'Rollback and rollforward must be verified');

  const chk11 = checkMap.get('old_new_version_coexistence');
  assert(chk11.coverage_percent === 100, 'Coverage percent must be 100');
  assert(chk11.table_probe_results && typeof chk11.table_probe_results === 'object', 'Missing table_probe_results');
  for (const tbl of chk4.affected_tables) {
    assert(chk11.table_probe_results[tbl], `Missing table probe result for ${tbl}`);
  }

  // Verify all required mutations exist and ran through production paths
  assert(Array.isArray(result.mutations) && result.mutations.length === contract.required_mutations.length, 'Mutation count mismatch');
  const mutMap = new Map(result.mutations.map(m => [m.id, m]));
  for (const id of contract.required_mutations) {
    const m = mutMap.get(id);
    assert(m, `Missing required mutation: ${id}`);
    assert(m.status === 'PASS', `Mutation ${id} status is not PASS`);
    assert(m.production_path === true, `Mutation ${id} production_path must be true`);
    assert(typeof m.gate_function === 'string' && m.gate_function.startsWith('gate'), `Mutation ${id} missing gate_function`);
    assert(typeof m.mutated_target === 'string' && m.mutated_target.length > 0, `Mutation ${id} missing mutated_target`);
    assert(typeof m.gate_id === 'string' && m.gate_id.length > 0, `Mutation ${id} missing gate_id`);
    assert(typeof m.reason_code === 'string' && m.reason_code.length > 0, `Mutation ${id} missing reason_code`);
    assert(typeof m.rejection_reason === 'string' && m.rejection_reason.length > 0, `Mutation ${id} missing rejection_reason`);
  }

  // Verify safety invariants
  assert(result.safety && result.safety.source_database_untouched === true, 'Source database must be untouched');
  assert(Array.isArray(result.safety.created_databases) && result.safety.created_databases.length > 0, 'Created databases list required');
  assert(Array.isArray(result.safety.dropped_databases), 'Dropped databases list required');
  assert(result.safety.created_databases.length === result.safety.dropped_databases.length, `Cleanup residue must be 0: created=${result.safety.created_databases.length}, dropped=${result.safety.dropped_databases.length}`);
  for (const db of result.safety.created_databases) {
    assert(result.safety.dropped_databases.includes(db), `Created database ${db} was not dropped`);
  }

  // Verify thresholds match exactly
  for (const [k, v] of Object.entries(contract.thresholds)) {
    assert(result.metrics && result.metrics[k] === v, `Threshold metric ${k} mismatch: expected ${v}, got ${result.metrics[k]}`);
  }

  // Strict recursive secret assertion across all evidence fields
  safety.assertNoSecrets(result, process.env);
}

async function certifyP04({ root, contract, candidateSha }) {
  const startTime = Date.now();
  const shortSha = candidateSha.slice(0, 8);
  const pid = process.pid;

  // Load backend environment
  const backendDir = path.resolve(root, 'backend');
  const dotenvPath = path.join(backendDir, '.env');
  if (fs.existsSync(dotenvPath)) {
    require(path.join(backendDir, 'node_modules/dotenv')).config({ path: dotenvPath });
  }

  const { Client } = require(path.join(backendDir, 'node_modules/pg'));
  const rawUrl = process.env.P04_TEST_ADMIN_URL || process.env.DATABASE_URL;
  const target = safety.parseAndValidateTargetUrl(rawUrl);

  const adminUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/postgres`;
  const adminClient = new Client({ connectionString: adminUrl });
  adminClient.on('error', () => {});
  await adminClient.connect();

  const sourceUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${target.database}?schema=public`;
  const sourceClient = new Client({ connectionString: sourceUrl });
  sourceClient.on('error', () => {});
  await sourceClient.connect();

  const inventory = safety.createInventory();
  const checks = [];
  const metrics = {
    schema_drift_count: 0,
    failed_or_pending_migrations: 0,
    edited_prebase_migrations: 0,
    unvalidated_constraints: 0,
    invalid_indexes: 0,
    orphan_foreign_keys: 0,
    unexpected_skips: 0,
    data_loss_rows: 0,
    duplicate_or_missing_migration_ids: 0,
    unsafe_contract_ddl: 0,
    compatibility_probe_coverage_percent: 100
  };

  try {
    // Dynamically derive candidate migrations and affected table manifest
    const candidateScope = analyzers.deriveCandidateScope(root, contract.phase_base_sha);

    const ctx = {
      root,
      contract,
      candidateSha,
      shortSha,
      pid,
      target,
      adminClient,
      sourceClient,
      sourceDbName: target.database,
      inventory,
      candidateScope
    };

    // -------------------------------------------------------------------------
    // Gate 1: predecessor_and_target_safety
    // -------------------------------------------------------------------------
    const check1 = await gates.gatePredecessorAndTargetSafety(ctx);
    checks.push(check1);

    // -------------------------------------------------------------------------
    // Gate 2: contract_consistency
    // -------------------------------------------------------------------------
    const check2 = await gates.gateContractConsistency(ctx);
    checks.push(check2);

    // -------------------------------------------------------------------------
    // Gate 3: prisma_validate_generate
    // -------------------------------------------------------------------------
    const check3 = await gates.gatePrismaValidateGenerate(ctx);
    checks.push(check3);

    // -------------------------------------------------------------------------
    // Gate 4: migration_chain_integrity
    // -------------------------------------------------------------------------
    const check4 = await gates.gateMigrationChainIntegrity(ctx);
    checks.push(check4);
    metrics.edited_prebase_migrations = check4.edited_prebase_migrations;

    // -------------------------------------------------------------------------
    // Gate 5: empty_db_migrate
    // -------------------------------------------------------------------------
    const check5 = await gates.gateEmptyDbMigrate(ctx);
    checks.push(check5);
    metrics.schema_drift_count = check5.schema_drift;

    // -------------------------------------------------------------------------
    // Gate 6: baseline_upgrade
    // -------------------------------------------------------------------------
    const check6 = await gates.gateBaselineUpgrade(ctx);
    checks.push(check6);
    metrics.data_loss_rows = check6.data_loss_rows;
    const rawBaselineDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${check6.baseline_db_name}?schema=public`;

    // -------------------------------------------------------------------------
    // Gate 7: migration_idempotency (Concurrency & Idempotency)
    // -------------------------------------------------------------------------
    const check7 = await gates.gateMigrationIdempotency(ctx, rawBaselineDbUrl);
    checks.push(check7);
    metrics.failed_or_pending_migrations = check7.rerun_pending_migrations;

    // -------------------------------------------------------------------------
    // Gate 8: rollback_rehearsal
    // -------------------------------------------------------------------------
    const check8 = await gates.gateRollbackRehearsal(ctx);
    checks.push(check8);

    // -------------------------------------------------------------------------
    // Gate 9: constraint_index_audit
    // -------------------------------------------------------------------------
    const check9 = await gates.gateConstraintIndexAudit(ctx, rawBaselineDbUrl);
    checks.push(check9);
    metrics.unvalidated_constraints = check9.unvalidated_constraints;
    metrics.invalid_indexes = check9.invalid_indexes;
    metrics.orphan_foreign_keys = check9.orphan_foreign_keys;

    // -------------------------------------------------------------------------
    // Gate 10: expand_contract_compatibility
    // -------------------------------------------------------------------------
    const check10 = await gates.gateExpandContractCompatibility(ctx);
    checks.push(check10);
    metrics.unsafe_contract_ddl = check10.unsafe_contract_ddl;

    // -------------------------------------------------------------------------
    // Gate 11: old_new_version_coexistence
    // -------------------------------------------------------------------------
    const check11 = await gates.gateOldNewVersionCoexistence(ctx, rawBaselineDbUrl);
    checks.push(check11);
    metrics.compatibility_probe_coverage_percent = check11.coverage_percent;

    // -------------------------------------------------------------------------
    // Required Adversarial Mutations (16/16 via exported gates)
    // -------------------------------------------------------------------------
    const mutations = await runAllMutations(ctx);

    // Verify source database was completely untouched
    const afterSourceFp = await safety.captureSourceFingerprint(sourceClient);
    const sourceUntouched = safety.verifyFingerprintIntegrity(
      { digest: check1.source_database_fingerprint, table_count: check1.source_database_tables },
      afterSourceFp
    );
    if (!sourceUntouched) {
      throw new safety.P04GateError(
        'predecessor_and_target_safety',
        'SOURCE_DATABASE_ALTERED',
        'Source database fingerprint altered during certification run'
      );
    }

    // Clean up all run-owned databases
    const cleanupResult = await safety.cleanupAllDatabases(adminClient, inventory, target.database);

    const result = {
      phase: 'P04',
      level: 'PHASE_GATE',
      candidate_sha: candidateSha,
      phase_base_sha: contract.phase_base_sha,
      synthetic: false,
      skipped_count: 0,
      checks,
      mutations,
      metrics,
      safety: {
        source_database_untouched: sourceUntouched,
        created_databases: cleanupResult.created,
        dropped_databases: cleanupResult.dropped
      },
      verdict: 'PASS',
      duration_ms: Date.now() - startTime
    };

    // Rigorous validation of evidence before return
    validateP04Evidence(result, contract);

    // Save summary report into _p04_test_results.json and stage allowlist
    const report = {
      phase: 'P04',
      name: 'Canonical database and migration chain',
      timestamp: new Date().toISOString(),
      verdict: 'PASS',
      candidate_sha: candidateSha,
      candidate_migrations: candidateScope.candidateMigrations.map(m => m.name),
      affected_tables: candidateScope.affectedTables,
      tests_summary: {
        total: checks.length,
        passed: checks.filter(c => c.status === 'PASS').length,
        failed: checks.filter(c => c.status !== 'PASS').length
      },
      tests: Object.fromEntries(checks.map(c => [c.id, c])),
      mutations_summary: {
        total: mutations.length,
        passed: mutations.filter(m => m.status === 'PASS' && m.production_path === true).length,
        failed: mutations.filter(m => m.status !== 'PASS' || m.production_path !== true).length
      },
      metrics
    };

    // Strict recursive secret assertion across all report fields
    safety.assertNoSecrets(report, process.env);

    const reportOut = path.join(root, 'docs/legacy-erp/verification/_p04_test_results.json');
    fs.mkdirSync(path.dirname(reportOut), { recursive: true });
    fs.writeFileSync(reportOut, JSON.stringify(report, null, 2) + '\n', 'utf8');

    spawnSync('git', ['add', 'docs/legacy-erp/verification/_p04_test_results.json'], { cwd: root });
    spawnSync('git', ['add', 'docs/legacy-erp/verification/evidence/P04_MIGRATION_SCOPE_MANIFEST.json'], { cwd: root });
    spawnSync('git', ['add', 'docs/legacy-erp/verification/evidence/P04_PHASE_CERTIFICATION_RESULT.json'], { cwd: root });

    return result;
  } finally {
    if (sourceClient) {
      await sourceClient.end().catch(() => {});
    }
    await safety.cleanupAllDatabases(adminClient, inventory, target.database).catch(() => {});
    await adminClient.end().catch(() => {});
  }
}

module.exports = {
  certifyP04,
  validateP04Evidence
};
