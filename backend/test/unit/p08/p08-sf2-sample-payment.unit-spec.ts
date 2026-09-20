/**
 * P08-SF2 — sample fee gate (BUS-RULE-107 / DEC-2026-09-20-051).
 *
 * Drives the REAL production services — RndService, StateTransitionService,
 * AuditService, OutboxService — against the real database, isolated by a run tag.
 * Nothing about the business rule, the authorization decision, the transaction or
 * the persistence path is mocked; only the id generator is stubbed because code
 * sequences are not what this suite proves.
 *
 * Asserts:
 *   - a new sample starts in WAITING_FINANCE, so the gate is actually reachable
 *   - formulation cannot start while the fee is unverified
 *   - the old acceptance-time auto-approval is GONE: a refused accept leaves
 *     paymentApprovedAt AND paymentApprovedById null (no fabricated verifier)
 *   - Finance verification is the only writer of both fields, and it advances
 *     WAITING_FINANCE -> QUEUE through the canonical transition map
 *   - the governed write persists its audit row and outbox event in one transaction
 *   - the shared transition path also refuses an unverified jump to FORMULATING
 *   - a repeated verification yields exactly one business effect
 *
 * audit_logs is append-only at the database level (audit_immutable trigger,
 * migration 20260918_p05_platform_controls), so this suite ASSERTS the audit chain
 * and never deletes it. Rows are keyed by a per-run UUID, so runs do not collide.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: __dirname + '/../../../.env' });

import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SampleStage, UserRole, PrismaClient } from '@prisma/client';

import { RndService, SAMPLE_FEE_NOT_VERIFIED, SAMPLE_NOT_AWAITING_FINANCE } from '../../../src/modules/rnd/rnd.service';
import { StateTransitionService } from '../../../src/modules/system/state-transition.service';
import { IdGeneratorService } from '../../../src/modules/system/id-generator.service';
import { AuditService } from '../../../src/platform/audit/audit.service';
import { OutboxService } from '../../../src/platform/outbox/outbox.service';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p08_sf2_${RUN_ID}`;

describe('P08-SF2 sample fee gate (real services, real audit + outbox)', () => {
  let rnd: RndService;
  let prisma: PrismaService;
  let moduleRef: any = null;

  let leadId: string;
  let financeUserId: string;
  const createdSampleIds: string[] = [];

  /** Thrown by Nest when a reason_code is attached; unwraps to the payload. */
  const reasonOf = (err: any): string | undefined =>
    err?.response?.reason_code ?? err?.reason_code;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        RndService,
        PrismaService,
        StateTransitionService,
        EventEmitter2,
        {
          provide: IdGeneratorService,
          useValue: {
            generateId: async (prefix: string) =>
              `${prefix}-${TAG}-${randomUUID().slice(0, 6)}`,
          },
        },
        // AuditService/OutboxService take PrismaClient; PrismaService extends it,
        // but listing both as providers makes Nest build a bare PrismaClient with
        // no driver adapter. Same workaround the P07 suites use.
        {
          provide: AuditService,
          useFactory: (p: PrismaService) => new AuditService(p as unknown as PrismaClient),
          inject: [PrismaService],
        },
        {
          provide: OutboxService,
          useFactory: (p: PrismaService) => new OutboxService(p as unknown as PrismaClient),
          inject: [PrismaService],
        },
      ],
    }).compile();

    moduleRef = mod;
    rnd = mod.get(RndService);
    prisma = mod.get(PrismaService);

    const staff = await prisma.bussdevStaff.create({ data: { name: `${TAG} Staff` } });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0812${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 Gate Test',
        picId: staff.id,
      },
    });
    leadId = lead.id;

    const finance = await prisma.user.upsert({
      where: { email: 'finance.p08.unit@test.local' },
      update: {},
      create: {
        email: 'finance.p08.unit@test.local',
        fullName: 'Finance Verifier (P08 unit)',
        roles: [UserRole.FINANCE],
      },
    });
    financeUserId = finance.id;
  });

  afterAll(async () => {
    // outbox rows are ordinary table rows; audit rows must never be deleted.
    await prisma.outboxEvent.deleteMany({
      where: { aggregateId: { in: createdSampleIds } },
    });
    await prisma.formulaPhase.deleteMany({
      where: { formula: { sampleRequestId: { in: createdSampleIds } } },
    });
    await prisma.formula.deleteMany({
      where: { sampleRequestId: { in: createdSampleIds } },
    });
    await prisma.sampleStageLog.deleteMany({
      where: { sampleRequestId: { in: createdSampleIds } },
    });
    await prisma.sampleRequest.deleteMany({ where: { id: { in: createdSampleIds } } });
    await prisma.salesLead.deleteMany({ where: { id: leadId } });
    await prisma.bussdevStaff.deleteMany({ where: { name: `${TAG} Staff` } });
    if (moduleRef) await moduleRef.close();
  });

  /** A sample awaiting Finance, exactly as createSample now produces it. */
  async function makeWaitingSample(label: string) {
    const sample = await prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${TAG}-${label}`,
        leadId,
        productName: `${TAG} ${label}`,
        targetFunction: 'Test',
        textureReq: 'A',
        colorReq: 'B',
        aromaReq: 'C',
        stage: SampleStage.WAITING_FINANCE,
      },
    });
    createdSampleIds.push(sample.id);
    return sample;
  }

  it('puts a newly created sample in WAITING_FINANCE so the gate is reachable', async () => {
    const sample = await rnd.createSample({
      leadId,
      productName: `${TAG} created`,
      targetFunction: 'Test',
      textureReq: 'A',
      colorReq: 'B',
      aromaReq: 'C',
    } as any);
    createdSampleIds.push(sample.id);

    expect(sample.stage).toBe(SampleStage.WAITING_FINANCE);
    expect(sample.paymentApprovedAt).toBeNull();
    expect(sample.paymentApprovedById).toBeNull();
  });

  it('refuses to start formulation while the fee is unverified', async () => {
    const sample = await makeWaitingSample('unverified');

    await expect(rnd.acceptSample(sample.id)).rejects.toThrow(BadRequestException);

    try {
      await rnd.acceptSample(sample.id);
    } catch (err) {
      expect(reasonOf(err)).toBe(SAMPLE_FEE_NOT_VERIFIED);
    }
  });

  it('no longer fabricates a verifier on refusal (the auto-approve path is gone)', async () => {
    const sample = await makeWaitingSample('nofabricate');

    await rnd.acceptSample(sample.id).catch(() => undefined);

    const after = await prisma.sampleRequest.findUniqueOrThrow({
      where: { id: sample.id },
    });
    expect(after.paymentApprovedAt).toBeNull();
    expect(after.paymentApprovedById).toBeNull();
    // and no formula was created as a side effect of the refused attempt
    const formulas = await prisma.formula.count({
      where: { sampleRequestId: sample.id },
    });
    expect(formulas).toBe(0);
  });

  it('refuses an unverified jump to FORMULATING through the shared transition path', async () => {
    const sample = await makeWaitingSample('advance');

    await expect(
      rnd.advanceSampleStage(sample.id, { newStage: SampleStage.FORMULATING } as any),
    ).rejects.toThrow(BadRequestException);

    const after = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sample.id } });
    expect(after.stage).toBe(SampleStage.WAITING_FINANCE);
  });

  it('lets Finance verify, records the named verifier, and advances to QUEUE with audit + outbox', async () => {
    const sample = await makeWaitingSample('verify');

    const verified = await rnd.verifySamplePayment(
      sample.id,
      financeUserId,
      'Transfer verified against bank statement',
    );

    expect(verified.stage).toBe(SampleStage.QUEUE);
    expect(verified.paymentApprovedById).toBe(financeUserId);
    expect(verified.paymentApprovedAt).not.toBeNull();

    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'SampleRequest', entityId: sample.id },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].action).toBe('VERIFY_SAMPLE_PAYMENT');
    expect(audits[0].actorUserId).toBe(financeUserId);
    // the audit row carries a real transaction id captured inside the transaction
    expect(audits[0].txId).toBeTruthy();

    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: sample.id, eventType: 'sample.payment_verified' },
    });
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({
      sample_id: sample.id,
      verified_by: financeUserId,
    });
  });

  it('accepts the sample only after verification, creating Formula V1', async () => {
    const sample = await makeWaitingSample('accept-after');
    await rnd.verifySamplePayment(sample.id, financeUserId);

    const { sample: accepted, formula } = await rnd.acceptSample(sample.id, financeUserId);

    expect(accepted.stage).toBe(SampleStage.FORMULATING);
    expect(formula.sampleRequestId).toBe(sample.id);
    expect(formula.version).toBe(1);
    expect(formula.status).toBe('DRAFT');
  });

  it('yields exactly one business effect when verification is repeated', async () => {
    const sample = await makeWaitingSample('repeat');
    await rnd.verifySamplePayment(sample.id, financeUserId);

    let secondError: any = null;
    try {
      await rnd.verifySamplePayment(sample.id, financeUserId);
    } catch (err) {
      secondError = err;
    }

    expect(secondError).toBeInstanceOf(ConflictException);
    expect(reasonOf(secondError)).toBe(SAMPLE_NOT_AWAITING_FINANCE);

    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: sample.id, eventType: 'sample.payment_verified' },
    });
    expect(events).toHaveLength(1);

    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'SampleRequest', entityId: sample.id, action: 'VERIFY_SAMPLE_PAYMENT' },
    });
    expect(audits).toHaveLength(1);
  });

  it('refuses to verify a sample that is not awaiting Finance', async () => {
    const sample = await makeWaitingSample('notwaiting');
    await rnd.rejectSamplePayment(sample.id, financeUserId, 'Transfer not found in bank statement');

    const rejected = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sample.id } });
    expect(rejected.stage).toBe(SampleStage.REJECTED);
    expect(rejected.paymentApprovedAt).toBeNull();

    await expect(
      rnd.verifySamplePayment(sample.id, financeUserId),
    ).rejects.toThrow(ConflictException);

    // and a rejected sample still cannot enter formulation
    await expect(rnd.acceptSample(sample.id)).rejects.toThrow(BadRequestException);
  });
});
