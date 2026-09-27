import request from 'supertest';
import { randomUUID } from 'crypto';
import { SampleStage } from '@prisma/client';

import {
  bootP08App,
  p08Code,
  p08Message,
  type P08App,
} from './p08-http-harness';

/**
 * P08-S1 — Acceptance 1 over real HTTP (BUS-RULE-107 / DEC-2026-09-20-051).
 *
 * Boots the production Nest application (AppModule: controllers, JwtAuthGuard,
 * RolesGuard, ValidationPipe, CanonicalErrorFilter) against the live PostgreSQL
 * named by `backend/.env`, and drives the sample-fee gate entirely through HTTP:
 *
 *   1. the write routes obey the canonical roles (401 unauthenticated, 403 wrong role)
 *   2. an unverified sample is ABSENT from the R&D actionable inbox and cannot be accepted
 *   3. only Finance writes verification, and the same business command issued twice
 *      collapses to exactly one audit row and one outbox event
 *   4. rejection is Finance-only, records the reason, and closes the transition
 *   5. tenant isolation: the P08 chain's tenant is the parent Lead's organization,
 *      so a tenant-B actor discloses nothing and mutates nothing
 *
 * Nothing about the business rule, the authorization decision, the transaction or
 * the persistence path is mocked. Fixtures create tenants, users, staff and a lead
 * only — never the verification, the audit row or the outbox event being proved.
 *
 * audit_logs is append-only at the database level (audit_immutable trigger,
 * migration 20260918_p05_platform_controls), so this suite ASSERTS the audit chain
 * and never deletes it.
 */

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p08_s1_${RUN_ID}`;

describe('P08-S1 sample fee gate (real HTTP, real PostgreSQL)', () => {
  let ctx: P08App;
  let prisma: P08App['prisma'];

  const tenantA = randomUUID();
  const tenantB = randomUUID();

  let staffA: any;
  let leadA: any;
  let rnd: any;
  let finance: any;
  let commercial: any;
  let commercialB: any;
  let tokenRnd: string;
  let tokenFinance: string;
  let tokenCommercial: string;
  let tokenCommercialB: string;

  const sampleIds: string[] = [];
  const userIds: string[] = [];

  const server = () => ctx.app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const newSampleBody = (label: string, overrides: Record<string, unknown> = {}) => ({
    leadId: leadA.id,
    productName: `${TAG} ${label}`,
    targetFunction: 'Brightening',
    textureReq: 'Liquid',
    colorReq: 'Clear',
    aromaReq: 'None',
    ...overrides,
  });

  /** The production create route, exactly as the R&D screen calls it. */
  const createSample = (token: string, label: string, overrides = {}) =>
    request(server()).post('/rnd/samples').set(auth(token)).send(newSampleBody(label, overrides));

  const accept = (token: string, id: string) =>
    request(server()).post(`/rnd/sample/${id}/accept`).set(auth(token)).send({});

  const verify = (token: string, id: string, body: Record<string, unknown> = {}) =>
    request(server()).post(`/rnd/sample/${id}/verify-payment`).set(auth(token)).send(body);

  const reject = (token: string, id: string, body: Record<string, unknown>) =>
    request(server()).post(`/rnd/sample/${id}/reject-payment`).set(auth(token)).send(body);

  const inbox = (token: string) => request(server()).get('/rnd/inbox').set(auth(token));

  beforeAll(async () => {
    ctx = await bootP08App();
    prisma = ctx.prisma;

    const mkUser = async (label: string, roles: string[]) => {
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `${TAG}.${label}@nex-p08.test`,
          fullName: `${TAG} ${label}`,
          passwordHash: '$2b$10$not-a-real-login-hash',
          roles: roles as any,
          status: 'ACTIVE' as any,
        },
      });
      userIds.push(user.id);
      return user;
    };

    rnd = await mkUser('rnd', ['RND']);
    finance = await mkUser('finance', ['FINANCE']);
    commercial = await mkUser('commercial', ['COMMERCIAL']);
    commercialB = await mkUser('commercial-b', ['COMMERCIAL']);

    tokenRnd = ctx.tokenFor(rnd, tenantA);
    tokenFinance = ctx.tokenFor(finance, tenantA);
    tokenCommercial = ctx.tokenFor(commercial, tenantA);
    tokenCommercialB = ctx.tokenFor(commercialB, tenantB);

    staffA = await prisma.bussdevStaff.create({
      data: { name: `${TAG} Staff`, organizationId: tenantA },
    });
    leadA = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0818${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 S1 HTTP',
        picId: staffA.id,
        organizationId: tenantA,
      },
    });
  }, 180000);

  afterAll(async () => {
    try {
      await prisma.outboxEvent.deleteMany({
        where: { aggregateId: { in: [...sampleIds, leadA?.id].filter(Boolean) as string[] } },
      });
      await prisma.formulaItem.deleteMany({
        where: { phase: { formula: { sampleRequestId: { in: sampleIds } } } },
      });
      await prisma.formulaPhase.deleteMany({
        where: { formula: { sampleRequestId: { in: sampleIds } } },
      });
      await prisma.formula.deleteMany({ where: { sampleRequestId: { in: sampleIds } } });
      await prisma.sampleStageLog.deleteMany({ where: { sampleRequestId: { in: sampleIds } } });
      await prisma.sampleRequest.deleteMany({ where: { id: { in: sampleIds } } });
      // Filters are never left `undefined`: that would widen them to "every row".
      await prisma.salesLead.deleteMany({ where: { clientName: `${TAG} Corp` } });
      await prisma.bussdevStaff.deleteMany({ where: { name: `${TAG} Staff` } });
      await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}.` } } });
    } finally {
      // Always close the app: a leaked Nest server keeps jest's event loop alive.
      await ctx.app.close();
    }
  }, 120000);

  // ── 1 ─────────────────────────────────────────────────────────────────────
  it('1. the write routes obey the canonical roles, and a client cannot inject a tenant', async () => {
    const unauthenticated = await request(server())
      .post('/rnd/samples')
      .send(newSampleBody('anonymous'));
    expect(unauthenticated.status).toBe(401);

    const wrongRole = await createSample(tokenCommercial, 'wrong-role');
    expect(wrongRole.status).toBe(403);
    expect(await prisma.sampleRequest.count({ where: { productName: `${TAG} wrong-role` } })).toBe(0);

    // `forbidNonWhitelisted` — the create DTO has no tenant field, so a client
    // cannot name one. The write is refused and nothing is persisted.
    const injected = await createSample(tokenRnd, 'inject-tenant', { organizationId: tenantB });
    expect(injected.status).toBe(400);
    expect(p08Code(injected.body)).toBe('VALIDATION_FAILED');
    expect(await prisma.sampleRequest.count({ where: { productName: `${TAG} inject-tenant` } })).toBe(0);

    const created = await createSample(tokenRnd, 'created');
    expect(created.status).toBe(201);
    sampleIds.push(created.body.id);

    expect(created.body.stage).toBe(SampleStage.WAITING_FINANCE);
    expect(created.body.paymentApprovedAt).toBeNull();
    expect(created.body.paymentApprovedById).toBeNull();
  }, 60000);

  // ── 2 ─────────────────────────────────────────────────────────────────────
  it('2. an unverified sample is absent from the R&D actionable inbox and cannot be accepted', async () => {
    const created = await createSample(tokenRnd, 'unverified');
    expect(created.status).toBe(201);
    sampleIds.push(created.body.id);

    const before = await inbox(tokenRnd);
    expect(before.status).toBe(200);
    expect(before.body.map((s: any) => s.id)).not.toContain(created.body.id);

    const refused = await accept(tokenRnd, created.body.id);
    expect(refused.status).toBe(400);
    expect(p08Code(refused.body)).toBe('SAMPLE_FEE_NOT_VERIFIED');

    // the refusal fabricated no verifier and started no formulation
    const after = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: created.body.id } });
    expect(after.stage).toBe(SampleStage.WAITING_FINANCE);
    expect(after.paymentApprovedAt).toBeNull();
    expect(after.paymentApprovedById).toBeNull();
    expect(await prisma.formula.count({ where: { sampleRequestId: created.body.id } })).toBe(0);
  }, 60000);

  // ── 3 ─────────────────────────────────────────────────────────────────────
  it('3. only Finance writes verification, once, and the sample then enters the inbox', async () => {
    const created = await createSample(tokenRnd, 'verify');
    expect(created.status).toBe(201);
    const sampleId = created.body.id;
    sampleIds.push(sampleId);

    // neither R&D nor a customer-facing role may write the verification
    for (const token of [tokenRnd, tokenCommercial]) {
      const denied = await verify(token, sampleId, { note: 'not mine to write' });
      expect(denied.status).toBe(403);
    }
    const untouched = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sampleId } });
    expect(untouched.paymentApprovedAt).toBeNull();
    expect(untouched.stage).toBe(SampleStage.WAITING_FINANCE);

    const verified = await verify(tokenFinance, sampleId, {
      note: 'Transfer matched against the bank statement',
    });
    expect([200, 201]).toContain(verified.status);
    expect(verified.body.stage).toBe(SampleStage.QUEUE);
    expect(verified.body.paymentApprovedById).toBe(finance.id);
    expect(verified.body.paymentApprovedAt).not.toBeNull();

    // now — and only now — the sample is actionable R&D work
    const after = await inbox(tokenRnd);
    expect(after.body.map((s: any) => s.id)).toContain(sampleId);

    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'SampleRequest', entityId: sampleId, action: 'VERIFY_SAMPLE_PAYMENT' },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].actorUserId).toBe(finance.id);
    expect(audits[0].txId).toBeTruthy();

    // THE RETRY — the same business command twice must collapse to one effect
    const retried = await verify(tokenFinance, sampleId, { note: 'retry' });
    expect(retried.status).toBe(409);
    expect(p08Code(retried.body)).toBe('SAMPLE_NOT_AWAITING_FINANCE');

    expect(
      await prisma.auditLog.count({
        where: { entityType: 'SampleRequest', entityId: sampleId, action: 'VERIFY_SAMPLE_PAYMENT' },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: sampleId, eventType: 'sample.payment_verified' },
      }),
    ).toBe(1);
  }, 90000);

  // ── 4 ─────────────────────────────────────────────────────────────────────
  it('4. rejection is Finance-only, records the reason, and closes the transition', async () => {
    const created = await createSample(tokenRnd, 'rejected');
    expect(created.status).toBe(201);
    const sampleId = created.body.id;
    sampleIds.push(sampleId);

    const reason = 'Transfer not found in the bank statement';
    const wrongRole = await reject(tokenRnd, sampleId, { reason });
    expect(wrongRole.status).toBe(403);
    expect(await prisma.auditLog.count({ where: { entityId: sampleId } })).toBe(0);

    const rejected = await reject(tokenFinance, sampleId, { reason });
    expect([200, 201]).toContain(rejected.status);
    expect(rejected.body.stage).toBe(SampleStage.REJECTED);
    expect(rejected.body.rejectionReason).toBe(reason);
    expect(rejected.body.paymentApprovedAt).toBeNull();

    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'SampleRequest', entityId: sampleId, action: 'REJECT_SAMPLE_PAYMENT' },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].actorUserId).toBe(finance.id);
    expect((audits[0].afterSnapshot as any).reason).toBe(reason);

    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: sampleId, eventType: 'sample.payment_rejected' },
    });
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({ sample_id: sampleId, rejected_by: finance.id, reason });

    // the canonical transition is closed: a rejected sample is not awaiting
    // Finance, and it still cannot enter formulation
    const lateVerify = await verify(tokenFinance, sampleId);
    expect(lateVerify.status).toBe(409);
    expect(p08Code(lateVerify.body)).toBe('SAMPLE_NOT_AWAITING_FINANCE');

    const lateAccept = await accept(tokenRnd, sampleId);
    expect(lateAccept.status).toBe(400);
    expect(p08Code(lateAccept.body)).toBe('SAMPLE_FEE_NOT_VERIFIED');
  }, 90000);

  // ── 5 ─────────────────────────────────────────────────────────────────────
  it('5. tenant isolation: a tenant-B actor discloses nothing and mutates nothing', async () => {
    // The P08 chain hangs off the parent Lead, and the Lead is tenant-scoped
    // (DEC-2026-09-20-059: P08 tenant scope reads through the parent Lead).
    const created = await createSample(tokenRnd, 'tenant-a');
    expect(created.status).toBe(201);
    const sampleId = created.body.id;
    sampleIds.push(sampleId);

    const before = {
      lead: await prisma.salesLead.findUniqueOrThrow({ where: { id: leadA.id } }),
      sample: await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sampleId } }),
      audit: await prisma.auditLog.count({ where: { entityId: leadA.id } }),
      outbox: await prisma.outboxEvent.count({ where: { aggregateId: sampleId } }),
    };

    // the owning lead of the P08 record is not readable across the tenant line
    const foreign = await request(server()).get(`/bussdev/lead/${leadA.id}`).set(auth(tokenCommercialB));
    expect(foreign.status).toBe(404);
    expect(JSON.stringify(foreign.body)).not.toContain(`${TAG} Corp`);
    expect(JSON.stringify(foreign.body)).not.toContain(`${TAG} tenant-a`);

    // and the tenant-B actor may not drive the P08 payment path either
    const foreignVerify = await verify(tokenCommercialB, sampleId, { note: 'cross tenant' });
    expect([401, 403]).toContain(foreignVerify.status);

    const after = {
      lead: await prisma.salesLead.findUniqueOrThrow({ where: { id: leadA.id } }),
      sample: await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sampleId } }),
      audit: await prisma.auditLog.count({ where: { entityId: leadA.id } }),
      outbox: await prisma.outboxEvent.count({ where: { aggregateId: sampleId } }),
    };
    expect(after.lead.organizationId).toBe(tenantA);
    expect(after.sample.stage).toBe(before.sample.stage);
    expect(after.sample.paymentApprovedById).toBeNull();
    expect(after.audit).toBe(before.audit);
    expect(after.outbox).toBe(before.outbox);

    // tenant A still reads its own lead
    const own = await request(server()).get(`/bussdev/lead/${leadA.id}`).set(auth(tokenCommercial));
    expect(own.status).toBe(200);
    expect(own.body.id).toBe(leadA.id);
  }, 90000);

  // ── 6 ─────────────────────────────────────────────────────────────────────
  it('6. the refusal message names the rule and leaks nothing internal', async () => {
    const created = await createSample(tokenRnd, 'message');
    sampleIds.push(created.body.id);

    const refused = await accept(tokenRnd, created.body.id);
    const message = p08Message(refused.body);
    expect(message).toMatch(/Finance/i);
    expect(message).not.toMatch(/prisma|select |insert |update |\.ts:/i);
  }, 60000);
});
