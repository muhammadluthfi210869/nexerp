import request from 'supertest';
import { randomUUID } from 'crypto';
import { FormulaStatus, MaterialType, SampleStage } from '@prisma/client';

import {
  bootP08App,
  p08Code,
  type P08App,
} from './p08-http-harness';
import {
  COMPOSITION_TOTAL_INVALID,
  FORMULA_LOCKED,
  costPerGramFor,
  gramFor,
} from '../../src/modules/rnd/formulas/formulas.service';

/**
 * P08-S2 — Acceptance 2 over real HTTP (BUS-RULE-108/109/113/114).
 *
 * Boots the production Nest application against the live PostgreSQL named by
 * `backend/.env` and drives formulation entirely through HTTP:
 *
 *   1. phase validity, and the exact `100.00% ± 0.001` composition invariant
 *   2. `grams = percentage × targetYieldGram / 100` and cost-per-gram HPP computed
 *      from the PERSISTED cost snapshots, reproducible across identical writes
 *   3. the acting user is captured on submit, on approve and on the production lock
 *   4. a locked formula refuses mutation with the canonical FORMULA_LOCKED code,
 *      including an attempt to empty (delete) its composition
 *
 * Every formula under test is created by the real chain the live UI uses:
 * `POST /rnd/samples` → `POST /rnd/sample/:id/verify-payment` (Finance) →
 * `POST /rnd/sample/:id/accept`. Nothing is seeded into a state the tests then
 * claim to have produced.
 *
 * audit_logs is append-only at the database level (audit_immutable trigger,
 * migration 20260918_p05_platform_controls), so this suite ASSERTS the audit chain
 * and never deletes it.
 */

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p08_s2_${RUN_ID}`;

/**
 * Fase 3a (DEC-2026-09-20-059 LOCKED): the P08 tenant is the parent Lead's
 * `organizationId`, carried in the verified JWT claim. Every fixture below and
 * every token must name the SAME tenant or the fail-closed service refuses the
 * request with TENANT_UNRESOLVED (400).
 */
const TENANT = randomUUID();

/** 20% @ 100 + 80% @ 100 → exactly 100.00% and a 100 per-gram HPP. */
const ITEMS = [
  { materialId: null, dosagePercentage: 20, costSnapshot: 100 },
  { materialId: null, dosagePercentage: 80, costSnapshot: 100 },
];

const dtoWith = (items: Array<Record<string, unknown>>, targetYieldGram = 500) => ({
  targetYieldGram,
  phases: [{ prefix: 'A', customName: 'Phase A', order: 1, items }],
});

describe('P08-S2 formulation integrity (real HTTP, real PostgreSQL)', () => {
  let ctx: P08App;
  let prisma: P08App['prisma'];

  let leadId: string;
  let rnd: any;
  let finance: any;
  let headOps: any;
  let tokenRnd: string;
  let tokenFinance: string;
  let tokenHeadOps: string;

  let formulaAId: string;
  let formulaBId: string;
  let materialId: string;

  const sampleIds: string[] = [];
  const formulaIds: string[] = [];
  const userIds: string[] = [];

  const server = () => ctx.app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const patchFormula = (token: string, id: string, body: Record<string, unknown>) =>
    request(server()).patch(`/rnd/formulas/${id}`).set(auth(token)).send(body);

  const getFormula = (token: string, id: string) =>
    request(server()).get(`/rnd/formulas/${id}`).set(auth(token));

  const submitForApproval = (token: string, id: string) =>
    request(server()).post(`/rnd/formulas/${id}/request-approval`).set(auth(token)).send({});

  const approveFormula = (token: string, id: string) =>
    request(server()).post(`/rnd/formulas/${id}/approve`).set(auth(token)).send({});

  const lockProduction = (token: string, id: string) =>
    request(server()).patch(`/rnd/formulas/${id}/lock-production`).set(auth(token)).send({});

  /** The real production chain, over HTTP, up to a DRAFT Formula V1. */
  async function openFormulation(label: string): Promise<{ sampleId: string; formulaId: string }> {
    const created = await request(server())
      .post('/rnd/samples')
      .set(auth(tokenRnd))
      .send({
        leadId,
        productName: `${TAG} ${label}`,
        targetFunction: 'Brightening',
        textureReq: 'Liquid',
        colorReq: 'Clear',
        aromaReq: 'None',
      });
    expect(created.status).toBe(201);
    sampleIds.push(created.body.id);

    const verified = await request(server())
      .post(`/rnd/sample/${created.body.id}/verify-payment`)
      .set(auth(tokenFinance))
      .send({ note: 'Transfer matched' });
    expect([200, 201]).toContain(verified.status);
    expect(verified.body.stage).toBe(SampleStage.QUEUE);

    const accepted = await request(server())
      .post(`/rnd/sample/${created.body.id}/accept`)
      .set(auth(tokenRnd))
      .send({});
    expect([200, 201]).toContain(accepted.status);

    const formulaId = accepted.body.formula.id;
    formulaIds.push(formulaId);
    return { sampleId: created.body.id, formulaId };
  }

  /** PERSISTED item rows, read back from the database, never from the request. */
  const persistedItems = (id: string) =>
    prisma.formulaItem.findMany({
      where: { phase: { formulaId: id } },
      orderBy: { dosagePercentage: 'asc' },
    });

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
    headOps = await mkUser('head-ops', ['HEAD_OPS']);
    tokenRnd = ctx.tokenFor(rnd, TENANT);
    tokenFinance = ctx.tokenFor(finance, TENANT);
    tokenHeadOps = ctx.tokenFor(headOps, TENANT);

    const staff = await prisma.bussdevStaff.create({
      data: { name: `${TAG} Staff`, organizationId: TENANT },
    });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0819${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 S2 HTTP',
        picId: staff.id,
        organizationId: TENANT,
      },
    });
    leadId = lead.id;

    // A real SCM material, so the production lock's material gate is satisfied by
    // real data rather than waived. Its INCI name matches no master limit, so the
    // regulatory gate sees an unremarkable composition.
    const material = await prisma.materialItem.create({
      data: {
        name: `${TAG} Material`,
        type: MaterialType.RAW_MATERIAL,
        unit: 'kg',
        unitPrice: 100,
        minLevel: 0,
        maxLevel: 1000,
        reorderPoint: 0,
        code: `MAT-${RUN_ID}`,
      },
    });
    materialId = material.id;

    const a = await openFormulation('formula-a');
    formulaAId = a.formulaId;
    const b = await openFormulation('formula-b');
    formulaBId = b.formulaId;
  }, 240000);

  afterAll(async () => {
    try {
      await prisma.outboxEvent.deleteMany({ where: { aggregateId: { in: formulaIds } } });
      await prisma.formulaItem.deleteMany({ where: { phase: { formulaId: { in: formulaIds } } } });
      await prisma.formulaPhase.deleteMany({ where: { formulaId: { in: formulaIds } } });
      await prisma.qCParameter.deleteMany({ where: { formulaId: { in: formulaIds } } });
      await prisma.formula.deleteMany({ where: { id: { in: formulaIds } } });
      await prisma.sampleStageLog.deleteMany({ where: { sampleRequestId: { in: sampleIds } } });
      await prisma.sampleRequest.deleteMany({ where: { id: { in: sampleIds } } });
      // Guarded: an unset id would widen this filter to "every material".
      if (materialId) await prisma.materialItem.deleteMany({ where: { id: materialId } });
      await prisma.salesLead.deleteMany({ where: { clientName: `${TAG} Corp` } });
      await prisma.bussdevStaff.deleteMany({ where: { name: `${TAG} Staff` } });
      await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}.` } } });
    } finally {
      // Always close the app: a leaked Nest server keeps jest's event loop alive.
      await ctx.app.close();
    }
  }, 120000);

  // ── 1 ─────────────────────────────────────────────────────────────────────
  it('1. phase validity holds, and anything but 100.00% ± 0.001 is refused', async () => {
    // a phase the DTO layer rejects outright — no business write is attempted
    const malformed = await patchFormula(tokenRnd, formulaAId, {
      targetYieldGram: 500,
      phases: [{ prefix: 'A', items: ITEMS }],
    });
    expect(malformed.status).toBe(400);
    expect(p08Code(malformed.body)).toBe('VALIDATION_FAILED');

    for (const [label, items] of [
      ['under', [{ ...ITEMS[0], dosagePercentage: 20 }, { ...ITEMS[1], dosagePercentage: 79 }]],
      ['over', [{ ...ITEMS[0], dosagePercentage: 20 }, { ...ITEMS[1], dosagePercentage: 80.5 }]],
      // 0.0015 away from 100 — outside the stated tolerance
      ['just-outside', [{ ...ITEMS[0], dosagePercentage: 20 }, { ...ITEMS[1], dosagePercentage: 79.9985 }]],
    ] as const) {
      const refused = await patchFormula(tokenRnd, formulaAId, dtoWith(items as any));
      expect(`${label}:${refused.status}`).toBe(`${label}:400`);
      expect(p08Code(refused.body)).toBe(COMPOSITION_TOTAL_INVALID);
    }

    // the refusals wrote nothing at all
    expect(await persistedItems(formulaAId)).toHaveLength(0);

    // The rule is `|total − 100| > 0.001` evaluated on the binary sum, so a total
    // that sums cleanly within the band is admitted …
    const inBand = await patchFormula(
      tokenRnd,
      formulaAId,
      dtoWith([
        { ...ITEMS[0], dosagePercentage: 20.0005 },
        { ...ITEMS[1], dosagePercentage: 79.9995 },
      ]),
    );
    expect([200, 201]).toContain(inBand.status);
    expect((await persistedItems(formulaAId)).map((i) => Number(i.dosagePercentage))).toEqual([
      20.0005, 79.9995,
    ]);

    // … while a mathematically exact ±0.001 total is refused, because the double
    // sum of 20 + 79.999 lands 0.0010000000000048 from 100. This mirrors the frozen
    // sf3 expectation for its 80.001 case; the edge is recorded, not redefined.
    const exactBoundary = await patchFormula(
      tokenRnd,
      formulaAId,
      dtoWith([{ ...ITEMS[0], dosagePercentage: 20 }, { ...ITEMS[1], dosagePercentage: 79.999 }]),
    );
    expect(exactBoundary.status).toBe(400);
    expect(p08Code(exactBoundary.body)).toBe(COMPOSITION_TOTAL_INVALID);
    expect((await persistedItems(formulaAId)).map((i) => Number(i.dosagePercentage))).toEqual([
      20.0005, 79.9995,
    ]);
  }, 90000);

  // ── 2 ─────────────────────────────────────────────────────────────────────
  it('2. grams and HPP are deterministic, and derived from the persisted cost snapshots', async () => {
    const first = await patchFormula(tokenRnd, formulaAId, dtoWith(ITEMS, 500));
    expect([200, 201]).toContain(first.status);
    const firstRows = await persistedItems(formulaAId);

    const second = await patchFormula(tokenRnd, formulaAId, dtoWith(ITEMS, 500));
    expect([200, 201]).toContain(second.status);
    const secondRows = await persistedItems(formulaAId);

    // the same input reproduces byte-identical persisted rows
    expect(secondRows.map((r) => Number(r.dosagePercentage))).toEqual(
      firstRows.map((r) => Number(r.dosagePercentage)),
    );
    expect(secondRows.map((r) => Number(r.costSnapshot))).toEqual(
      firstRows.map((r) => Number(r.costSnapshot)),
    );

    // %→gram and cost-per-gram, computed from the PERSISTED rows and the
    // PERSISTED target yield — not from the request body.
    const formula = await getFormula(tokenRnd, formulaAId);
    expect(formula.status).toBe(200);
    const targetNetto = Number(formula.body.targetYieldGram);
    expect(targetNetto).toBe(500);
    expect(Number((await prisma.formula.findUniqueOrThrow({ where: { id: formulaAId } })).targetYieldGram)).toBe(500);

    expect(firstRows.map((r) => gramFor(r.dosagePercentage, targetNetto))).toEqual([100, 400]);
    expect(costPerGramFor(firstRows)).toBe(100);
    expect(firstRows.map((r) => Number(r.costSnapshot))).toEqual([100, 100]);

    // a different target yield scales the grams, proving the conversion is live
    const rescaled = await patchFormula(tokenRnd, formulaAId, dtoWith(ITEMS, 250));
    expect([200, 201]).toContain(rescaled.status);
    const rescaledRows = await persistedItems(formulaAId);
    expect(rescaledRows.map((r) => gramFor(r.dosagePercentage, 250))).toEqual([50, 200]);
    // the cost-per-gram is a property of the composition, so it did not move
    expect(costPerGramFor(rescaledRows)).toBe(100);
  }, 90000);

  // ── 3 ─────────────────────────────────────────────────────────────────────
  it('3. the actor is captured on submit and on approve, and approve locks exactly once', async () => {
    const submitted = await submitForApproval(tokenRnd, formulaAId);
    expect([200, 201]).toContain(submitted.status);
    expect(submitted.body.status).toBe(FormulaStatus.WAITING_APPROVAL);

    const submitAudits = await prisma.auditLog.findMany({
      where: { entityType: 'Formula', entityId: formulaAId, action: 'SUBMIT_FORMULA_APPROVAL' },
    });
    expect(submitAudits).toHaveLength(1);
    expect(submitAudits[0].actorUserId).toBe(rnd.id);

    // a role that lacks the canonical permission cannot approve
    const denied = await approveFormula(tokenRnd, formulaAId);
    expect(denied.status).toBe(403);
    expect(
      await prisma.auditLog.count({
        where: { entityType: 'Formula', entityId: formulaAId, action: 'APPROVE_FORMULA' },
      }),
    ).toBe(0);

    const locked = await approveFormula(tokenHeadOps, formulaAId);
    expect([200, 201]).toContain(locked.status);
    expect(locked.body.status).toBe(FormulaStatus.SAMPLE_LOCKED);
    expect(locked.body.lockedById).toBe(headOps.id);

    const approveAudits = await prisma.auditLog.findMany({
      where: { entityType: 'Formula', entityId: formulaAId, action: 'APPROVE_FORMULA' },
    });
    expect(approveAudits).toHaveLength(1);
    expect(approveAudits[0].actorUserId).toBe(headOps.id);
    expect(approveAudits[0].txId).toBeTruthy();
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: formulaAId, eventType: 'rnd.formulation.locked' },
      }),
    ).toBe(1);

    // the retry mints no second lock effect
    const again = await approveFormula(tokenHeadOps, formulaAId);
    expect(again.body.status).toBe(FormulaStatus.SAMPLE_LOCKED);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: formulaAId, eventType: 'rnd.formulation.locked' },
      }),
    ).toBe(1);
  }, 90000);

  // ── 4 ─────────────────────────────────────────────────────────────────────
  it('4. a locked formula refuses mutation with the canonical error, including a delete', async () => {
    const before = await persistedItems(formulaAId);
    expect(before.length).toBeGreaterThan(0);

    const overwrite = await patchFormula(tokenRnd, formulaAId, dtoWith(ITEMS, 1000));
    expect(overwrite.status).toBe(400);
    expect(p08Code(overwrite.body)).toBe(FORMULA_LOCKED);

    // emptying the phase IS the delete of the composition rows
    const emptied = await patchFormula(tokenRnd, formulaAId, dtoWith([], 1000));
    expect(emptied.status).toBe(400);
    expect(p08Code(emptied.body)).toBe(FORMULA_LOCKED);

    // submitting it again cannot walk the lock back into an editable state
    const resubmit = await submitForApproval(tokenRnd, formulaAId);
    expect(resubmit.status).toBe(400);
    expect(p08Code(resubmit.body)).toBe(FORMULA_LOCKED);
    expect((await prisma.formula.findUniqueOrThrow({ where: { id: formulaAId } })).status).toBe(
      FormulaStatus.SAMPLE_LOCKED,
    );

    // and the persisted composition is byte-identical to what it was
    const after = await persistedItems(formulaAId);
    expect(after.map((i) => i.id)).toEqual(before.map((i) => i.id));
    expect(after.map((i) => Number(i.dosagePercentage))).toEqual(
      before.map((i) => Number(i.dosagePercentage)),
    );
    expect(after.map((i) => Number(i.costSnapshot))).toEqual(
      before.map((i) => Number(i.costSnapshot)),
    );
  }, 90000);

  // ── 5 ─────────────────────────────────────────────────────────────────────
  it('5. the production lock captures its actor, and its gate refuses an unlinked formula', async () => {
    // (a) the production gate is real: formula A carries no SCM material links
    const gated = await lockProduction(tokenHeadOps, formulaAId);
    expect(gated.status).toBe(400);
    expect((await prisma.formula.findUniqueOrThrow({ where: { id: formulaAId } })).status).toBe(
      FormulaStatus.SAMPLE_LOCKED,
    );

    // (b) a formula whose items ARE linked to real SCM materials locks through,
    // recording the acting user on the row, in the audit chain and in the event
    const linked = await patchFormula(
      tokenRnd,
      formulaBId,
      dtoWith([
        { materialId, dosagePercentage: 20, costSnapshot: 100 },
        { materialId, dosagePercentage: 80, costSnapshot: 100 },
      ]),
    );
    expect([200, 201]).toContain(linked.status);

    const locked = await lockProduction(tokenHeadOps, formulaBId);
    expect([200, 201]).toContain(locked.status);
    expect(locked.body.status).toBe(FormulaStatus.PRODUCTION_LOCKED);
    expect(locked.body.lockedById).toBe(headOps.id);

    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'Formula', entityId: formulaBId, action: 'LOCK_FORMULA_PRODUCTION' },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].actorUserId).toBe(headOps.id);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: formulaBId, eventType: 'rnd.formulation.locked' },
      }),
    ).toBe(1);

    // and a production-locked formula is immutable too
    const refused = await patchFormula(tokenRnd, formulaBId, dtoWith(ITEMS, 1000));
    expect(refused.status).toBe(400);
    expect(p08Code(refused.body)).toBe(FORMULA_LOCKED);
  }, 120000);
});
