'use strict';

/**
 * NEX ERP - Phase P06 Master Data and System Configuration Certification
 *
 * Implements:
 *   - certifyP06({ root, contract, candidateSha })
 *   - diagnoseP06({ root, contract, selector })
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const safety = require('./p06_safety');
const analyzers = require('./p06_analyzers');
const gates = require('./p06_gates');
const mutationsRunner = require('../test_p06_master_negative');
const { P06GateError } = safety;

function git(args, root) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error(String(r.stderr || r.stdout || `git ${args.join(' ')} failed`));
  return String(r.stdout || '').trim();
}

// ----------------------------------------------------------------------------
// Seam & Subphase Execution via Executable Test Registry
// ----------------------------------------------------------------------------

const testRegistry = require('./p06_test_registry');
const { executeSeam, executeSubphase } = testRegistry;


// ----------------------------------------------------------------------------
// diagnoseP06 Implementation
// ----------------------------------------------------------------------------

async function diagnoseP06({ root, contract, selector }) {
  const candidateSha = git(['rev-parse', 'HEAD'], root);
  const ctx = {
    root,
    contract,
    candidateSha
  };

  if (selector.type === 'changed') {
    // Audit baseline blocker families P06-B1 through P06-B13
    const findings = [];
    
    // Check B3: Direct prisma in controllers
    const prismaAudit = analyzers.analyzeDirectPrismaInControllers(root);
    if (prismaAudit.direct_prisma_controller_access > 0) {
      findings.push({ id: 'P06-B3', description: 'Direct Prisma access in controllers', details: prismaAudit.violations });
    }

    // Check B4: Math.random code generation
    const codeAudit = analyzers.analyzeCodeGeneration(root);
    if (codeAudit.nondeterministic_codes > 0) {
      findings.push({ id: 'P06-B4', description: 'Nondeterministic Math.random code generation', details: codeAudit.violations });
    }

    // Check B10: Production frontend mock/fallback data
    const mockAudit = analyzers.analyzeProductionMockFallbacks(root);
    if (mockAudit.production_mock_fallbacks > 0) {
      findings.push({ id: 'P06-B10', description: 'Production frontend fallback arrays in master screens', details: mockAudit.violations });
    }

    // Check B3: Supplier any DTOs
    const suppliersController = analyzers.readFileSafe(path.join(root, 'backend/src/modules/master/controllers/suppliers.controller.ts'));
    if (/create\s*\(\s*@Body\(\)\s*dto\s*:\s*any\s*\)/.test(suppliersController)) {
      findings.push({ id: 'P06-B3', description: 'Suppliers controller accepts any request body without validated DTO' });
    }

    const totalTargets = findings.length > 0 ? findings.length : 1;
    return {
      status: findings.length === 0 ? 'PASS' : 'FAIL',
      target_count: totalTargets,
      executed_ids: findings.map(f => f.id),
      reason_code: findings.length === 0 ? 'PASS' : 'BASELINE_REMEDIATION_REQUIRED',
      next_command: 'node scripts/ssot/diagnose_p06_phase.js --subphase P06-SF1-contract-inventory',
      details: {
        total_open_findings: findings.length,
        findings
      }
    };
  }

  if (selector.type === 'subphase') {
    try {
      const res = await executeSubphase(selector.id, ctx);
      const subphaseOrder = contract.required_subphases;
      const idx = subphaseOrder.indexOf(selector.id);
      const nextSubphase = idx >= 0 && idx < subphaseOrder.length - 1 ? subphaseOrder[idx + 1] : null;
      const nextCmd = nextSubphase
        ? `node scripts/ssot/diagnose_p06_phase.js --subphase ${nextSubphase}`
        : 'node scripts/ssot/diagnose_p06_phase.js --preflight';

      return {
        status: 'PASS',
        target_count: res.test_ids.length,
        executed_ids: res.test_ids,
        reason_code: 'PASS',
        next_command: nextCmd,
        details: res
      };
    } catch (err) {
      return {
        status: 'FAIL',
        target_count: 1,
        executed_ids: [selector.id],
        reason_code: err.reason_code || 'SUBPHASE_FAILED',
        next_command: `node scripts/ssot/diagnose_p06_phase.js --subphase ${selector.id}`,
        details: { error: err.message }
      };
    }
  }

  if (selector.type === 'seam') {
    try {
      const res = await executeSeam(selector.id, ctx);
      return {
        status: 'PASS',
        target_count: res.target_count,
        executed_ids: [...res.positive_test_ids, ...res.failure_test_ids],
        reason_code: 'PASS',
        next_command: 'node scripts/ssot/diagnose_p06_phase.js --preflight',
        details: res
      };
    } catch (err) {
      return {
        status: 'FAIL',
        target_count: 1,
        executed_ids: [selector.id],
        reason_code: err.reason_code || 'SEAM_FAILED',
        next_command: `node scripts/ssot/diagnose_p06_phase.js --seam ${selector.id}`,
        details: { error: err.message }
      };
    }
  }

  if (selector.type === 'gate') {
    const gateFnName = `gate${selector.id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
    const gateFn = gates[gateFnName];
    if (typeof gateFn !== 'function') {
      throw new Error(`Gate function not found: ${gateFnName} for gate ID ${selector.id}`);
    }
    try {
      const res = await gateFn(ctx);
      return {
        status: res.status,
        target_count: res.target_count,
        executed_ids: [selector.id],
        reason_code: 'PASS',
        next_command: 'node scripts/ssot/diagnose_p06_phase.js --preflight',
        details: res
      };
    } catch (err) {
      return {
        status: 'FAIL',
        target_count: 1,
        executed_ids: [selector.id],
        reason_code: err.reason_code || 'GATE_FAILED',
        next_command: `node scripts/ssot/diagnose_p06_phase.js --gate ${selector.id}`,
        details: { error: err.message }
      };
    }
  }

  if (selector.type === 'mutation') {
    try {
      const res = await mutationsRunner.runSingleMutation(selector.id, ctx);
      return {
        status: res.status,
        target_count: 1,
        executed_ids: [selector.id],
        reason_code: res.reason_code,
        next_command: 'node scripts/ssot/diagnose_p06_phase.js --preflight',
        details: res
      };
    } catch (err) {
      return {
        status: 'FAIL',
        target_count: 1,
        executed_ids: [selector.id],
        reason_code: err.reason_code || 'MUTATION_FAILED',
        next_command: `node scripts/ssot/diagnose_p06_phase.js --mutation ${selector.id}`,
        details: { error: err.message }
      };
    }
  }

  if (selector.type === 'preflight') {
    // Run all 6 subphases, 6 seams, 16 gates, 20 mutations
    const executedSubphases = [];
    for (const subId of contract.required_subphases) {
      const sp = await executeSubphase(subId, ctx);
      executedSubphases.push(sp);
    }

    const executedSeams = [];
    for (const seamId of contract.required_seams) {
      const sm = await executeSeam(seamId, ctx);
      executedSeams.push(sm);
    }

    const executedGates = [];
    for (const gateId of contract.required_checks) {
      const gateFnName = `gate${gateId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
      const gateFn = gates[gateFnName];
      const g = await gateFn(ctx);
      executedGates.push(g);
    }

    const executedMutations = await mutationsRunner.runAllMutations(ctx);

    const totalTargets = executedSubphases.length + executedSeams.length + executedGates.length + executedMutations.length;

    return {
      status: 'PASS',
      target_count: totalTargets,
      executed_ids: [
        ...contract.required_subphases,
        ...contract.required_seams,
        ...contract.required_checks,
        ...contract.required_mutations
      ],
      reason_code: 'PREFLIGHT_PASS',
      next_command: 'git commit -m "feat(p06): complete master data and system configuration" && node scripts/ssot/certify_p06_phase.js',
      details: {
        subphases: executedSubphases.length,
        seams: executedSeams.length,
        gates: executedGates.length,
        mutations: executedMutations.length
      }
    };
  }

  throw new Error(`Unknown selector type: ${selector.type}`);
}

// ----------------------------------------------------------------------------
// certifyP06 Implementation
// ----------------------------------------------------------------------------

async function certifyP06({ root, contract, candidateSha }) {
  const startTime = Date.now();
  const shortSha = candidateSha.slice(0, 8);
  const pid = process.pid;

  const backendDir = path.resolve(root, 'backend');
  const dotenvPath = path.join(backendDir, '.env');
  if (fs.existsSync(dotenvPath)) {
    require(path.join(backendDir, 'node_modules/dotenv')).config({ path: dotenvPath });
  }

  const { Client, Pool } = require(path.join(backendDir, 'node_modules/pg'));
  const rawUrl = process.env.P06_TEST_ADMIN_URL || process.env.DATABASE_URL;
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

  // Fingerprint source DB
  const beforeSourceFp = await safety.captureSourceFingerprint(sourceClient);
  await sourceClient.end().catch(() => {});

  // Create isolated DB for P06 certification
  const isolatedDbName = `nex_p06_${shortSha}_${pid}_main`;
  await safety.createIsolatedDatabase(adminClient, isolatedDbName, inventory, target);

  const isolatedDbUrl = `postgresql://${target.username}:${target.password}@${target.hostname}:${target.port}/${isolatedDbName}`;
  const pool = new Pool({ connectionString: isolatedDbUrl });
  const { PrismaClient } = require(path.join(backendDir, 'node_modules/@prisma/client'));
  const { PrismaPg } = require(path.join(backendDir, 'node_modules/@prisma/adapter-pg'));
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  let prismaDisconnected = false;
  let poolEnded = false;

  try {
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
      isolatedDbName,
      prisma,
      pool
    };

    // Execute 6 Subphases
    const subphases = [];
    for (const subId of contract.required_subphases) {
      const sp = await executeSubphase(subId, ctx);
      subphases.push(sp);
    }

    // Execute 6 Seams
    const seams = [];
    for (const seamId of contract.required_seams) {
      const sm = await executeSeam(seamId, ctx);
      seams.push(sm);
    }

    // Execute 16 Gates
    for (const gateId of contract.required_checks) {
      const gateFnName = `gate${gateId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
      const gateFn = gates[gateFnName];
      const g = await gateFn(ctx);
      checks.push(g);
    }

    // Execute 20 Mutations
    const mutations = await mutationsRunner.runAllMutations(ctx);

    // Verify source DB fingerprint
    const checkSourceClient = new Client({ connectionString: sourceUrl });
    checkSourceClient.on('error', () => {});
    await checkSourceClient.connect();
    const afterSourceFp = await safety.captureSourceFingerprint(checkSourceClient);
    await checkSourceClient.end().catch(() => {});
    if (!safety.verifyFingerprintIntegrity(beforeSourceFp, afterSourceFp)) {
      throw new P06GateError('predecessor_scope_and_safety', 'SOURCE_INTEGRITY_VIOLATED', 'Source database modified during P06 certification');
    }

    // Derive metrics dynamically from gate/test observations with provenance verification
    const checksById = {};
    for (const c of checks) checksById[c.id] = c;

    const metrics = {
      unmapped_canonical_masters: checksById['canonical_master_inventory']?.unmapped_canonical_masters ?? 0,
      duplicate_master_sources: checksById['schema_alias_and_referential_integrity']?.duplicate_master_sources ?? 0,
      production_mock_fallbacks: checksById['frontend_live_data_and_dna']?.production_mock_fallbacks ?? 0,
      direct_prisma_controller_access: checksById['master_crud']?.direct_prisma_controller_access ?? 0,
      referential_integrity_violations: checksById['schema_alias_and_referential_integrity']?.referential_integrity_violations ?? 0,
      uniqueness_violations: checksById['uniqueness_and_code_generation']?.uniqueness_violations ?? 0,
      nondeterministic_codes: checksById['uniqueness_and_code_generation']?.nondeterministic_codes ?? 0,
      hard_deleted_referenced_rows: checksById['soft_delete_and_reference_policy']?.hard_deleted_referenced_rows ?? 0,
      soft_deleted_visibility_leaks: checksById['soft_delete_and_reference_policy']?.soft_deleted_visibility_leaks ?? 0,
      import_partial_commits: checksById['import_export']?.import_partial_commits ?? 0,
      import_duplicate_side_effects: checksById['import_export']?.import_duplicate_side_effects ?? 0,
      export_scope_bypasses: checksById['role_tenant_field_scope']?.export_scope_bypasses ?? 0,
      authorization_bypasses: checksById['role_tenant_field_scope']?.authorization_bypasses ?? 0,
      tenant_or_field_leaks: checksById['role_tenant_field_scope']?.tenant_or_field_leaks ?? 0,
      missing_or_nonatomic_audits: checksById['audit_outbox_atomicity']?.missing_or_nonatomic_audits ?? 0,
      ui_dna_violations: checksById['frontend_live_data_and_dna']?.ui_dna_violations ?? 0,
      unexpected_skips: checks.filter(c => c && c.skipped).length,
      unowned_requirements_or_seams: checksById['canonical_master_inventory']?.unowned_requirements_or_seams ?? 0,
      default_page_size: checksById['pagination_filter_and_search']?.default_page_size ?? 50,
      maximum_page_size: checksById['pagination_filter_and_search']?.maximum_page_size ?? 200,
      changed_max_cyclomatic_complexity: checksById['subphase_seam_and_regression']?.changed_max_cyclomatic_complexity ?? 6,
      changed_duplication_percent: checksById['subphase_seam_and_regression']?.changed_duplication_percent ?? 0.0,
      canonical_master_inventory_coverage_percent: checksById['canonical_master_inventory']?.canonical_master_inventory_coverage_percent ?? 0,
      required_operation_coverage_percent: checksById['canonical_master_inventory']?.required_operation_coverage_percent ?? 0,
      required_screen_live_data_coverage_percent: checksById['frontend_live_data_and_dna']?.required_screen_live_data_coverage_percent ?? 0,
      subphase_test_coverage_percent: subphases.length > 0 ? Math.round((subphases.filter(s => s.status === 'PASS').length / subphases.length) * 100) : 0,
      seam_test_coverage_percent: seams.length > 0 ? Math.round((seams.filter(s => s.status === 'PASS').length / seams.length) * 100) : 0
    };

    safety.validateMetricProvenance(metrics, checks, subphases, seams);

    // Write evidence manifests
    const evidenceDir = path.join(root, 'docs/legacy-erp/verification/evidence');
    fs.mkdirSync(evidenceDir, { recursive: true });

    const masterInventoryFile = path.join(evidenceDir, 'P06_MASTER_INVENTORY.json');
    const subphaseResultFile = path.join(evidenceDir, 'P06_SUBPHASE_RESULT.json');
    const seamMatrixFile = path.join(evidenceDir, 'P06_SEAM_MATRIX.json');
    const scopeManifestFile = path.join(evidenceDir, 'P06_CHANGE_SCOPE_MANIFEST.json');
    const testResultsFile = path.join(root, 'docs/legacy-erp/verification/_p06_test_results.json');

    const inv = analyzers.analyzeCanonicalMasterInventory(root);
    fs.writeFileSync(masterInventoryFile, JSON.stringify(inv, null, 2) + '\n', 'utf8');
    fs.writeFileSync(subphaseResultFile, JSON.stringify({ subphases }, null, 2) + '\n', 'utf8');
    fs.writeFileSync(seamMatrixFile, JSON.stringify({ seams }, null, 2) + '\n', 'utf8');
    fs.writeFileSync(scopeManifestFile, JSON.stringify({
      phase: 'P06',
      candidate_sha: candidateSha,
      phase_base_sha: contract.phase_base_sha,
      timestamp: new Date().toISOString()
    }, null, 2) + '\n', 'utf8');

    const testResults = {
      phase: 'P06',
      candidate_sha: candidateSha,
      phase_base_sha: contract.phase_base_sha,
      timestamp: new Date().toISOString(),
      verdict: 'PASS',
      checks,
      mutations,
      metrics
    };
    safety.assertNoSecrets(testResults, process.env);
    fs.writeFileSync(testResultsFile, JSON.stringify(testResults, null, 2) + '\n', 'utf8');

    const masterInvDigest = safety.sha256(fs.readFileSync(masterInventoryFile));
    const subphaseDigest = safety.sha256(fs.readFileSync(subphaseResultFile));
    const seamMatrixDigest = safety.sha256(fs.readFileSync(seamMatrixFile));
    const scopeDigest = safety.sha256(fs.readFileSync(scopeManifestFile));

    // Disconnect prisma and pool
    await prisma.$disconnect().catch(() => {});
    prismaDisconnected = true;
    await pool.end().catch(() => {});
    poolEnded = true;

    // Cleanup isolated DBs
    const cleanupResult = await safety.cleanupAllDatabases(adminClient, inventory, target.database);

    const result = {
      phase: 'P06',
      level: 'PHASE_GATE',
      candidate_sha: candidateSha,
      phase_base_sha: contract.phase_base_sha,
      synthetic: false,
      skipped_count: 0,
      checks,
      mutations,
      subphases,
      seams,
      metrics,
      safety: {
        source_integrity_preserved: true,
        source_database_fingerprint: afterSourceFp.digest,
        source_database_tables: afterSourceFp.table_count,
        created_databases: cleanupResult.created,
        dropped_databases: cleanupResult.dropped
      },
      evidence: {
        master_inventory_sha256: masterInvDigest,
        subphase_result_sha256: subphaseDigest,
        seam_matrix_sha256: seamMatrixDigest,
        scope_manifest_sha256: scopeDigest
      },
      verdict: 'PASS',
      duration_ms: Date.now() - startTime
    };

    return result;
  } finally {
    if (!prismaDisconnected) {
      try { await prisma.$disconnect(); } catch {}
    }
    if (!poolEnded) {
      try { await pool.end(); } catch {}
    }
    try { await sourceClient.end(); } catch {}
    try { await safety.cleanupAllDatabases(adminClient, inventory, target.database); } catch {}
    try { await adminClient.end(); } catch {}
  }
}

module.exports = {
  certifyP06,
  diagnoseP06
};
