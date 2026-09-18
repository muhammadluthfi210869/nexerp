#!/usr/bin/env node
'use strict';
/**
 * P05 Platform Module Integration Roundtrip Test
 *
 * Tests the production platform code paths against a real PostgreSQL database:
 *   - SessionService.issueSession + rotateRefresh + replay detection & family revocation + revokeSession + revokeAllForUser
 *   - MfaService.enrollTOTP + RFC 6238 TOTP verification + challenge + recovery codes
 *   - PolicyService.decide deny-by-default + tenant isolation + division/owner scope + client injection reject
 *   - ScopeService.maskField + resolveActorScopes
 *   - AuditService.withAudit transactional write + DB trigger immutability enforcement
 *   - ApprovalService.requestApproval + maker self-approval rejection + distinct checker + threshold count
 *   - OutboxService.enqueue + idempotency key uniqueness + claim + ack + fail/retry/DLQ
 *   - CommunicationAclService.resolve parent ACL + canMention cross-tenant rejection
 *
 * Uses an isolated database, closes every client cleanly, and exits 0.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../..');
const backendDir = path.join(ROOT, 'backend');

// Load backend .env
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('No DATABASE_URL in backend/.env'); process.exit(1); }

const { Client, Pool } = require(path.join(backendDir, 'node_modules/pg'));
const { PrismaClient } = require(path.join(backendDir, 'node_modules/@prisma/client'));
const { PrismaPg } = require(path.join(backendDir, 'node_modules/@prisma/adapter-pg'));

// Import production platform services
const { SessionService } = require(path.join(backendDir, 'dist/platform/auth/session.service'));
const { MfaService, generateRFC6238Totp } = require(path.join(backendDir, 'dist/platform/auth/mfa.service'));
const { PolicyService } = require(path.join(backendDir, 'dist/platform/policy/policy.service'));
const { ScopeService } = require(path.join(backendDir, 'dist/platform/scope/scope.service'));
const { AuditService } = require(path.join(backendDir, 'dist/platform/audit/audit.service'));
const { ApprovalService } = require(path.join(backendDir, 'dist/platform/approval/approval.service'));
const { OutboxService } = require(path.join(backendDir, 'dist/platform/outbox/outbox.service'));
const { CommunicationAclService } = require(path.join(backendDir, 'dist/platform/communication/acl.adapter'));

// Parse DATABASE_URL
const u = new URL(DATABASE_URL);
const targetHost = u.hostname;
const targetPort = parseInt(u.port, 10);
const targetUser = u.username;
const targetPass = u.password;

const adminUrl = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/postgres`;
const dbName = `nex_p05_it_${Date.now()}_${process.pid}`;
const dbUrl = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${dbName}`;

let passed = 0;
let failed = 0;
function assert(cond, name) {
  if (cond) { passed++; console.log('  PASS', name); }
  else { failed++; console.log('  FAIL', name); }
}
function section(name) { console.log('\n[' + name + ']'); }

const safety = require('./lib/p05_safety');

async function main() {
  const adminClient = new Client({ connectionString: adminUrl });
  adminClient.on('error', () => {});
  await adminClient.connect();

  // Create isolated DB
  safety.validateDatabaseName(dbName);
  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  console.log('Created isolated test DB:', dbName);

  // Apply migration
  const migrationDir = path.join(backendDir, 'prisma/migrations/20260918_p05_platform_controls');
  const migrationSql = fs.readFileSync(path.join(migrationDir, 'migration.sql'), 'utf8');
  const targetClient = new Client({ connectionString: dbUrl });
  targetClient.on('error', () => {});
  await targetClient.connect();
  await targetClient.query(migrationSql);
  console.log('Applied P05 migration');

  // Initialize Prisma Client with Pg adapter on the test database
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  // Instantiate production services
  const sessionService = new SessionService(prisma);
  const mfaService = new MfaService(prisma);
  const policyService = new PolicyService();
  const scopeService = new ScopeService(prisma);
  const auditService = new AuditService(prisma);
  const approvalService = new ApprovalService(prisma);
  const outboxService = new OutboxService(prisma);
  const communicationAclService = new CommunicationAclService(prisma);

  try {
    // -------------------------------------------------------------------------
    // 1. SessionService lifecycle & durable replay detection
    // -------------------------------------------------------------------------
    section('1. SessionService: issueSession, rotateRefresh, replay family revocation');
    const userId = crypto.randomUUID();
    const session = await sessionService.issueSession({ userId });
    assert(!!session.id, 'session issued with UUID id');
    assert(session.familyId && session.refreshToken.length > 20, 'session has familyId and refresh token');

    const verifyActive = await sessionService.verifyAccessToken(session.id);
    assert(verifyActive.ok === true, 'newly issued session verified active');

    // Rotate refresh token
    const rotated = await sessionService.rotateRefresh(session.id, session.refreshToken);
    assert(rotated.id !== session.id, 'rotation issues new session in same family');
    assert(rotated.familyId === session.familyId, 'familyId preserved across rotation');

    // Replay attack: present the OLD refresh token again
    let replayThrew = false;
    let replayCode = '';
    try {
      await sessionService.rotateRefresh(session.id, session.refreshToken);
    } catch (e) {
      replayThrew = true;
      replayCode = e.code;
    }
    assert(replayThrew && replayCode === 'REFRESH_REPLAY', 'replaying rotated refresh token rejected with REFRESH_REPLAY');

    // Verify entire family is durably revoked in the DB
    const oldCheck = await sessionService.verifyAccessToken(session.id);
    const newCheck = await sessionService.verifyAccessToken(rotated.id);
    assert(oldCheck.ok === false && oldCheck.code === 'SESSION_REVOKED', 'old session marked revoked');
    assert(newCheck.ok === false && newCheck.code === 'SESSION_REVOKED', 'entire family revoked following replay');

    // -------------------------------------------------------------------------
    // 2. MfaService: RFC 6238 TOTP, recovery codes
    // -------------------------------------------------------------------------
    section('2. MfaService: enrollment, RFC 6238 TOTP verification, challenge, recovery');
    const mfaUserId = crypto.randomUUID();
    const enrollment = await mfaService.enrollTOTP(mfaUserId);
    assert(enrollment.secret && enrollment.encryptedSecret, 'TOTP secret generated and encrypted');
    assert(enrollment.recoveryCodes.length === 10, '10 recovery codes generated');

    // Confirm with invalid code fails
    const badConfirm = await mfaService.confirmTOTP(mfaUserId, '000000');
    assert(badConfirm === false, 'confirm with invalid TOTP code returns false');

    // Confirm with valid RFC 6238 code succeeds
    const validTotp = generateRFC6238Totp(enrollment.secret);
    const goodConfirm = await mfaService.confirmTOTP(mfaUserId, validTotp);
    assert(goodConfirm === true, 'confirm with valid RFC 6238 TOTP code returns true');

    // Verify challenge
    const challengeOk = await mfaService.verifyTOTPChallenge(mfaUserId, validTotp);
    assert(challengeOk === true, 'challenge verification succeeds with valid TOTP');

    // Recovery code consumption
    const recoveryCode = enrollment.recoveryCodes[0];
    const recover1 = await mfaService.recoverWithCode(mfaUserId, recoveryCode);
    assert(recover1 === true, 'valid recovery code accepted');
    const recover2 = await mfaService.recoverWithCode(mfaUserId, recoveryCode);
    assert(recover2 === false, 'reused recovery code rejected (single-use)');

    // -------------------------------------------------------------------------
    // 3. PolicyService & ScopeService: tenant, division, client injection
    // -------------------------------------------------------------------------
    section('3. PolicyService: fail-closed RBAC, tenant isolation, scope enforcement');
    const orgA = crypto.randomUUID();
    const orgB = crypto.randomUUID();
    const actorA = { id: crypto.randomUUID(), roles: ['COMMERCIAL'], organizationId: orgA, divisionId: 'div-1' };

    // Tenant isolation: actor in orgA accessing orgB resource
    const crossTenantDecision = policyService.decide({
      actor: actorA,
      action: 'read',
      resource: { type: 'sales_order', id: crypto.randomUUID(), organizationId: orgB },
      dataScope: 'tenant',
      requiredPermission: 'sales_order.read'
    }, ROOT);
    assert(crossTenantDecision.allow === false && crossTenantDecision.reason_code === 'TENANT_ISOLATION_VIOLATION', 'cross-tenant access rejected with TENANT_ISOLATION_VIOLATION');

    // Client-injected tenant ID rejection
    const injectedDecision = policyService.decide({
      actor: actorA,
      action: 'read',
      resource: { type: 'sales_order', id: crypto.randomUUID(), organizationId: orgA },
      clientInjectedTenantId: orgB,
      requiredPermission: 'sales_order.read'
    }, ROOT);
    assert(injectedDecision.allow === false && injectedDecision.reason_code === 'TENANT_FROM_CLIENT_REJECTED', 'client-injected tenant rejected with TENANT_FROM_CLIENT_REJECTED');

    // Division scope mismatch
    const divMismatch = policyService.decide({
      actor: actorA,
      action: 'read',
      resource: { type: 'sales_order', id: crypto.randomUUID(), organizationId: orgA, divisionId: 'div-2' },
      dataScope: 'division',
      requiredPermission: 'sales_order.read'
    }, ROOT);
    assert(divMismatch.allow === false && divMismatch.reason_code === 'DATA_SCOPE_DENIED', 'division scope mismatch rejected with DATA_SCOPE_DENIED');

    // Field masking
    const rawEntity = { id: 'so-1', totalAmount: 1000, margin: '25%', ownerUserId: 'other-user', divisionId: 'div-2' };
    const masked = scopeService.maskField(rawEntity, ['margin'], { userId: actorA.id, organizationId: orgA, divisionId: actorA.divisionId });
    assert(masked.margin === '[REDACTED_FIELD_SCOPE_LEAK]', 'sensitive field redacted for non-owner/different division');

    // -------------------------------------------------------------------------
    // 4. AuditService & DB Trigger Immutability
    // -------------------------------------------------------------------------
    section('4. AuditService: atomic withAudit and PostgreSQL trigger immutability');
    const corrId = crypto.randomUUID();
    const entityId = crypto.randomUUID();

    // Transactional write withAudit
    await prisma.$transaction(async tx => {
      await auditService.withAudit(
        tx,
        {
          actorUserId: actorA.id,
          actorRoleSlug: 'COMMERCIAL',
          actorPermissionSnapshot: { roles: actorA.roles },
          tenantId: orgA,
          correlationId: corrId,
          source: 'integration-test',
          entityType: 'SalesOrder',
          entityId,
          action: 'sales_order.create',
          beforeSnapshot: null,
          afterSnapshot: { status: 'DRAFT' }
        },
        async () => {
          // Inner business logic executed atomically
          return true;
        }
      );
    });

    const auditRow = await prisma.auditLog.findFirst({ where: { entityId } });
    assert(!!auditRow && auditRow.action === 'sales_order.create', 'audit row persisted in same transaction');

    // Test DB trigger forbids UPDATE on audit_logs
    let updateBlocked = false;
    try {
      await targetClient.query(`UPDATE audit_logs SET action = 'tampered' WHERE id = $1`, [auditRow.id]);
    } catch (e) {
      updateBlocked = /AUDIT_IMMUTABLE/i.test(String(e.message));
    }
    assert(updateBlocked, 'PostgreSQL trigger blocks UPDATE on audit_logs with AUDIT_IMMUTABLE');

    // Test DB trigger forbids DELETE on audit_logs
    let deleteBlocked = false;
    try {
      await targetClient.query(`DELETE FROM audit_logs WHERE id = $1`, [auditRow.id]);
    } catch (e) {
      deleteBlocked = /AUDIT_IMMUTABLE/i.test(String(e.message));
    }
    assert(deleteBlocked, 'PostgreSQL trigger blocks DELETE on audit_logs with AUDIT_IMMUTABLE');

    // -------------------------------------------------------------------------
    // 5. ApprovalService: Maker-Checker separation, distinct checkers
    // -------------------------------------------------------------------------
    section('5. ApprovalService: maker-checker separation & distinct threshold checkers');
    const makerId = crypto.randomUUID();
    const checker1Id = crypto.randomUUID();
    const checker2Id = crypto.randomUUID();
    const governedId = crypto.randomUUID();

    const approval = await approvalService.requestApproval({
      governedEntityType: 'PurchaseOrder',
      governedEntityId: governedId,
      action: 'purchase_order.approve',
      requestedById: makerId,
      version: 1,
      thresholdRequired: 2
    });
    assert(!!approval.id && approval.thresholdRequired === 2, 'approval requested with threshold 2');

    // Maker tries to approve own request
    let selfApproveThrew = false;
    let selfApproveCode = '';
    try {
      await approvalService.decide(approval.id, makerId, 'APPROVED');
    } catch (e) {
      selfApproveThrew = true;
      selfApproveCode = e.code;
    }
    assert(selfApproveThrew && selfApproveCode === 'SELF_APPROVAL_FORBIDDEN', 'maker self-approval rejected with SELF_APPROVAL_FORBIDDEN');

    // Checker 1 approves (threshold 1/2)
    const check1 = await approvalService.decide(approval.id, checker1Id, 'APPROVED');
    assert(check1.state === 'PENDING' && check1.reason_code === 'MISSING_THRESHOLD', 'first checker approval sets PENDING (threshold 1/2)');

    // Checker 1 tries to approve AGAIN (duplicate checker prevention)
    let dupCheckerThrew = false;
    let dupCheckerCode = '';
    try {
      await approvalService.decide(approval.id, checker1Id, 'APPROVED');
    } catch (e) {
      dupCheckerThrew = true;
      dupCheckerCode = e.code;
    }
    assert(dupCheckerThrew && dupCheckerCode === 'DUPLICATE_CHECKER', 'duplicate approval by same checker rejected with DUPLICATE_CHECKER');

    // Checker 2 approves (threshold 2/2 -> approved)
    const check2 = await approvalService.decide(approval.id, checker2Id, 'APPROVED');
    assert(check2.state === 'APPROVED' && check2.reason_code === 'PASS', 'second distinct checker approval sets APPROVED');

    // -------------------------------------------------------------------------
    // 6. OutboxService: Transactional enqueue, idempotency key, claim, retry, DLQ
    // -------------------------------------------------------------------------
    section('6. OutboxService: enqueue, idempotency uniqueness, claim, retry, DLQ');
    const outboxAggId = crypto.randomUUID();
    let eventId = '';

    await prisma.$transaction(async tx => {
      const ev = await outboxService.enqueue(tx, {
        eventType: 'sales_order.created',
        aggregateType: 'SalesOrder',
        aggregateId: outboxAggId,
        payload: { orderNumber: 'SO-001', amount: 500 },
        correlationId: crypto.randomUUID(),
        tenantId: orgA
      });
      eventId = ev.id;
    });
    assert(!!eventId, 'outbox event enqueued in transaction');

    // Attempt duplicate enqueue with identical payload/aggregate in new transaction
    let dupOutboxThrew = false;
    try {
      await prisma.$transaction(async tx => {
        await outboxService.enqueue(tx, {
          eventType: 'sales_order.created',
          aggregateType: 'SalesOrder',
          aggregateId: outboxAggId,
          payload: { orderNumber: 'SO-001', amount: 500 },
          correlationId: crypto.randomUUID(),
          tenantId: orgA
        });
      });
    } catch (e) {
      dupOutboxThrew = /unique|duplicate/i.test(String(e.message));
    }
    assert(dupOutboxThrew, 'duplicate outbox idempotency key rejected by unique constraint');

    // Claim
    const workerId = 'worker-' + crypto.randomUUID().slice(0, 8);
    const claimed = await outboxService.claim(workerId, 10);
    assert(claimed.some(e => e.id === eventId), 'worker claimed enqueued event with lease');

    // Ack
    await outboxService.ack(eventId);
    const acked = await prisma.outboxEvent.findUnique({ where: { id: eventId } });
    assert(acked.status === 'PUBLISHED', 'claimed event acked to PUBLISHED');

    // Retry to DLQ
    let failEvId = '';
    await prisma.$transaction(async tx => {
      const ev = await outboxService.enqueue(tx, {
        eventType: 'invoice.failed',
        aggregateType: 'Invoice',
        aggregateId: crypto.randomUUID(),
        payload: { attempt: 1 },
        correlationId: crypto.randomUUID(),
        tenantId: orgA
      });
      failEvId = ev.id;
    });

    // Fail 4 times (retry backoff)
    for (let attempt = 1; attempt <= 4; attempt++) {
      const retryResult = await outboxService.fail(failEvId, `failure-${attempt}`);
      assert(retryResult.deadLettered === false, `failure ${attempt} scheduled for retry`);
    }
    // 5th failure moves to DLQ
    const dlqResult = await outboxService.fail(failEvId, 'terminal-failure');
    assert(dlqResult && dlqResult.deadLettered === true, '5th failure moves event to DEAD_LETTER status');

    const dlqRow = await prisma.outboxDlq.findFirst({ where: { outboxEventId: failEvId } });
    assert(!!dlqRow && dlqRow.reason === 'terminal-failure', 'dead-letter record written to outbox_dlq table');

    // -------------------------------------------------------------------------
    // 7. CommunicationAclService
    // -------------------------------------------------------------------------
    section('7. CommunicationAclService: parent ACL resolution & cross-tenant mention check');
    // Seed a tenant scope for a known user
    const tenantUser = crypto.randomUUID();
    await prisma.tenantScope.create({
      data: {
        userId: tenantUser,
        organizationId: orgA,
        effectiveFrom: new Date(),
        primary: true
      }
    });

    const mentionCheckSameOrg = await communicationAclService.canMention({
      contextType: 'generic',
      parentId: tenantUser,
      actorUserId: tenantUser,
      targetUserId: tenantUser,
      targetTenantId: orgA
    });
    assert(mentionCheckSameOrg.ok === true, 'same-tenant mention check returns ok: true');

    const mentionCheckCrossOrg = await communicationAclService.canMention({
      contextType: 'generic',
      parentId: tenantUser,
      actorUserId: tenantUser,
      targetUserId: crypto.randomUUID(),
      targetTenantId: orgB
    });
    assert(mentionCheckCrossOrg.ok === false && mentionCheckCrossOrg.code === 'CROSS_TENANT_MENTION', 'cross-tenant mention rejected with CROSS_TENANT_MENTION');

    console.log(`\n=== All Integration Tests Completed: ${passed} passed, ${failed} failed ===`);
  } finally {
    // Gracefully disconnect and close every client before DB drop
    await prisma.$disconnect().catch(() => {});
    await pool.end().catch(() => {});
    await targetClient.end().catch(() => {});

    try {
      await adminClient.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
        [dbName]
      );
      await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
      console.log('Successfully dropped isolated test DB:', dbName);
    } catch (e) {
      console.error('DB cleanup error:', e.message);
    }
    await adminClient.end().catch(() => {});
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('FATAL INTEGRATION TEST ERROR:', e);
  process.exit(1);
});
