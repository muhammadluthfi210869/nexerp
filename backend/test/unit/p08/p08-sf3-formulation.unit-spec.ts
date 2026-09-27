/**
 * P08-SF3 — formulation integrity (BUS-RULE-108, 109, 113, 114).
 *
 * Drives the REAL FormulasService against the real database, isolated by a run
 * tag. The one collaborator stubbed is LegalityService — it circularly depends on
 * BussdevService (legality.service.ts:20 `forwardRef`), and the BPOM gate it
 * implements is neither owned nor changed by P08-SF3. Everything this suite
 * proves — the composition invariant, the lock guard, the revision lineage, the
 * audit/outbox atomicity — runs through production code and the production DB.
 *
 * Asserts:
 *   - composition ≠ 100% is rejected with COMPOSITION_TOTAL_INVALID
 *   - %→gram and HPP are reproducible: the same input twice yields byte-identical
 *     item rows and identical derived numbers
 *   - a locked (SAMPLE_LOCKED / PRODUCTION_LOCKED) and a superseded formula each
 *     reject mutation with FORMULA_LOCKED, and their items are left untouched
 *   - the lock write commits with its audit row and its `rnd.formulation.locked`
 *     outbox event, and a repeated lock adds exactly zero further effects
 *   - a revision copies rather than rewrites: the parent keeps its version and its
 *     item rows, and only its status flag is marked SUPERSEDED (BUS-RULE-114)
 *   - a revision of a locked parent is allowed and still leaves the parent intact
 *
 * audit_logs is append-only at the database level (audit_immutable trigger,
 * migration 20260918_p05_platform_controls), so this suite ASSERTS the audit chain
 * and never deletes it.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: __dirname + '/../../../.env' });

import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { FormulaStatus, PrismaClient, SampleStage } from '@prisma/client';

import {
  FormulasService,
  COMPOSITION_TOTAL_INVALID,
  FORMULA_LOCKED,
  EVENT_FORMULA_LOCKED,
  compositionTotal,
  costPerGramFor,
  gramFor,
} from '../../../src/modules/rnd/formulas/formulas.service';
import { LegalityService } from '../../../src/modules/legality/legality.service';
import { IdGeneratorService } from '../../../src/modules/system/id-generator.service';
import { AuditService } from '../../../src/platform/audit/audit.service';
import { OutboxService } from '../../../src/platform/outbox/outbox.service';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p08_sf3_${RUN_ID}`;

/** 20% @ 100 + 80% @ 100 → 100.00% and 100 cost-per-gram. Deliberately exact. */
const ITEMS = [
  { materialId: null, dosagePercentage: 20, costSnapshot: 100 },
  { materialId: null, dosagePercentage: 80, costSnapshot: 100 },
];

const dtoWith = (items: Array<Record<string, unknown>>, targetYieldGram = 500) => ({
  targetYieldGram,
  phases: [
    { prefix: 'A', customName: 'Phase A', order: 1, items },
  ],
});

describe('P08-SF3 formulation integrity (real service, real audit + outbox)', () => {
  let formulas: FormulasService;
  let prisma: PrismaService;
  let moduleRef: any = null;

  let sampleId: string;
  let leadId: string;
  let actorId: string;
  const formulaIds: string[] = [];

  const reasonOf = (err: any): string | undefined =>
    err?.response?.reason_code ?? err?.reason_code;

  const itemsOf = (formulaId: string) =>
    prisma.formulaItem.findMany({
      where: { phase: { formulaId } },
      orderBy: { dosagePercentage: 'asc' },
    });

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        FormulasService,
        PrismaService,
        EventEmitter2,
        {
          provide: IdGeneratorService,
          useValue: {
            generateId: async (prefix: string) =>
              `${prefix}-${TAG}-${randomUUID().slice(0, 6)}`,
          },
        },
        {
          provide: LegalityService,
          useValue: {
            validateFormula: async () => ({
              canProceed: true,
              violations: [],
              riskScore: 'LOW',
            }),
          },
        },
        {
          provide: AuditService,
          useFactory: (p: PrismaService) =>
            new AuditService(p as unknown as PrismaClient),
          inject: [PrismaService],
        },
        {
          provide: OutboxService,
          useFactory: (p: PrismaService) =>
            new OutboxService(p as unknown as PrismaClient),
          inject: [PrismaService],
        },
      ],
    }).compile();

    moduleRef = mod;
    formulas = mod.get(FormulasService);
    prisma = mod.get(PrismaService);

    const staff = await prisma.bussdevStaff.create({ data: { name: `${TAG} Staff` } });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0813${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 formulation',
        picId: staff.id,
      },
    });
    leadId = lead.id;

    const sample = await prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${TAG}`,
        leadId,
        productName: `${TAG} Sample`,
        targetFunction: 'Test',
        textureReq: 'A',
        colorReq: 'B',
        aromaReq: 'C',
        stage: SampleStage.FORMULATING,
      },
    });
    sampleId = sample.id;

    const actor = await prisma.user.upsert({
      where: { email: 'rnd.p08.sf3@test.local' },
      update: {},
      create: {
        email: 'rnd.p08.sf3@test.local',
        fullName: 'R&D Actor (P08 SF3)',
        roles: ['RND'],
      },
    });
    actorId = actor.id;
  });

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany({ where: { aggregateId: { in: formulaIds } } });
    await prisma.formulaItem.deleteMany({ where: { phase: { formulaId: { in: formulaIds } } } });
    await prisma.formulaPhase.deleteMany({ where: { formulaId: { in: formulaIds } } });
    await prisma.formula.deleteMany({ where: { id: { in: formulaIds } } });
    await prisma.sampleStageLog.deleteMany({ where: { sampleRequestId: sampleId } });
    await prisma.sampleRequest.deleteMany({ where: { id: sampleId } });
    await prisma.salesLead.deleteMany({ where: { id: leadId } });
    await prisma.bussdevStaff.deleteMany({ where: { name: `${TAG} Staff` } });
    if (moduleRef) await moduleRef.close();
  });

  /** A formula fixture written straight to the DB — the create path is not under test here. */
  async function makeFormula(label: string, status: FormulaStatus = FormulaStatus.DRAFT) {
    const formula = await prisma.formula.create({
      data: {
        formulaCode: `F-${TAG}-${label}`,
        sampleRequestId: sampleId,
        targetYieldGram: 1000,
        version: 1,
        status,
        phases: {
          create: {
            prefix: 'A',
            customName: 'Phase A',
            order: 1,
            items: {
              createMany: {
                data: ITEMS.map((i) => ({
                  materialId: i.materialId,
                  dosagePercentage: i.dosagePercentage,
                  costSnapshot: i.costSnapshot,
                })),
              },
            },
          },
        },
      },
    });
    formulaIds.push(formula.id);
    return formula;
  }

  it('reports the composition total, and rejects anything but 100%', async () => {
    expect(compositionTotal(ITEMS)).toBe(100);

    const formula = await makeFormula('composition');
    const under = await formulas
      .updateFormulaV4(formula.id, dtoWith([{ ...ITEMS[0], dosagePercentage: 19.5 }, ITEMS[1]]) as any)
      .catch((e) => e);
    expect(under).toBeInstanceOf(BadRequestException);
    expect(reasonOf(under)).toBe(COMPOSITION_TOTAL_INVALID);

    const over = await formulas
      .updateFormulaV4(formula.id, dtoWith([ITEMS[0], { ...ITEMS[1], dosagePercentage: 80.001 }]) as any)
      .catch((e) => e);
    expect(reasonOf(over)).toBe(COMPOSITION_TOTAL_INVALID);

    // and nothing was written by either refusal
    const kept = await itemsOf(formula.id);
    expect(kept.map((i) => Number(i.dosagePercentage))).toEqual([20, 80]);
  });

  it('converts %→gram and HPP deterministically, and reproduces the same rows twice', async () => {
    // pure functions: the definition itself
    expect(gramFor(20, 500)).toBe(100);
    expect(gramFor(80, 500)).toBe(400);
    expect(costPerGramFor(ITEMS)).toBe(100);

    const formula = await makeFormula('deterministic');

    const first = await formulas.updateFormulaV4(formula.id, dtoWith(ITEMS, 500) as any, actorId);
    const firstRows = await itemsOf(formula.id);

    const second = await formulas.updateFormulaV4(formula.id, dtoWith(ITEMS, 500) as any, actorId);
    const secondRows = await itemsOf(formula.id);

    expect(secondRows.map((i) => Number(i.dosagePercentage))).toEqual(
      firstRows.map((i) => Number(i.dosagePercentage)),
    );
    expect(secondRows.map((i) => Number(i.costSnapshot))).toEqual(
      firstRows.map((i) => Number(i.costSnapshot)),
    );
    expect(Number(second!.targetYieldGram)).toBe(Number(first!.targetYieldGram));

    // the derived numbers are identical across runs, computed from the persisted rows
    const derived = (rows: typeof firstRows, yieldGram: unknown) => ({
      grams: rows.map((r) => gramFor(r.dosagePercentage, yieldGram)),
      hpp: costPerGramFor(rows),
    });
    expect(derived(secondRows, second!.targetYieldGram)).toEqual(
      derived(firstRows, first!.targetYieldGram),
    );

    expect(derived(firstRows, first!.targetYieldGram)).toEqual({
      grams: [100, 400],
      hpp: 100,
    });
  });

  it('rejects mutation of a locked formula and leaves its items untouched', async () => {
    const formula = await makeFormula('locked-sample');
    await formulas.approveFormula(formula.id, actorId);

    const locked = await prisma.formula.findUniqueOrThrow({ where: { id: formula.id } });
    expect(locked.status).toBe(FormulaStatus.SAMPLE_LOCKED);

    const err = await formulas
      .updateFormulaV4(formula.id, dtoWith([{ ...ITEMS[0], dosagePercentage: 100 }, { ...ITEMS[1], dosagePercentage: 0 }]) as any, actorId)
      .catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(reasonOf(err)).toBe(FORMULA_LOCKED);

    const kept = await itemsOf(formula.id);
    expect(kept.map((i) => Number(i.dosagePercentage))).toEqual([20, 80]);
    expect(Number((await prisma.formula.findUniqueOrThrow({ where: { id: formula.id } })).targetYieldGram)).toBe(1000);
  });

  it('rejects mutation of a production-locked formula', async () => {
    // The BPOM/material gate that sets PRODUCTION_LOCKED is out of SF3 scope, so the
    // status is seeded directly; the guard under test is the mutation refusal.
    const formula = await makeFormula('locked-prod', FormulaStatus.PRODUCTION_LOCKED);

    const err = await formulas
      .updateFormulaV4(formula.id, dtoWith(ITEMS) as any, actorId)
      .catch((e) => e);
    expect(reasonOf(err)).toBe(FORMULA_LOCKED);

    expect((await itemsOf(formula.id)).length).toBe(2);
  });

  it('commits the lock with its audit row and one outbox event, exactly once', async () => {
    const formula = await makeFormula('lock-effects');

    await formulas.approveFormula(formula.id, actorId);

    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'Formula', entityId: formula.id, action: 'APPROVE_FORMULA' },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].actorUserId).toBe(actorId);
    expect(audits[0].txId).toBeTruthy();

    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: formula.id, eventType: EVENT_FORMULA_LOCKED },
    });
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({
      formulation_id: formula.id,
      locked_by: actorId,
    });

    // a repeated lock is a no-op: no second audit row, no second event
    const again = await formulas.approveFormula(formula.id, actorId);
    expect(again.status).toBe(FormulaStatus.SAMPLE_LOCKED);
    expect(
      await prisma.auditLog.count({
        where: { entityType: 'Formula', entityId: formula.id, action: 'APPROVE_FORMULA' },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({
        where: { aggregateId: formula.id, eventType: EVENT_FORMULA_LOCKED },
      }),
    ).toBe(1);
  });

  it('copies a revision instead of rewriting the parent, and freezes the parent', async () => {
    const parent = await makeFormula('revision-parent');
    const parentItemsBefore = await itemsOf(parent.id);

    const revision = await formulas.createRevision(parent.id, actorId);

    expect(revision.version).toBe(2);
    expect(revision.status).toBe(FormulaStatus.DRAFT);
    expect(revision.id).not.toBe(parent.id);

    // BUS-RULE-114: the parent's revision number and item rows are unchanged
    const parentAfter = await prisma.formula.findUniqueOrThrow({ where: { id: parent.id } });
    expect(parentAfter.version).toBe(1);
    expect(Number(parentAfter.targetYieldGram)).toBe(1000);
    expect(parentAfter.status).toBe(FormulaStatus.SUPERSEDED);

    const parentItemsAfter = await itemsOf(parent.id);
    expect(parentItemsAfter.map((i) => i.id)).toEqual(parentItemsBefore.map((i) => i.id));
    expect(parentItemsAfter.map((i) => Number(i.dosagePercentage))).toEqual([20, 80]);

    // the copy carries the composition forward
    const revisionItems = await itemsOf(revision.id);
    expect(revisionItems.map((i) => Number(i.dosagePercentage))).toEqual([20, 80]);

    // and the superseded parent is now frozen history
    const err = await formulas
      .updateFormulaV4(parent.id, dtoWith(ITEMS) as any, actorId)
      .catch((e) => e);
    expect(reasonOf(err)).toBe(FORMULA_LOCKED);

    // the lineage is recorded with the parent's unchanged version as evidence
    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'Formula', entityId: revision.id, action: 'CREATE_FORMULA_REVISION' },
    });
    expect(audits).toHaveLength(1);
    expect((audits[0].beforeSnapshot as any).parent_version).toBe(1);
    expect((audits[0].beforeSnapshot as any).parent_formula_id).toBe(parent.id);
  });

  it('allows rework of a locked parent without touching the parent', async () => {
    const parent = await makeFormula('rework-locked', FormulaStatus.PRODUCTION_LOCKED);
    const parentItemsBefore = await itemsOf(parent.id);

    const revision = await formulas.createRevision(parent.id, actorId);

    expect(revision.status).toBe(FormulaStatus.DRAFT);
    const parentAfter = await prisma.formula.findUniqueOrThrow({ where: { id: parent.id } });
    expect(parentAfter.version).toBe(1);
    // the parent's item rows survive the rework byte for byte
    const parentItemsAfter = await itemsOf(parent.id);
    expect(parentItemsAfter.map((i) => i.id)).toEqual(parentItemsBefore.map((i) => i.id));
  });
});
