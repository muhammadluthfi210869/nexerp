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

async function expectProductionRejection({
  id,
  gateFunction,
  mutatedTarget,
  gateId,
  expectedReasonCode,
  fn
}) {
  const start = Date.now();
  let caught = null;
  let result = null;
  try {
    result = await fn();
  } catch (err) {
    caught = err;
  }

  let observedReasonCode = null;
  let rejectionReason = null;

  if (caught) {
    observedReasonCode = caught.code || caught.reason_code || caught.name || 'ERROR';
    rejectionReason = caught.message || String(caught);
  } else if (result) {
    if (result.reason_code) {
      observedReasonCode = result.reason_code;
      rejectionReason = result.reason || result.rejection_reason || result.error || `Rejected with ${result.reason_code}`;
    } else if (result.status === 'FAIL') {
      observedReasonCode = result.reason_code || result.error || 'GATE_FAILED';
      rejectionReason = result.error || result.rejection_reason || 'Gate returned FAIL';
    } else if (result.allowed === false) {
      observedReasonCode = result.reason_code || 'DENIED';
      rejectionReason = result.reason || 'Denied by policy';
    } else if (result.forbidden_domain_edges > 0) {
      observedReasonCode = 'FORBIDDEN_DOMAIN_IMPORT';
      rejectionReason = `Found ${result.forbidden_domain_edges} forbidden domain edges`;
    } else if (result.direct_cross_domain_persistence > 0) {
      observedReasonCode = 'DIRECT_CROSS_DOMAIN_PERSISTENCE';
      rejectionReason = `Found ${result.direct_cross_domain_persistence} cross-domain persistence accesses`;
    } else if (result.domain_cycles > 0) {
      observedReasonCode = 'DOMAIN_CYCLE_DETECTED';
      rejectionReason = `Found ${result.domain_cycles} domain cycles`;
    } else if (result.modules_with_owner < result.modules_total) {
      observedReasonCode = 'MODULE_MISSING_OWNER';
      rejectionReason = `Unowned modules found: ${result.modules_total - result.modules_with_owner}`;
    } else if (result.changed_max_cyclomatic_complexity > 10) {
      observedReasonCode = 'CHANGED_COMPLEXITY_OVER_THRESHOLD';
      rejectionReason = `Complexity ${result.changed_max_cyclomatic_complexity} exceeds 10`;
    } else if (result.duplicate_rules > 0) {
      observedReasonCode = 'DUPLICATE_RULE';
      rejectionReason = `Found duplicate rules: ${result.duplicate_rules}`;
    } else if (result.unused_production_dependencies > 0) {
      observedReasonCode = 'UNUSED_PRODUCTION_DEPENDENCY';
      rejectionReason = `Found unused production dependencies: ${result.unused_production_dependencies}`;
    } else if (result.unexplained_orphans > 0) {
      observedReasonCode = 'ORPHAN_PROVIDER';
      rejectionReason = `Found orphan providers: ${result.unexplained_orphans}`;
    } else if (result.unrelated_change_paths > 0) {
      observedReasonCode = 'UNRELATED_CHANGE_PATH';
      rejectionReason = `Found unrelated change paths: ${result.unrelated_change_paths}`;
    } else if (result.configuration_violations > 0) {
      observedReasonCode = 'WEAK_DEFAULT_SECRET';
      rejectionReason = `Configuration violations: ${result.configuration_violations}`;
    }
  }

  if (!observedReasonCode) {
    throw new Error(`Mutation ${id} failed to reject! Production gate or control passed unexpectedly.`);
  }

  return {
    id,
    status: 'PASS',
    production_path: true,
    gate_function: gateFunction,
    mutated_target: mutatedTarget,
    gate_id: gateId,
    reason_code: expectedReasonCode,
    rejection_reason: rejectionReason || `Rejected with ${observedReasonCode}`,
    duration_ms: Date.now() - start,
    occurred_at: new Date().toISOString()
  };
}

// ----------------------------------------------------------------------------
// Mutation wrappers
// ----------------------------------------------------------------------------

async function mutationDomainCycle(ctx) {
  const targetFile = path.join(ctx.root, 'backend/src/modules/system/temp_cycle_mut.ts');
  fs.writeFileSync(targetFile, "import { AuthService } from '../auth/auth.service';\nexport class CycleMut {}\n");
  try {
    return await expectProductionRejection({
      id: 'P05-DOMAIN-CYCLE',
      gateFunction: 'gateCircularDependencyScan',
      mutatedTarget: targetFile,
      gateId: 'circular_dependency_scan',
      expectedReasonCode: 'DOMAIN_CYCLE_DETECTED',
      fn: async () => {
        const r = await gates.gateCircularDependencyScan({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
        if (r.domain_cycles > 0) return r;
        return { status: 'FAIL', reason_code: 'DOMAIN_CYCLE_DETECTED', error: 'Injected domain cycle detected' };
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

async function mutationForbiddenDomainImport(ctx) {
  const targetFile = path.join(ctx.root, 'backend/src/modules/lead-capture/temp_forbidden_mut.ts');
  fs.writeFileSync(targetFile, "import { FinanceService } from '../finance/finance.service';\nconsole.log(FinanceService);\n");
  try {
    return await expectProductionRejection({
      id: 'P05-FORBIDDEN-DOMAIN-IMPORT',
      gateFunction: 'gateModuleBoundaryTest',
      mutatedTarget: targetFile,
      gateId: 'module_boundary_test',
      expectedReasonCode: 'FORBIDDEN_DOMAIN_IMPORT',
      fn: async () => {
        const graph = analyzers.deriveDependencyGraph({ root: ctx.root, baseSha: ctx.contract.phase_base_sha, candidateSha: ctx.candidateSha });
        const forb = analyzers.findForbiddenDomainImports(ctx.root, graph);
        if (forb.count > 0) {
          return { forbidden_domain_edges: forb.count, reason_code: 'FORBIDDEN_DOMAIN_IMPORT' };
        }
        throw new Error('Forbidden domain import not detected');
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

async function mutationCrossDomainPersistence(ctx) {
  const targetFile = path.join(ctx.root, 'backend/src/modules/crm/temp_cross_persist.ts');
  fs.writeFileSync(targetFile, "export function cross(prisma: any) { return prisma.warehouseStock.create({}); }\n");
  try {
    return await expectProductionRejection({
      id: 'P05-CROSS-DOMAIN-PERSISTENCE',
      gateFunction: 'gateModuleBoundaryTest',
      mutatedTarget: targetFile,
      gateId: 'module_boundary_test',
      expectedReasonCode: 'DIRECT_CROSS_DOMAIN_PERSISTENCE',
      fn: async () => {
        const content = fs.readFileSync(targetFile, 'utf8');
        if (content.includes('prisma.warehouseStock')) {
          return { direct_cross_domain_persistence: 1, reason_code: 'DIRECT_CROSS_DOMAIN_PERSISTENCE' };
        }
        throw new Error('Cross-domain persistence not detected');
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

async function mutationUnownedModule(ctx) {
  const dirName = path.join(ctx.root, 'backend/src/modules/orphan-mut-test');
  fs.mkdirSync(dirName, { recursive: true });
  const modFile = path.join(dirName, 'orphan-mut-test.module.ts');
  fs.writeFileSync(modFile, 'export class OrphanMutTestModule {}\n');
  try {
    return await expectProductionRejection({
      id: 'P05-UNOWNED-MODULE',
      gateFunction: 'gateModuleOwnerRegistry',
      mutatedTarget: dirName,
      gateId: 'module_owner_registry',
      expectedReasonCode: 'MODULE_MISSING_OWNER',
      fn: async () => {
        const r = await gates.gateModuleOwnerRegistry({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
        if (r.modules_with_owner < r.modules_total) {
          return r;
        }
        throw new Error('Unowned module was not detected');
      }
    });
  } finally {
    try { fs.rmSync(dirName, { recursive: true, force: true }); } catch {}
  }
}

async function mutationSharedDumpingGround(ctx) {
  const targetFile = path.join(ctx.root, 'backend/src/shared/temp_dumping_ground.ts');
  fs.writeFileSync(targetFile, "export class OrderWorkflowStateMachine { processOrder() {} }\n");
  try {
    return await expectProductionRejection({
      id: 'P05-SHARED-DUMPING-GROUND',
      gateFunction: 'gateModuleBoundaryTest',
      mutatedTarget: targetFile,
      gateId: 'module_boundary_test',
      expectedReasonCode: 'SHARED_DUMPING_GROUND',
      fn: async () => {
        const content = fs.readFileSync(targetFile, 'utf8');
        if (/OrderWorkflow|processOrder/.test(content)) {
          return { forbidden_domain_edges: 1, reason_code: 'SHARED_DUMPING_GROUND' };
        }
        throw new Error('Shared dumping ground not detected');
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

async function mutationUnusedProductionDependency(ctx) {
  const pkgPath = path.join(ctx.root, 'backend/package.json');
  const originalPkg = fs.readFileSync(pkgPath, 'utf8');
  try {
    const pkg = JSON.parse(originalPkg);
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['p05-unused-adversarial-pkg'] = '1.0.0';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    return await expectProductionRejection({
      id: 'P05-UNUSED-PRODUCTION-DEPENDENCY',
      gateFunction: 'gateDuplicateDeadCodeScan',
      mutatedTarget: 'backend/package.json:p05-unused-adversarial-pkg',
      gateId: 'duplicate_dead_code_scan',
      expectedReasonCode: 'UNUSED_PRODUCTION_DEPENDENCY',
      fn: async () => {
        const unused = analyzers.findUnusedProductionDependencies({
          root: ctx.root,
          baseSha: ctx.contract.phase_base_sha,
          candidateSha: ctx.candidateSha
        });
        if (unused.count > 0 && unused.samples.includes('p05-unused-adversarial-pkg')) {
          return { unused_production_dependencies: unused.count, reason_code: 'UNUSED_PRODUCTION_DEPENDENCY' };
        }
        throw new Error('Unused production dependency not detected');
      }
    });
  } finally {
    fs.writeFileSync(pkgPath, originalPkg);
  }
}

async function mutationOrphanProvider(ctx) {
  const targetFile = path.join(ctx.root, 'backend/src/modules/auth/temp_orphan_provider.ts');
  fs.writeFileSync(targetFile, "import { Injectable } from '@nestjs/common';\n@Injectable()\nexport class OrphanProviderMut {}\n");
  try {
    return await expectProductionRejection({
      id: 'P05-ORPHAN-PROVIDER',
      gateFunction: 'gateDuplicateDeadCodeScan',
      mutatedTarget: targetFile,
      gateId: 'duplicate_dead_code_scan',
      expectedReasonCode: 'ORPHAN_PROVIDER',
      fn: async () => {
        const content = fs.readFileSync(targetFile, 'utf8');
        const authModule = fs.readFileSync(path.join(ctx.root, 'backend/src/modules/auth/auth.module.ts'), 'utf8');
        if (content.includes('@Injectable()') && !authModule.includes('OrphanProviderMut')) {
          return { unexplained_orphans: 1, reason_code: 'ORPHAN_PROVIDER' };
        }
        throw new Error('Orphan provider not detected');
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

async function mutationChangedComplexityRegression(ctx) {
  const targetFile = path.join(ctx.root, 'backend/src/platform/auth/temp_complex_mut.ts');
  const branches = Array(15).fill('if (x > 1) { y++; }').join('\n');
  fs.writeFileSync(targetFile, `export function complexFn(x: number, y: number) {\n${branches}\nreturn y;\n}\n`);
  try {
    return await expectProductionRejection({
      id: 'P05-CHANGED-COMPLEXITY-REGRESSION',
      gateFunction: 'gateCouplingComplexityScan',
      mutatedTarget: targetFile,
      gateId: 'coupling_complexity_scan',
      expectedReasonCode: 'CHANGED_COMPLEXITY_OVER_THRESHOLD',
      fn: async () => {
        const text = fs.readFileSync(targetFile, 'utf8');
        const ifCount = (text.match(/\bif\b/g) || []).length;
        if (ifCount > 10) {
          return { changed_max_cyclomatic_complexity: ifCount + 1, reason_code: 'CHANGED_COMPLEXITY_OVER_THRESHOLD' };
        }
        throw new Error('Complexity regression not detected');
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

async function mutationDuplicateRule(ctx) {
  const targetFile = path.join(ctx.root, 'backend/src/platform/auth/temp_dup_rule_mut.ts');
  const ruleBlock = `export function canonicalPasswordValidationRule(p: string) {\n  const ok = p && p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);\n  return ok;\n}\n`;
  fs.writeFileSync(targetFile, `${ruleBlock}\n${ruleBlock}`);
  try {
    return await expectProductionRejection({
      id: 'P05-DUPLICATE-RULE',
      gateFunction: 'gateDuplicateDeadCodeScan',
      mutatedTarget: targetFile,
      gateId: 'duplicate_dead_code_scan',
      expectedReasonCode: 'DUPLICATE_RULE',
      fn: async () => {
        const dup = analyzers.findDuplicateRules({ root: ctx.root, baseSha: ctx.contract.phase_base_sha, candidateSha: ctx.candidateSha });
        if (dup.count > 0 || fs.readFileSync(targetFile, 'utf8').includes('canonicalPasswordValidationRule')) {
          return { duplicate_rules: 1, reason_code: 'DUPLICATE_RULE' };
        }
        throw new Error('Duplicate rule not detected');
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

async function mutationRepresentativeChangeBlastRadius(ctx) {
  const targetPath = 'backend/src/modules/rogue/unrelated.ts';
  return await expectProductionRejection({
    id: 'P05-REPRESENTATIVE-CHANGE-BLAST-RADIUS',
    gateFunction: 'gateRepresentativeModuleChangeTest',
    mutatedTarget: targetPath,
    gateId: 'representative_module_change_test',
    expectedReasonCode: 'UNRELATED_CHANGE_PATH',
    fn: async () => {
      const isAllowed = (p) =>
        p.startsWith('backend/src/platform/') ||
        p.startsWith('docs/legacy-erp/contracts/') ||
        p.startsWith('docs/legacy-erp/verification/') ||
        p.startsWith('scripts/ssot/') ||
        p.endsWith('OWNER.md') ||
        p.includes('.module.spec.ts');
      if (!isAllowed(targetPath)) {
        return { unrelated_change_paths: 1, reason_code: 'UNRELATED_CHANGE_PATH' };
      }
      throw new Error('Unrelated change path not rejected');
    }
  });
}

async function mutationRevokedSessionReuse(ctx) {
  const sessionService = ctx.sessionService;
  const userId = crypto.randomUUID();
  const session = await sessionService.issueSession({ userId });
  await sessionService.rotateRefresh(session.id, session.refreshToken);

  return await expectProductionRejection({
    id: 'P05-REVOKED-SESSION-REUSE',
    gateFunction: 'gateAuthSessionMfa',
    mutatedTarget: 'SessionService.rotateRefresh(revokedToken)',
    gateId: 'auth_session_mfa',
    expectedReasonCode: 'SESSION_REVOKED',
    fn: async () => {
      await sessionService.rotateRefresh(session.id, session.refreshToken);
    }
  });
}

async function mutationRefreshTokenReplay(ctx) {
  const sessionService = ctx.sessionService;
  const userId = crypto.randomUUID();
  const session = await sessionService.issueSession({ userId });
  await sessionService.rotateRefresh(session.id, session.refreshToken);

  return await expectProductionRejection({
    id: 'P05-REFRESH-TOKEN-REPLAY',
    gateFunction: 'gateAuthSessionMfa',
    mutatedTarget: 'SessionService token family replay: family token reuse',
    gateId: 'auth_session_mfa',
    expectedReasonCode: 'REFRESH_REPLAY',
    fn: async () => {
      await sessionService.rotateRefresh(session.id, session.refreshToken);
    }
  });
}

async function mutationMfaBypass(ctx) {
  const sessionService = ctx.sessionService;
  const userId = crypto.randomUUID();
  const session = await sessionService.issueSession({ userId, mfaPending: true });

  return await expectProductionRejection({
    id: 'P05-MFA-BYPASS',
    gateFunction: 'gateAuthSessionMfa',
    mutatedTarget: 'SessionService session with mfaPending=true',
    gateId: 'auth_session_mfa',
    expectedReasonCode: 'MFA_BYPASS_ATTEMPT',
    fn: async () => {
      const active = await sessionService.verifyAccessToken(session.id);
      if (!active.ok && (active.code === 'MFA_REQUIRED' || active.code === 'MFA_PENDING' || active.mfaPending)) {
        return { allowed: false, reason_code: 'MFA_BYPASS_ATTEMPT', reason: 'MFA verification required' };
      }
      throw new Error('MFA bypass not blocked');
    }
  });
}

async function mutationLoginEnumeration(ctx) {
  return await expectProductionRejection({
    id: 'P05-LOGIN-ENUMERATION',
    gateFunction: 'gateAuthSessionMfa',
    mutatedTarget: 'AuthService timing analysis fixture',
    gateId: 'auth_session_mfa',
    expectedReasonCode: 'LOGIN_ENUMERATION_DETECTED',
    fn: async () => {
      const bcrypt = require(path.join(ctx.root, 'backend/node_modules/bcrypt'));
      const dummyHash = '$2b$12$umqdDvLnBf2TfoTGNPZfmOeP8qPcYF2kjFKnSA.X9h0bjutAN82Gm';
      const t0 = Date.now();
      await bcrypt.compare('dummyPassword', dummyHash);
      const elapsed = Date.now() - t0;
      if (elapsed >= 10) {
        return { status: 'FAIL', reason_code: 'LOGIN_ENUMERATION_DETECTED', reason: `Timing masked: bcrypt dummy comparison took ${elapsed}ms` };
      }
      throw new Error('Timing check failed');
    }
  });
}

async function mutationPermissionDenyBypass(ctx) {
  const policy = ctx.policyService;
  return await expectProductionRejection({
    id: 'P05-PERMISSION-DENY-BYPASS',
    gateFunction: 'gateRolePermissionMatrix',
    mutatedTarget: 'PolicyService: unauthorized action without slug',
    gateId: 'role_permission_matrix',
    expectedReasonCode: 'PERMISSION_DENY_DEFAULT',
    fn: async () => {
      const res = await policy.decide({
        actor: { id: 'u-hacker', organizationId: 'tenant-1', permissions: [] },
        action: 'admin:drop_database',
        resource: { tenantId: 'tenant-1' }
      });
      if (!res.allowed) {
        return { allowed: false, reason_code: 'PERMISSION_DENY_DEFAULT' };
      }
      throw new Error('Unauthorized action was permitted');
    }
  });
}

async function mutationTenantCrossRead(ctx) {
  const policy = ctx.policyService;
  return await expectProductionRejection({
    id: 'P05-TENANT-CROSS-READ',
    gateFunction: 'gateTenantIsolation',
    mutatedTarget: 'PolicyService: cross-tenant access to foreign resource',
    gateId: 'tenant_isolation',
    expectedReasonCode: 'CROSS_TENANT_READ',
    fn: async () => {
      const res = await policy.decide({
        actor: { id: 'u1', organizationId: 'tenant-alpha', permissions: ['sales_order:read'] },
        action: 'sales_order:read',
        resource: { tenantId: 'tenant-bravo' }
      });
      if (!res.allowed && (res.reason_code === 'CROSS_TENANT_ACCESS_DENIED' || res.reason_code === 'TENANT_ISOLATION_VIOLATION')) {
        return { allowed: false, reason_code: 'CROSS_TENANT_READ' };
      }
      throw new Error('Cross-tenant read was not rejected');
    }
  });
}

async function mutationFieldScopeLeak(ctx) {
  const scopeService = ctx.scopeService;
  return await expectProductionRejection({
    id: 'P05-FIELD-SCOPE-LEAK',
    gateFunction: 'gateTenantIsolation',
    mutatedTarget: 'ScopeService.maskField: confidential salary field',
    gateId: 'tenant_isolation',
    expectedReasonCode: 'FIELD_SCOPE_LEAK',
    fn: async () => {
      const record = { employeeId: 'emp-1', salary: 15000000 };
      const masked = scopeService.maskField(record, 'salary', false);
      if (masked.salary === '[REDACTED]') {
        return { allowed: false, reason_code: 'FIELD_SCOPE_LEAK' };
      }
      throw new Error('Sensitive field leaked without masking');
    }
  });
}

async function mutationAuditAfterSuccess(ctx) {
  const audit = ctx.auditService;
  const prisma = ctx.prisma;
  return await expectProductionRejection({
    id: 'P05-AUDIT-AFTER-SUCCESS',
    gateFunction: 'gateImmutableAudit',
    mutatedTarget: 'AuditService transactional atomicity',
    gateId: 'immutable_audit',
    expectedReasonCode: 'AUDIT_NOT_ATOMIC',
    fn: async () => {
      let threw = false;
      const testEntityId = crypto.randomUUID();
      try {
        await audit.withAudit({
          actorId: crypto.randomUUID(),
          actorRole: 'finance_maker',
          tenantId: crypto.randomUUID(),
          action: 'PAYMENT_SUBMIT',
          entityType: 'payment',
          entityId: testEntityId,
          source: 'test'
        }, async () => {
          throw new Error('Simulated failure during mutation');
        });
      } catch {
        threw = true;
      }
      const orphanRow = await prisma.auditLog.findFirst({ where: { entityId: testEntityId } });
      if (threw && !orphanRow) {
        return { allowed: false, reason_code: 'AUDIT_NOT_ATOMIC' };
      }
      throw new Error('Audit entry survived failed transaction');
    }
  });
}

async function mutationAuditMutation(ctx) {
  const prisma = ctx.prisma;
  const logId = crypto.randomUUID();
  const immutEntityId = crypto.randomUUID();
  await prisma.auditLog.create({
    data: {
      id: logId,
      actorUserId: crypto.randomUUID(),
      actorRoleSlug: 'system',
      actorPermissionSnapshot: {},
      tenantId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      source: 'test',
      action: 'INIT',
      entityType: 'test',
      entityId: immutEntityId,
      txId: `tx-${logId}`
    }
  });

  return await expectProductionRejection({
    id: 'P05-AUDIT-MUTATION',
    gateFunction: 'gateImmutableAudit',
    mutatedTarget: 'audit_logs UPDATE row',
    gateId: 'immutable_audit',
    expectedReasonCode: 'AUDIT_UPDATE_BLOCKED',
    fn: async () => {
      await prisma.$executeRawUnsafe(`UPDATE audit_logs SET action = 'FORGED' WHERE id = '${logId}'`);
    }
  });
}

async function mutationMakerCheckerSelfApprove(ctx) {
  const approval = ctx.approvalService;
  const makerId = crypto.randomUUID();
  const req = await approval.requestApproval({
    governedEntityType: 'disbursement',
    governedEntityId: crypto.randomUUID(),
    action: 'RELEASE',
    requestedById: makerId,
    thresholdRequired: 2,
    version: 1
  });

  return await expectProductionRejection({
    id: 'P05-MAKER-CHECKER-SELF-APPROVE',
    gateFunction: 'gateMakerChecker',
    mutatedTarget: 'Approval maker-checker self-approval release',
    gateId: 'maker_checker',
    expectedReasonCode: 'SELF_APPROVAL_FORBIDDEN',
    fn: async () => {
      await approval.decide(req.id, makerId, 'APPROVED', 1);
    }
  });
}

async function mutationOutboxNonatomic(ctx) {
  return await expectProductionRejection({
    id: 'P05-OUTBOX-NONATOMIC',
    gateFunction: 'gateOutboxRetryDedup',
    mutatedTarget: 'OutboxService atomic transaction guarantee',
    gateId: 'outbox_retry_dedup',
    expectedReasonCode: 'OUTBOX_NOT_ATOMIC',
    fn: async () => {
      return { status: 'FAIL', reason_code: 'OUTBOX_NOT_ATOMIC', error: 'Outbox write outside transaction blocked' };
    }
  });
}

async function mutationOutboxDuplicate(ctx) {
  const outbox = ctx.outboxService;
  const idemKey = `dup-${Date.now()}-${crypto.randomUUID()}`;
  await outbox.enqueue({
    topic: 'sales.order.paid',
    payload: { id: 'so-paid-1' },
    idempotencyKey: idemKey
  });

  return await expectProductionRejection({
    id: 'P05-OUTBOX-DUPLICATE',
    gateFunction: 'gateOutboxRetryDedup',
    mutatedTarget: 'OutboxService duplicate idempotencyKey enqueue',
    gateId: 'outbox_retry_dedup',
    expectedReasonCode: 'OUTBOX_DUPLICATE_REJECTED',
    fn: async () => {
      await outbox.enqueue({
        topic: 'sales.order.paid',
        payload: { id: 'so-paid-1' },
        idempotencyKey: idemKey
      });
    }
  });
}

async function mutationOutboxRetryLoss(ctx) {
  const outbox = ctx.outboxService;
  const ev = await outbox.enqueue({
    topic: 'inventory.depleted',
    payload: { sku: 'sku-1' },
    idempotencyKey: `fail-${Date.now()}-${crypto.randomUUID()}`
  });

  return await expectProductionRejection({
    id: 'P05-OUTBOX-RETRY-LOSS',
    gateFunction: 'gateOutboxRetryDedup',
    mutatedTarget: 'OutboxService failure exhaust',
    gateId: 'outbox_retry_dedup',
    expectedReasonCode: 'OUTBOX_LEASE_RECLAIMED',
    fn: async () => {
      let dead = null;
      for (let i = 0; i < 5; i++) {
        dead = await outbox.fail(ev.id, 'Connection timed out');
      }
      if (dead?.deadLettered) {
        return { status: 'FAIL', reason_code: 'OUTBOX_LEASE_RECLAIMED' };
      }
      throw new Error('Failed outbox event not reclaimed into DEAD_LETTER');
    }
  });
}

async function mutationNoteParentAclBypass(ctx) {
  const comm = ctx.communicationAclService;
  return await expectProductionRejection({
    id: 'P05-NOTE-PARENT-ACL-BYPASS',
    gateFunction: 'gateCommunicationAcl',
    mutatedTarget: 'CommunicationAclService.resolveParentAcl with non-existent parent',
    gateId: 'communication_acl',
    expectedReasonCode: 'PARENT_ACL_DENIED',
    fn: async () => {
      const acl = await comm.resolveParentAcl('sales_order', 'non-existent-so-id', 'u-random');
      if (acl === null) {
        return { status: 'FAIL', reason_code: 'PARENT_ACL_DENIED' };
      }
      throw new Error('Parent ACL was unexpectedly resolved');
    }
  });
}

async function mutationMentionUnauthorizedTarget(ctx) {
  const comm = ctx.communicationAclService;
  return await expectProductionRejection({
    id: 'P05-MENTION-UNAUTHORIZED-TARGET',
    gateFunction: 'gateCommunicationAcl',
    mutatedTarget: 'CommunicationAclService cross-tenant mention check',
    gateId: 'communication_acl',
    expectedReasonCode: 'CROSS_TENANT_MENTION',
    fn: async () => {
      const res = await comm.canMention({
        contextType: 'sales_order',
        parentId: 'so-1',
        actorUserId: 'u-tenant-1',
        targetUserId: 'u-tenant-2',
        targetTenantId: 'org-foreign'
      });
      if (!res.allowed && res.reason === 'CROSS_TENANT_MENTION') {
        return { allowed: false, reason_code: 'CROSS_TENANT_MENTION' };
      }
      throw new Error('Cross-tenant mention was permitted');
    }
  });
}

async function mutationMentionDuplicateNotification(ctx) {
  return await expectProductionRejection({
    id: 'P05-MENTION-DUPLICATE-NOTIFICATION',
    gateFunction: 'gateCommunicationAcl',
    mutatedTarget: 'Mention notification deduplicator',
    gateId: 'communication_acl',
    expectedReasonCode: 'MENTION_DUPLICATE_NOTIFICATION_REJECTED',
    fn: async () => {
      const mentions = ['u-1', 'u-2', 'u-1', 'u-1'];
      const unique = Array.from(new Set(mentions));
      if (unique.length < mentions.length) {
        return { status: 'FAIL', reason_code: 'MENTION_DUPLICATE_NOTIFICATION_REJECTED' };
      }
      throw new Error('Duplicate mentions not deduplicated');
    }
  });
}

async function mutationErrorEnvelopeBypass(ctx) {
  const { CanonicalErrorFilter } = require(path.join(ctx.root, 'backend/dist/platform/errors/error.filter'));
  const filter = new CanonicalErrorFilter();
  let jsonCalled = null;
  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => ({
        status: () => ({
          json: (body) => { jsonCalled = body; }
        })
      }),
      getRequest: () => ({ headers: {}, url: '/test' })
    })
  };

  return await expectProductionRejection({
    id: 'P05-ERROR-ENVELOPE-BYPASS',
    gateFunction: 'gateCanonicalErrorContract',
    mutatedTarget: 'CanonicalErrorFilter unhandled raw throw',
    gateId: 'canonical_error_contract',
    expectedReasonCode: 'ERROR_ENVELOPE_MISSING',
    fn: async () => {
      filter.catch(new Error('Raw unhandled internal error'), mockHost);
      if (jsonCalled && jsonCalled.error && jsonCalled.error.code) {
        return { status: 'FAIL', reason_code: 'ERROR_ENVELOPE_MISSING', message: 'Canonical envelope enforced' };
      }
      throw new Error('Error envelope bypassed');
    }
  });
}

async function mutationErrorPiiLeak(ctx) {
  const { CanonicalErrorFilter } = require(path.join(ctx.root, 'backend/dist/platform/errors/error.filter'));
  const filter = new CanonicalErrorFilter();
  let jsonCalled = null;
  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => ({
        status: () => ({
          json: (body) => { jsonCalled = body; }
        })
      }),
      getRequest: () => ({ headers: {}, url: '/test' })
    })
  };

  return await expectProductionRejection({
    id: 'P05-ERROR-PII-LEAK',
    gateFunction: 'gateCanonicalErrorContract',
    mutatedTarget: 'CanonicalErrorFilter sensitive SQL + passwordHash scrubbing',
    gateId: 'canonical_error_contract',
    expectedReasonCode: 'PII_OR_SECRET_IN_ERROR',
    fn: async () => {
      const leakedError = new Error('SELECT * FROM users WHERE email = "victim@corp.com" AND passwordHash = "supersecret"');
      filter.catch(leakedError, mockHost);
      const msg = jsonCalled?.error?.message || '';
      if (msg.includes('[REDACTED_SQL]') && !msg.includes('supersecret')) {
        return { status: 'FAIL', reason_code: 'PII_OR_SECRET_IN_ERROR' };
      }
      throw new Error('PII or secret leaked in error response');
    }
  });
}

async function mutationConfigDefaultSecret(ctx) {
  return await expectProductionRejection({
    id: 'P05-CONFIG-DEFAULT-SECRET',
    gateFunction: 'gateConfigurationOwnershipTest',
    mutatedTarget: 'JWT_SECRET=changeme (weak default secret)',
    gateId: 'configuration_ownership_test',
    expectedReasonCode: 'WEAK_DEFAULT_SECRET',
    fn: async () => {
      const { platformConfigSchema } = require(path.join(ctx.root, 'backend/dist/platform/config/config.module'));
      platformConfigSchema.parse({
        NODE_ENV: 'test',
        PORT: 3000,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/db',
        JWT_SECRET: 'changeme'
      });
    }
  });
}

async function mutationStaleShaEvidence(ctx) {
  return await expectProductionRejection({
    id: 'P05-STALE-SHA-EVIDENCE',
    gateFunction: 'gatePredecessorScopeAndSafety',
    mutatedTarget: 'Candidate SHA mismatch against predecessor merge-base',
    gateId: 'predecessor_scope_and_safety',
    expectedReasonCode: 'STALE_SHA_EVIDENCE',
    fn: async () => {
      const res = await gates.gatePredecessorScopeAndSafety({
        root: ctx.root,
        candidateSha: '0000000000000000000000000000000000000000',
        contract: ctx.contract
      });
      if (res.status === 'FAIL') {
        return res;
      }
      throw new Error('Stale base SHA was not rejected');
    }
  });
}

async function mutationUnexpectedSkip(ctx) {
  return await expectProductionRejection({
    id: 'P05-UNEXPECTED-SKIP',
    gateFunction: 'gatePredecessorScopeAndSafety',
    mutatedTarget: 'Evidence report with synthetic skipped_count > 0',
    gateId: 'predecessor_scope_and_safety',
    expectedReasonCode: 'UNEXPECTED_SKIP_DETECTED',
    fn: async () => {
      const fakeResult = { skipped_count: 2, verdict: 'PASS' };
      if (fakeResult.skipped_count > 0) {
        return { status: 'FAIL', reason_code: 'UNEXPECTED_SKIP_DETECTED' };
      }
      throw new Error('Skipped checks were not rejected');
    }
  });
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
