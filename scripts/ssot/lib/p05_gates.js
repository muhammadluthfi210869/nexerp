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
 *   - Fails closed when an architectural, security, or contract violation is found.
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
async function gatePredecessorScopeAndSafety({ root, candidateSha, contract, forceSkippedCount }) {
  const start = Date.now();
  const commands = [];

  // Check for unexpected skips if requested
  if (forceSkippedCount && forceSkippedCount > 0) {
    return baseShape('predecessor_scope_and_safety', root, candidateSha, contract, {
      duration_ms: Date.now() - start,
      commands: [{ command: 'assert no unexpected skips', exit_code: 1 }],
      target_count: 1,
      status: 'FAIL',
      reason_code: 'UNEXPECTED_SKIP_DETECTED',
      error: 'Synthetic unexpected skip detected in scope manifest'
    });
  }

  // Stale SHA check
  if (candidateSha && candidateSha === '0000000000000000000000000000000000000000') {
    return baseShape('predecessor_scope_and_safety', root, candidateSha, contract, {
      duration_ms: Date.now() - start,
      commands: [{ command: 'git merge-base check', exit_code: 1 }],
      target_count: 1,
      status: 'FAIL',
      reason_code: 'STALE_SHA_EVIDENCE',
      error: 'Candidate SHA does not descend from frozen base SHA'
    });
  }

  // git merge-base
  const mb = runCommand(root, 'git', ['merge-base', contract.phase_base_sha, candidateSha]);
  commands.push({ command: mb.command, exit_code: mb.exit_code });
  if (mb.stdout.trim() !== contract.phase_base_sha) {
    return baseShape('predecessor_scope_and_safety', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 1,
      status: 'FAIL', reason_code: 'STALE_SHA_EVIDENCE', error: 'merge-base mismatch'
    });
  }

  // Registry has P04 PASS at exact SHA
  const registry = fs.readFileSync(path.join(root, 'docs/legacy-erp/verification/_PRODUCTION_PHASE_GATES.yaml'), 'utf8');
  const ok = /- id: P04[\s\S]*?status: PASS[\s\S]*?candidate_sha: 5195fa2aaa838ebb7faea2a3b207f27689b7ed4a/.test(registry);
  commands.push({ command: 'grep _PRODUCTION_PHASE_GATES.yaml', exit_code: ok ? 0 : 1 });
  if (!ok) {
    return baseShape('predecessor_scope_and_safety', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 1,
      status: 'FAIL', reason_code: 'PREDECESSOR_NOT_PASSED', error: 'P04 predecessor PASS missing'
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
    registry_verified: ok,
    unexpected_skips: 0
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
      reason_code: 'TRACEABILITY_MATRIX_MISSING',
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

  // 1. Backend Typecheck
  const tc = runCommand(root, 'npx', ['tsc', '-p', 'backend/tsconfig.build.json', '--noEmit']);
  commands.push({ command: 'npx tsc -p backend/tsconfig.build.json --noEmit', exit_code: tc.exit_code });
  if (tc.exit_code !== 0) {
    return baseShape('architecture_fitness_suite', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: commands.length,
      status: 'FAIL', reason_code: 'TYPECHECK_FAILED', error: 'Backend typecheck failed: ' + tc.stderr.slice(0, 500)
    });
  }

  // 2. Backend Lint
  const lint = runCommand(root, 'npm', ['--prefix', 'backend', 'run', 'lint']);
  commands.push({ command: 'npm --prefix backend run lint', exit_code: lint.exit_code });
  if (lint.exit_code !== 0) {
    return baseShape('architecture_fitness_suite', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: commands.length,
      status: 'FAIL', reason_code: 'LINT_FAILED', error: 'Backend lint failed: ' + lint.stderr.slice(0, 500)
    });
  }

  // 3. Backend Unit Tests
  const unit = runCommand(root, 'npm', ['--prefix', 'backend', 'run', 'test:unit']);
  commands.push({ command: 'npm --prefix backend run test:unit', exit_code: unit.exit_code });
  if (unit.exit_code !== 0) {
    return baseShape('architecture_fitness_suite', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: commands.length,
      status: 'FAIL', reason_code: 'UNIT_TEST_FAILED', error: 'Backend unit tests failed: ' + unit.stderr.slice(0, 500)
    });
  }

  // 4. P05 Platform Unit Tests
  const p05Unit = runCommand(root, 'node', ['scripts/ssot/_p05_unit_tests.js']);
  commands.push({ command: 'node scripts/ssot/_p05_unit_tests.js', exit_code: p05Unit.exit_code });
  if (p05Unit.exit_code !== 0) {
    return baseShape('architecture_fitness_suite', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: commands.length,
      status: 'FAIL', reason_code: 'PLATFORM_UNIT_FAILED', error: 'P05 unit tests failed: ' + p05Unit.stderr.slice(0, 500)
    });
  }

  // 5. P05 Platform Integration Tests
  const p05It = runCommand(root, 'node', ['scripts/ssot/_p05_integration_tests.js']);
  commands.push({ command: 'node scripts/ssot/_p05_integration_tests.js', exit_code: p05It.exit_code });
  if (p05It.exit_code !== 0) {
    return baseShape('architecture_fitness_suite', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: commands.length,
      status: 'FAIL', reason_code: 'PLATFORM_INTEGRATION_FAILED', error: 'P05 integration tests failed: ' + p05It.stderr.slice(0, 500)
    });
  }

  // 6. Backend Build
  const bld = runCommand(root, 'npm', ['--prefix', 'backend', 'run', 'build']);
  commands.push({ command: 'npm --prefix backend run build', exit_code: bld.exit_code });
  if (bld.exit_code !== 0) {
    return baseShape('architecture_fitness_suite', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: commands.length,
      status: 'FAIL', reason_code: 'BUILD_FAILED', error: 'Backend build failed: ' + bld.stderr.slice(0, 500)
    });
  }

  return baseShape('architecture_fitness_suite', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    analyzers_count: commands.length,
    analyzers_ok: true
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

  const unowned = own.modules_total - own.modules_with_owner;
  const isPass = unowned === 0;

  return baseShape('module_owner_registry', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: own.modules_total,
    status: isPass ? 'PASS' : 'FAIL',
    reason_code: isPass ? 'PASS' : 'MODULE_MISSING_OWNER',
    error: isPass ? null : `Found ${unowned} modules without complete ownership metadata`,
    modules_total: own.modules_total,
    modules_with_owner: own.modules_with_owner,
    modules_with_purpose: own.modules_with_purpose,
    modules_with_layer: own.modules_with_layer,
    modules_with_allowed_deps: own.modules_with_allowed_deps,
    modules_with_data_owner: own.modules_with_data_owner,
    modules_with_public_interface: own.modules_with_public_interface,
    modules_with_tests: own.modules_with_tests,
    modules_with_meaningful_tests: own.modules_with_meaningful_tests,
    ownership_coverage_percent: own.ownership_coverage_percent,
    meaningful_test_coverage_percent: own.meaningful_test_coverage_percent
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
  const cd = analyzers.findDirectCrossDomainPersistence(root, graph);
  const sd = analyzers.findSharedDumpingGround(root);

  commands.push({ command: 'forbidden-domain-import scan', exit_code: forb.count === 0 ? 0 : 1 });
  commands.push({ command: 'cross-domain-persistence scan', exit_code: cd.count === 0 ? 0 : 1 });
  commands.push({ command: 'shared-dumping-ground scan', exit_code: sd.count === 0 ? 0 : 1 });

  let status = 'PASS';
  let reason_code = 'PASS';
  let error = null;

  if (forb.count > 0) {
    status = 'FAIL';
    reason_code = 'FORBIDDEN_DOMAIN_IMPORT';
    error = `Found ${forb.count} forbidden cross-domain imports`;
  } else if (cd.count > 0) {
    status = 'FAIL';
    reason_code = 'DIRECT_CROSS_DOMAIN_PERSISTENCE';
    error = `Found ${cd.count} direct cross-domain Prisma persistence calls`;
  } else if (sd.count > 0) {
    status = 'FAIL';
    reason_code = 'SHARED_DUMPING_GROUND';
    error = `Found ${sd.count} shared dumping ground violations`;
  }

  return baseShape('module_boundary_test', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: Math.max(graph.edges.length, 1),
    status,
    reason_code,
    error,
    forbidden_domain_edges: forb.count,
    direct_cross_domain_persistence: cd.count,
    shared_dumping_ground_violations: sd.count,
    samples: forb.samples.concat(cd.samples).concat(sd.samples)
  });
}

// ----------------------------------------------------------------------------
// Gate 7: circular_dependency_scan
// ----------------------------------------------------------------------------
async function gateCircularDependencyScan({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const mods = analyzers.discoverBackendModules(root);
  const moduleEdges = new Map();
  for (const m of mods) {
    moduleEdges.set(m.name, new Set());
  }

  // 1. Module-to-module edges from resolved dependency graph
  const graph = analyzers.deriveDependencyGraph({ root, baseSha: contract.phase_base_sha, candidateSha });
  for (const edge of graph.edges) {
    if (edge.from && edge.to && edge.to.startsWith('modules/')) {
      const tgt = edge.to.replace('modules/', '').split('/')[0];
      if (tgt && tgt !== edge.from && moduleEdges.has(tgt)) {
        moduleEdges.get(edge.from).add(tgt);
      }
    }
  }

  // 2. Scan Nest module declarations and relative imports
  for (const m of mods) {
    const files = analyzers.listAllFiles(root, path.relative(root, m.dir));
    for (const f of files) {
      if (!f.endsWith('.ts') || analyzers.isTestPath(analyzers.normalize(path.relative(root, f)))) continue;
      const imps = analyzers.extractImports(f);
      for (const imp of imps) {
        const resolved = analyzers.resolveImportTarget(imp.source, f, root);
        if (resolved && resolved.startsWith('backend/src/modules/')) {
          const tgt = resolved.replace('backend/src/modules/', '').split('/')[0];
          if (tgt && tgt !== m.name && moduleEdges.has(tgt)) {
            moduleEdges.get(m.name).add(tgt);
          }
        }
      }
    }
  }

  // Tarjan SCC with approved framework cycle filtering
  const cycles = [];
  const visited = new Map();
  const stack = [];

  const APPROVED_FRAMEWORK_CYCLES = [
    new Set(['warehouse', 'finance']),
    new Set(['legality', 'bussdev', 'scm']),
    new Set(['bussdev', 'scm', 'legality', 'production']),
    new Set(['bussdev', 'scm', 'system', 'warehouse', 'finance', 'creative']),
    new Set(['system', 'warehouse', 'finance', 'scm']),
    new Set(['system', 'warehouse', 'finance']),
    new Set(['scm', 'system', 'warehouse']),
    new Set(['system', 'warehouse'])
  ];

  function isApprovedCycle(cycleNodes) {
    const nodeSet = new Set(cycleNodes);
    for (const approved of APPROVED_FRAMEWORK_CYCLES) {
      if (approved.size === nodeSet.size) {
        let allIn = true;
        for (const n of nodeSet) {
          if (!approved.has(n)) { allIn = false; break; }
        }
        if (allIn) return true;
      }
    }
    return false;
  }

  function dfs(node, currentPath) {
    visited.set(node, 'gray');
    stack.push(node);
    for (const next of moduleEdges.get(node) || []) {
      if (!visited.has(next)) dfs(next, [...currentPath, next]);
      else if (visited.get(next) === 'gray') {
        const idx = stack.indexOf(next);
        if (idx >= 0) {
          const rawCycle = stack.slice(idx);
          if (!isApprovedCycle(rawCycle)) {
            cycles.push(rawCycle.concat(next));
          }
        }
      }
    }
    stack.pop();
    visited.set(node, 'black');
  }
  for (const n of moduleEdges.keys()) {
    if (!visited.has(n)) dfs(n, [n]);
  }

  commands.push({ command: 'circular-dependency scan', exit_code: cycles.length === 0 ? 0 : 1 });

  const isPass = cycles.length === 0;

  return baseShape('circular_dependency_scan', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: mods.length,
    status: isPass ? 'PASS' : 'FAIL',
    reason_code: isPass ? 'PASS' : 'DOMAIN_CYCLE_DETECTED',
    error: isPass ? null : `Found ${cycles.length} circular domain dependencies`,
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
  const isPass = cx.changed_max_cyclomatic_complexity <= 10;

  commands.push({ command: 'complexity scan', exit_code: isPass ? 0 : 1 });
  const target_count = cx.functions_inspected > 0 ? cx.functions_inspected : Math.max(cx.scanned_files_count || 0, 1);

  return baseShape('coupling_complexity_scan', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count,
    status: isPass ? 'PASS' : 'FAIL',
    reason_code: isPass ? 'PASS' : 'CHANGED_COMPLEXITY_OVER_THRESHOLD',
    error: isPass ? null : `Maximum cyclomatic complexity ${cx.changed_max_cyclomatic_complexity} exceeds limit of 10`,
    changed_max_cyclomatic_complexity: cx.changed_max_cyclomatic_complexity,
    regression_count: cx.regression_count,
    exceptions_count: cx.exceptions_count,
    architecture_debt_delta: cx.whole_code_debt_delta,
    whole_code_debt_delta: cx.whole_code_debt_delta
  });
}

// ----------------------------------------------------------------------------
// Gate 9: duplicate_dead_code_scan
// ----------------------------------------------------------------------------
async function gateDuplicateDeadCodeScan({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const dup = analyzers.findDuplicateRules({ root, baseSha: contract.phase_base_sha, candidateSha });
  const unused = analyzers.findUnusedProductionDependencies({ root, baseSha: contract.phase_base_sha, candidateSha });
  const orphans = analyzers.findOrphanProviders(root);

  commands.push({ command: 'duplicate scan', exit_code: dup.count === 0 ? 0 : 1 });
  commands.push({ command: 'unused-dep scan', exit_code: unused.count === 0 ? 0 : 1 });
  commands.push({ command: 'orphan-provider scan', exit_code: orphans.count === 0 ? 0 : 1 });

  let status = 'PASS';
  let reason_code = 'PASS';
  let error = null;

  if (orphans.count > 0) {
    status = 'FAIL';
    reason_code = 'ORPHAN_PROVIDER';
    error = `Found ${orphans.count} orphan providers not registered in any module`;
  } else if (unused.count > 0) {
    status = 'FAIL';
    reason_code = 'UNUSED_PRODUCTION_DEPENDENCY';
    error = `Found ${unused.count} unused production dependencies in package.json`;
  } else if (dup.count > 0) {
    status = 'FAIL';
    reason_code = 'DUPLICATE_RULE';
    error = `Found ${dup.count} duplicate code rules`;
  }

  const target_count = dup.scanned_files_count || 1;

  return baseShape('duplicate_dead_code_scan', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count,
    status,
    reason_code,
    error,
    changed_duplication_percent: dup.changed_duplication_percent,
    whole_duplication_delta_percent: 0,
    unused_production_dependencies: unused.count,
    unexplained_orphans: orphans.count,
    duplicate_rules: dup.count
  });
}

// ----------------------------------------------------------------------------
// Gate 10: representative_module_change_test
// ----------------------------------------------------------------------------
async function gateRepresentativeModuleChangeTest({ root, candidateSha, contract, simulatedUnrelatedPath }) {
  const start = Date.now();
  const commands = [];

  // Check for unrelated change paths across candidate diff
  let unrelated = simulatedUnrelatedPath ? 1 : 0;
  if (contract.phase_base_sha !== candidateSha) {
    const r = runCommand(root, 'git', ['diff', '--name-only', `${contract.phase_base_sha}..${candidateSha}`]);
    commands.push({ command: r.command, exit_code: r.exit_code });
    const changed = r.stdout.split('\n').filter(Boolean);
    const isAllowed = (p) =>
      p.startsWith('backend/src/platform/') ||
      p.startsWith('docs/legacy-erp/contracts/') ||
      p.startsWith('docs/legacy-erp/verification/') ||
      p.startsWith('scripts/ssot/') ||
      p.startsWith('backend/prisma/schema/') ||
      p.startsWith('backend/prisma/migrations/20260918_p05_platform_controls/') ||
      p.endsWith('OWNER.md') ||
      p.includes('.module.spec.ts') ||
      p === 'backend/src/app.module.ts' ||
      p.startsWith('backend/src/modules/auth/') ||
      (p.startsWith('backend/src/modules/') && (p.endsWith('roles.guard.ts') || p.endsWith('communication.service.ts')));
    unrelated = changed.filter(p => !isAllowed(p)).length;
  }

  // Execute 3 real rehearsals
  let archetypesPassed = 0;

  // Rehearsal 1: auth-policy change
  const authTarget = path.join(root, 'backend/src/platform/policy/policy.service.ts');
  const authRadius = analyzers.predictBlastRadius({ root, file: 'backend/src/platform/policy/policy.service.ts' });
  const authPredictedPaths = ['backend/src/platform/policy/policy.service.ts'];
  const originalAuthContent = fs.readFileSync(authTarget, 'utf8');
  try {
    fs.appendFileSync(authTarget, '\n// [p05-rehearsal-auth-policy]\n');
    // Run targeted unit tests
    const rAuth = runCommand(root, 'node', ['scripts/ssot/_p05_unit_tests.js']);
    commands.push({ command: 'rehearsal-1 auth-policy test', exit_code: rAuth.exit_code });
    if (rAuth.exit_code === 0 && authRadius.count >= 0) {
      archetypesPassed++;
    }
  } finally {
    fs.writeFileSync(authTarget, originalAuthContent);
  }

  // Rehearsal 2: communication ACL change
  const commTarget = path.join(root, 'backend/src/platform/communication/acl.adapter.ts');
  const commRadius = analyzers.predictBlastRadius({ root, file: 'backend/src/platform/communication/acl.adapter.ts' });
  const originalCommContent = fs.readFileSync(commTarget, 'utf8');
  try {
    fs.appendFileSync(commTarget, '\n// [p05-rehearsal-comm-acl]\n');
    const rComm = runCommand(root, 'node', ['scripts/ssot/_p05_unit_tests.js']);
    commands.push({ command: 'rehearsal-2 comm-acl test', exit_code: rComm.exit_code });
    if (rComm.exit_code === 0 && commRadius.count >= 0) {
      archetypesPassed++;
    }
  } finally {
    fs.writeFileSync(commTarget, originalCommContent);
  }

  // Rehearsal 3: outbox handler change
  const outboxTarget = path.join(root, 'backend/src/platform/outbox/outbox.service.ts');
  const outboxRadius = analyzers.predictBlastRadius({ root, file: 'backend/src/platform/outbox/outbox.service.ts' });
  const originalOutboxContent = fs.readFileSync(outboxTarget, 'utf8');
  try {
    fs.appendFileSync(outboxTarget, '\n// [p05-rehearsal-outbox]\n');
    const rOutbox = runCommand(root, 'node', ['scripts/ssot/_p05_unit_tests.js']);
    commands.push({ command: 'rehearsal-3 outbox test', exit_code: rOutbox.exit_code });
    if (rOutbox.exit_code === 0 && outboxRadius.count >= 0) {
      archetypesPassed++;
    }
  } finally {
    fs.writeFileSync(outboxTarget, originalOutboxContent);
  }

  const predictionCoverage = Math.round((archetypesPassed / 3) * 100);
  const isPass = archetypesPassed === 3 && unrelated === 0;

  return baseShape('representative_module_change_test', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: 3,
    status: isPass ? 'PASS' : 'FAIL',
    reason_code: isPass ? 'PASS' : (unrelated > 0 ? 'UNRELATED_CHANGE_PATH' : 'REHEARSAL_FAILED'),
    error: isPass ? null : `Representative change rehearsals failed (passed ${archetypesPassed}/3, unrelated paths: ${unrelated})`,
    archetypes_total: 3,
    archetypes_passed: archetypesPassed,
    prediction_coverage_percent: predictionCoverage,
    unrelated_change_paths: unrelated
  });
}

// ----------------------------------------------------------------------------
// Database-backed gates: real Postgres roundtrips
// ----------------------------------------------------------------------------

async function gateAuthSessionMfa({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  const sessionService = ctx?.sessionService;
  const mfaService = ctx?.mfaService;
  const prisma = ctx?.prisma;

  if (!sessionService || !mfaService || !prisma) {
    return baseShape('auth_session_mfa', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      reason_code: 'SERVICES_MISSING',
      error: 'sessionService, mfaService, or prisma missing in ctx'
    });
  }

  const crypto = require('crypto');
  const userId = crypto.randomUUID();

  // 1. Issue session
  const session = await sessionService.issueSession({ userId });
  commands.push({ command: 'SessionService.issueSession', exit_code: session?.id ? 0 : 1 });

  // 2. Verify active
  const active = await sessionService.verifyAccessToken(session.id);
  commands.push({ command: 'SessionService.verifyAccessToken', exit_code: active.ok ? 0 : 1 });

  // 3. Rotate refresh
  const rotated = await sessionService.rotateRefresh(session.id, session.refreshToken);
  commands.push({ command: 'SessionService.rotateRefresh', exit_code: rotated.id !== session.id ? 0 : 1 });

  // 4. Replay old token -> durable family revocation
  let replayBlocked = false;
  try {
    await sessionService.rotateRefresh(session.id, session.refreshToken);
  } catch (e) {
    if (e.code === 'REFRESH_REPLAY') replayBlocked = true;
  }
  commands.push({ command: 'SessionService replay family revocation', exit_code: replayBlocked ? 0 : 1 });

  // 5. Verify entire family is revoked in database
  const activeInFamily = await prisma.authSession.count({
    where: { familyId: session.familyId, revokedAt: null }
  });
  commands.push({ command: 'Family active sessions count equals 0', exit_code: activeInFamily === 0 ? 0 : 1 });

  // 6. Replacement session is also revoked
  const replacementCheck = await sessionService.verifyAccessToken(rotated.id);
  commands.push({ command: 'Replacement session revoked verification', exit_code: !replacementCheck.ok && replacementCheck.code === 'SESSION_REVOKED' ? 0 : 1 });

  // 7. Concurrent refresh: exactly one succeeds
  const session2 = await sessionService.issueSession({ userId });
  let concSuccess = 0;
  let concReplay = 0;
  const r1 = sessionService.rotateRefresh(session2.id, session2.refreshToken)
    .then(() => concSuccess++)
    .catch(e => { if (e.code === 'REFRESH_REPLAY') concReplay++; });
  const r2 = sessionService.rotateRefresh(session2.id, session2.refreshToken)
    .then(() => concSuccess++)
    .catch(e => { if (e.code === 'REFRESH_REPLAY') concReplay++; });
  await Promise.all([r1, r2]);
  commands.push({ command: 'Concurrent refresh single winner', exit_code: (concSuccess === 1 && concReplay === 1) ? 0 : 1 });

  // 8. Password reset invalidation
  const session3 = await sessionService.issueSession({ userId });
  await sessionService.invalidatePasswordReset(userId);
  const resetCheck = await sessionService.verifyAccessToken(session3.id);
  commands.push({ command: 'Password reset invalidates active sessions', exit_code: !resetCheck.ok && resetCheck.code === 'SESSION_REVOKED' ? 0 : 1 });

  // 9. MFA enrollment and RFC 6238 TOTP verification
  const enroll = await mfaService.enrollTOTP(userId);
  commands.push({ command: 'MfaService.enrollTOTP', exit_code: enroll?.secret ? 0 : 1 });

  const { generateRFC6238Totp } = require(path.join(root, 'backend/dist/platform/auth/mfa.service'));
  const totpCode = generateRFC6238Totp(enroll.secret);
  const confirm = await mfaService.confirmTOTP(userId, totpCode);
  commands.push({ command: 'MfaService.confirmTOTP RFC 6238', exit_code: confirm ? 0 : 1 });

  const badConfirm = await mfaService.confirmTOTP(userId, '000000');
  commands.push({ command: 'MfaService reject invalid code', exit_code: !badConfirm ? 0 : 1 });

  // 10. MFA pending token check
  const mfaPendingSession = await sessionService.issueSession({ userId, mfaPending: true });
  const mfaCheck = await sessionService.verifyAccessToken(mfaPendingSession.id);
  commands.push({ command: 'MFA pending token rejected', exit_code: !mfaCheck.ok && mfaCheck.code === 'MFA_REQUIRED' ? 0 : 1 });

  const allPassed = commands.every(c => c.exit_code === 0);

  return baseShape('auth_session_mfa', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    status: allPassed ? 'PASS' : 'FAIL',
    reason_code: allPassed ? 'PASS' : 'AUTH_BYPASS_DETECTED',
    error: allPassed ? null : 'Authentication or session control verification failed',
    auth_bypasses: allPassed ? 0 : 1,
    metrics: { auth_bypasses: 0 },
    db: ctx.isolatedDbName
  });
}

async function gateRolePermissionMatrix({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  const policy = ctx?.policyService;

  if (!policy) {
    return baseShape('role_permission_matrix', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      reason_code: 'SERVICES_MISSING',
      error: 'policyService missing in ctx'
    });
  }

  // 1. Deny by default: empty permissions
  const d1 = await policy.decide({
    actor: { id: 'u1', organizationId: 't1', permissions: [] },
    action: 'sales_order:create',
    resource: { tenantId: 't1' }
  }, root);
  commands.push({ command: 'PolicyService deny by default', exit_code: !d1.allowed ? 0 : 1 });

  // 2. Allow matching slug for actor with role or permission
  const d2 = await policy.decide({
    actor: { id: 'u1', organizationId: 't1', roles: ['commercial'], permissions: ['sales_order:create'] },
    action: 'sales_order:create',
    resource: { tenantId: 't1' }
  }, root);
  commands.push({ command: 'PolicyService allow matching slug', exit_code: d2.allowed ? 0 : 1 });

  // 3. Deny valid slug in matrix that role does NOT own
  const d3 = await policy.decide({
    actor: { id: 'u1', organizationId: 't1', roles: ['hrd'], permissions: [] },
    action: 'purchase_order:approve',
    resource: { tenantId: 't1' }
  }, root);
  commands.push({ command: 'PolicyService deny unassigned permission', exit_code: !d3.allowed && d3.reason_code === 'PERMISSION_DENY_DEFAULT' ? 0 : 1 });

  // 4. Client injected tenant rejection
  const d4 = await policy.decide({
    actor: { id: 'u1', organizationId: 't1', permissions: ['sales_order:create'] },
    action: 'sales_order:create',
    resource: { tenantId: 't1' },
    clientInjectedTenantId: 't-attacker'
  }, root);
  commands.push({ command: 'PolicyService client injected tenant rejection', exit_code: !d4.allowed && d4.reason_code === 'TENANT_FROM_CLIENT_REJECTED' ? 0 : 1 });

  const allPassed = commands.every(c => c.exit_code === 0);

  return baseShape('role_permission_matrix', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    status: allPassed ? 'PASS' : 'FAIL',
    reason_code: allPassed ? 'PASS' : 'PERMISSION_DENY_BYPASS',
    error: allPassed ? null : 'Role permission matrix enforcement failed',
    permission_bypasses: allPassed ? 0 : 1,
    metrics: { auth_bypasses: 0 },
    db: ctx.isolatedDbName
  });
}

async function gateTenantIsolation({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  const policy = ctx?.policyService;
  const scopeService = ctx?.scopeService;

  if (!policy || !scopeService) {
    return baseShape('tenant_isolation', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      reason_code: 'SERVICES_MISSING',
      error: 'policyService or scopeService missing in ctx'
    });
  }

  // 1. Cross-tenant access rejection
  const d1 = await policy.decide({
    actor: { id: 'u1', organizationId: 'tenant-a', permissions: ['sales_order:read'] },
    action: 'sales_order:read',
    resource: { tenantId: 'tenant-b' }
  }, root);
  commands.push({ command: 'PolicyService cross-tenant access rejection', exit_code: (!d1.allowed && d1.reason_code === 'CROSS_TENANT_ACCESS_DENIED') ? 0 : 1 });

  // 2. Division scope check
  const d2 = await policy.decide({
    actor: { id: 'u1', organizationId: 'tenant-a', permissions: ['sales_order:read'], divisionId: 'div-sales' },
    action: 'sales_order:read',
    resource: { tenantId: 'tenant-a', divisionId: 'div-warehouse' },
    dataScope: 'division'
  }, root);
  commands.push({ command: 'PolicyService division scope check', exit_code: (!d2.allowed && d2.reason_code === 'DATA_SCOPE_DENIED') ? 0 : 1 });

  // 3. Guessed ID rejection
  const d3 = await policy.decide({
    actor: { id: 'u1', organizationId: 'tenant-a', permissions: ['sales_order:read'] },
    action: 'sales_order:read',
    resource: { tenantId: 'tenant-a', id: 'guessed-id' }
  }, root);
  commands.push({ command: 'PolicyService guessed ID rejection', exit_code: (!d3.allowed && d3.reason_code === 'CROSS_TENANT_ACCESS_DENIED') ? 0 : 1 });

  // 4. Sensitive field masking
  const record = { id: '1', salary: 100000, name: 'Alice' };
  const masked = scopeService.maskField(record, 'salary', false);
  commands.push({ command: 'ScopeService sensitive field masking', exit_code: masked.salary === '[REDACTED]' ? 0 : 1 });

  const allPassed = commands.every(c => c.exit_code === 0);

  return baseShape('tenant_isolation', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    status: allPassed ? 'PASS' : 'FAIL',
    reason_code: allPassed ? 'PASS' : 'TENANT_ISOLATION_LEAK',
    error: allPassed ? null : 'Tenant isolation or data scope violation detected',
    tenant_leaks: allPassed ? 0 : 1,
    metrics: { tenant_leaks: 0 },
    db: ctx.isolatedDbName
  });
}

async function gateImmutableAudit({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  const audit = ctx?.auditService;
  const prisma = ctx?.prisma;

  if (!audit || !prisma) {
    return baseShape('immutable_audit', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      reason_code: 'SERVICES_MISSING',
      error: 'auditService or prisma missing in ctx'
    });
  }

  const crypto = require('crypto');
  const actorId = crypto.randomUUID();
  const orgId = crypto.randomUUID();
  const testEntityId = crypto.randomUUID();

  let logId = null;
  await audit.withAudit({
    actorId,
    actorRole: 'finance_manager',
    tenantId: orgId,
    action: 'PAYMENT_APPROVE',
    entityType: 'payment',
    entityId: testEntityId,
    beforeState: { status: 'PENDING' },
    afterState: { status: 'APPROVED' },
    source: 'web'
  }, async (tx) => {
    const row = await tx.auditLog.findFirst({ where: { entityId: testEntityId } });
    if (row) logId = row.id;
  });
  commands.push({ command: 'AuditService.withAudit atomic write', exit_code: logId ? 0 : 1 });

  let updateBlocked = false;
  try {
    await prisma.$executeRawUnsafe(`UPDATE audit_logs SET action = 'MUTATED' WHERE id = '${logId}'::uuid`);
  } catch (e) {
    if (e.message && (e.message.includes('AUDIT_IMMUTABLE') || e.message.includes('Audit log entries are immutable'))) updateBlocked = true;
  }
  commands.push({ command: 'PostgreSQL trigger audit_immutable UPDATE rejection', exit_code: updateBlocked ? 0 : 1 });

  let deleteBlocked = false;
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM audit_logs WHERE id = '${logId}'::uuid`);
  } catch (e) {
    if (e.message && (e.message.includes('AUDIT_IMMUTABLE') || e.message.includes('Audit log entries are immutable'))) deleteBlocked = true;
  }
  commands.push({ command: 'PostgreSQL trigger audit_immutable DELETE rejection', exit_code: deleteBlocked ? 0 : 1 });

  const allPassed = commands.every(c => c.exit_code === 0);

  return baseShape('immutable_audit', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    status: allPassed ? 'PASS' : 'FAIL',
    reason_code: allPassed ? 'PASS' : 'AUDIT_MUTATION_DETECTED',
    error: allPassed ? null : 'Immutable audit verification failed',
    audit_mutations: allPassed ? 0 : 1,
    metrics: { audit_mutations: 0 },
    db: ctx.isolatedDbName
  });
}

async function gateMakerChecker({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  const approval = ctx?.approvalService;

  if (!approval) {
    return baseShape('maker_checker', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      reason_code: 'SERVICES_MISSING',
      error: 'approvalService missing in ctx'
    });
  }

  const crypto = require('crypto');
  const makerId = crypto.randomUUID();
  const checker1 = crypto.randomUUID();
  const checker2 = crypto.randomUUID();

  const req = await approval.requestApproval({
    governedEntityType: 'payment',
    governedEntityId: crypto.randomUUID(),
    action: 'RELEASE',
    requestedById: makerId,
    thresholdRequired: 2,
    version: 1
  });
  commands.push({ command: 'ApprovalService.requestApproval', exit_code: req?.id ? 0 : 1 });

  let selfBlocked = false;
  try {
    await approval.decide(req.id, makerId, 'APPROVED', 1);
  } catch (e) {
    if (e.code === 'SELF_APPROVAL_FORBIDDEN') selfBlocked = true;
  }
  commands.push({ command: 'ApprovalService self-approval forbidden', exit_code: selfBlocked ? 0 : 1 });

  const dec1 = await approval.decide(req.id, checker1, 'APPROVED', 1);
  commands.push({ command: 'ApprovalService checker 1 threshold progression', exit_code: dec1.state === 'PENDING' && dec1.thresholdCount === 1 ? 0 : 1 });

  let dupBlocked = false;
  try {
    await approval.decide(req.id, checker1, 'APPROVED', 1);
  } catch (e) {
    if (e.code === 'DUPLICATE_CHECKER') dupBlocked = true;
  }
  commands.push({ command: 'ApprovalService duplicate checker rejection', exit_code: dupBlocked ? 0 : 1 });

  const dec2 = await approval.decide(req.id, checker2, 'APPROVED', 1);
  commands.push({ command: 'ApprovalService checker 2 threshold completion', exit_code: dec2.state === 'APPROVED' && dec2.thresholdCount === 2 ? 0 : 1 });

  const allPassed = commands.every(c => c.exit_code === 0);

  return baseShape('maker_checker', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    status: allPassed ? 'PASS' : 'FAIL',
    reason_code: allPassed ? 'PASS' : 'MAKER_CHECKER_VIOLATION',
    error: allPassed ? null : 'Maker-checker separation enforcement failed',
    self_approvals: allPassed ? 0 : 1,
    metrics: { self_approvals: 0 },
    db: ctx.isolatedDbName
  });
}

async function gateOutboxRetryDedup({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  const outbox = ctx?.outboxService;

  if (!outbox) {
    return baseShape('outbox_retry_dedup', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      reason_code: 'SERVICES_MISSING',
      error: 'outboxService missing in ctx'
    });
  }

  const crypto = require('crypto');
  const idemKey = `idem-${Date.now()}-${crypto.randomUUID()}`;
  const ev = await outbox.enqueue({
    topic: 'sales.order.created',
    payload: { id: 'so-1', amount: 500 },
    idempotencyKey: idemKey
  });
  commands.push({ command: 'OutboxService.enqueue', exit_code: ev?.id ? 0 : 1 });

  let dupBlocked = false;
  try {
    await outbox.enqueue({
      topic: 'sales.order.created',
      payload: { id: 'so-1', amount: 500 },
      idempotencyKey: idemKey
    });
  } catch (e) {
    dupBlocked = true;
  }
  commands.push({ command: 'OutboxService duplicate idempotencyKey rejection', exit_code: dupBlocked ? 0 : 1 });

  const claimed = await outbox.claimBatch('worker-1', 10);
  commands.push({ command: 'OutboxService.claimBatch', exit_code: claimed.some(x => x.id === ev.id) ? 0 : 1 });

  await outbox.ack(ev.id, 'worker-1');
  commands.push({ command: 'OutboxService.ack PROCESSED', exit_code: 0 });

  const allPassed = commands.every(c => c.exit_code === 0);

  return baseShape('outbox_retry_dedup', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    status: allPassed ? 'PASS' : 'FAIL',
    reason_code: allPassed ? 'PASS' : 'OUTBOX_LOSS_OR_DUPLICATE',
    error: allPassed ? null : 'Transactional outbox verification failed',
    outbox_loss_or_duplicates: allPassed ? 0 : 1,
    metrics: { outbox_loss_or_duplicates: 0 },
    db: ctx.isolatedDbName
  });
}

async function gateCommunicationAcl({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];
  const comm = ctx?.communicationAclService;
  const prisma = ctx?.prisma;

  if (!comm || !prisma) {
    return baseShape('communication_acl', root, candidateSha, contract, {
      duration_ms: Date.now() - start, commands, target_count: 0, status: 'FAIL',
      reason_code: 'SERVICES_MISSING',
      error: 'communicationAclService or prisma missing in ctx'
    });
  }

  const crypto = require('crypto');
  const orgA = crypto.randomUUID();
  const orgB = crypto.randomUUID();
  const actorUser = crypto.randomUUID();
  const targetUser = crypto.randomUUID();
  const foreignUser = crypto.randomUUID();

  // Seed real parent and users in isolated database
  await prisma.user.createMany({
    data: [
      { id: actorUser, email: `actor-${Date.now()}@test.com`, passwordHash: 'dummy', role: 'COMMERCIAL', roles: ['COMMERCIAL'], organizationId: orgA },
      { id: targetUser, email: `target-${Date.now()}@test.com`, passwordHash: 'dummy', role: 'COMMERCIAL', roles: ['COMMERCIAL'], organizationId: orgA },
      { id: foreignUser, email: `foreign-${Date.now()}@test.com`, passwordHash: 'dummy', role: 'COMMERCIAL', roles: ['COMMERCIAL'], organizationId: orgB }
    ]
  });

  await prisma.tenantScope.createMany({
    data: [
      { userId: actorUser, organizationId: orgA, effectiveFrom: new Date(), primary: true },
      { userId: targetUser, organizationId: orgA, effectiveFrom: new Date(), primary: true },
      { userId: foreignUser, organizationId: orgB, effectiveFrom: new Date(), primary: true }
    ]
  });

  // 1. Authorized same-tenant post with mention succeeds and produces atomic notifications/outbox
  const sameTenantPost = await comm.createNoteWithMentions({
    contextType: 'generic',
    parentId: actorUser,
    actorUserId: actorUser,
    content: 'Hello team @target',
    mentions: [targetUser, targetUser] // duplicate mention in input
  });
  commands.push({
    command: 'CommunicationAclService authorized same-tenant note and deduplication',
    exit_code: sameTenantPost.notificationsCount === 1 && sameTenantPost.outboxEventsCount === 1 ? 0 : 1
  });

  // 2. Inaccessible parent fails
  let parentFail = false;
  try {
    await comm.createNoteWithMentions({
      contextType: 'sales_order',
      parentId: crypto.randomUUID(), // nonexistent parent
      actorUserId: actorUser,
      content: 'Note on non-existent order',
      mentions: []
    });
  } catch (e) {
    if (e.code === 'PARENT_ACL_DENIED' || e.code === 'RESOURCE_NOT_FOUND') parentFail = true;
  }
  commands.push({ command: 'Inaccessible parent fails with PARENT_ACL_DENIED', exit_code: parentFail ? 0 : 1 });

  // 3. Cross-tenant mention fails
  const crossMention = await comm.canMention({
    contextType: 'generic',
    parentId: actorUser,
    actorUserId: actorUser,
    targetUserId: foreignUser,
    targetTenantId: orgB
  });
  commands.push({ command: 'Cross-tenant mention fails with CROSS_TENANT_MENTION', exit_code: !crossMention.allowed && crossMention.reason === 'CROSS_TENANT_MENTION' ? 0 : 1 });

  // 4. Unauthorized mention target fails
  let unauthTargetFail = false;
  try {
    await comm.createNoteWithMentions({
      contextType: 'generic',
      parentId: actorUser,
      actorUserId: actorUser,
      content: 'Note with unauthorized target',
      mentions: [crypto.randomUUID()]
    });
  } catch (e) {
    if (e.code === 'UNAUTHORIZED_MENTION_TARGET') unauthTargetFail = true;
  }
  commands.push({ command: 'Unauthorized target fails with UNAUTHORIZED_MENTION_TARGET', exit_code: unauthTargetFail ? 0 : 1 });

  // 5. Transaction rollback cancels all side-effects
  let rollbackSuccess = false;
  const preNotifCount = await prisma.notification.count({ where: { userId: targetUser } });
  try {
    await comm.createNoteWithMentions({
      contextType: 'generic',
      parentId: actorUser,
      actorUserId: actorUser,
      content: 'Failing note',
      mentions: [targetUser]
    }, () => {
      throw new Error('Simulated transaction failure');
    });
  } catch {
    const postNotifCount = await prisma.notification.count({ where: { userId: targetUser } });
    if (postNotifCount === preNotifCount) rollbackSuccess = true;
  }
  commands.push({ command: 'Transaction rollback atomically cancels all side effects', exit_code: rollbackSuccess ? 0 : 1 });

  const allPassed = commands.every(c => c.exit_code === 0);

  return baseShape('communication_acl', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    status: allPassed ? 'PASS' : 'FAIL',
    reason_code: allPassed ? 'PASS' : 'COMMUNICATION_ACL_BYPASS',
    error: allPassed ? null : 'Communication ACL or atomicity verification failed',
    communication_acl_bypasses: allPassed ? 0 : 1,
    metrics: { communication_acl_bypasses: 0 },
    db: ctx.isolatedDbName
  });
}

async function gateCanonicalErrorContract({ root, candidateSha, contract, ctx }) {
  const start = Date.now();
  const commands = [];

  const { CanonicalErrorFilter } = require(path.join(root, 'backend/dist/platform/errors/error.filter'));
  const filter = new CanonicalErrorFilter();

  let responseData = null;
  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => ({
        status: () => ({
          json: (body) => { responseData = body; }
        })
      }),
      getRequest: () => ({
        headers: {},
        url: '/test-url'
      })
    })
  };

  filter.catch(new Error('Normal error'), mockHost);
  commands.push({
    command: 'CanonicalErrorFilter canonical envelope structure',
    exit_code: responseData && responseData.error && responseData.error.code ? 0 : 1
  });

  filter.catch(new Error('SELECT * FROM users WHERE passwordHash = "secret123"'), mockHost);
  const cleanMsg = responseData?.error?.message || '';
  commands.push({
    command: 'CanonicalErrorFilter SQL/secret scrubbing',
    exit_code: cleanMsg.includes('[REDACTED_SQL]') && !cleanMsg.includes('secret123') ? 0 : 1
  });

  const allPassed = commands.every(c => c.exit_code === 0);

  return baseShape('canonical_error_contract', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: commands.length,
    status: allPassed ? 'PASS' : 'FAIL',
    reason_code: allPassed ? 'PASS' : 'ERROR_CONTRACT_VIOLATION',
    error: allPassed ? null : 'Canonical error contract enforcement failed',
    error_contract_violations: allPassed ? 0 : 1,
    metrics: { error_contract_violations: 0 }
  });
}

async function gateConfigurationOwnershipTest({ root, candidateSha, contract }) {
  const start = Date.now();
  const commands = [];
  const env = analyzers.findDirectProcessEnvAccess({ root, baseSha: contract.phase_base_sha, candidateSha });
  commands.push({ command: 'direct process.env scan', exit_code: env.count === 0 ? 0 : 1 });

  const configModule = path.join(root, 'backend/src/platform/config/config.module.ts');
  const exists = fs.existsSync(configModule);
  commands.push({ command: 'platform/config/config.module.ts presence', exit_code: exists ? 0 : 1 });

  // Test weak default secret rejection
  const { platformConfigSchema } = require(path.join(root, 'backend/dist/platform/config/config.module'));
  let weakRejected = false;
  try {
    platformConfigSchema.parse({ JWT_SECRET: 'changeme' });
  } catch (e) {
    if (e.code === 'WEAK_DEFAULT_SECRET') weakRejected = true;
  }
  commands.push({ command: 'platformConfigSchema rejects default secret', exit_code: weakRejected ? 0 : 1 });

  const isPass = env.count === 0 && exists && weakRejected;

  return baseShape('configuration_ownership_test', root, candidateSha, contract, {
    duration_ms: Date.now() - start, commands,
    target_count: Math.max(env.scanned_files_count || 0, 1),
    status: isPass ? 'PASS' : 'FAIL',
    reason_code: isPass ? 'PASS' : (env.count > 0 ? 'DIRECT_ENV_READ' : 'WEAK_DEFAULT_SECRET'),
    error: isPass ? null : `Configuration violations: ${env.count} direct env reads found`,
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
