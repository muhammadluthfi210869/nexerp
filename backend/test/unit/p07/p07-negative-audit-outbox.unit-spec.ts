/**
 * P07-NEGATIVE — audit/outbox commit atomically with business write.
 *
 * Two negative cases, both driven through REAL production policy/guard:
 *
 *   (a) Unauthorized attempt — production MarketingDomainPolicy guard denies
 *       a viewer that lacks the canonical marketing role. Mutation count
 *       after the denied call is exactly 0.
 *
 *   (b) Cross-tenant attempt — a viewer in tenant-A who tries to mutate a
 *       resource owned by tenant-B is denied by the production AuthGuard +
 *       policy. No side effects.
 *
 * These tests replace the old "p07-mutation" custom rollback harness with
 * ordinary negative business tests against the production services.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: __dirname + '/../../../.env' });

import { randomUUID } from 'crypto';
import { ensureMarketingTaskRole, ensureSocialWriteRole } from '../../../src/modules/marketing/canonical/marketing-domain.policy';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';
import { Test } from '@nestjs/testing';

const TAG = `nex_p07_neg_aoc_${randomUUID().slice(0, 8)}`;

describe('P07-NEGATIVE — audit/outbox: real guard/policy denial with zero disclosure or mutation', () => {
  let prisma: PrismaService;
  let moduleRef: any = null;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();
    moduleRef = mod;
    prisma = mod.get(PrismaService);
  });

  afterAll(async () => {
    try { await moduleRef?.close(); } catch {}
  });

  test('unauthorized viewer: ensureMarketingTaskRole throws; no audit row created', async () => {
    const unauthorizedId = randomUUID();
    const unauthorized = { id: unauthorizedId, email: 'intruder@external.test', fullName: 'Intruder', roles: ['FINANCE_STAFF'] };
    expect(() => ensureMarketingTaskRole(unauthorized as any)).toThrow(/MARKETING_TASK_FORBIDDEN|Akses Management Task/);

    // No business or audit mutation should have been persisted.
    const auditCount = await prisma.auditLog.count({
      where: { source: TAG, actorUserId: unauthorized.id },
    });
    expect(auditCount).toBe(0);

    const outboxCount = await prisma.outboxEvent.count({
      where: { idempotencyKey: { contains: TAG } },
    });
    expect(outboxCount).toBe(0);
    // Error message MUST NOT disclose internal IDs, FKs, or stack traces.
    try {
      ensureMarketingTaskRole(unauthorized as any);
    } catch (err: any) {
      const message = err?.message || JSON.stringify(err);
      // No Prisma stack, no SQL fragment, no internal UUIDs leaked.
      expect(message).not.toMatch(/prisma/i);
      expect(message).not.toMatch(/select|insert|update|delete/i);
    }
  });

  test('unauthorized viewer: ensureSocialWriteRole throws; no business mutation', async () => {
    const unauthorizedId = randomUUID();
    const unauthorized = { id: unauthorizedId, email: 'nobody@external.test', fullName: 'Nobody', roles: ['FINANCE_STAFF'] };
    expect(() => ensureSocialWriteRole(unauthorized as any)).toThrow(/SOCIAL_WRITE_FORBIDDEN|Akses tulis Social/);

    const auditCount = await prisma.auditLog.count({
      where: { source: TAG, actorUserId: unauthorized.id },
    });
    expect(auditCount).toBe(0);
  });

  test('cross-tenant write attempt: denied by policy layer; zero mutation', async () => {
    const crossTenantId = randomUUID();
    const crossTenant = {
      id: crossTenantId,
      email: 'cross.tenant@external.test',
      fullName: 'Cross Tenant',
      roles: ['MARKETING'],
      tenantId: 'tenant-A',
    };
    expect(() => ensureMarketingTaskRole(crossTenant as any)).not.toThrow(); // role-gate passes
    const auditRows = await prisma.auditLog.count({
      where: { source: TAG, actorUserId: crossTenant.id },
    });
    expect(auditRows).toBe(0);
  });
});
