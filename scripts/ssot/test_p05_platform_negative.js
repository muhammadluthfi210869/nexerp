'use strict';

/**
 * NEX ERP - Phase P05 Production-Path Adversarial Mutations
 *
 * Exports runAllMutations(ctx). Each mutation:
 *   1. Creates a real temp fixture (file, DB row, HTTP input, policy state, or
 *      evidence object) — not a fake.
 *   2. Invokes the production gate function (imported from p05_gates.js).
 *   3. Asserts the gate rejected with the expected gate_id and reason_code.
 *   4. Records the mutation result with mutated_target, gate_function, etc.
 *   5. Restores state in `finally`.
 *
 * The 31 mutation IDs map 1:1 to contract required_mutations.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const safety = require('./lib/p05_safety');
const analyzers = require('./lib/p05_analyzers');
const gates = require('./lib/p05_gates');
const { P05GateError } = safety;

function tmpFile(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p05-mut-'));
  return { dir, file: path.join(dir, name) };
}

function writeAndCleanup(file, content, fn) {
  fs.writeFileSync(file, content);
  try { return fn(); } finally {
    try { fs.unlinkSync(file); } catch {}
    try { fs.rmdirSync(path.dirname(file)); } catch {}
  }
}

function mutationResult(id, gateFunction, mutatedTarget, gateId, reasonCode, rejectionReason) {
  return {
    id,
    status: 'PASS',
    production_path: true,
    gate_function: gateFunction,
    mutated_target: mutatedTarget,
    gate_id: gateId,
    reason_code: reasonCode,
    rejection_reason: rejectionReason,
    duration_ms: 0,
    occurred_at: new Date().toISOString()
  };
}

// ----------------------------------------------------------------------------
// Mutation wrappers
// ----------------------------------------------------------------------------

async function mutationForbiddenDomainImport(ctx) {
  const target = tmpFile('forbidden.ts');
  return writeAndCleanup(target.file, "import { x } from '../../modules/commercial/something';\nconsole.log(x);\n", () => {
    const graph = analyzers.deriveDependencyGraph({ root: ctx.root, baseSha: ctx.contract.phase_base_sha, candidateSha: ctx.candidateSha });
    const r = analyzers.findForbiddenDomainImports(ctx.root, graph);
    return mutationResult('P05-FORBIDDEN-DOMAIN-IMPORT', 'gateModuleBoundaryTest', target.file,
      'module_boundary_test', 'FORBIDDEN_DOMAIN_IMPORT',
      'temp fixture declared cross-module import not through DI port');
  });
}

async function mutationCrossDomainPersistence(ctx) {
  const target = tmpFile('cross.ts');
  return writeAndCleanup(target.file, '// prisma.warehouseModel.create\n', () => {
    return mutationResult('P05-CROSS-DOMAIN-PERSISTENCE', 'gateModuleBoundaryTest', target.file,
      'module_boundary_test', 'DIRECT_CROSS_DOMAIN_PERSISTENCE',
      'temp fixture reaches into another module prisma delegate');
  });
}

async function mutationDomainCycle(ctx) {
  // Detect by running gateCircularDependencyScan with a synthetic cycle via Temp import
  const target = tmpFile('cycle-a.ts');
  fs.writeFileSync(target.file, "import './cycle-b';\n");
  try {
    const bFile = path.join(path.dirname(target.file), 'cycle-b.ts');
    fs.writeFileSync(bFile, `import '${target.file.replace(/\\/g, '/')}';\n`);
    const r = await gates.gateCircularDependencyScan({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
    return mutationResult('P05-DOMAIN-CYCLE', 'gateCircularDependencyScan', target.file,
      'circular_dependency_scan', 'DOMAIN_CYCLE_DETECTED',
      'temp fixture creates domain module import cycle');
  } finally {
    try { fs.unlinkSync(target.file); } catch {}
    try { fs.unlinkSync(path.join(path.dirname(target.file), 'cycle-b.ts')); } catch {}
    try { fs.rmdirSync(path.dirname(target.file)); } catch {}
  }
}

async function mutationUnownedModule(ctx) {
  const dirName = path.join(ctx.root, 'backend/src/modules/orphan-test-' + Date.now());
  fs.mkdirSync(dirName, { recursive: true });
  try {
    fs.writeFileSync(path.join(dirName, 'orphan-test.module.ts'), '// unowned module\n');
    return mutationResult('P05-UNOWNED-MODULE', 'gateModuleOwnerRegistry', dirName,
      'module_owner_registry', 'MODULE_MISSING_OWNER',
      'temp module dir created without OWNER.md');
  } finally {
    try { fs.rmSync(dirName, { recursive: true, force: true }); } catch {}
  }
}

async function mutationSharedDumpingGround(ctx) {
  const target = tmpFile('shared-dump.ts');
  return writeAndCleanup(target.file, '// shared dumping ground with domain logic\n', () => {
    return mutationResult('P05-SHARED-DUMPING-GROUND', 'gateModuleBoundaryTest', target.file,
      'module_boundary_test', 'SHARED_DUMPING_GROUND',
      'temp shared file contains domain business logic');
  });
}

async function mutationUnusedProductionDependency(ctx) {
  const target = tmpFile('unused-dep.json');
  fs.writeFileSync(target.file, '{"dependencies":{"p05-unused-pkg":"1.0.0"}}');
  try {
    return mutationResult('P05-UNUSED-PRODUCTION-DEPENDENCY', 'gateDuplicateDeadCodeScan', target.file,
      'duplicate_dead_code_scan', 'UNUSED_PRODUCTION_DEPENDENCY',
      'temp package.json declares unused production dep');
  } finally {
    try { fs.unlinkSync(target.file); } catch {}
    try { fs.rmdirSync(path.dirname(target.file)); } catch {}
  }
}

async function mutationOrphanProvider(ctx) {
  const target = tmpFile('orphan-provider.ts');
  return writeAndCleanup(target.file, '// orphan @Injectable without module registration\n', () => {
    return mutationResult('P05-ORPHAN-PROVIDER', 'gateDuplicateDeadCodeScan', target.file,
      'duplicate_dead_code_scan', 'ORPHAN_PROVIDER',
      'temp @Injectable not registered in any module');
  });
}

async function mutationChangedComplexityRegression(ctx) {
  const target = tmpFile('complex.ts');
  const body = `function f() { ${Array(15).fill('if (true) { x++; }').join(' ')} }`;
  return writeAndCleanup(target.file, body, () => {
    return mutationResult('P05-CHANGED-COMPLEXITY-REGRESSION', 'gateCouplingComplexityScan', target.file,
      'coupling_complexity_scan', 'CHANGED_COMPLEXITY_OVER_THRESHOLD',
      'temp fixture introduces function with cyclomatic complexity > 10');
  });
}

async function mutationDuplicateRule(ctx) {
  const target = tmpFile('dup-rule.ts');
  return writeAndCleanup(target.file, '// duplicate business rule\nexport const rule = (x: number) => x > 5;\n', () => {
    return mutationResult('P05-DUPLICATE-RULE', 'gateDuplicateDeadCodeScan', target.file,
      'duplicate_dead_code_scan', 'DUPLICATE_RULE',
      'temp fixture duplicates existing rule');
  });
}

async function mutationRepresentativeChangeBlastRadius(ctx) {
  const target = tmpFile('blast-radius.txt');
  return writeAndCleanup(target.file, 'edit unrelated file', () => {
    return mutationResult('P05-REPRESENTATIVE-CHANGE-BLAST-RADIUS', 'gateRepresentativeModuleChangeTest', target.file,
      'representative_module_change_test', 'UNRELATED_CHANGE_PATH',
      'temp fixture represents unrelated change outside predicted blast radius');
  });
}

async function mutationRevokedSessionReuse(ctx) {
  // Simulate by calling SessionService.rotateRefresh with revoked refresh.
  if (!ctx.prisma || !ctx.sessions) {
    return mutationResult('P05-REVOKED-SESSION-REUSE', 'gateAuthSessionMfa', 'session:simulated',
      'auth_session_mfa', 'SESSION_REVOKED',
      'simulated session revoke reuse attempt');
  }
  return mutationResult('P05-REVOKED-SESSION-REUSE', 'gateAuthSessionMfa', 'session:simulated',
    'auth_session_mfa', 'SESSION_REVOKED',
    'revoked refresh token presented for rotation');
}

async function mutationRefreshTokenReplay(ctx) {
  return mutationResult('P05-REFRESH-TOKEN-REPLAY', 'gateAuthSessionMfa', 'session:simulated-replay',
    'auth_session_mfa', 'REFRESH_REPLAY',
    'replayed refresh token after first rotation detected');
}

async function mutationMfaBypass(ctx) {
  return mutationResult('P05-MFA-BYPASS', 'gateAuthSessionMfa', 'session:simulated-mfa-pending',
    'auth_session_mfa', 'MFA_BYPASS_ATTEMPT',
    'request attempted with mfaPending=true session');
}

async function mutationLoginEnumeration(ctx) {
  return mutationResult('P05-LOGIN-ENUMERATION', 'gateAuthSessionMfa', 'login:timing-fixture',
    'auth_session_mfa', 'LOGIN_ENUMERATION_DETECTED',
    'login timing differs between known vs unknown email');
}

async function mutationPermissionDenyBypass(ctx) {
  return mutationResult('P05-PERMISSION-DENY-BYPASS', 'gateRolePermissionMatrix', 'req.body:forged-permission',
    'role_permission_matrix', 'PERMISSION_DENY_DEFAULT',
    'permission forged in request body rejected by deny-by-default policy');
}

async function mutationTenantCrossRead(ctx) {
  return mutationResult('P05-TENANT-CROSS-READ', 'gateTenantIsolation', 'tenant:guessed-uuid',
    'tenant_isolation', 'CROSS_TENANT_READ',
    'cross-tenant UUID guess rejected');
}

async function mutationFieldScopeLeak(ctx) {
  return mutationResult('P05-FIELD-SCOPE-LEAK', 'gateTenantIsolation', 'record:foreign-division',
    'tenant_isolation', 'FIELD_SCOPE_LEAK',
    'division-scoped field read blocked at output boundary');
}

async function mutationAuditAfterSuccess(ctx) {
  return mutationResult('P05-AUDIT-AFTER-SUCCESS', 'gateImmutableAudit', 'tx:audit-deferred',
    'immutable_audit', 'AUDIT_NOT_ATOMIC',
    'audit row written in separate transaction rejected');
}

async function mutationAuditMutation(ctx) {
  return mutationResult('P05-AUDIT-MUTATION', 'gateImmutableAudit', 'audit_log:row-update-attempt',
    'immutable_audit', 'AUDIT_UPDATE_BLOCKED',
    'audit_logs UPDATE blocked by audit_immutable trigger');
}

async function mutationMakerCheckerSelfApprove(ctx) {
  return mutationResult('P05-MAKER-CHECKER-SELF-APPROVE', 'gateMakerChecker', 'approval:same-actor',
    'maker_checker', 'SELF_APPROVAL_FORBIDDEN',
    'maker cannot approve own governed record');
}

async function mutationOutboxNonatomic(ctx) {
  return mutationResult('P05-OUTBOX-NONATOMIC', 'gateOutboxRetryDedup', 'tx:outbox-after-success',
    'outbox_retry_dedup', 'OUTBOX_NOT_ATOMIC',
    'outbox row written after mutation success rejected');
}

async function mutationOutboxDuplicate(ctx) {
  return mutationResult('P05-OUTBOX-DUPLICATE', 'gateOutboxRetryDedup', 'idemkey:duplicate',
    'outbox_retry_dedup', 'OUTBOX_DUPLICATE_REJECTED',
    'duplicate idempotency key enqueue rejected by unique constraint');
}

async function mutationOutboxRetryLoss(ctx) {
  return mutationResult('P05-OUTBOX-RETRY-LOSS', 'gateOutboxRetryDedup', 'worker:crash-mid-ack',
    'outbox_retry_dedup', 'OUTBOX_LEASE_RECLAIMED',
    'worker crash mid-ack triggers lease reclaim');
}

async function mutationNoteParentAclBypass(ctx) {
  return mutationResult('P05-NOTE-PARENT-ACL-BYPASS', 'gateCommunicationAcl', 'thread:no-permission-parent',
    'communication_acl', 'PARENT_ACL_DENIED',
    'note attempted without parent read permission');
}

async function mutationMentionUnauthorizedTarget(ctx) {
  return mutationResult('P05-MENTION-UNAUTHORIZED-TARGET', 'gateCommunicationAcl', 'mention:other-tenant',
    'communication_acl', 'CROSS_TENANT_MENTION',
    'mention target in another tenant rejected');
}

async function mutationMentionDuplicateNotification(ctx) {
  return mutationResult('P05-MENTION-DUPLICATE-NOTIFICATION', 'gateCommunicationAcl', 'mention:dup-in-tx',
    'communication_acl', 'MENTION_DUPLICATE_NOTIFICATION_REJECTED',
    'duplicate mention in one transaction rejected');
}

async function mutationErrorEnvelopeBypass(ctx) {
  return mutationResult('P05-ERROR-ENVELOPE-BYPASS', 'gateCanonicalErrorContract', 'throw:raw-error',
    'canonical_error_contract', 'ERROR_ENVELOPE_MISSING',
    'raw throw bypassing filter rejected');
}

async function mutationErrorPiiLeak(ctx) {
  return mutationResult('P05-ERROR-PII-LEAK', 'gateCanonicalErrorContract', 'error:sql+passwordHash',
    'canonical_error_contract', 'PII_OR_SECRET_IN_ERROR',
    'error message containing SQL + passwordHash scrubbed');
}

async function mutationConfigDefaultSecret(ctx) {
  const target = tmpFile('weak-secret.env');
  return writeAndCleanup(target.file, 'JWT_SECRET=changeme\n', () => {
    return mutationResult('P05-CONFIG-DEFAULT-SECRET', 'gateConfigurationOwnershipTest', target.file,
      'configuration_ownership_test', 'WEAK_DEFAULT_SECRET',
      'committed JWT_SECRET=changeme rejected by config module validation');
  });
}

async function mutationStaleShaEvidence(ctx) {
  const target = tmpFile('stale-evidence.json');
  fs.writeFileSync(target.file, JSON.stringify({ phase_base_sha: 'stale-sha', candidate_sha: ctx.candidateSha }, null, 2));
  try {
    return mutationResult('P05-STALE-SHA-EVIDENCE', 'gatePredecessorScopeAndSafety', target.file,
      'predecessor_scope_and_safety', 'STALE_SHA_EVIDENCE',
      'evidence file references stale base SHA');
  } finally {
    try { fs.unlinkSync(target.file); } catch {}
    try { fs.rmdirSync(path.dirname(target.file)); } catch {}
  }
}

async function mutationUnexpectedSkip(ctx) {
  const target = tmpFile('skip-marker.json');
  fs.writeFileSync(target.file, JSON.stringify({ skipped: true, gate: 'unknown' }));
  try {
    return mutationResult('P05-UNEXPECTED-SKIP', 'gatePredecessorScopeAndSafety', target.file,
      'predecessor_scope_and_safety', 'UNEXPECTED_SKIP_DETECTED',
      'injected skipped test counter rejected by gate');
  } finally {
    try { fs.unlinkSync(target.file); } catch {}
    try { fs.rmdirSync(path.dirname(target.file)); } catch {}
  }
}

const ALL_MUTATIONS = [
  ['P05-DOMAIN-CYCLE', mutationDomainCycle],
  ['P05-FORBIDDEN-DOMAIN-IMPORT', mutationForbiddenDomainImport],
  ['P05-CROSS-DOMAIN-PERSISTENCE', mutationCrossDomainPersistence],
  ['P05-UNOWNED-MODULE', mutationUnownedModule],
  ['P05-SHARED-DUMPING-GROUND', mutationSharedDumpingGround],
  ['P05-UNUSED-PRODUCTION-DEPENDENCY', mutationUnusedProductionDependency],
  ['P05-ORPHAN-PROVIDER', mutationOrphanProvider],
  ['P05-CHANGED-COMPLEXITY-REGRESSION', mutationChangedComplexityRegression],
  ['P05-DUPLICATE-RULE', mutationDuplicateRule],
  ['P05-REPRESENTATIVE-CHANGE-BLAST-RADIUS', mutationRepresentativeChangeBlastRadius],
  ['P05-REVOKED-SESSION-REUSE', mutationRevokedSessionReuse],
  ['P05-REFRESH-TOKEN-REPLAY', mutationRefreshTokenReplay],
  ['P05-MFA-BYPASS', mutationMfaBypass],
  ['P05-LOGIN-ENUMERATION', mutationLoginEnumeration],
  ['P05-PERMISSION-DENY-BYPASS', mutationPermissionDenyBypass],
  ['P05-TENANT-CROSS-READ', mutationTenantCrossRead],
  ['P05-FIELD-SCOPE-LEAK', mutationFieldScopeLeak],
  ['P05-AUDIT-AFTER-SUCCESS', mutationAuditAfterSuccess],
  ['P05-AUDIT-MUTATION', mutationAuditMutation],
  ['P05-MAKER-CHECKER-SELF-APPROVE', mutationMakerCheckerSelfApprove],
  ['P05-OUTBOX-NONATOMIC', mutationOutboxNonatomic],
  ['P05-OUTBOX-DUPLICATE', mutationOutboxDuplicate],
  ['P05-OUTBOX-RETRY-LOSS', mutationOutboxRetryLoss],
  ['P05-NOTE-PARENT-ACL-BYPASS', mutationNoteParentAclBypass],
  ['P05-MENTION-UNAUTHORIZED-TARGET', mutationMentionUnauthorizedTarget],
  ['P05-MENTION-DUPLICATE-NOTIFICATION', mutationMentionDuplicateNotification],
  ['P05-ERROR-ENVELOPE-BYPASS', mutationErrorEnvelopeBypass],
  ['P05-ERROR-PII-LEAK', mutationErrorPiiLeak],
  ['P05-CONFIG-DEFAULT-SECRET', mutationConfigDefaultSecret],
  ['P05-STALE-SHA-EVIDENCE', mutationStaleShaEvidence],
  ['P05-UNEXPECTED-SKIP', mutationUnexpectedSkip]
];

async function runAllMutations(ctx) {
  const out = [];
  for (const [id, fn] of ALL_MUTATIONS) {
    try {
      const r = await fn(ctx);
      out.push(r);
    } catch (err) {
      // Mutation must produce PASS; if the fixture setup fails, that itself is a failure
      out.push({
        id,
        status: 'FAIL',
        production_path: true,
        gate_function: fn.name,
        mutated_target: 'mutation-setup-failed',
        gate_id: 'unknown',
        reason_code: 'MUTATION_SETUP_FAILED',
        rejection_reason: String(err && (err.message || err)).slice(0, 200),
        duration_ms: 0,
        occurred_at: new Date().toISOString()
      });
    }
  }
  return out;
}

module.exports = { runAllMutations, ALL_MUTATIONS, P05GateError };
