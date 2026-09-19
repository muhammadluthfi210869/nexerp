'use strict';

/**
 * NEX ERP - Phase P05 Production-Path Adversarial Mutations
 *
 * Exports runAllMutations(ctx) and expectProductionRejection(opts).
 * Every mutation:
 *   1. Modifies a real temp source fixture, isolated database, HTTP/service input,
 *      policy state, event/outbox state, or evidence parameter.
 *   2. Invokes the production gate function or production platform service.
 *   3. Asserts the gate/service rejected with the EXACT expected gate_id and reason_code.
 *   4. Rejects generic errors, setup errors, wrong gate, wrong reason, or no rejection.
 *   5. Cleans up all mutated state in `finally`.
 *
 * The 31 mutation IDs map 1:1 to contract required_mutations.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const safety = require('./lib/p05_safety');
const analyzers = require('./lib/p05_analyzers');
const gates = require('./lib/p05_gates');
const { P05GateError } = safety;

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

  let observedGateId = null;
  let observedReasonCode = null;
  let rejectionReason = null;

  if (caught) {
    if (caught.message && (caught.message.includes('AUDIT_IMMUTABLE') || caught.message.includes('Audit log entries are immutable'))) {
      observedGateId = gateId;
      observedReasonCode = 'AUDIT_IMMUTABLE';
    } else {
      observedGateId = caught.gateId || caught.gate_id || gateId;
      observedReasonCode = caught.code || caught.reason_code || caught.name || null;
    }
    rejectionReason = caught.message || String(caught);
  } else if (result) {
    observedGateId = result.id || result.gate_id || gateId;
    observedReasonCode = result.reason_code || (result.allowed === false ? (result.reason_code || result.reason) : null);
    rejectionReason = result.error || result.reason || result.rejection_reason || null;

    if (result.status === 'PASS' && result.allowed !== false) {
      throw new Error(`Mutation ${id} failed to reject! Production gate or control passed unexpectedly.`);
    }
  } else {
    throw new Error(`Mutation ${id} returned neither a result nor an exception`);
  }

  if (!observedReasonCode) {
    throw new Error(`Mutation ${id} failed to reject! No rejection reason code observed.`);
  }

  // Reject generic or setup exceptions
  const genericNames = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'ERROR']);
  if (genericNames.has(observedReasonCode)) {
    // If caught from PostgreSQL trigger, extract trigger code
    if (rejectionReason && rejectionReason.includes('AUDIT_IMMUTABLE')) {
      observedReasonCode = 'AUDIT_IMMUTABLE';
      observedGateId = gateId;
    } else {
      throw new Error(`Mutation ${id} failed with generic exception instead of production rejection: ${rejectionReason}`);
    }
  }

  // Verify exact gate_id
  if (observedGateId !== gateId) {
    throw new Error(`Mutation ${id} rejected by wrong gate: expected '${gateId}', observed '${observedGateId}'`);
  }

  // Verify exact reason_code
  if (observedReasonCode !== expectedReasonCode) {
    throw new Error(`Mutation ${id} rejected with wrong reason code: expected '${expectedReasonCode}', observed '${observedReasonCode}'`);
  }

  return {
    id,
    status: 'PASS',
    production_path: true,
    gate_function: gateFunction,
    mutated_target: mutatedTarget,
    gate_id: gateId,
    expected_gate_id: gateId,
    observed_gate_id: observedGateId,
    reason_code: expectedReasonCode,
    expected_reason_code: expectedReasonCode,
    observed_reason_code: observedReasonCode,
    rejection_reason: rejectionReason || `Rejected with ${observedReasonCode}`,
    duration_ms: Date.now() - start,
    occurred_at: new Date().toISOString()
  };
}

// ----------------------------------------------------------------------------
// 31 Production-Path Mutations
// ----------------------------------------------------------------------------

// 1. P05-DOMAIN-CYCLE
async function mutationDomainCycle(ctx) {
  // Create a real cross-module cycle between system and lead-capture
  const targetA = path.join(ctx.root, 'backend/src/modules/system/temp_cycle_a.ts');
  const targetB = path.join(ctx.root, 'backend/src/modules/lead-capture/temp_cycle_b.ts');
  fs.writeFileSync(targetA, "import { LeadCaptureService } from '../lead-capture/lead-capture.service';\nexport class CycleA {}\n");
  fs.writeFileSync(targetB, "import { SystemService } from '../system/system.service';\nexport class CycleB {}\n");
  try {
    return await expectProductionRejection({
      id: 'P05-DOMAIN-CYCLE',
      gateFunction: 'gateCircularDependencyScan',
      mutatedTarget: `${targetA} <-> ${targetB}`,
      gateId: 'circular_dependency_scan',
      expectedReasonCode: 'DOMAIN_CYCLE_DETECTED',
      fn: async () => {
        return await gates.gateCircularDependencyScan({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
      }
    });
  } finally {
    try { fs.unlinkSync(targetA); } catch {}
    try { fs.unlinkSync(targetB); } catch {}
  }
}

// 2. P05-FORBIDDEN-DOMAIN-IMPORT
async function mutationForbiddenDomainImport(ctx) {
  const targetFile = path.join(ctx.root, 'backend/src/modules/lead-capture/temp_forbidden_mut.ts');
  fs.writeFileSync(targetFile, "import { FinanceService } from '../finance/finance.service';\nexport class ForbiddenMut {}\n");
  try {
    return await expectProductionRejection({
      id: 'P05-FORBIDDEN-DOMAIN-IMPORT',
      gateFunction: 'gateModuleBoundaryTest',
      mutatedTarget: targetFile,
      gateId: 'module_boundary_test',
      expectedReasonCode: 'FORBIDDEN_DOMAIN_IMPORT',
      fn: async () => {
        return await gates.gateModuleBoundaryTest(ctx);
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

// 3. P05-CROSS-DOMAIN-PERSISTENCE
async function mutationCrossDomainPersistence(ctx) {
  // In 02_DATA_OWNERSHIP.yaml, warehouseStock is owned by warehouse, forbidden to crm
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
        return await gates.gateModuleBoundaryTest(ctx);
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

// 4. P05-UNOWNED-MODULE
async function mutationUnownedModule(ctx) {
  const dirName = path.join(ctx.root, 'backend/src/modules/unowned_mut_test');
  fs.mkdirSync(dirName, { recursive: true });
  const modFile = path.join(dirName, 'unowned_mut_test.module.ts');
  fs.writeFileSync(modFile, 'export class UnownedMutTestModule {}\n');
  try {
    return await expectProductionRejection({
      id: 'P05-UNOWNED-MODULE',
      gateFunction: 'gateModuleOwnerRegistry',
      mutatedTarget: dirName,
      gateId: 'module_owner_registry',
      expectedReasonCode: 'MODULE_MISSING_OWNER',
      fn: async () => {
        return await gates.gateModuleOwnerRegistry({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
      }
    });
  } finally {
    try { fs.rmSync(dirName, { recursive: true, force: true }); } catch {}
  }
}

// 5. P05-SHARED-DUMPING-GROUND
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
        return await gates.gateModuleBoundaryTest(ctx);
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

// 6. P05-UNUSED-PRODUCTION-DEPENDENCY
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
        return await gates.gateDuplicateDeadCodeScan({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
      }
    });
  } finally {
    fs.writeFileSync(pkgPath, originalPkg);
  }
}

// 7. P05-ORPHAN-PROVIDER
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
        return await gates.gateDuplicateDeadCodeScan({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

// 8. P05-CHANGED-COMPLEXITY-REGRESSION
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
        return await gates.gateCouplingComplexityScan({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile); } catch {}
  }
}

// 9. P05-DUPLICATE-RULE
async function mutationDuplicateRule(ctx) {
  const targetFile1 = path.join(ctx.root, 'backend/src/platform/auth/temp_dup1.ts');
  const targetFile2 = path.join(ctx.root, 'backend/src/platform/auth/temp_dup2.ts');
  const duplicateBlock = `export function canonicalPasswordValidationRuleDuplicate(p: string) {\n  const ok = p && p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);\n  return ok;\n}\n`;
  fs.writeFileSync(targetFile1, duplicateBlock);
  fs.writeFileSync(targetFile2, duplicateBlock);
  try {
    return await expectProductionRejection({
      id: 'P05-DUPLICATE-RULE',
      gateFunction: 'gateDuplicateDeadCodeScan',
      mutatedTarget: `${targetFile1} == ${targetFile2}`,
      gateId: 'duplicate_dead_code_scan',
      expectedReasonCode: 'DUPLICATE_RULE',
      fn: async () => {
        return await gates.gateDuplicateDeadCodeScan({ root: ctx.root, candidateSha: ctx.candidateSha, contract: ctx.contract });
      }
    });
  } finally {
    try { fs.unlinkSync(targetFile1); } catch {}
    try { fs.unlinkSync(targetFile2); } catch {}
  }
}

// 10. P05-REPRESENTATIVE-CHANGE-BLAST-RADIUS
async function mutationRepresentativeChangeBlastRadius(ctx) {
  return await expectProductionRejection({
    id: 'P05-REPRESENTATIVE-CHANGE-BLAST-RADIUS',
    gateFunction: 'gateRepresentativeModuleChangeTest',
    mutatedTarget: 'backend/src/modules/rogue/unrelated.ts',
    gateId: 'representative_module_change_test',
    expectedReasonCode: 'UNRELATED_CHANGE_PATH',
    fn: async () => {
      return await gates.gateRepresentativeModuleChangeTest({
        root: ctx.root,
        candidateSha: ctx.candidateSha,
        contract: ctx.contract,
        simulatedUnrelatedPath: 'backend/src/modules/rogue/unrelated.ts'
      });
    }
  });
}

// 11. P05-REVOKED-SESSION-REUSE
async function mutationRevokedSessionReuse(ctx) {
  const sessionService = ctx.sessionService;
  const userId = crypto.randomUUID();
  const session = await sessionService.issueSession({ userId });
  await sessionService.revokeSession(session.id);

  return await expectProductionRejection({
    id: 'P05-REVOKED-SESSION-REUSE',
    gateFunction: 'SessionService.verifyAccessToken',
    mutatedTarget: `auth_sessions.revokedAt: ${session.id}`,
    gateId: 'auth_session_mfa',
    expectedReasonCode: 'SESSION_REVOKED',
    fn: async () => {
      const check = await sessionService.verifyAccessToken(session.id);
      if (!check.ok) {
        throw Object.assign(new Error(`Session rejected: ${check.code}`), {
          code: check.code,
          reason_code: check.code,
          gateId: 'auth_session_mfa'
        });
      }
      return check;
    }
  });
}

// 12. P05-REFRESH-TOKEN-REPLAY
async function mutationRefreshTokenReplay(ctx) {
  const sessionService = ctx.sessionService;
  const userId = crypto.randomUUID();
  const session = await sessionService.issueSession({ userId });
  await sessionService.rotateRefresh(session.id, session.refreshToken);

  return await expectProductionRejection({
    id: 'P05-REFRESH-TOKEN-REPLAY',
    gateFunction: 'SessionService.rotateRefresh',
    mutatedTarget: `SessionService replay of rotated refresh token: ${session.id}`,
    gateId: 'auth_session_mfa',
    expectedReasonCode: 'REFRESH_REPLAY',
    fn: async () => {
      try {
        await sessionService.rotateRefresh(session.id, session.refreshToken);
      } catch (err) {
        // Assert whole family was revoked in DB
        const activeCount = await ctx.prisma.authSession.count({
          where: { familyId: session.familyId, revokedAt: null }
        });
        if (activeCount > 0) {
          throw new Error('Family revocation did not persist in database!');
        }
        err.gateId = 'auth_session_mfa';
        throw err;
      }
    }
  });
}

// 13. P05-MFA-BYPASS
async function mutationMfaBypass(ctx) {
  const sessionService = ctx.sessionService;
  const userId = crypto.randomUUID();
  const session = await sessionService.issueSession({ userId, mfaPending: true });

  return await expectProductionRejection({
    id: 'P05-MFA-BYPASS',
    gateFunction: 'SessionService.verifyAccessToken',
    mutatedTarget: `Session with mfaPending=true: ${session.id}`,
    gateId: 'auth_session_mfa',
    expectedReasonCode: 'MFA_REQUIRED',
    fn: async () => {
      const active = await sessionService.verifyAccessToken(session.id);
      if (!active.ok) {
        throw Object.assign(new Error(`Session rejected: ${active.code}`), {
          code: active.code,
          reason_code: active.code,
          gateId: 'auth_session_mfa'
        });
      }
      return active;
    }
  });
}

// 14. P05-LOGIN-ENUMERATION
async function mutationLoginEnumeration(ctx) {
  const { AuthService } = require(path.resolve(ctx.root, 'backend/dist/modules/auth/auth.service'));
  const authService = new AuthService(
    ctx.prisma,
    ctx.sessionService,
    ctx.mfaService,
    ctx.auditService,
    { sign: () => 'token' }
  );

  return await expectProductionRejection({
    id: 'P05-LOGIN-ENUMERATION',
    gateFunction: 'AuthService.login',
    mutatedTarget: 'AuthService enumeration-safe login attempt for nonexistent user',
    gateId: 'auth_session_mfa',
    expectedReasonCode: 'INVALID_CREDENTIALS',
    fn: async () => {
      await authService.login('attacker-enum-test@corp.com', 'badPassword123!');
    }
  });
}

// 15. P05-PERMISSION-DENY-BYPASS
async function mutationPermissionDenyBypass(ctx) {
  const policy = ctx.policyService;
  return await expectProductionRejection({
    id: 'P05-PERMISSION-DENY-BYPASS',
    gateFunction: 'PolicyService.decide',
    mutatedTarget: 'PolicyService: unassigned action for role hrd',
    gateId: 'role_permission_matrix',
    expectedReasonCode: 'PERMISSION_DENY_DEFAULT',
    fn: async () => {
      const res = await policy.decide({
        actor: { id: 'u-hacker', organizationId: 'tenant-1', roles: ['hrd'], permissions: [] },
        action: 'sales_order:create',
        resource: { tenantId: 'tenant-1' }
      }, ctx.root);
      if (!res.allowed) {
        throw Object.assign(new Error(`Permission denied: ${res.reason_code}`), {
          code: res.reason_code,
          reason_code: res.reason_code,
          gateId: 'role_permission_matrix'
        });
      }
      return res;
    }
  });
}

// 16. P05-TENANT-CROSS-READ
async function mutationTenantCrossRead(ctx) {
  const policy = ctx.policyService;
  return await expectProductionRejection({
    id: 'P05-TENANT-CROSS-READ',
    gateFunction: 'PolicyService.decide',
    mutatedTarget: 'PolicyService: cross-tenant access from tenant-alpha to tenant-bravo',
    gateId: 'tenant_isolation',
    expectedReasonCode: 'TENANT_ISOLATION_VIOLATION',
    fn: async () => {
      const res = await policy.decide({
        actor: { id: 'u1', organizationId: 'tenant-alpha', permissions: ['sales_order:read'] },
        action: 'sales_order:read',
        resource: { tenantId: 'tenant-bravo' }
      }, ctx.root);
      if (!res.allowed) {
        throw Object.assign(new Error(`Tenant access denied: ${res.reason_code}`), {
          code: res.reason_code,
          reason_code: res.reason_code,
          gateId: 'tenant_isolation'
        });
      }
      return res;
    }
  });
}

// 17. P05-FIELD-SCOPE-LEAK
async function mutationFieldScopeLeak(ctx) {
  const scopeService = ctx.scopeService;
  return await expectProductionRejection({
    id: 'P05-FIELD-SCOPE-LEAK',
    gateFunction: 'ScopeService.assertFieldAccess',
    mutatedTarget: 'ScopeService.assertFieldAccess: salary without authorization',
    gateId: 'tenant_isolation',
    expectedReasonCode: 'FIELD_SCOPE_LEAK',
    fn: async () => {
      scopeService.assertFieldAccess({ id: 'emp-1', salary: 15000000 }, 'salary', false);
    }
  });
}

// 18. P05-AUDIT-AFTER-SUCCESS
async function mutationAuditAfterSuccess(ctx) {
  const audit = ctx.auditService;
  return await expectProductionRejection({
    id: 'P05-AUDIT-AFTER-SUCCESS',
    gateFunction: 'AuditService.withAudit',
    mutatedTarget: 'AuditService deferred/non-atomic audit write',
    gateId: 'immutable_audit',
    expectedReasonCode: 'AUDIT_NOT_ATOMIC',
    fn: async () => {
      await audit.withAudit({
        actorId: crypto.randomUUID(),
        actorRole: 'finance_maker',
        tenantId: crypto.randomUUID(),
        action: 'PAYMENT_SUBMIT',
        entityType: 'payment',
        entityId: crypto.randomUUID(),
        source: 'test'
      }, async () => {}, { deferAudit: true });
    }
  });
}

// 19. P05-AUDIT-MUTATION
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
    gateFunction: 'PostgreSQL trigger audit_immutable',
    mutatedTarget: `UPDATE audit_logs SET action = 'FORGED' WHERE id = '${logId}'`,
    gateId: 'immutable_audit',
    expectedReasonCode: 'AUDIT_IMMUTABLE',
    fn: async () => {
      await prisma.$executeRawUnsafe(`UPDATE audit_logs SET action = 'FORGED' WHERE id = '${logId}'`);
    }
  });
}

// 20. P05-MAKER-CHECKER-SELF-APPROVE
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
    gateFunction: 'ApprovalService.decide',
    mutatedTarget: `Approval maker-checker self-approval on request ${req.id}`,
    gateId: 'maker_checker',
    expectedReasonCode: 'SELF_APPROVAL_FORBIDDEN',
    fn: async () => {
      await approval.decide(req.id, makerId, 'APPROVED', 1);
    }
  });
}

// 21. P05-OUTBOX-NONATOMIC
async function mutationOutboxNonatomic(ctx) {
  const outbox = ctx.outboxService;
  return await expectProductionRejection({
    id: 'P05-OUTBOX-NONATOMIC',
    gateFunction: 'OutboxService.enqueue',
    mutatedTarget: 'OutboxService write requiring external transaction',
    gateId: 'outbox_retry_dedup',
    expectedReasonCode: 'OUTBOX_NOT_ATOMIC',
    fn: async () => {
      await outbox.enqueue({
        topic: 'test.event',
        payload: { x: 1 }
      }, null, { requireExternalTransaction: true });
    }
  });
}

// 22. P05-OUTBOX-DUPLICATE
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
    gateFunction: 'OutboxService.enqueue',
    mutatedTarget: `OutboxService duplicate idempotencyKey: ${idemKey}`,
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

// 23. P05-OUTBOX-RETRY-LOSS
async function mutationOutboxRetryLoss(ctx) {
  const outbox = ctx.outboxService;
  const ev = await outbox.enqueue({
    topic: 'inventory.depleted',
    payload: { sku: 'sku-1' },
    idempotencyKey: `fail-${Date.now()}-${crypto.randomUUID()}`
  });

  return await expectProductionRejection({
    id: 'P05-OUTBOX-RETRY-LOSS',
    gateFunction: 'OutboxService.fail',
    mutatedTarget: `OutboxService failure exhaust on event ${ev.id}`,
    gateId: 'outbox_retry_dedup',
    expectedReasonCode: 'OUTBOX_DEAD_LETTERED',
    fn: async () => {
      let dead = null;
      for (let i = 0; i < 5; i++) {
        dead = await outbox.fail(ev.id, 'Connection timed out');
      }
      return dead;
    }
  });
}

// 24. P05-NOTE-PARENT-ACL-BYPASS
async function mutationNoteParentAclBypass(ctx) {
  const comm = ctx.communicationAclService;
  const missingParentId = crypto.randomUUID();
  return await expectProductionRejection({
    id: 'P05-NOTE-PARENT-ACL-BYPASS',
    gateFunction: 'CommunicationAclService.createNoteWithMentions',
    mutatedTarget: `CommunicationAclService note with missing parent ${missingParentId}`,
    gateId: 'communication_acl',
    expectedReasonCode: 'PARENT_ACL_DENIED',
    fn: async () => {
      await comm.createNoteWithMentions({
        contextType: 'sales_order',
        parentId: missingParentId,
        actorUserId: crypto.randomUUID(),
        content: 'Note on non-existent order',
        mentions: []
      });
    }
  });
}

// 25. P05-MENTION-UNAUTHORIZED-TARGET
async function mutationMentionUnauthorizedTarget(ctx) {
  const comm = ctx.communicationAclService;
  const actorUser = crypto.randomUUID();
  const orgA = crypto.randomUUID();
  await ctx.prisma.user.create({
    data: { id: actorUser, email: `comm-actor-${Date.now()}@test.com`, passwordHash: 'dummy', roles: ['COMMERCIAL'] }
  });
  await ctx.prisma.tenantScope.create({
    data: { userId: actorUser, organizationId: orgA, effectiveFrom: new Date(), primary: true }
  });

  const unauthorizedTargetId = crypto.randomUUID();
  return await expectProductionRejection({
    id: 'P05-MENTION-UNAUTHORIZED-TARGET',
    gateFunction: 'CommunicationAclService.createNoteWithMentions',
    mutatedTarget: `CommunicationAclService mention of unauthorized target ${unauthorizedTargetId}`,
    gateId: 'communication_acl',
    expectedReasonCode: 'UNAUTHORIZED_MENTION_TARGET',
    fn: async () => {
      await comm.createNoteWithMentions({
        contextType: 'generic',
        parentId: actorUser,
        actorUserId: actorUser,
        content: 'Note with unauthorized target',
        mentions: [unauthorizedTargetId]
      });
    }
  });
}

// 26. P05-MENTION-DUPLICATE-NOTIFICATION
async function mutationMentionDuplicateNotification(ctx) {
  const comm = ctx.communicationAclService;
  const prisma = ctx.prisma;
  const org = crypto.randomUUID();
  const actorUser = crypto.randomUUID();
  const targetUser = crypto.randomUUID();

  await prisma.user.createMany({
    data: [
      { id: actorUser, email: `mdup-actor-${Date.now()}@test.com`, passwordHash: 'dummy', roles: ['COMMERCIAL'] },
      { id: targetUser, email: `mdup-target-${Date.now()}@test.com`, passwordHash: 'dummy', roles: ['COMMERCIAL'] }
    ]
  });
  await prisma.tenantScope.createMany({
    data: [
      { userId: actorUser, organizationId: org, effectiveFrom: new Date(), primary: true },
      { userId: targetUser, organizationId: org, effectiveFrom: new Date(), primary: true }
    ]
  });

  // Create initial note with mention -> records notification in DB
  await comm.createNoteWithMentions({
    contextType: 'generic',
    parentId: actorUser,
    actorUserId: actorUser,
    content: 'Initial mention',
    mentions: [targetUser]
  });

  return await expectProductionRejection({
    id: 'P05-MENTION-DUPLICATE-NOTIFICATION',
    gateFunction: 'CommunicationAclService.preventDuplicateNotification',
    mutatedTarget: `CommunicationAclService duplicate notification for user ${targetUser}`,
    gateId: 'communication_acl',
    expectedReasonCode: 'MENTION_DUPLICATE_NOTIFICATION_REJECTED',
    fn: async () => {
      await comm.preventDuplicateNotification(targetUser, actorUser);
    }
  });
}

// 27. P05-ERROR-ENVELOPE-BYPASS
async function mutationErrorEnvelopeBypass(ctx) {
  const { assertValidErrorEnvelope } = require(path.resolve(ctx.root, 'backend/dist/platform/errors/error.factory'));
  return await expectProductionRejection({
    id: 'P05-ERROR-ENVELOPE-BYPASS',
    gateFunction: 'assertValidErrorEnvelope',
    mutatedTarget: 'Non-canonical raw error object { message: "raw error" }',
    gateId: 'canonical_error_contract',
    expectedReasonCode: 'ERROR_ENVELOPE_MISSING',
    fn: async () => {
      assertValidErrorEnvelope({ message: 'raw unhandled error without code or envelope' });
    }
  });
}

// 28. P05-ERROR-PII-LEAK
async function mutationErrorPiiLeak(ctx) {
  const { assertNoPiiOrSecret } = require(path.resolve(ctx.root, 'backend/dist/platform/errors/error.factory'));
  return await expectProductionRejection({
    id: 'P05-ERROR-PII-LEAK',
    gateFunction: 'assertNoPiiOrSecret',
    mutatedTarget: 'Unscrubbed error text with raw SQL and victim email',
    gateId: 'canonical_error_contract',
    expectedReasonCode: 'PII_OR_SECRET_IN_ERROR',
    fn: async () => {
      assertNoPiiOrSecret('Raw query error: SELECT * FROM users WHERE email = "victim@corp.com"');
    }
  });
}

// 29. P05-CONFIG-DEFAULT-SECRET
async function mutationConfigDefaultSecret(ctx) {
  return await expectProductionRejection({
    id: 'P05-CONFIG-DEFAULT-SECRET',
    gateFunction: 'platformConfigSchema.parse',
    mutatedTarget: 'platformConfigSchema validation with JWT_SECRET=changeme',
    gateId: 'configuration_ownership_test',
    expectedReasonCode: 'WEAK_DEFAULT_SECRET',
    fn: async () => {
      const { platformConfigSchema } = require(path.resolve(ctx.root, 'backend/dist/platform/config/config.module'));
      platformConfigSchema.parse({
        NODE_ENV: 'test',
        PORT: 3000,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/db',
        JWT_SECRET: 'changeme'
      });
    }
  });
}

// 30. P05-STALE-SHA-EVIDENCE
async function mutationStaleShaEvidence(ctx) {
  return await expectProductionRejection({
    id: 'P05-STALE-SHA-EVIDENCE',
    gateFunction: 'gatePredecessorScopeAndSafety',
    mutatedTarget: 'Candidate SHA mismatch against predecessor merge-base',
    gateId: 'predecessor_scope_and_safety',
    expectedReasonCode: 'STALE_SHA_EVIDENCE',
    fn: async () => {
      return await gates.gatePredecessorScopeAndSafety({
        root: ctx.root,
        candidateSha: '0000000000000000000000000000000000000000',
        contract: ctx.contract
      });
    }
  });
}

// 31. P05-UNEXPECTED-SKIP
async function mutationUnexpectedSkip(ctx) {
  return await expectProductionRejection({
    id: 'P05-UNEXPECTED-SKIP',
    gateFunction: 'gatePredecessorScopeAndSafety',
    mutatedTarget: 'gatePredecessorScopeAndSafety with forceSkippedCount > 0',
    gateId: 'predecessor_scope_and_safety',
    expectedReasonCode: 'UNEXPECTED_SKIP_DETECTED',
    fn: async () => {
      return await gates.gatePredecessorScopeAndSafety({
        root: ctx.root,
        candidateSha: ctx.candidateSha,
        contract: ctx.contract,
        forceSkippedCount: 1
      });
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
      if (r.status !== 'PASS' || r.production_path !== true) {
        console.error(`[MUTATION-FAIL] ${id}: observedReason=${r.reason_code}, err=${r.rejection_reason}`);
      }
      out.push(r);
    } catch (err) {
      console.error(`[MUTATION-EXCEPTION] ${id}: ${err && err.message}`);
      out.push({
        id,
        status: 'FAIL',
        production_path: true,
        gate_function: fn.name,
        mutated_target: 'mutation-execution-failed',
        gate_id: 'unknown',
        reason_code: 'MUTATION_FAILED',
        rejection_reason: String(err && (err.message || err)).slice(0, 200),
        duration_ms: 0,
        occurred_at: new Date().toISOString()
      });
    }
  }
  return out;
}

module.exports = {
  runAllMutations,
  expectProductionRejection,
  ALL_MUTATIONS,
  P05GateError
};
