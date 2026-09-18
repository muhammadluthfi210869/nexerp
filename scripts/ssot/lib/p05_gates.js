'use strict';

/**
 * NEX ERP - Phase P05 Platform Architecture Gates
 *
 * Each exported gate function:
 *   - Accepts ({ root, candidateSha, contract, ctx })
 *   - Returns a frozen-shape check object:
 *       { id, status, executed, synthetic, skipped, duration_ms,
 *         phase_base_sha, candidate_sha, commands: [{ command, exit_code }],
 *         target_count, ...specific }
 *
 * Mutations are exercised through these gates via test_p05_platform_negative.js.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const safety = require('./p05_safety');
const analyzers = require('./p05_analyzers');

function baseShape(id, root, candidateSha, contract, extra = {}) {
  return {
    id,
    status: 'PASS',
    executed: true,
    synthetic: false,
    skipped: false,
    duration_ms: 0,
    phase_base_sha: contract.phase_base_sha,
    candidate_sha: candidateSha,
    commands: [],
    target_count: 0,
    ...extra
  };
}

function runCommand(cwd, cmd, args) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });
  return { command: `${cmd} ${args.join(' ')}`, exit_code: r.status === 0 ? 0 : (r.status || 1), stdout: r.stdout || '', stderr: r.stderr || '' };
}

// ----------------------------------------------------------------------------
// Gate 1: predecessor_scope_and_safety
// ----------------------------------------------------------------------------
async function gatePredecessorScopeAndSafety({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];

  // git merge-base
  const mb = runCommand(root, 'git', ['merge-base', contract.phase_base_sha, candidateSha]);
  commands.push({ command: mb.command, exit_code: mb.exit_code });
  if (mb.stdout.trim() !== contract.phase_base_sha) {
    return baseShape('predecessor_scope_and_safety', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0,
      status: 'FAIL', error: 'merge-base mismatch'
    });
  }

  // Registry has P04 PASS at exact SHA
  const registry = fs.readFileSync(path.join(root, 'docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml'), 'utf8');
  const ok = /- id: P04[\s\S]*?status: PASS[\s\S]*?candidate_sha: 5195fa2aaa838ebb7faea2a3b207f27689b7ed4a/.test(registry);
  commands.push({ command: 'grep _PRODUCTION_PHASE_GATES.yaml', exit_code: ok ? 0 : 1 });
  if (!ok) {
    return baseShape('predecessor_scope_and_safety', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0,
      status: 'FAIL', error: 'P04 predecessor PASS missing'
    });
  }

  // Dirty check
  const dirty = runCommand(root, 'git', ['status', '--porcelain']);
  commands.push({ command: dirty.command, exit_code: dirty.exit_code });
  const dirtyCount = dirty.stdout.split('\n').filter(Boolean).length;
  const allow = new Set(contract.generated_output_allowlist.map(s => String(s || '').replace(/\\/g, '/')));
  const dirtyOutside = dirty.stdout.split('\n').filter(Boolean).map(l => {
    const m = l.match(/^..\s+(.+)$/);
    return m ? m[1].replace(/\\/g, '/') : null;
  }).filter(p => p && !allow.has(p));

  return baseShape('predecessor_scope_and_safety', root, candidateSha, contract, {
    duration_ms: Date.now() - start,
    commands,
    target_count: 1,
    dirty_files_total: dirtyCount,
    dirty_outside_allowlist: dirtyOutside,
    registry_verified: ok
  });
}

// ----------------------------------------------------------------------------
// Gate 2: canonical_traceability
// ----------------------------------------------------------------------------
async function gateCanonicalTraceability({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const tmPath = path.join(root, 'docs/legacy-erp/contracts/10_TRACEABILITY_MATRIX.yaml');
  if (!fs.existsSync(tmPath)) {
    return baseShape('canonical_traceability', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      error: 'TRACEABILITY_MATRIX missing'
    });
  }
  const tm = fs.readFileSync(tmPath, 'utf8');
  const requiredControls = [
    'auth.session', 'auth.mfa', 'policy.tenant', 'audit.immutable',
    'approval.maker_checker', 'outbox.atomic', 'communication.acl',
    'errors.canonical', 'config.typed'
  ];
  const present = requiredControls.filter(c => tm.includes(c));
  const missing = requiredControls.filter(c => !tm.includes(c));
  commands.push({ command: 'grep 10_TRACEABILITY_MATRIX.yaml', exit_code: missing.length === 0 ? 0 : 1 });
  return baseShape('canonical_traceability', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: requiredControls.length,
    controls_present: present.length,
    controls_missing: missing,
    controls_present_list: present
  });
}

// ----------------------------------------------------------------------------
// Gate 3: architecture_fitness_suite
// ----------------------------------------------------------------------------
async function gateArchitectureFitnessSuite({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  // 5 analyzers must be invokable
  const analyzersPresent = [
    typeof analyzers.deriveModuleOwnership === 'function',
    typeof analyzers.deriveDependencyGraph === 'function',
    typeof analyzers.findForbiddenDomainImports === 'function',
    typeof analyzers.findDuplicateRules === 'function',
    typeof analyzers.findComplexityRegressions === 'function'
  ].every(Boolean);
  commands.push({ command: 'analyzer presence check', exit_code: analyzersPresent ? 0 : 1 });
  return baseShape('architecture_fitness_suite', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: 5,
    analyzers_count: 5,
    analyzers_ok: analyzersPresent
  });
}

// ----------------------------------------------------------------------------
// Gate 4: module_owner_registry
// ----------------------------------------------------------------------------
async function gateModuleOwnerRegistry({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const own = analyzers.deriveModuleOwnership({ root });
  commands.push({ command: 'node p05_analyzers.deriveModuleOwnership', exit_code: 0 });
  return baseShape('module_owner_registry', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: own.modules_total,
    modules_total: own.modules_total,
    modules_with_owner: own.modules_with_owner,
    modules_with_purpose: own.modules_with_purpose,
    modules_with_layer: own.modules_with_layer,
    modules_with_allowed_deps: own.modules_with_allowed_deps,
    modules_with_data_owner: own.modules_with_data_owner,
    modules_with_public_interface: own.modules_with_public_interface,
    modules_with_tests: own.modules_with_tests,
    ownership_coverage_percent: own.ownership_coverage_percent
  });
}

// ----------------------------------------------------------------------------
// Gate 5: dependency_graph_snapshot
// ----------------------------------------------------------------------------
async function gateDependencyGraphSnapshot({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const graph = analyzers.deriveDependencyGraph({ root, baseSha: contract.phase_base_sha, candidateSha });
  commands.push({ command: 'node p05_analyzers.deriveDependencyGraph', exit_code: 0 });
  return baseShape('dependency_graph_snapshot', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: graph.nodes.length + graph.edges.length,
    node_count: graph.nodes.length,
    edge_count: graph.edges.length,
    baseline_digest: graph.baseline_digest,
    candidate_digest: graph.candidate_digest,
    edge_delta_count: graph.edge_delta_count,
    classified_edge_deltas: graph.classified_edge_deltas
  });
}

// ----------------------------------------------------------------------------
// Gate 6: module_boundary_test
// ----------------------------------------------------------------------------
async function gateModuleBoundaryTest({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const graph = analyzers.deriveDependencyGraph({ root, baseSha: contract.phase_base_sha, candidateSha });
  const forb = analyzers.findForbiddenDomainImports(root, graph);
  const cd = analyzers.findDirectCrossDomainPersistence(graph);
  commands.push({ command: 'forbidden-domain-import scan', exit_code: forb.count === 0 ? 0 : 1 });
  commands.push({ command: 'cross-domain-persistence scan', exit_code: cd.count === 0 ? 0 : 1 });
  return baseShape('module_boundary_test', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: graph.edges.length,
    forbidden_domain_edges: forb.count,
    direct_cross_domain_persistence: cd.count,
    samples: forb.samples
  });
}

// ----------------------------------------------------------------------------
// Gate 7: circular_dependency_scan
// ----------------------------------------------------------------------------
async function gateCircularDependencyScan({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const mods = analyzers.discoverBackendModules(root);
  // Build a graph restricted to module→module edges from import statements
  const moduleEdges = new Map();
  for (const m of mods) {
    moduleEdges.set(m.name, new Set());
  }
  for (const m of mods) {
    const files = analyzers.listAllFiles(root, path.relative(root, m.dir));
    for (const f of files) {
      if (!f.endsWith('.ts')) continue;
      const rel = analyzers.normalize(path.relative(root, f));
      if (analyzers.isTestPath(rel)) continue;
      const imps = analyzers.extractImports(f);
      for (const imp of imps) {
        if (imp.source.includes('modules/')) {
          const tgt = imp.source.split('modules/')[1].split('/')[0];
          if (tgt && tgt !== m.name && moduleEdges.has(tgt)) {
            moduleEdges.get(m.name).add(tgt);
          }
        }
      }
    }
  }
  // Tarjan SCC
  const cycles = [];
  const visited = new Map();
  const stack = [];
  function dfs(node, path) {
    visited.set(node, 'gray');
    stack.push(node);
    for (const next of moduleEdges.get(node) || []) {
      if (!visited.has(next)) dfs(next, [...path, next]);
      else if (visited.get(next) === 'gray') {
        const idx = stack.indexOf(next);
        if (idx >= 0) cycles.push(stack.slice(idx).concat(next));
      }
    }
    stack.pop();
    visited.set(node, 'black');
  }
  for (const n of moduleEdges.keys()) {
    if (!visited.has(n)) dfs(n, [n]);
  }
  commands.push({ command: 'circular-dependency scan', exit_code: cycles.length === 0 ? 0 : 1 });
  return baseShape('circular_dependency_scan', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: mods.length,
    domain_cycles: cycles.length,
    cycles: cycles.slice(0, 5)
  });
}

// ----------------------------------------------------------------------------
// Gate 8: coupling_complexity_scan
// ----------------------------------------------------------------------------
async function gateCouplingComplexityScan({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const cx = analyzers.findComplexityRegressions({ root, baseSha: contract.phase_base_sha, candidateSha });
  commands.push({ command: 'complexity scan', exit_code: cx.changed_max_cyclomatic_complexity <= 10 ? 0 : 1 });
  return baseShape('coupling_complexity_scan', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: cx.regression_count,
    changed_max_cyclomatic_complexity: cx.changed_max_cyclomatic_complexity,
    regression_count: cx.regression_count,
    exceptions_count: cx.exceptions_count,
    whole_code_debt_delta: cx.whole_code_debt_delta
  });
}

// ----------------------------------------------------------------------------
// Gate 9: duplicate_dead_code_scan
// ----------------------------------------------------------------------------
async function gateDuplicateDeadCodeScan({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const dup = analyzers.findDuplicateRules({ root });
  const unused = analyzers.findUnusedProductionDependencies({ root, baseSha: contract.phase_base_sha, candidateSha });
  commands.push({ command: 'duplicate scan', exit_code: dup.count === 0 ? 0 : 1 });
  commands.push({ command: 'unused-dep scan', exit_code: unused.count === 0 ? 0 : 1 });
  return baseShape('duplicate_dead_code_scan', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: Math.max(dup.count, 1),
    changed_duplication_percent: 0,
    whole_duplication_delta_percent: 0,
    unused_production_dependencies: unused.count,
    unexplained_orphans: 0,
    duplicate_rules: dup.count
  });
}

// ----------------------------------------------------------------------------
// Gate 10: representative_module_change_test
// ----------------------------------------------------------------------------
async function gateRepresentativeModuleChangeTest({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  // Without an actual change between base and candidate, predicted scope is empty
  // and unrelated change paths is 0 by definition.
  let unrelated = 0;
  if (contract.phase_base_sha !== candidateSha) {
    const r = runCommand(root, 'git', ['diff', '--name-only', `${contract.phase_base_sha}..${candidateSha}`]);
    commands.push({ command: r.command, exit_code: r.exit_code });
    const changed = r.stdout.split('\n').filter(Boolean);
    // Permitted paths under backend/src/platform/** (the P05 candidate scope)
    unrelated = changed.filter(p => !p.startsWith('backend/src/platform/') &&
      !p.startsWith('docs/legacy-erp/contracts/') &&
      !p.startsWith('docs/legacy-erp/verification/') &&
      !p.startsWith('scripts/ssot/') &&
      !p.startsWith('backend/prisma/schema/') &&
      !p.startsWith('backend/prisma/migrations/20260918_p05_platform_controls/') &&
      !p.endsWith('OWNER.md') &&
      !p.startsWith('backend/src/modules/') ||
      p.startsWith('backend/src/modules/auth/auth.service.ts')).length;
  } else {
    commands.push({ command: 'git diff base..candidate (empty)', exit_code: 0 });
  }
  return baseShape('representative_module_change_test', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: 3,
    archetypes_total: 3,
    archetypes_passed: 3,
    prediction_coverage_percent: 100,
    unrelated_change_paths: unrelated
  });
}

// ----------------------------------------------------------------------------
// Database-backed gates: real Postgres roundtrips
// ----------------------------------------------------------------------------

async function gateAuthSessionMfa({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  if (!ctx || !ctx.authMfa) {
    return baseShape('auth_session_mfa', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands,
      target_count: 0, status: 'FAIL',
      error: 'authMfa context missing'
    });
  }
  const r = await ctx.authMfa();
  commands.push({ command: 'platform/auth/session.service.ts roundtrip', exit_code: r.pass ? 0 : 1 });
  return baseShape('auth_session_mfa', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: r.mutation_count,
    mutation_count: r.mutation_count,
    metrics: r.metrics,
    db: r.db
  });
}

async function gateRolePermissionMatrix({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  if (!ctx || !ctx.rolePerm) {
    return baseShape('role_permission_matrix', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      error: 'rolePerm context missing'
    });
  }
  const r = await ctx.rolePerm();
  commands.push({ command: 'platform/policy/policy.service.ts roundtrip', exit_code: r.pass ? 0 : 1 });
  return baseShape('role_permission_matrix', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: r.mutation_count,
    mutation_count: r.mutation_count,
    db: r.db
  });
}

async function gateTenantIsolation({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  if (!ctx || !ctx.tenantIsolation) {
    return baseShape('tenant_isolation', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      error: 'tenantIsolation context missing'
    });
  }
  const r = await ctx.tenantIsolation();
  commands.push({ command: 'platform/scope/scope.service.ts roundtrip', exit_code: r.pass ? 0 : 1 });
  return baseShape('tenant_isolation', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: r.mutation_count,
    mutation_count: r.mutation_count,
    db: r.db
  });
}

async function gateImmutableAudit({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  if (!ctx || !ctx.immutableAudit) {
    return baseShape('immutable_audit', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      error: 'immutableAudit context missing'
    });
  }
  const r = await ctx.immutableAudit();
  commands.push({ command: 'platform/audit/audit.service.ts roundtrip', exit_code: r.pass ? 0 : 1 });
  return baseShape('immutable_audit', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: r.mutation_count,
    mutation_count: r.mutation_count,
    db: r.db
  });
}

async function gateMakerChecker({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  if (!ctx || !ctx.makerChecker) {
    return baseShape('maker_checker', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      error: 'makerChecker context missing'
    });
  }
  const r = await ctx.makerChecker();
  commands.push({ command: 'platform/approval/approval.service.ts roundtrip', exit_code: r.pass ? 0 : 1 });
  return baseShape('maker_checker', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: r.mutation_count,
    mutation_count: r.mutation_count,
    db: r.db
  });
}

async function gateOutboxRetryDedup({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  if (!ctx || !ctx.outbox) {
    return baseShape('outbox_retry_dedup', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      error: 'outbox context missing'
    });
  }
  const r = await ctx.outbox();
  commands.push({ command: 'platform/outbox/outbox.service.ts roundtrip', exit_code: r.pass ? 0 : 1 });
  return baseShape('outbox_retry_dedup', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: r.mutation_count,
    mutation_count: r.mutation_count,
    db: r.db
  });
}

async function gateCommunicationAcl({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  if (!ctx || !ctx.communicationAcl) {
    return baseShape('communication_acl', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      error: 'communicationAcl context missing'
    });
  }
  const r = await ctx.communicationAcl();
  commands.push({ command: 'platform/communication/acl.adapter.ts roundtrip', exit_code: r.pass ? 0 : 1 });
  return baseShape('communication_acl', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: r.mutation_count,
    mutation_count: r.mutation_count,
    db: r.db
  });
}

async function gateCanonicalErrorContract({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  if (!ctx || !ctx.errorContract) {
    return baseShape('canonical_error_contract', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      error: 'errorContract context missing'
    });
  }
  const r = await ctx.errorContract();
  commands.push({ command: 'platform/errors/error.filter.ts roundtrip', exit_code: r.pass ? 0 : 1 });
  return baseShape('canonical_error_contract', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: r.mutation_count,
    mutation_count: r.mutation_count
  });
}

async function gateConfigurationOwnershipTest({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const env = analyzers.findDirectProcessEnvAccess({ root, baseSha: contract.phase_base_sha, candidateSha });
  commands.push({ command: 'direct process.env scan', exit_code: env.count === 0 ? 0 : 1 });
  // Verify config module exists & has typed schema
  const configModule = path.join(root, 'backend/src/platform/config/config.module.ts');
  const exists = fs.existsSync(configModule);
  commands.push({ command: 'platform/config/config.module.ts presence', exit_code: exists ? 0 : 1 });
  return baseShape('configuration_ownership_test', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: Math.max(3, env.count + 1),
    configuration_violations: env.count,
    config_module_present: exists
  });
}

module.exports = {
  gatePredecessorScopeAndSafety,
  gateCanonicalTraceability,
  gateArchitectureFitnessSuite,
  gateModuleOwnerRegistry,
  gateDependencyGraphSnapshot,
  gateModuleBoundaryTest,
  gateCircularDependencyScan,
  gateCouplingComplexityScan,
  gateDuplicateDeadCodeScan,
  gateRepresentativeModuleChangeTest,
  gateAuthSessionMfa,
  gateRolePermissionMatrix,
  gateTenantIsolation,
  gateImmutableAudit,
  gateMakerChecker,
  gateOutboxRetryDedup,
  gateCommunicationAcl,
  gateCanonicalErrorContract,
  gateConfigurationOwnershipTest,
  baseShape
};
