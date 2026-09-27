/**
 * P08-SF4 — design approval bound, supervisor reopen, and the single permit expiry
 * policy (BUS-RULE-110, 111, 112, 113).
 *
 * Drives the REAL CreativeService and LegalityService against the real database,
 * isolated by a run tag. The revision rounds below walk the genuine state chain
 * (REVISION -> upload -> IN_PROGRESS -> submit -> WAITING_APJ -> APJ approve ->
 * WAITING_CLIENT -> client rejects -> REVISION) rather than rewriting the state
 * column, so the allowance is spent by the production transitions.
 *
 * The one collaborator stubbed is BussdevService, which both services reach through
 * `forwardRef` for a cross-module notification this suite does not prove. bcrypt is
 * mocked so a PIN check does not need a real hash; the PIN gate itself is not what
 * this suite is about.
 *
 * Asserts:
 *   - a design decision must name the artwork version it decided on, and it must be
 *     the current one — not "whichever row happened to be latest"
 *   - each revision request consumes one unit of the allowance and the bound of 3
 *     hard-locks the design
 *   - a locked design refuses further revisions until a supervisor reopens it
 *   - the supervisor reopen resets the allowance to zero AND that reset survives the
 *     next upload (the defect that made the old unlock useless)
 *   - a reopen by a non-supervisor is refused and leaves the design locked
 *   - the reopen is recorded in the design history with its reason
 *   - every governed design write commits with its audit row and outbox event
 *   - the permit expiry policy is one policy: 0/30/90 buckets, NO_EXPIRY is not SAFE,
 *     and a 75-day permit is WARNING on every surface
 *   - permit audit risk is derived from the record, not asserted as 'OK' at insert
 *
 * audit_logs is append-only at the database level (audit_immutable trigger), so this
 * suite ASSERTS the audit chain and never deletes it.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: __dirname + '/../../../.env' });

import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { ForbiddenException } from '@nestjs/common';
import {
  ApprovalStatus,
  DesignState,
  LegalStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';

import {
  CreativeService,
  DESIGN_NOT_LOCKED,
  DESIGN_REOPEN_UNAUTHORIZED,
  DESIGN_REVISION_BOUND,
  DESIGN_REVISION_BOUND_REACHED,
  DESIGN_VERSION_REQUIRED,
  REOPEN_REASON_REQUIRED,
} from '../../../src/modules/creative/creative.service';
import {
  LegalityService,
  permitAuditRisk,
  permitExpiryBucket,
  permitDaysLeft,
} from '../../../src/modules/legality/legality.service';
import { BussdevService } from '../../../src/modules/bussdev/bussdev.service';
import { AuditService } from '../../../src/platform/audit/audit.service';
import { OutboxService } from '../../../src/platform/outbox/outbox.service';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p08_sf4_${RUN_ID}`;

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('$2b$10$p08sf4'),
}));

describe('P08-SF4 design approval + permit expiry (real services, real audit + outbox)', () => {
  let creative: CreativeService;
  let legality: LegalityService;
  let prisma: PrismaService;
  let moduleRef: any = null;

  let leadId: string;
  let bdId: string;
  let apjId: string;
  let directorId: string;
  const taskIds: string[] = [];

  const reasonOf = (err: any): string | undefined =>
    err?.response?.reason_code ?? err?.reason_code;

  const daysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        CreativeService,
        LegalityService,
        PrismaService,
        EventEmitter2,
        {
          provide: BussdevService,
          useValue: { checkSalesOrderReadiness: async () => undefined },
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
    creative = mod.get(CreativeService);
    legality = mod.get(LegalityService);
    prisma = mod.get(PrismaService);

    const staff = await prisma.bussdevStaff.create({
      data: { name: `${TAG} Staff` },
    });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0814${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 design',
        picId: staff.id,
      },
    });
    leadId = lead.id;

    const bd = await prisma.user.upsert({
      where: { email: 'bd.p08.sf4@test.local' },
      update: {},
      create: {
        email: 'bd.p08.sf4@test.local',
        fullName: 'BusDev Staff (P08 SF4)',
        roles: [UserRole.COMMERCIAL],
      },
    });
    bdId = bd.id;

    const apj = await prisma.user.upsert({
      where: { email: 'apj.p08.sf4@test.local' },
      update: {},
      create: {
        email: 'apj.p08.sf4@test.local',
        fullName: 'APJ (P08 SF4)',
        roles: [UserRole.APJ],
        approvalPin: '$2b$10$notarealhash',
      },
    });
    apjId = apj.id;

    const director = await prisma.user.upsert({
      where: { email: 'director.p08.sf4@test.local' },
      update: {},
      create: {
        email: 'director.p08.sf4@test.local',
        fullName: 'Director (P08 SF4)',
        roles: [UserRole.DIRECTOR],
      },
    });
    directorId = director.id;
  });

  afterAll(async () => {
    await prisma.outboxEvent.deleteMany({
      where: { aggregateId: { in: taskIds } },
    });
    await prisma.purchaseOrder.deleteMany({ where: { leadId } });
    // design_feedbacks / design_versions cascade from design_tasks.
    await prisma.designTask.deleteMany({ where: { id: { in: taskIds } } });
    await prisma.salesLead.deleteMany({ where: { id: leadId } });
    await prisma.bussdevStaff.deleteMany({ where: { name: `${TAG} Staff` } });
    if (moduleRef) await moduleRef.close();
  });

  /** A task already at WAITING_CLIENT with one uploaded artwork version. */
  async function makeTaskAtClient(label: string) {
    const task = await prisma.designTask.create({
      data: {
        leadId,
        brief: `${TAG} ${label}`,
        kanbanState: DesignState.WAITING_CLIENT,
        versions: {
          create: {
            versionNumber: 1,
            artworkUrl: `/uploads/${TAG}-${label}-v1.ai`,
            mockupUrl: `/uploads/${TAG}-${label}-v1.png`,
          },
        },
      },
      include: { versions: true },
    });
    taskIds.push(task.id);
    return { task, versionId: task.versions[0].id };
  }

  /** The client asks for a revision on the version currently on the table. */
  function clientRequestRevision(
    taskId: string,
    versionId: string,
    reason: string,
  ) {
    return creative.clientReview(taskId, ApprovalStatus.REJECTED, {
      versionId,
      authorId: bdId,
      reason,
    });
  }

  /**
   * One full production cycle: designer uploads a new artwork, submits it to the APJ,
   * the APJ approves it, and the client then asks for another revision. This is what
   * actually moves the revision counter — no direct writes to the state column.
   */
  async function revisionRound(taskId: string, label: string) {
    const version = await creative.uploadVersion({
      taskId,
      artworkUrl: `/uploads/${TAG}-${label}.ai`,
      mockupUrl: `/uploads/${TAG}-${label}.png`,
      uploadedBy: bdId,
    });
    await creative.submitToApj(taskId);
    await creative.apjReview({
      taskId,
      status: ApprovalStatus.APPROVED,
      authorId: apjId,
      pin: '1234',
      ipAddress: null,
      versionId: version.id,
    });
    return clientRequestRevision(taskId, version.id, `revision ${label}`);
  }

  /** Spend the whole allowance: first rejection on V1, then full rounds. */
  async function exhaustAllowance(taskId: string, versionId: string) {
    await clientRequestRevision(taskId, versionId, 'revision 1');
    for (let i = 2; i <= DESIGN_REVISION_BOUND; i++) {
      await revisionRound(taskId, `r${i}`);
    }
  }

  describe('BUS-RULE-110 — an approval decision binds to an exact artwork version', () => {
    it('refuses a decision that names no version', async () => {
      const { task } = await makeTaskAtClient('noversion');

      const err = await creative
        .clientReview(task.id, ApprovalStatus.APPROVED, { authorId: bdId })
        .catch((e) => e);

      expect(reasonOf(err)).toBe(DESIGN_VERSION_REQUIRED);
      expect(
        await prisma.designFeedback.count({ where: { taskId: task.id } }),
      ).toBe(0);
      const after = await prisma.designTask.findUniqueOrThrow({
        where: { id: task.id },
      });
      expect(after.kanbanState).toBe(DesignState.WAITING_CLIENT);
      expect(after.isFinal).toBe(false);
    });

    it('refuses a decision that names a version older than the one on the table', async () => {
      const { task, versionId } = await makeTaskAtClient('staleversion');
      // a newer artwork lands after the reviewer looked at V1
      await prisma.designVersion.create({
        data: { taskId: task.id, versionNumber: 2, artworkUrl: '/v2.ai' },
      });

      const err = await creative
        .clientReview(task.id, ApprovalStatus.APPROVED, {
          versionId,
          authorId: bdId,
        })
        .catch((e) => e);

      expect(reasonOf(err)).toBe(DESIGN_VERSION_REQUIRED);
      expect(
        await prisma.designTask.findUniqueOrThrow({ where: { id: task.id } }),
      ).toMatchObject({ isFinal: false });
    });

    it('records the approved version and finalizes the design with audit + outbox', async () => {
      const { task, versionId } = await makeTaskAtClient('approve');

      const result = await creative.clientReview(
        task.id,
        ApprovalStatus.APPROVED,
        { versionId, authorId: bdId, notes: 'Client signed off' },
      );

      expect(result.kanbanState).toBe(DesignState.LOCKED);
      expect(result.isFinal).toBe(true);

      const feedback = await prisma.designFeedback.findFirstOrThrow({
        where: { taskId: task.id, approvalStatus: ApprovalStatus.APPROVED },
      });
      expect(feedback.versionId).toBe(versionId);

      const audits = await prisma.auditLog.findMany({
        where: {
          entityType: 'DesignTask',
          entityId: task.id,
          action: 'CLIENT_APPROVE_DESIGN',
        },
      });
      expect(audits).toHaveLength(1);
      expect(audits[0].actorUserId).toBe(bdId);
      expect(audits[0].txId).toBeTruthy();

      const events = await prisma.outboxEvent.findMany({
        where: { aggregateId: task.id, eventType: 'design.finalized' },
      });
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        design_task_id: task.id,
        version_id: versionId,
      });
    });
  });

  describe('BUS-RULE-111 — revision bound, hard lock, and the supervisor reopen', () => {
    it('consumes one unit of the allowance per revision request and locks at the bound', async () => {
      const { task, versionId } = await makeTaskAtClient('bound');

      const first = await clientRequestRevision(task.id, versionId, 'revision 1');
      expect(first.revisionCount).toBe(1);
      expect(first.isLocked).toBe(false);

      const second = await revisionRound(task.id, 'r2');
      expect(second.revisionCount).toBe(2);
      expect(second.isLocked).toBe(false);

      const third = await revisionRound(task.id, 'r3');
      expect(third.revisionCount).toBe(DESIGN_REVISION_BOUND);
      expect(third.isLocked).toBe(true);

      // the APJ approval on the way through is bound to the version it approved
      const approvals = await prisma.designFeedback.findMany({
        where: { taskId: task.id, approvalStatus: ApprovalStatus.APPROVED },
        include: { version: true },
      });
      expect(approvals.length).toBeGreaterThan(0);
      for (const a of approvals) {
        expect(a.versionId).toBe(a.version?.id);
      }
    });

    it('refuses a revision past the bound at both entry points until a supervisor reopens', async () => {
      const { task, versionId } = await makeTaskAtClient('pastbound');
      await exhaustAllowance(task.id, versionId);
      expect(
        (await prisma.designTask.findUniqueOrThrow({ where: { id: task.id } }))
          .isLocked,
      ).toBe(true);

      // entry point 1 — the upload path. The hard lock closes it.
      const uploadErr = await creative
        .uploadVersion({
          taskId: task.id,
          artworkUrl: `/uploads/${TAG}-pastbound-extra.ai`,
          uploadedBy: bdId,
        })
        .catch((e) => e);
      expect(reasonOf(uploadErr)).toBe(DESIGN_REVISION_BOUND_REACHED);

      // entry point 2 — the decision path, from the state a client decision is
      // actually made in. The at-bound state is seeded directly because the chain
      // that produces it (three full revision rounds) is proven by the test above.
      const atBound = await makeTaskAtClient('pastbound-client');
      await prisma.designTask.update({
        where: { id: atBound.task.id },
        data: { revisionCount: DESIGN_REVISION_BOUND, isLocked: true },
      });
      const err = await clientRequestRevision(
        atBound.task.id,
        atBound.versionId,
        'one more',
      ).catch((e) => e);
      expect(reasonOf(err)).toBe(DESIGN_REVISION_BOUND_REACHED);

      // nothing moved
      const after = await prisma.designTask.findUniqueOrThrow({
        where: { id: atBound.task.id },
      });
      expect(after.revisionCount).toBe(DESIGN_REVISION_BOUND);
      expect(after.kanbanState).toBe(DesignState.WAITING_CLIENT);
      expect(
        await prisma.designFeedback.count({ where: { taskId: atBound.task.id } }),
      ).toBe(0);
    });

    it('refuses a reopen from a non-supervisor and leaves the design locked', async () => {
      const { task, versionId } = await makeTaskAtClient('unauthorized');
      await exhaustAllowance(task.id, versionId);

      const err = await creative
        .unlockTask({
          taskId: task.id,
          action: 'CHARGE',
          userId: bdId,
          reason: 'let me in',
        })
        .catch((e) => e);

      expect(err).toBeInstanceOf(ForbiddenException);
      expect(reasonOf(err)).toBe(DESIGN_REOPEN_UNAUTHORIZED);
      const after = await prisma.designTask.findUniqueOrThrow({
        where: { id: task.id },
      });
      expect(after.isLocked).toBe(true);
      expect(after.revisionCount).toBe(DESIGN_REVISION_BOUND);
      // the refused attempt left no reopen record behind
      expect(
        await prisma.designFeedback.count({
          where: { taskId: task.id, content: 'let me in' },
        }),
      ).toBe(0);
    });

    it('reopens as a supervisor, records the reason, and the allowance genuinely restarts', async () => {
      const { task, versionId } = await makeTaskAtClient('reopen');
      await exhaustAllowance(task.id, versionId);

      const reopened = await creative.unlockTask({
        taskId: task.id,
        action: 'CHARGE',
        userId: directorId,
        reason: 'Client changed the brand direction',
      });

      expect(reopened.isLocked).toBe(false);
      expect(reopened.revisionCount).toBe(0);
      expect(reopened.kanbanState).toBe(DesignState.REVISION);

      const history = await prisma.designFeedback.findFirstOrThrow({
        where: {
          taskId: task.id,
          content: 'Client changed the brand direction',
        },
      });
      expect(history.authorId).toBe(directorId);

      const audits = await prisma.auditLog.findMany({
        where: {
          entityType: 'DesignTask',
          entityId: task.id,
          action: 'SUPERVISOR_REOPEN_DESIGN',
        },
      });
      expect(audits).toHaveLength(1);
      expect((audits[0].beforeSnapshot as any).revisionCount).toBe(
        DESIGN_REVISION_BOUND,
      );
      expect((audits[0].afterSnapshot as any).revisionCount).toBe(0);

      const events = await prisma.outboxEvent.findMany({
        where: { aggregateId: task.id, eventType: 'design.reopened' },
      });
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        reopened_by: directorId,
        revision_count_before: DESIGN_REVISION_BOUND,
      });

      // THE REGRESSION THIS SUITE EXISTS FOR: the allowance must still be reset after
      // the next upload. Before the fix, uploadVersion rewrote revisionCount from
      // `versions.length`, so the task re-locked instantly and the reopen was useless.
      const uploaded = await creative.uploadVersion({
        taskId: task.id,
        artworkUrl: `/uploads/${TAG}-reopen-v2.ai`,
        uploadedBy: bdId,
      });
      const afterUpload = await prisma.designTask.findUniqueOrThrow({
        where: { id: task.id },
      });
      expect(afterUpload.revisionCount).toBe(0);
      expect(afterUpload.isLocked).toBe(false);

      // and a whole further revision cycle is accepted again (0 -> 1 of 3)
      await creative.submitToApj(task.id);
      await creative.apjReview({
        taskId: task.id,
        status: ApprovalStatus.APPROVED,
        authorId: apjId,
        pin: '1234',
        ipAddress: null,
        versionId: uploaded.id,
      });
      const afterRevision = await clientRequestRevision(
        task.id,
        uploaded.id,
        'one more after reopen',
      );
      expect(afterRevision.revisionCount).toBe(1);
      expect(afterRevision.isLocked).toBe(false);
    });

    it('requires a reason, and refuses to reopen a design that is not locked', async () => {
      const { task, versionId } = await makeTaskAtClient('noreason');
      await exhaustAllowance(task.id, versionId);

      const noReason = await creative
        .unlockTask({
          taskId: task.id,
          action: 'CHARGE',
          userId: directorId,
        })
        .catch((e) => e);
      expect(reasonOf(noReason)).toBe(REOPEN_REASON_REQUIRED);

      await creative.unlockTask({
        taskId: task.id,
        action: 'CHARGE',
        userId: directorId,
        reason: 'ok',
      });
      const notLocked = await creative
        .unlockTask({
          taskId: task.id,
          action: 'CHARGE',
          userId: directorId,
          reason: 'again',
        })
        .catch((e) => e);
      expect(reasonOf(notLocked)).toBe(DESIGN_NOT_LOCKED);
    });

    it('lists only finalized designs, with the approved version attached', async () => {
      const finalized = await prisma.designTask.findFirstOrThrow({
        where: { isFinal: true, brief: { startsWith: TAG } },
      });

      const page = await creative.getFinalizedDesigns(1, 200);
      const ids = page.data.map((d) => d.id);

      expect(ids).toContain(finalized.id);
      const notFinalized = await prisma.designTask.findMany({
        where: { isFinal: false, brief: { startsWith: TAG } },
        select: { id: true },
      });
      expect(notFinalized.length).toBeGreaterThan(0);
      for (const d of notFinalized) expect(ids).not.toContain(d.id);
    });
  });

  describe('BUS-RULE-112 — one permit expiry policy', () => {
    it('buckets at 0 / 30 / 90 and never calls an unknown expiry safe', () => {
      expect(permitExpiryBucket(daysFromNow(-1))).toBe('EXPIRED');
      expect(permitExpiryBucket(daysFromNow(0))).toBe('EXPIRED');
      expect(permitExpiryBucket(daysFromNow(1))).toBe('CRITICAL');
      expect(permitExpiryBucket(daysFromNow(30))).toBe('CRITICAL');
      expect(permitExpiryBucket(daysFromNow(31))).toBe('WARNING');
      expect(permitExpiryBucket(daysFromNow(90))).toBe('WARNING');
      expect(permitExpiryBucket(daysFromNow(91))).toBe('SAFE');
      expect(permitExpiryBucket(null)).toBe('NO_EXPIRY');
      expect(permitDaysLeft(null)).toBeNull();

      expect(permitAuditRisk(null)).toBe('DELAY_AUDIT');
      expect(permitAuditRisk(daysFromNow(-5))).toBe('CRITICAL');
      expect(permitAuditRisk(daysFromNow(10))).toBe('CRITICAL');
      expect(permitAuditRisk(daysFromNow(60))).toBe('DELAY_AUDIT');
      expect(permitAuditRisk(daysFromNow(400))).toBe('OK');
    });

    it('derives the permit audit risk at insert and respects a caller-supplied status', async () => {
      const staff = await prisma.legalStaff.create({
        data: { name: `${TAG} Legal` },
      });
      const base = {
        clientName: `${TAG} Corp`,
        category: 'Cosmetic',
        picId: staff.id,
        applicationDate: new Date(),
      };

      const noExpiry = await legality.createBpom({
        ...base,
        bpomId: `${TAG}-BPOM-1`,
        productName: `${TAG} NoExpiry`,
      });
      expect(noExpiry.auditRisk).toBe('DELAY_AUDIT');

      const alreadyExpired = await legality.createBpom({
        ...base,
        bpomId: `${TAG}-BPOM-2`,
        productName: `${TAG} Expired`,
        expiryDate: daysFromNow(-3),
      });
      expect(alreadyExpired.auditRisk).toBe('CRITICAL');

      const healthy = await legality.createBpom({
        ...base,
        bpomId: `${TAG}-BPOM-3`,
        productName: `${TAG} Healthy`,
        expiryDate: daysFromNow(400),
      });
      expect(healthy.auditRisk).toBe('OK');
      expect(healthy.status).toBe(LegalStatus.IN_PROGRESS);

      // a caller-supplied status is no longer overwritten by the insert
      const done = await legality.createBpom({
        ...base,
        bpomId: `${TAG}-BPOM-4`,
        productName: `${TAG} Done`,
        expiryDate: daysFromNow(400),
        status: LegalStatus.DONE,
      });
      expect(done.status).toBe(LegalStatus.DONE);

      const ids = [noExpiry.id, alreadyExpired.id, healthy.id, done.id];
      await prisma.legalTimelineLog.deleteMany({
        where: { recordId: { in: ids } },
      });
      await prisma.bpomRecord.deleteMany({
        where: { bpomId: { startsWith: `${TAG}-BPOM-` } },
      });
      await prisma.legalStaff.deleteMany({ where: { name: `${TAG} Legal` } });
    });

    it('uses the one policy everywhere, so a 75-day permit is WARNING not SAFE', async () => {
      const staff = await prisma.legalStaff.create({
        data: { name: `${TAG} LegalFeed` },
      });
      const soon = await legality.createHki({
        hkiId: `${TAG}-HKI-1`,
        brandName: `${TAG} Soon`,
        type: 'Merek',
        clientName: `${TAG} Corp`,
        picId: staff.id,
        applicationDate: new Date(),
        expiryDate: daysFromNow(75),
      });

      // the expiry feed: 75 days sits in WARNING under the 0/30/90 policy (the old
      // 30/60 computation called it SAFE)
      const feed = await legality.getExpiryData();
      const row = feed.warning.find((i) => i.id === soon.id);
      expect(row).toBeDefined();
      expect(row!.daysLeft).toBeGreaterThan(70);
      expect(feed.safe.find((i) => i.id === soon.id)).toBeUndefined();

      // the permit list: derived from the same policy, envelope unchanged
      const listed = (await legality.getPermits()).find(
        (p) => p.id === `${TAG}-HKI-1`,
      );
      expect(listed?.status).toBe('EXPIRING_SOON');

      await prisma.legalTimelineLog.deleteMany({ where: { recordId: soon.id } });
      await prisma.hkiRecord.deleteMany({
        where: { hkiId: { startsWith: `${TAG}-HKI-` } },
      });
      await prisma.legalStaff.deleteMany({
        where: { name: `${TAG} LegalFeed` },
      });
    });
  });
});
