import request from 'supertest';
import { randomUUID } from 'crypto';
import { SampleStage, RevisionStatus } from '@prisma/client';

import {
  bootP08App,
  p08Code,
  type P08App,
} from '../p08/p08-http-harness';

/**
 * Fase 3a — P08 tenant isolation over real HTTP (DEC-2026-09-20-059 LOCKED).
 *
 * DEC-059: the P08 chain's tenant is the PARENT LEAD's `organizationId`. The
 * P08 tables (`sample_requests`, `new_product_forms`, `formulas`, …) carry no
 * `organizationId` column and are not given one here; the actor's tenant comes
 * from the verified JWT claim (`req.user.organizationId`) and is matched against
 * `sampleRequest.lead.organizationId`.
 *
 * Before this suite existed, `rnd.service.ts` had NO tenant predicate anywhere:
 * a tenant-B actor holding a bare sample id could read it, list it in the inbox,
 * and drive its state machine. That was `P08-B6` — cross-tenant refusal was
 * proven only through the parent `Lead` (`p08-s1-sample-http.e2e-spec.ts:316`),
 * never through the `/rnd` surface that the P08 screens actually call.
 *
 * EVERY test in this file is expected to FAIL against the unfixed service. That
 * is the point: CLAUDE.md requires a failing reproduction before the fix.
 */

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p08_sec_${RUN_ID}`;

describe('P08 tenant isolation (/rnd surface, real HTTP, real PostgreSQL)', () => {
  let ctx: P08App;
  let prisma: P08App['prisma'];

  const tenantA = randomUUID();
  const tenantB = randomUUID();

  let rnd: any;
  let finance: any;
  let rndB: any;
  let orphan: any;

  let tokenRnd: string;
  let tokenFinance: string;
  let tokenRndB: string;
  let tokenNoTenant: string;

  let leadA: any;
  let npfA: any;

  /** A tenant-A sample sitting in the actionable inbox after Finance verified it. */
  let sampleInQueue: string;
  /** A tenant-A sample left waiting for Finance. */
  let sampleWaiting: string;

  const sampleIds: string[] = [];
  const npfIds: string[] = [];
  const userIds: string[] = [];

  const server = () => ctx.app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const listSamples = (token: string) => request(server()).get('/rnd/samples').set(auth(token));
  const readSample = (token: string, id: string) =>
    request(server()).get(`/rnd/samples/${id}`).set(auth(token));
  const inbox = (token: string) => request(server()).get('/rnd/inbox').set(auth(token));
  const pipeline = (token: string) => request(server()).get('/rnd/pipeline').set(auth(token));
  const revisions = (token: string) => request(server()).get('/rnd/revisions').set(auth(token));
  const formulas = (token: string) => request(server()).get('/rnd/formulas').set(auth(token));
  const dashboard = (token: string) => request(server()).get('/rnd/dashboard').set(auth(token));
  const npf = (token: string, id: string) =>
    request(server()).get(`/rnd/npf/${id}`).set(auth(token));
  const advance = (token: string, id: string, newStage: SampleStage) =>
    request(server()).patch(`/rnd/sample/${id}/advance`).set(auth(token)).send({ newStage });
  const accept = (token: string, id: string) =>
    request(server()).post(`/rnd/sample/${id}/accept`).set(auth(token)).send({});
  const verify = (token: string, id: string) =>
    request(server())
      .post(`/rnd/sample/${id}/verify-payment`)
      .set(auth(token))
      .send({ note: 'bank statement match' });

  const patchFormula = (token: string, id: string, body: Record<string, unknown>) =>
    request(server()).patch(`/rnd/formulas/${id}`).set(auth(token)).send(body);

  const createSample = (token: string, label: string) =>
    request(server()).post('/rnd/samples').set(auth(token)).send({
      leadId: leadA.id,
      productName: `${TAG} ${label}`,
      targetFunction: 'Brightening',
      textureReq: 'Liquid',
      colorReq: 'Clear',
      aromaReq: 'None',
    });

  /** Refuses to let any assertion pass while the response carries tenant-A text. */
  const expectNoTenantALeak = (body: unknown) => {
    const raw = JSON.stringify(body ?? null);
    expect(raw).not.toContain(`${TAG} Corp`);
    expect(raw).not.toContain(`${TAG} secret sample`);
    expect(raw).not.toContain(sampleInQueue);
    expect(raw).not.toContain(sampleWaiting);
  };

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

    rnd = await mkUser('rnd-a', ['RND']);
    finance = await mkUser('finance-a', ['FINANCE']);
    // The foreign actor holds every role the formula routes accept, so a 403 can
    // only come from the tenant guard — never from the role guard, which would
    // make the isolation assertion pass for the wrong reason.
    rndB = await mkUser('rnd-b', ['RND', 'HEAD_OPS', 'SUPER_ADMIN']);
    orphan = await mkUser('rnd-no-tenant', ['RND']);

    tokenRnd = ctx.tokenFor(rnd, tenantA);
    tokenFinance = ctx.tokenFor(finance, tenantA);
    tokenRndB = ctx.tokenFor(rndB, tenantB);
    // No tenant claim at all — the shape every real login has today
    // (`auth.service.ts:102-107` signs only {sub,email,roles,sessionId}).
    tokenNoTenant = ctx.tokenFor(orphan);

    const staffA = await prisma.bussdevStaff.create({
      data: { name: `${TAG} Staff`, organizationId: tenantA },
    });
    leadA = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0819${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 tenant isolation',
        picId: staffA.id,
        organizationId: tenantA,
      },
    });

    npfA = await prisma.newProductForm.create({
      data: { productName: `${TAG} secret sample`, targetPrice: 150000, leadId: leadA.id },
    });
    npfIds.push(npfA.id);

    // Two real samples through the production create route: one left waiting on
    // Finance, one released into the actionable inbox.
    const waiting = await createSample(tokenRnd, 'waiting');
    expect(waiting.status).toBe(201);
    sampleWaiting = waiting.body.id;
    sampleIds.push(sampleWaiting);

    const queued = await createSample(tokenRnd, 'secret sample');
    expect(queued.status).toBe(201);
    sampleInQueue = queued.body.id;
    sampleIds.push(sampleInQueue);

    const released = await verify(tokenFinance, sampleInQueue);
    expect([200, 201]).toContain(released.status);
    expect(released.body.stage).toBe(SampleStage.QUEUE);

    // A revision-status row so `/rnd/revisions` has something to leak.
    await prisma.sampleRequest.update({
      where: { id: sampleInQueue },
      data: { revisionStatus: RevisionStatus.IN_PROGRESS, latestRevisionDate: new Date() },
    });
  }, 180000);

  afterAll(async () => {
    try {
      await prisma.outboxEvent.deleteMany({
        where: { aggregateId: { in: [...sampleIds, leadA?.id, ...npfIds].filter(Boolean) as string[] } },
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
      await prisma.newProductForm.deleteMany({ where: { id: { in: npfIds } } });
      // Filters are never left `undefined`: that would widen them to "every row".
      await prisma.salesLead.deleteMany({ where: { clientName: `${TAG} Corp` } });
      await prisma.bussdevStaff.deleteMany({ where: { name: `${TAG} Staff` } });
      await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}.` } } });
    } finally {
      await ctx.app.close();
    }
  }, 120000);

  // ── reads ──────────────────────────────────────────────────────────────────

  it('1. GET /rnd/samples never lists another tenant’s samples', async () => {
    const foreign = await listSamples(tokenRndB);
    expect(foreign.status).toBe(200);
    expect(foreign.body.map((s: any) => s.id)).not.toContain(sampleInQueue);
    expect(foreign.body.map((s: any) => s.id)).not.toContain(sampleWaiting);
    expectNoTenantALeak(foreign.body);

    // the owner still sees both — the fix must not over-block
    const own = await listSamples(tokenRnd);
    expect(own.status).toBe(200);
    expect(own.body.map((s: any) => s.id)).toEqual(
      expect.arrayContaining([sampleInQueue, sampleWaiting]),
    );
  }, 60000);

  it('2. GET /rnd/samples/:id refuses a cross-tenant bare id with 403 and discloses nothing', async () => {
    const foreign = await readSample(tokenRndB, sampleInQueue);
    expect(foreign.status).toBe(403);
    expect(p08Code(foreign.body)).toBe('TENANT_ISOLATION_VIOLATION');
    expectNoTenantALeak(foreign.body);

    const own = await readSample(tokenRnd, sampleInQueue);
    expect(own.status).toBe(200);
    expect(own.body.id).toBe(sampleInQueue);
  }, 60000);

  it('3. GET /rnd/inbox and /rnd/pipeline never leak the cross-tenant work queue', async () => {
    const foreignInbox = await inbox(tokenRndB);
    expect(foreignInbox.status).toBe(200);
    expect(foreignInbox.body.map((s: any) => s.id)).not.toContain(sampleInQueue);
    expectNoTenantALeak(foreignInbox.body);

    const ownInbox = await inbox(tokenRnd);
    expect(ownInbox.body.map((s: any) => s.id)).toContain(sampleInQueue);

    const foreignPipeline = await pipeline(tokenRndB);
    expect(foreignPipeline.status).toBe(200);
    expect(foreignPipeline.body.map((s: any) => s.id)).not.toContain(sampleInQueue);
    expectNoTenantALeak(foreignPipeline.body);

    const foreignRevisions = await revisions(tokenRndB);
    expect(foreignRevisions.status).toBe(200);
    expect(foreignRevisions.body.map((s: any) => s.id)).not.toContain(sampleInQueue);
    expectNoTenantALeak(foreignRevisions.body);
  }, 60000);

  it('4. GET /rnd/formulas, /rnd/dashboard and /rnd/npf/:id are tenant-scoped', async () => {
    const foreignFormulas = await formulas(tokenRndB);
    expect(foreignFormulas.status).toBe(200);
    expect(foreignFormulas.body.map((f: any) => f.sampleRequestId)).not.toContain(sampleInQueue);
    expectNoTenantALeak(foreignFormulas.body);

    const foreignDashboard = await dashboard(tokenRndB);
    expect(foreignDashboard.status).toBe(200);
    expectNoTenantALeak(foreignDashboard.body);

    const foreignNpf = await npf(tokenRndB, npfA.id);
    expect(foreignNpf.status).toBe(403);
    expect(p08Code(foreignNpf.body)).toBe('TENANT_ISOLATION_VIOLATION');
    expectNoTenantALeak(foreignNpf.body);

    const ownNpf = await npf(tokenRnd, npfA.id);
    expect(ownNpf.status).toBe(200);
    expect(ownNpf.body.id).toBe(npfA.id);
  }, 60000);

  // ── writes ─────────────────────────────────────────────────────────────────

  it('5. PATCH /rnd/sample/:id/advance cannot move another tenant’s sample', async () => {
    const before = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sampleInQueue } });

    const foreign = await advance(tokenRndB, sampleInQueue, SampleStage.FORMULATING);
    expect(foreign.status).toBe(403);
    expect(p08Code(foreign.body)).toBe('TENANT_ISOLATION_VIOLATION');

    const after = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sampleInQueue } });
    expect(after.stage).toBe(before.stage);
    expect(after.stage).toBe(SampleStage.QUEUE);
    expect(
      await prisma.sampleStageLog.count({
        where: { sampleRequestId: sampleInQueue, stage: SampleStage.FORMULATING },
      }),
    ).toBe(0);
  }, 60000);

  it('6. POST /rnd/sample/:id/accept cannot start formulation for another tenant', async () => {
    const foreign = await accept(tokenRndB, sampleInQueue);
    expect(foreign.status).toBe(403);
    expect(p08Code(foreign.body)).toBe('TENANT_ISOLATION_VIOLATION');

    expect(await prisma.formula.count({ where: { sampleRequestId: sampleInQueue } })).toBe(0);
    const after = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sampleInQueue } });
    expect(after.stage).toBe(SampleStage.QUEUE);

    // the owner can still accept — the fix must not over-block
    const own = await accept(tokenRnd, sampleInQueue);
    expect([200, 201]).toContain(own.status);
    expect(await prisma.formula.count({ where: { sampleRequestId: sampleInQueue } })).toBe(1);
  }, 90000);

  // ── fail-closed ────────────────────────────────────────────────────────────

  it('7. an actor with no tenant claim is resolved from the server, never from the request', async () => {
    // A session that carries no tenant claim must NOT be treated as "all
    // tenants": that is the fail-open shape this fix removes. The service
    // rejects with TENANT_UNRESOLVED (400) so the caller learns the context is
    // missing instead of silently reading across every organization.
    const unresolved = await listSamples(tokenNoTenant);
    expect(unresolved.status).toBe(400);
    expect(p08Code(unresolved.body)).toBe('TENANT_UNRESOLVED');
    expectNoTenantALeak(unresolved.body);

    // A client cannot hand itself a tenant through query or body either.
    const injected = await request(server())
      .get(`/rnd/samples?organizationId=${tenantB}&tenantId=${tenantB}`)
      .set(auth(tokenNoTenant));
    expect(injected.status).toBe(400);
    expect(p08Code(injected.body)).toBe('TENANT_UNRESOLVED');

    const injectedRead = await request(server())
      .get(`/rnd/samples/${sampleInQueue}?organizationId=${tenantA}`)
      .set(auth(tokenRndB));
    expect(injectedRead.status).toBe(403);
    expect(p08Code(injectedRead.body)).toBe('TENANT_ISOLATION_VIOLATION');
    expectNoTenantALeak(injectedRead.body);
  }, 60000);

  // ── /rnd/formulas ──────────────────────────────────────────────────────────

  it('8. the formula surface is tenant-scoped too, not only /rnd/samples', async () => {
    // Test 6 had the owner accept `sampleInQueue`, which mints Formula V1.
    const formula = await prisma.formula.findFirstOrThrow({
      where: { sampleRequestId: sampleInQueue },
    });

    // read — a bare formula id must not disclose the row
    const foreignRead = await request(server())
      .get(`/rnd/formulas/${formula.id}`)
      .set(auth(tokenRndB));
    expect(foreignRead.status).toBe(403);
    expect(p08Code(foreignRead.body)).toBe('TENANT_ISOLATION_VIOLATION');
    expectNoTenantALeak(foreignRead.body);

    // it must not confirm existence either: a foreign id answers like a missing one
    const missing = await request(server())
      .get(`/rnd/formulas/${randomUUID()}`)
      .set(auth(tokenRndB));
    expect(missing.status).toBe(foreignRead.status);

    // mutation — cannot rewrite the composition
    const foreignPatch = await patchFormula(tokenRndB, formula.id, {
      targetYieldGram: 500,
      phases: [{ prefix: 'A', customName: 'Phase A', order: 1, items: [] }],
    });
    expect(foreignPatch.status).toBe(403);
    expect(p08Code(foreignPatch.body)).toBe('TENANT_ISOLATION_VIOLATION');
    expect(
      await prisma.formula.findUniqueOrThrow({ where: { id: formula.id } }),
    ).toMatchObject({ status: formula.status });

    // state machine — cannot approve or lock another tenant's formula
    for (const path of ['approve', 'request-approval']) {
      const res = await request(server())
        .post(`/rnd/formulas/${formula.id}/${path}`)
        .set(auth(tokenRndB))
        .send({});
      expect(res.status).toBe(403);
      expect(p08Code(res.body)).toBe('TENANT_ISOLATION_VIOLATION');
    }
    const foreignLock = await request(server())
      .patch(`/rnd/formulas/${formula.id}/lock-production`)
      .set(auth(tokenRndB))
      .send({});
    expect(foreignLock.status).toBe(403);
    expect(p08Code(foreignLock.body)).toBe('TENANT_ISOLATION_VIOLATION');

    // creation — cannot attach a formula to another tenant's sample
    const foreignCreate = await request(server())
      .post('/rnd/formulas')
      .set(auth(tokenRndB))
      .send({ sampleRequestId: sampleInQueue, totalWeightGr: 500, items: [] });
    expect(foreignCreate.status).toBe(403);
    expect(p08Code(foreignCreate.body)).toBe('TENANT_ISOLATION_VIOLATION');

    // list — the tenant's own formulas only
    const foreignList = await request(server())
      .get('/rnd/formulas')
      .set(auth(tokenRndB));
    expect(foreignList.status).toBe(200);
    expect(foreignList.body.map((f: any) => f.id)).not.toContain(formula.id);
    expectNoTenantALeak(foreignList.body);

    // the owner still gets through — the fix must not over-block
    const own = await request(server())
      .get(`/rnd/formulas/${formula.id}`)
      .set(auth(tokenRnd));
    expect(own.status).toBe(200);
    expect(own.body.id).toBe(formula.id);

    // and an actor with no tenant claim is refused, never treated as "all tenants"
    const unresolved = await request(server())
      .get(`/rnd/formulas/${formula.id}`)
      .set(auth(tokenNoTenant));
    expect(unresolved.status).toBe(400);
    expect(p08Code(unresolved.body)).toBe('TENANT_UNRESOLVED');
    expectNoTenantALeak(unresolved.body);
  }, 90000);
});