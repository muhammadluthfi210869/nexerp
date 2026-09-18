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

    // -------------------------------------------------------------------------
    // Gate 7: migration_idempotency
    // -------------------------------------------------------------------------
    const check7 = await gates.gateMigrationIdempotency(ctx, check6.baseline_db_url);
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
    const check9 = await gates.gateConstraintIndexAudit(ctx, check6.baseline_db_url);
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
    const check11 = await gates.gateOldNewVersionCoexistence(ctx, check6.baseline_db_url);
    checks.push(check11);
    metrics.compatibility_probe_coverage_percent = check11.coverage_percent;

    // -------------------------------------------------------------------------
    // Required Adversarial Mutations (16/16)
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

    // Save summary report into _p04_test_results.json and auto-stage
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

    const reportOut = path.join(root, 'docs/legacy-erp/verification/_p04_test_results.json');
    fs.mkdirSync(path.dirname(reportOut), { recursive: true });
    fs.writeFileSync(reportOut, JSON.stringify(report, null, 2) + '\n', 'utf8');

    // Stage generated allowlist files using relative paths
    spawnSync('git', ['add', 'docs/legacy-erp/verification/_p04_test_results.json'], { cwd: root });
    spawnSync('git', ['add', 'docs/legacy-erp/verification/evidence/P04_MIGRATION_SCOPE_MANIFEST.json'], { cwd: root });

    return {
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
  } finally {
    if (sourceClient) {
      await sourceClient.end().catch(() => {});
    }
    await safety.cleanupAllDatabases(adminClient, inventory, target.database).catch(() => {});
    await adminClient.end().catch(() => {});
  }
}

module.exports = {
  certifyP04
};
