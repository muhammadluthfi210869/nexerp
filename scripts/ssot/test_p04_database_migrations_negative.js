#!/usr/bin/env node
'use strict';

/**
 * NEX ERP - Phase P04 Adversarial Negative Mutation Suite
 *
 * Verifies that the P04 production safety, analyzer, and verification paths
 * deterministically detect and reject all 16 required adversarial mutations.
 *
 * Each mutation mutates real isolated input, workspace, or database state and
 * invokes the EXACT exported production gate function from lib/p04_gates.js.
 * Calling analyzer helpers directly is strictly forbidden.
 *
 * Every mutation record MUST include:
 * - gate_function: the exact exported gate function called
 * - mutated_target: description of the real mutated resource/state
 * - gate_id: structured gate ID caught
 * - reason_code: structured reason code caught
 * - production_path: true (only after proving gate execution)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const safety = require('./lib/p04_safety');
const analyzers = require('./lib/p04_analyzers');
const gates = require('./lib/p04_gates');

const ROOT = path.resolve(__dirname, '../..');
const CONTRACT_PATH = path.join(__dirname, 'p04_acceptance_contract.json');

async function runAllMutations(context) {
  const { root = ROOT, contract, candidateSha, adminClient, inventory, sourceDbName, target } = context;
  const candidateScope = context.candidateScope || analyzers.deriveCandidateScope(root, contract.phase_base_sha);
  const shortSha = candidateSha ? candidateSha.slice(0, 8) : 'curr';
  const pid = process.pid;
  const enrichedContext = { ...context, root, contract, candidateSha, adminClient, inventory, sourceDbName, target, candidateScope, shortSha, pid };
  const backendDir = path.resolve(root, 'backend');
  const { Client } = require(path.join(backendDir, 'node_modules/pg'));
  const results = [];

  async function executeMutation(id, gateFunctionName, mutatedTarget, expectedGateId, expectedReasonCode, fn) {
    if (typeof gates[gateFunctionName] !== 'function') {
      throw new Error(`Invalid gate function name "${gateFunctionName}" for mutation ${id}: must be an exported function on gates`);
    }

    let gateCalled = false;
    const origGate = gates[gateFunctionName];
    gates[gateFunctionName] = async function (...args) {
      gateCalled = true;
      return origGate.apply(this, args);
    };

    try {
      await fn();
      throw new Error(`Mutation ${id} unexpectedly passed without rejection`);
    } catch (err) {
      if (err.message && err.message.includes('unexpectedly passed without rejection')) {
        throw err;
      }
      if (!gateCalled) {
        throw new Error(`Mutation ${id} did not execute expected gate function "${gateFunctionName}"`);
      }
      if (!err.gate_id || !err.reason_code) {
        throw new Error(`Mutation ${id} failed to throw structured P04GateError: ${err.message}`);
      }
      if (err.gate_id !== expectedGateId) {
        throw new Error(`Mutation ${id} threw wrong gate_id: expected "${expectedGateId}", got "${err.gate_id}" (${err.message})`);
      }
      if (err.reason_code !== expectedReasonCode) {
        throw new Error(`Mutation ${id} threw wrong reason_code: expected "${expectedReasonCode}", got "${err.reason_code}" (${err.message})`);
      }

      results.push({
        id,
        status: 'PASS',
        production_path: true,
        gate_function: gateFunctionName,
        mutated_target: mutatedTarget,
        gate_id: err.gate_id,
        reason_code: err.reason_code,
        rejection_reason: err.message
      });
    } finally {
      gates[gateFunctionName] = origGate;
    }
  }

  // 1. P04-REMOTE-TARGET-REFUSED
  await executeMutation(
    'P04-REMOTE-TARGET-REFUSED',
    'gatePredecessorAndTargetSafety',
    'target.hostname: 103.93.134.215 (non-loopback target)',
    'predecessor_and_target_safety',
    'REMOTE_TARGET_REFUSED',
    async () => {
      await gates.gatePredecessorAndTargetSafety({
        ...context,
        target: { ...target, hostname: '103.93.134.215' }
      });
    }
  );

  // 2. P04-UNSAFE-DB-NAME-REFUSED
  await executeMutation(
    'P04-UNSAFE-DB-NAME-REFUSED',
    'gatePredecessorAndTargetSafety',
    'tempDatabaseNameValidationAttempt: erp_p04_test (unsafe temporary database name)',
    'predecessor_and_target_safety',
    'UNSAFE_DB_NAME_REFUSED',
    async () => {
      await gates.gatePredecessorAndTargetSafety({
        ...context,
        tempDatabaseNameValidationAttempt: 'erp_p04_test'
      });
    }
  );

  // 3. P04-SOURCE-DB-DROP-REFUSED
  await executeMutation(
    'P04-SOURCE-DB-DROP-REFUSED',
    'gatePredecessorAndTargetSafety',
    `dropTargetDbAttempt: ${sourceDbName} (source database drop protection)`,
    'predecessor_and_target_safety',
    'SOURCE_DB_DROP_REFUSED',
    async () => {
      await gates.gatePredecessorAndTargetSafety({
        ...context,
        dropTargetDbAttempt: sourceDbName
      });
    }
  );

  // 4. P04-PREBASE-MIGRATION-EDIT
  const tempWorkspaceEdited = path.join(os.tmpdir(), `nex_p04_mut_prebase_${Date.now()}`);
  fs.mkdirSync(tempWorkspaceEdited, { recursive: true });
  try {
    const origMigDir = path.join(root, 'backend/prisma/migrations');
    for (const ent of fs.readdirSync(origMigDir, { withFileTypes: true })) {
      if (ent.isDirectory()) {
        const src = path.join(origMigDir, ent.name);
        const dst = path.join(tempWorkspaceEdited, ent.name);
        fs.cpSync(src, dst, { recursive: true });
      }
    }
    const prebaseSql = path.join(tempWorkspaceEdited, '20260430122705_phase1/migration.sql');
    fs.appendFileSync(prebaseSql, '\n-- adversarial edit: prebase checksum corrupted\n', 'utf8');

    await executeMutation(
      'P04-PREBASE-MIGRATION-EDIT',
      'gateMigrationChainIntegrity',
      `${prebaseSql} (adversarial prebase migration SQL edit)`,
      'migration_chain_integrity',
      'PREBASE_MIGRATION_EDITED',
      async () => {
        await gates.gateMigrationChainIntegrity({
          ...context,
          migrationsDir: tempWorkspaceEdited
        });
      }
    );
  } finally {
    fs.rmSync(tempWorkspaceEdited, { recursive: true, force: true });
  }

  // 5. P04-MISSING-MIGRATION-SQL
  const tempWorkspaceMissing = path.join(os.tmpdir(), `nex_p04_mut_missing_${Date.now()}`);
  fs.mkdirSync(tempWorkspaceMissing, { recursive: true });
  try {
    const corruptedDir = path.join(tempWorkspaceMissing, '20260999000000_corrupted');
    fs.mkdirSync(corruptedDir, { recursive: true });

    await executeMutation(
      'P04-MISSING-MIGRATION-SQL',
      'gateMigrationChainIntegrity',
      `${corruptedDir} (migration directory missing migration.sql)`,
      'migration_chain_integrity',
      'MISSING_MIGRATION_SQL',
      async () => {
        await gates.gateMigrationChainIntegrity({
          ...context,
          migrationsDir: tempWorkspaceMissing
        });
      }
    );
  } finally {
    fs.rmSync(tempWorkspaceMissing, { recursive: true, force: true });
  }

  // 6. P04-MIGRATION-DRIFT
  const driftDbName = `nex_p04_drift_${Date.now()}_probe`;
  await safety.createIsolatedDatabase(adminClient, driftDbName, inventory);
  const driftDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${driftDbName}?schema=public`;
  try {
    await executeMutation(
      'P04-MIGRATION-DRIFT',
      'gateEmptyDbMigrate',
      `isolated_db:${driftDbName} (unmanaged drift table injected)`,
      'empty_db_migrate',
      'SCHEMA_DRIFT_DETECTED',
      async () => {
        await gates.gateEmptyDbMigrate({
          ...context,
          emptyDbNameOverride: driftDbName,
          targetDbUrlOverride: driftDbUrl,
          preSeedSql: 'CREATE TABLE "unmanaged_drift_table" (id text primary key, unmanaged_val text);'
        });
      }
    );
  } finally {
    await safety.dropIsolatedDatabase(adminClient, driftDbName, inventory, target.database).catch(() => {});
  }

  // 7. P04-SECOND-DEPLOY-NOT-NOOP
  const idempDbName = `nex_p04_idemp_${Date.now()}_probe`;
  await safety.createIsolatedDatabase(adminClient, idempDbName, inventory);
  const idempDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${idempDbName}?schema=public`;
  try {
    // Deploy migrations to idempDb
    gates.runPrisma(['migrate', 'deploy'], {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: idempDbUrl }
    });

    // Corrupt ledger by injecting a failed migration row
    const idempClient = new Client({ connectionString: idempDbUrl });
    idempClient.on('error', () => {});
    await idempClient.connect();
    await idempClient.query(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (gen_random_uuid()::text, 'fake_chk', NULL, 'unhealthy_pending_migration', 'failed', NULL, NOW(), 0)
    `);
    await idempClient.end();

    await executeMutation(
      'P04-SECOND-DEPLOY-NOT-NOOP',
      'gateMigrationIdempotency',
      `isolated_db:${idempDbName} (failed migration injected into ledger)`,
      'migration_idempotency',
      'SECOND_DEPLOY_NOT_NOOP',
      async () => {
        await gates.gateMigrationIdempotency(context, idempDbUrl);
      }
    );
  } finally {
    await safety.dropIsolatedDatabase(adminClient, idempDbName, inventory, target.database).catch(() => {});
  }

  // 8. P04-BASELINE-UPGRADE-DATA-LOSS
  const dlDbName = `nex_p04_dataloss_${Date.now()}_probe`;
  await safety.createIsolatedDatabase(adminClient, dlDbName, inventory);
  const dlDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${dlDbName}?schema=public`;
  try {
    await executeMutation(
      'P04-BASELINE-UPGRADE-DATA-LOSS',
      'gateBaselineUpgrade',
      `isolated_db:${dlDbName} (fixture row mutated before upgrade)`,
      'baseline_upgrade',
      'BASELINE_UPGRADE_DATA_LOSS',
      async () => {
        await gates.gateBaselineUpgrade({
          ...enrichedContext,
          baselineDbNameOverride: dlDbName,
          baselineDbUrlOverride: dlDbUrl,
          mutateFixtureBeforeUpgrade: async (client) => {
            await client.query('UPDATE "articles" SET "metaDescription" = \'Corrupted Value\'');
          }
        });
      }
    );
  } finally {
    await safety.dropIsolatedDatabase(adminClient, dlDbName, inventory, target.database).catch(() => {});
  }

  // 9. P04-BACKFILL-NONDETERMINISTIC
  const bfDbName = `nex_p04_backfill_${Date.now()}_probe`;
  await safety.createIsolatedDatabase(adminClient, bfDbName, inventory);
  const bfDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${bfDbName}?schema=public`;
  try {
    await executeMutation(
      'P04-BACKFILL-NONDETERMINISTIC',
      'gateBaselineUpgrade',
      `isolated_db:${bfDbName} (non-deterministic backfill query updating random values on pass 2)`,
      'baseline_upgrade',
      'BACKFILL_NONDETERMINISTIC',
      async () => {
        await gates.gateBaselineUpgrade({
          ...enrichedContext,
          baselineDbNameOverride: bfDbName,
          baselineDbUrlOverride: bfDbUrl,
          backfillQueryOverride: 'UPDATE "articles" SET "metaDescription" = random()::text WHERE id = $1'
        });
      }
    );
  } finally {
    await safety.dropIsolatedDatabase(adminClient, bfDbName, inventory, target.database).catch(() => {});
  }

  // 10. P04-ROLLBACK-SCHEMA-MISMATCH
  const rbsDbName = `nex_p04_rbschema_${Date.now()}_probe`;
  await safety.createIsolatedDatabase(adminClient, rbsDbName, inventory);
  const rbsDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${rbsDbName}?schema=public`;
  try {
    await executeMutation(
      'P04-ROLLBACK-SCHEMA-MISMATCH',
      'gateRollbackRehearsal',
      `isolated_db:${rbsDbName} (down.sql creates extra table drift)`,
      'rollback_rehearsal',
      'ROLLBACK_SCHEMA_MISMATCH',
      async () => {
        await gates.gateRollbackRehearsal({
          ...enrichedContext,
          rollbackDbNameOverride: rbsDbName,
          rollbackDbUrlOverride: rbsDbUrl,
          downSqlOverride: 'CREATE TABLE "extra_rollback_drift" (id text primary key); DELETE FROM _prisma_migrations WHERE migration_name = \'20260918120000_p04_deduplicate_slug_indexes\';'
        });
      }
    );
  } finally {
    await safety.dropIsolatedDatabase(adminClient, rbsDbName, inventory, target.database).catch(() => {});
  }

  // 11. P04-ROLLBACK-DATA-LOSS
  const rbdDbName = `nex_p04_rbdata_${Date.now()}_probe`;
  await safety.createIsolatedDatabase(adminClient, rbdDbName, inventory);
  const rbdDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${rbdDbName}?schema=public`;
  try {
    await executeMutation(
      'P04-ROLLBACK-DATA-LOSS',
      'gateRollbackRehearsal',
      `isolated_db:${rbdDbName} (fixture data deleted before rollback)`,
      'rollback_rehearsal',
      'ROLLBACK_DATA_LOSS',
      async () => {
        await gates.gateRollbackRehearsal({
          ...enrichedContext,
          rollbackDbNameOverride: rbdDbName,
          rollbackDbUrlOverride: rbdDbUrl,
          mutateBeforeRollback: async (client) => {
            await client.query('DELETE FROM "articles"');
          }
        });
      }
    );
  } finally {
    await safety.dropIsolatedDatabase(adminClient, rbdDbName, inventory, target.database).catch(() => {});
  }

  // 12. P04-UNSAFE-CONTRACT-DDL
  const tempDdlDir = path.join(os.tmpdir(), `nex_p04_mut_ddl_${Date.now()}`);
  fs.mkdirSync(tempDdlDir, { recursive: true });
  try {
    const tempSqlPath = path.join(tempDdlDir, 'migration.sql');
    const tempDownPath = path.join(tempDdlDir, 'down.sql');
    fs.writeFileSync(tempSqlPath, 'ALTER TABLE "articles" DROP COLUMN "title";\n', 'utf8');
    fs.writeFileSync(tempDownPath, 'ALTER TABLE "articles" ADD COLUMN "title" TEXT;\n', 'utf8');

    await executeMutation(
      'P04-UNSAFE-CONTRACT-DDL',
      'gateExpandContractCompatibility',
      `${tempSqlPath} (ALTER TABLE articles DROP COLUMN title)`,
      'expand_contract_compatibility',
      'UNSAFE_CONTRACT_DDL',
      async () => {
        await gates.gateExpandContractCompatibility({
          ...context,
          candidateScopeOverride: {
            candidateMigrations: [{
              name: '20260999_unsafe_ddl',
              sqlPath: tempSqlPath,
              downPath: tempDownPath
            }]
          }
        });
      }
    );
  } finally {
    fs.rmSync(tempDdlDir, { recursive: true, force: true });
  }

  // 13. P04-INVALID-CONSTRAINT-OR-INDEX
  const invConDbName = `nex_p04_invcon_${Date.now()}_probe`;
  await safety.createIsolatedDatabase(adminClient, invConDbName, inventory);
  const invConDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${invConDbName}?schema=public`;
  try {
    // Deploy migrations to invConDb
    gates.runPrisma(['migrate', 'deploy'], {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: invConDbUrl }
    });

    // Add unvalidated NOT VALID constraint
    const invClient = new Client({ connectionString: invConDbUrl });
    invClient.on('error', () => {});
    await invClient.connect();
    await invClient.query('ALTER TABLE "articles" ADD CONSTRAINT "chk_val" CHECK (length(title) > 0) NOT VALID;');
    await invClient.end();

    await executeMutation(
      'P04-INVALID-CONSTRAINT-OR-INDEX',
      'gateConstraintIndexAudit',
      `isolated_db:${invConDbName} (NOT VALID constraint added to articles)`,
      'constraint_index_audit',
      'UNVALIDATED_CONSTRAINT',
      async () => {
        await gates.gateConstraintIndexAudit(enrichedContext, invConDbUrl);
      }
    );
  } finally {
    await safety.dropIsolatedDatabase(adminClient, invConDbName, inventory, target.database).catch(() => {});
  }

  // 14. P04-MISSING-N1-N-COMPATIBILITY-PROBE
  const probeDbName = `nex_p04_probe_${Date.now()}_probe`;
  await safety.createIsolatedDatabase(adminClient, probeDbName, inventory);
  const probeDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${probeDbName}?schema=public`;
  try {
    gates.runPrisma(['migrate', 'deploy'], {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: probeDbUrl }
    });

    await executeMutation(
      'P04-MISSING-N1-N-COMPATIBILITY-PROBE',
      'gateOldNewVersionCoexistence',
      `probeTablesOverride: [articles] (omitting website_products from probe execution)`,
      'old_new_version_coexistence',
      'MISSING_COMPATIBILITY_PROBE',
      async () => {
        await gates.gateOldNewVersionCoexistence({
          ...enrichedContext,
          targetDbUrlOverride: probeDbUrl,
          probeTablesOverride: ['articles'],
          candidateScopeOverride: { affectedTables: ['articles', 'website_products'] }
        }, probeDbUrl);
      }
    );
  } finally {
    await safety.dropIsolatedDatabase(adminClient, probeDbName, inventory, target.database).catch(() => {});
  }

  // 15. P04-STALE-SHA-EVIDENCE
  await executeMutation(
    'P04-STALE-SHA-EVIDENCE',
    'gatePredecessorAndTargetSafety',
    'candidateShaOverride: 0000000000000000000000000000000000000000',
    'predecessor_and_target_safety',
    'STALE_SHA_EVIDENCE',
    async () => {
      await gates.gatePredecessorAndTargetSafety({
        ...enrichedContext,
        candidateShaOverride: '0000000000000000000000000000000000000000'
      });
    }
  );

  // 16. P04-UNEXPECTED-SKIP
  await executeMutation(
    'P04-UNEXPECTED-SKIP',
    'gatePredecessorAndTargetSafety',
    'skippedCheckOverride: empty_db_migrate',
    'predecessor_and_target_safety',
    'UNEXPECTED_SKIP',
    async () => {
      await gates.gatePredecessorAndTargetSafety({
        ...enrichedContext,
        skippedCheckOverride: 'empty_db_migrate'
      });
    }
  );

  // Rigorous self-test scanning all mutation results
  for (const r of results) {
    if (!r.gate_function || !r.gate_function.startsWith('gate')) {
      throw new Error(`Self-test rejected mutation ${r.id}: missing or invalid gate_function (${r.gate_function})`);
    }
    if (!r.mutated_target || typeof r.mutated_target !== 'string' || r.mutated_target.length === 0) {
      throw new Error(`Self-test rejected mutation ${r.id}: missing mutated_target`);
    }
    if (!r.gate_id || !r.reason_code || !r.rejection_reason) {
      throw new Error(`Self-test rejected mutation ${r.id}: missing structured rejection evidence`);
    }
    if (r.production_path !== true) {
      throw new Error(`Self-test rejected mutation ${r.id}: production_path must be true`);
    }
  }

  return results;
}

async function main() {
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
  const candidateSha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();

  // Load backend environment
  const backendDir = path.resolve(ROOT, 'backend');
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

  const inventory = safety.createInventory();

  try {
    const results = await runAllMutations({
      root: ROOT,
      contract,
      candidateSha,
      adminClient,
      inventory,
      sourceDbName: target.database,
      target
    });

    console.log(`\nMutation Suite Results: ${results.filter(r => r.status === 'PASS').length}/${contract.required_mutations.length} mutations PASS`);
    for (const r of results) {
      console.log(`  [PASS] ${r.id} -> gate_function=${r.gate_function}, target=${r.mutated_target.slice(0, 40)}, reason_code=${r.reason_code}`);
    }
  } finally {
    await safety.cleanupAllDatabases(adminClient, inventory, target.database);
    await adminClient.end();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Mutation test run failed:', err);
    process.exit(1);
  });
}

module.exports = {
  runAllMutations
};
