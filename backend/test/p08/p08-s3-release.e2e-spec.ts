import request from 'supertest';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ApprovalStatus, DesignState, Division, FormulaStatus, LegalStatus } from '@prisma/client';

import { bootP08App, p08Code, type P08App } from './p08-http-harness';
import {
  DESIGN_REVISION_BOUND_REACHED,
  DESIGN_VERSION_REQUIRED,
} from '../../src/modules/creative/creative.service';
import { FORMULA_LOCKED } from '../../src/modules/rnd/formulas/formulas.service';

/**
 * P08-S3 — Acceptance 3 and 4 over real HTTP (BUS-RULE-110..114, DEC-052/053/056).
 *
 *   1. rework clones to `version + 1` with the parent link, and the source stays
 *      read-only — a separate, auditable lineage entry that never rewrites it
 *   2. a design decision binds to an immutable artwork version, with segregated
 *      actors; the fourth revision hard-locks the design
 *   3. a reasoned supervisor reopen restarts the allowance; an unauthorized actor
 *      cannot reopen at all
 *   4. BPOM / HKI-Merek / Halal keep their issue and expiry dates in one consistent
 *      bucket policy, and an expired permit is never treated as valid
 *   5. a failing outbox between the business write and the audit/outbox commit
 *      rolls the whole governed write back with no partial effect
 *
 * Everything runs through the production Nest HTTP composition against the live
 * PostgreSQL named by `backend/.env`. The only override anywhere in this file is
 * in the last describe: an outbox stub used to inject a DOWNSTREAM PROVIDER
 * failure, because a rollback cannot be observed without a failing provider. No
 * business rule, role decision, transaction or persistence seam is replaced.
 *
 * audit_logs is append-only at the database level (audit_immutable trigger,
 * migration 20260918_p05_platform_controls), so this suite ASSERTS the audit chain
 * and never deletes it.
 */

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p08_s3_${RUN_ID}`;
const APJ_PIN = '7712';
const UPLOADS = path.resolve(__dirname, '..', '..', 'uploads', 'creative_assets');

describe('P08-S3 lineage, design bound and permit expiry (real HTTP, real PostgreSQL)', () => {
  let ctx: P08App;
  let prisma: P08App['prisma'];

  let leadId: string;
  let lead: any;
  let director: any;
  let apj: any;
  let commercial: any;
  let compliance: any;
  let rnd: any;
  let tDirector: string;
  let tApj: string;
  let tCommercial: string;
  let tCompliance: string;
  let tRnd: string;

  const taskIds: string[] = [];
  /**
   * Multer's disk storage writes the artwork BEFORE the controller reaches the
   * service, so an upload the hard lock REFUSES still leaves files behind that no
   * response body can name. The cleanup therefore works off a directory snapshot
   * taken in `beforeAll`, not off the responses.
   */
  let uploadsBefore: Set<string> = new Set();
  const permitIds: string[] = [];
  const sampleIds: string[] = [];
  const formulaIds: string[] = [];
  const legalStaffIds: string[] = [];
  const userIds: string[] = [];

  const server = () => ctx.app.getHttpServer();
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const createTask = (token: string, brief: string) =>
    request(server()).post('/creative/task').set(auth(token)).send({ leadId, brief });

  const uploadVersion = (token: string, taskId: string, label: string) =>
    request(server())
      .patch(`/creative/task/${taskId}/version`)
      .set(auth(token))
      .attach('artwork', Buffer.from(`%PDF-1.4 P08 S3 ${label}`), {
        filename: `${label}.ai`,
        contentType: 'application/postscript',
      })
      .attach('mockup', Buffer.from('P08'), {
        filename: `${label}.png`,
        contentType: 'image/png',
      });

  const submit = (token: string, taskId: string) =>
    request(server()).patch(`/creative/task/${taskId}/submit`).set(auth(token)).send({});

  const apjReview = (token: string, taskId: string, body: Record<string, unknown>) =>
    request(server()).patch(`/creative/task/${taskId}/apj-review`).set(auth(token)).send(body);

  const clientReview = (token: string, taskId: string, body: Record<string, unknown>) =>
    request(server()).patch(`/creative/task/${taskId}/client-review`).set(auth(token)).send(body);

  const unlock = (token: string, taskId: string, body: Record<string, unknown> = {}) =>
    request(server()).patch(`/creative/task/${taskId}/unlock`).set(auth(token)).send(body);

  const finalized = (token: string) =>
    request(server()).get('/creative/finalized').set(auth(token));

  /** Pass-through that keeps the upload response in the call chain readable. */
  function trackUpload(body: any) {
    return body;
  }

  /** A design task walked to WAITING_CLIENT with one APJ-approved version. */
  async function taskAtClient(label: string) {
    const created = await createTask(tDirector, `${TAG} ${label}`);
    expect(created.status).toBe(201);
    taskIds.push(created.body.id);

    const v1 = trackUpload((await uploadVersion(tDirector, created.body.id, `${label}-v1`)).body);
    expect((await submit(tDirector, created.body.id)).status).toBe(200);

    const approved = await apjReview(tApj, created.body.id, {
      status: ApprovalStatus.APPROVED,
      versionId: v1.id,
      pin: APJ_PIN,
    });
    expect([200, 201]).toContain(approved.status);
    expect(approved.body.kanbanState).toBe(DesignState.WAITING_CLIENT);
    return { taskId: created.body.id as string, v1 };
  }

  /** One whole production revision cycle, ending on a client revision request. */
  async function revisionRound(taskId: string, label: string) {
    const version = trackUpload((await uploadVersion(tDirector, taskId, label)).body);
    expect((await submit(tDirector, taskId)).status).toBe(200);
    const approved = await apjReview(tApj, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: version.id,
      pin: APJ_PIN,
    });
    expect([200, 201]).toContain(approved.status);
    const rejected = await clientReview(tCommercial, taskId, {
      status: ApprovalStatus.REJECTED,
      versionId: version.id,
      reason: `revision ${label}`,
    });
    expect([200, 201]).toContain(rejected.status);
    return rejected.body;
  }

  beforeAll(async () => {
    ctx = await bootP08App();
    prisma = ctx.prisma;
    uploadsBefore = new Set(fs.existsSync(UPLOADS) ? fs.readdirSync(UPLOADS) : []);

    const mkUser = async (label: string, roles: string[], extra: any = {}) => {
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `${TAG}.${label}@nex-p08.test`,
          fullName: `${TAG} ${label}`,
          passwordHash: '$2b$10$not-a-real-login-hash',
          roles: roles as any,
          status: 'ACTIVE' as any,
          ...extra,
        },
      });
      userIds.push(user.id);
      return user;
    };

    director = await mkUser('director', ['DIRECTOR']);
    apj = await mkUser('apj', ['APJ'], { approvalPin: bcrypt.hashSync(APJ_PIN, 4) });
    commercial = await mkUser('commercial', ['COMMERCIAL']);
    compliance = await mkUser('compliance', ['COMPLIANCE']);
    rnd = await mkUser('rnd', ['RND']);

    tDirector = ctx.tokenFor(director);
    tApj = ctx.tokenFor(apj);
    tCommercial = ctx.tokenFor(commercial);
    tCompliance = ctx.tokenFor(compliance);
    tRnd = ctx.tokenFor(rnd);

    const staff = await prisma.bussdevStaff.create({ data: { name: `${TAG} Staff` } });
    lead = await prisma.salesLead.create({
      data: {
        clientName: `${TAG} Corp`,
        contactInfo: `0817${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 S3 HTTP',
        picId: staff.id,
      },
    });
    leadId = lead.id;
  }, 240000);

  afterAll(async () => {
    try {
      const leadFilter = { clientName: `${TAG} Corp` };
      await prisma.outboxEvent.deleteMany({
        where: { aggregateId: { in: [...taskIds, ...formulaIds, ...sampleIds] } },
      });
      await prisma.designFeedback.deleteMany({ where: { taskId: { in: taskIds } } });
      await prisma.designVersion.deleteMany({ where: { taskId: { in: taskIds } } });
      await prisma.designTask.deleteMany({ where: { id: { in: taskIds } } });
      // a client approval auto-generates the design PO; it belongs to the fixture lead
      await prisma.purchaseOrder.deleteMany({ where: { lead: leadFilter } });
      await prisma.formulaItem.deleteMany({ where: { phase: { formulaId: { in: formulaIds } } } });
      await prisma.formulaPhase.deleteMany({ where: { formulaId: { in: formulaIds } } });
      await prisma.qCParameter.deleteMany({ where: { formulaId: { in: formulaIds } } });
      await prisma.formula.deleteMany({ where: { id: { in: formulaIds } } });
      await prisma.sampleStageLog.deleteMany({ where: { sampleRequestId: { in: sampleIds } } });
      await prisma.sampleRequest.deleteMany({ where: { id: { in: sampleIds } } });
      await prisma.legalTimelineLog.deleteMany({ where: { recordId: { in: permitIds } } });
      await prisma.bpomRecord.deleteMany({ where: { bpomId: { startsWith: `${TAG}-` } } });
      await prisma.hkiRecord.deleteMany({ where: { hkiId: { startsWith: `${TAG}-` } } });
      await prisma.halalRecord.deleteMany({ where: { halalId: { startsWith: `${TAG}-` } } });
      await prisma.legalStaff.deleteMany({ where: { name: `${TAG} Legal` } });
      // Filters are never left `undefined`: that would widen them to "every row".
      await prisma.salesLead.deleteMany({ where: leadFilter });
      await prisma.bussdevStaff.deleteMany({ where: { name: `${TAG} Staff` } });
      await prisma.user.deleteMany({ where: { email: { startsWith: `${TAG}.` } } });
    } finally {
      // Always close the app, and always sweep the upload directory: a leaked Nest
      // server keeps jest's event loop alive, and a refused upload still wrote files.
      for (const file of fs.existsSync(UPLOADS) ? fs.readdirSync(UPLOADS) : []) {
        if (uploadsBefore.has(file)) continue;
        try {
          fs.rmSync(path.join(UPLOADS, file), { force: true });
        } catch {
          /* the upload directory is not part of the acceptance */
        }
      }
      await ctx.app.close();
    }
  }, 120000);

  // ── 1 ─────────────────────────────────────────────────────────────────────
  it('1. rework clones to version + 1 with the parent link, and the source stays read-only', async () => {
    const sample = await prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-${TAG}-lineage`,
        leadId,
        productName: `${TAG} lineage`,
        targetFunction: 'Test',
        textureReq: 'A',
        colorReq: 'B',
        aromaReq: 'C',
        stage: 'FORMULATING' as any,
      },
    });
    sampleIds.push(sample.id);

    const formula = await prisma.formula.create({
      data: {
        formulaCode: `F-${TAG}-lineage`,
        sampleRequestId: sample.id,
        targetYieldGram: 1000,
        version: 1,
        status: FormulaStatus.DRAFT,
        phases: {
          create: {
            prefix: 'A',
            customName: 'Phase A',
            order: 1,
            items: {
              createMany: {
                data: [
                  { dosagePercentage: 20, costSnapshot: 100 },
                  { dosagePercentage: 80, costSnapshot: 100 },
                ],
              },
            },
          },
        },
      },
      include: { phases: { include: { items: true } } },
    });
    formulaIds.push(formula.id);
    const parentItemsBefore = await prisma.formulaItem.findMany({
      where: { phase: { formulaId: formula.id } },
      orderBy: { dosagePercentage: 'asc' },
    });

    const revision = await request(server())
      .post(`/rnd/formulas/${formula.id}/revision`)
      .set(auth(tRnd))
      .send({});
    expect([200, 201]).toContain(revision.status);
    formulaIds.push(revision.body.id);

    expect(revision.body.version).toBe(2);
    expect(revision.body.id).not.toBe(formula.id);
    expect(revision.body.status).toBe(FormulaStatus.DRAFT);

    // the parent's version and its item rows are untouched; only its flag moved
    const parentAfter = await prisma.formula.findUniqueOrThrow({ where: { id: formula.id } });
    expect(parentAfter.version).toBe(1);
    expect(Number(parentAfter.targetYieldGram)).toBe(1000);
    expect(parentAfter.status).toBe(FormulaStatus.SUPERSEDED);
    const parentItemsAfter = await prisma.formulaItem.findMany({
      where: { phase: { formulaId: formula.id } },
      orderBy: { dosagePercentage: 'asc' },
    });
    expect(parentItemsAfter.map((i) => i.id)).toEqual(parentItemsBefore.map((i) => i.id));

    // the copy carries the composition forward
    const revisionItems = await prisma.formulaItem.findMany({
      where: { phase: { formulaId: revision.body.id } },
      orderBy: { dosagePercentage: 'asc' },
    });
    expect(revisionItems.map((i) => Number(i.dosagePercentage))).toEqual([20, 80]);

    // the adjustment is its own auditable ledger entry naming its parent
    const audits = await prisma.auditLog.findMany({
      where: {
        entityType: 'Formula',
        entityId: revision.body.id,
        action: 'CREATE_FORMULA_REVISION',
      },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].actorUserId).toBe(rnd.id);
    expect((audits[0].beforeSnapshot as any).parent_version).toBe(1);
    expect((audits[0].beforeSnapshot as any).parent_formula_id).toBe(formula.id);

    // and the superseded source is now frozen history over HTTP
    const refused = await request(server())
      .patch(`/rnd/formulas/${formula.id}`)
      .set(auth(tRnd))
      .send({
        targetYieldGram: 1000,
        phases: [
          { prefix: 'A', order: 1, items: [{ dosagePercentage: 50, costSnapshot: 1 }, { dosagePercentage: 50, costSnapshot: 1 }] },
        ],
      });
    expect(refused.status).toBe(400);
    expect(p08Code(refused.body)).toBe(FORMULA_LOCKED);
    expect(
      (await prisma.formulaItem.findMany({ where: { phase: { formulaId: formula.id } } })).map((i) => i.id),
    ).toEqual(parentItemsBefore.map((i) => i.id));
  }, 120000);

  // ── 2 ─────────────────────────────────────────────────────────────────────
  it('2. a decision binds to the artwork version on the table, and the actors are segregated', async () => {
    const created = await createTask(tDirector, `${TAG} bound`);
    expect(created.status).toBe(201); // DIRECTOR is the canonical creative writer
    const taskId = created.body.id;
    taskIds.push(taskId);

    const v1 = trackUpload((await uploadVersion(tDirector, taskId, 'bound-v1')).body);
    expect((await submit(tDirector, taskId)).status).toBe(200);

    // the APJ decision is refused for a role without the canonical permission
    const wrongRole = await apjReview(tCommercial, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: v1.id,
      pin: APJ_PIN,
    });
    expect(wrongRole.status).toBe(403);
    expect(
      await prisma.designFeedback.count({ where: { taskId, approvalStatus: ApprovalStatus.APPROVED } }),
    ).toBe(0);

    // a wrong PIN is refused by the real e-signature check
    const wrongPin = await apjReview(tApj, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: v1.id,
      pin: '0000',
    });
    expect(wrongPin.status).toBe(400);

    const approved = await apjReview(tApj, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: v1.id,
      pin: APJ_PIN,
    });
    expect([200, 201]).toContain(approved.status);
    expect(approved.body.kanbanState).toBe(DesignState.WAITING_CLIENT);

    // a decision that names no version is refused, and writes no feedback
    const noVersion = await clientReview(tCommercial, taskId, {
      status: ApprovalStatus.APPROVED,
    });
    expect(noVersion.status).toBe(400);
    expect(p08Code(noVersion.body)).toBe(DESIGN_VERSION_REQUIRED);
    expect(await prisma.designFeedback.count({ where: { taskId } })).toBe(1); // only the APJ row

    // the client decision is refused for the APJ role — the actors are segregated
    const crossRole = await clientReview(tApj, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: v1.id,
    });
    expect(crossRole.status).toBe(403);
  }, 120000);

  // ── 3 ─────────────────────────────────────────────────────────────────────
  it('3. a stale artwork version cannot be approved once a newer one is on the table', async () => {
    const { taskId, v1 } = await taskAtClient('stale');

    const firstRound = await clientReview(tCommercial, taskId, {
      status: ApprovalStatus.REJECTED,
      versionId: v1.id,
      reason: 'revision 1',
    });
    expect([200, 201]).toContain(firstRound.status);
    expect(firstRound.body.revisionCount).toBe(1);

    const v2 = trackUpload((await uploadVersion(tDirector, taskId, 'stale-v2')).body);
    expect((await submit(tDirector, taskId)).status).toBe(200);
    const approved = await apjReview(tApj, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: v2.id,
      pin: APJ_PIN,
    });
    expect([200, 201]).toContain(approved.status);

    // V1 is no longer the version on the table, so it cannot be decided on
    const feedbackBefore = await prisma.designFeedback.count({ where: { taskId } });
    const stale = await clientReview(tCommercial, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: v1.id,
    });
    expect(stale.status).toBe(400);
    expect(p08Code(stale.body)).toBe(DESIGN_VERSION_REQUIRED);
    expect(await prisma.designFeedback.count({ where: { taskId } })).toBe(feedbackBefore);
    expect((await prisma.designTask.findUniqueOrThrow({ where: { id: taskId } })).isFinal).toBe(false);

    // V2 is, and it finalizes the design
    const final = await clientReview(tCommercial, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: v2.id,
      notes: 'Client signed the artwork off',
    });
    expect([200, 201]).toContain(final.status);
    expect(final.body.kanbanState).toBe(DesignState.LOCKED);
    expect(final.body.isFinal).toBe(true);
    expect(final.body.finalArtworkUrl).toBe(v2.artworkUrl);

    // the approved version is a stored fact, not a guess from ordering
    // the client decision, not the APJ decision that approved the same version
    const feedback = await prisma.designFeedback.findFirstOrThrow({
      where: {
        taskId,
        approvalStatus: ApprovalStatus.APPROVED,
        versionId: v2.id,
        fromDivision: Division.BD,
      },
    });
    expect(feedback.versionId).toBe(v2.id);
    expect(feedback.authorId).toBe(commercial.id);

    // a duplicate decision on the finalized design is refused with no second effect
    const duplicate = await clientReview(tCommercial, taskId, {
      status: ApprovalStatus.APPROVED,
      versionId: v2.id,
    });
    expect(duplicate.status).toBe(400);
    expect(
      await prisma.auditLog.count({
        where: { entityType: 'DesignTask', entityId: taskId, action: 'CLIENT_APPROVE_DESIGN' },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({ where: { aggregateId: taskId, eventType: 'design.finalized' } }),
    ).toBe(1);

    // and it is on the one finalized-designs page, with its approved version
    const page = await finalized(tCommercial);
    expect(page.status).toBe(200);
    const row = page.body.data.find((d: any) => d.id === taskId);
    expect(row).toBeDefined();
    expect(row.approvedVersion?.id).toBe(v2.id);
    expect(row.versions.length).toBe(2);
    expect(row.isFinal).toBe(true);
  }, 150000);

  // ── 4 ─────────────────────────────────────────────────────────────────────
  it('4. the fourth revision hard-locks, an unauthorized reopen is refused, and a reasoned reopen restarts', async () => {
    const { taskId, v1 } = await taskAtClient('bound3');

    const first = await clientReview(tCommercial, taskId, {
      status: ApprovalStatus.REJECTED,
      versionId: v1.id,
      reason: 'revision 1',
    });
    expect(first.body.revisionCount).toBe(1);
    expect(first.body.isLocked).toBe(false);

    const second = await revisionRound(taskId, 'bound3-r2');
    expect(second.revisionCount).toBe(2);
    expect(second.isLocked).toBe(false);

    const third = await revisionRound(taskId, 'bound3-r3');
    expect(third.revisionCount).toBe(3);
    expect(third.isLocked).toBe(true);

    // THE FOURTH REVISION — the hard lock closes the upload path
    const pastBound = await uploadVersion(tDirector, taskId, 'bound3-r4');
    expect(pastBound.status).toBe(400);
    expect(p08Code(pastBound.body)).toBe(DESIGN_REVISION_BOUND_REACHED);
    const afterBound = await prisma.designTask.findUniqueOrThrow({
      where: { id: taskId },
      include: { versions: true },
    });
    expect(afterBound.versions).toHaveLength(3);
    expect(afterBound.revisionCount).toBe(3);

    // an unauthorized actor cannot reopen — refused by the canonical role gate
    // before any service work happens
    const unauthorized = await unlock(tCommercial, taskId, {
      action: 'CHARGE',
      reason: 'let me continue',
    });
    expect(unauthorized.status).toBe(403);
    const stillLocked = await prisma.designTask.findUniqueOrThrow({ where: { id: taskId } });
    expect(stillLocked.isLocked).toBe(true);
    expect(stillLocked.revisionCount).toBe(3);
    expect(
      await prisma.auditLog.count({
        where: { entityType: 'DesignTask', entityId: taskId, action: 'SUPERVISOR_REOPEN_DESIGN' },
      }),
    ).toBe(0);

    // a reopen with no reason is refused by the service
    const noReason = await unlock(tDirector, taskId, { action: 'CHARGE' });
    expect(noReason.status).toBe(400);
    expect(
      await prisma.designTask.findUniqueOrThrow({ where: { id: taskId } }),
    ).toMatchObject({ isLocked: true, revisionCount: 3 });

    // the reasoned supervisor reopen resets the allowance and records history
    const reason = 'Client changed the brand direction';
    const reopened = await unlock(tDirector, taskId, { action: 'CHARGE', reason });
    expect([200, 201]).toContain(reopened.status);
    expect(reopened.body.revisionCount).toBe(0);
    expect(reopened.body.isLocked).toBe(false);

    const reopenAudits = await prisma.auditLog.findMany({
      where: { entityType: 'DesignTask', entityId: taskId, action: 'SUPERVISOR_REOPEN_DESIGN' },
    });
    expect(reopenAudits).toHaveLength(1);
    expect(reopenAudits[0].actorUserId).toBe(director.id);
    expect((reopenAudits[0].beforeSnapshot as any).revisionCount).toBe(3);
    expect((reopenAudits[0].afterSnapshot as any).revisionCount).toBe(0);
    expect(
      await prisma.outboxEvent.count({ where: { aggregateId: taskId, eventType: 'design.reopened' } }),
    ).toBe(1);
    expect(
      await prisma.designFeedback.count({ where: { taskId, content: reason } }),
    ).toBe(1);

    // and the reset survives the next upload — a whole revision cycle is accepted again
    const next = trackUpload((await uploadVersion(tDirector, taskId, 'bound3-r5')).body);
    const afterUpload = await prisma.designTask.findUniqueOrThrow({ where: { id: taskId } });
    expect(afterUpload.revisionCount).toBe(0);
    expect(afterUpload.isLocked).toBe(false);
    expect((await submit(tDirector, taskId)).status).toBe(200);
    expect(
      (
        await apjReview(tApj, taskId, {
          status: ApprovalStatus.APPROVED,
          versionId: next.id,
          pin: APJ_PIN,
        })
      ).status,
    ).toBeLessThan(300);
    const afterRevision = await clientReview(tCommercial, taskId, {
      status: ApprovalStatus.REJECTED,
      versionId: next.id,
      reason: 'one more after reopen',
    });
    expect(afterRevision.body.revisionCount).toBe(1);
    expect(afterRevision.body.isLocked).toBe(false);

    // a design that never finalized is absent from the finalized-designs page
    const page = await finalized(tCommercial);
    expect(page.body.data.map((d: any) => d.id)).not.toContain(taskId);
  }, 180000);

  // ── 5 ─────────────────────────────────────────────────────────────────────
  it('5. BPOM / HKI / Halal keep issue and expiry in one policy, and an expired permit is never valid', async () => {
    const legalStaff = await prisma.legalStaff.create({ data: { name: `${TAG} Legal` } });
    legalStaffIds.push(legalStaff.id);

    const daysFromNow = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    const denied = await request(server())
      .post('/legality/bpom')
      .set(auth(tRnd))
      .send({});
    expect(denied.status).toBe(403);

    const issue = new Date();
    const bpom = await request(server())
      .post('/legality/bpom')
      .set(auth(tCompliance))
      .send({
        clientName: `${TAG} Corp`,
        category: 'Cosmetic',
        picId: legalStaff.id,
        applicationDate: issue,
        bpomId: `${TAG}-BPOM`,
        productName: `${TAG} Serum`,
        expiryDate: daysFromNow(75),
      });
    expect([200, 201]).toContain(bpom.status);
    permitIds.push(bpom.body.id);

    const hki = await request(server())
      .post('/legality/hki')
      .set(auth(tCompliance))
      .send({
        clientName: `${TAG} Corp`,
        picId: legalStaff.id,
        applicationDate: issue,
        hkiId: `${TAG}-HKI`,
        brandName: `${TAG} Brand`,
        type: 'Merek',
        expiryDate: daysFromNow(-2),
      });
    expect([200, 201]).toContain(hki.status);
    permitIds.push(hki.body.id);

    const halal = await request(server())
      .post('/legality/halal')
      .set(auth(tCompliance))
      .send({
        picId: legalStaff.id,
        applicationDate: issue,
        category: 'Cosmetic',
        halalId: `${TAG}-HALAL`,
        productName: `${TAG} Serum`,
        manufacturer: `${TAG} Corp`,
      });
    expect([200, 201]).toContain(halal.status);
    permitIds.push(halal.body.id);

    // the issue date and the expiry are both kept, and the risk is derived
    expect(new Date(bpom.body.applicationDate).getTime()).toBeCloseTo(issue.getTime(), -3);
    expect(bpom.body.expiryDate).not.toBeNull();
    expect(bpom.body.auditRisk).toBe('DELAY_AUDIT');
    expect(hki.body.auditRisk).toBe('CRITICAL');
    expect(halal.body.expiryDate).toBeNull();
    expect(halal.body.auditRisk).toBe('DELAY_AUDIT'); // no expiry on file is not "OK"
    expect(bpom.body.status).toBe(LegalStatus.IN_PROGRESS);

    // one expiry policy, on the feed …
    const feed = await request(server()).get('/legality/expiry').set(auth(tCompliance));
    expect(feed.status).toBe(200);
    const warning = feed.body.warning.find((i: any) => i.id === bpom.body.id);
    expect(warning).toBeDefined();
    expect(warning.daysLeft).toBeGreaterThan(70);
    expect(feed.body.expired.find((i: any) => i.id === hki.body.id)).toBeDefined();
    // an unknown expiry is absent from the feed rather than treated as expiring
    expect(feed.body.nearestExpiring.find((i: any) => i.id === halal.body.id)).toBeUndefined();
    expect(feed.body.summary.expired).toBeGreaterThanOrEqual(1);

    // … and the same policy on the permit view the UI reads
    const permits = await request(server()).get('/legality/permits').set(auth(tCompliance));
    expect(permits.status).toBe(200);
    const bpomRow = permits.body.find((p: any) => p.id === `${TAG}-BPOM`);
    const hkiRow = permits.body.find((p: any) => p.id === `${TAG}-HKI`);
    const halalRow = permits.body.find((p: any) => p.id === `${TAG}-HALAL`);
    expect(bpomRow.status).toBe('EXPIRING_SOON');
    // THE ADVERSARIAL CASE — a permit read past its expiry is never "valid"
    expect(hkiRow.status).toBe('EXPIRED');
    expect(hkiRow.expiry).toBe(daysFromNow(-2).toISOString().split('T')[0]);
    // no expiry on file is not silently ACTIVE-by-expiry either; it is simply not expiring
    expect(halalRow.expiry).toBe('N/A');
    expect(halalRow.status).toBe('ACTIVE');
  }, 120000);
});

/**
 * The rollback proof. An outbox that cannot reach its downstream provider is the
 * one thing that cannot be observed on the happy path, so it is injected here —
 * at the PROVIDER boundary, never inside a business rule, role decision,
 * transaction or persistence seam. Everything else, including the audit chain and
 * the sample row, is the production implementation against real PostgreSQL.
 */
describe('P08-S3 rollback: a provider failure between the write and the commit', () => {
  let app: any;
  let prisma: P08App['prisma'];
  let sampleId: string;
  let leadId: string;
  let tokenRnd: string;
  let tokenFinance: string;
  const userIds: string[] = [];

  beforeAll(async () => {
    const { Test } = await import('@nestjs/testing');
    const { ValidationPipe, INestApplication } = await import('@nestjs/common');
    const { AppModule } = await import('../../src/app.module');
    const { PrismaService } = await import('../../src/prisma/prisma/prisma.service');
    const { PlatformConfig } = await import('../../src/platform/config/config.module');
    const { OutboxService } = await import('../../src/platform/outbox/outbox.service');
    const { validationExceptionFactory } = await import(
      '../../src/common/validation/validation-error.factory'
    );

    const failingOutbox = {
      enqueue: jest.fn().mockRejectedValue(new Error('OUTBOX_DOWNSTREAM_FAILURE: simulated')),
      computeIdempotencyKey: () => 'x',
    };

    const fixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PlatformConfig)
      .useValue(
        PlatformConfig.fromValues({
          jwtSecret: process.env.JWT_SECRET!,
          mfaEncryptionKey: process.env.AES_SECRET_KEY!,
        }),
      )
      .overrideProvider(OutboxService)
      .useValue(failingOutbox)
      .compile();

    app = fixture.createNestApplication();
    (app as InstanceType<typeof INestApplication>).useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const tag = `nex_p08_s3rb_${RUN_ID}`;
    const mkUser = async (label: string, roles: string[]) => {
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: `${tag}.${label}@nex-p08.test`,
          fullName: `${tag} ${label}`,
          passwordHash: '$2b$10$not-a-real-login-hash',
          roles: roles as any,
          status: 'ACTIVE' as any,
        },
      });
      userIds.push(user.id);
      return user;
    };
    const rnd = await mkUser('rnd', ['RND']);
    const finance = await mkUser('finance', ['FINANCE']);
    tokenRnd = ctxToken(rnd);
    tokenFinance = ctxToken(finance);

    const staff = await prisma.bussdevStaff.create({ data: { name: `${tag} Staff` } });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `${tag} Corp`,
        contactInfo: `0816${RUN_ID}`,
        source: 'GOOGLE',
        productInterest: 'P08 S3 rollback',
        picId: staff.id,
      },
    });
    leadId = lead.id;

    const created = await request(app.getHttpServer())
      .post('/rnd/samples')
      .set({ Authorization: `Bearer ${tokenRnd}` })
      .send({
        leadId,
        productName: `${tag} sample`,
        targetFunction: 'Test',
        textureReq: 'A',
        colorReq: 'B',
        aromaReq: 'C',
      });
    expect(created.status).toBe(201);
    sampleId = created.body.id;

    function ctxToken(user: any) {
      return jwt.sign(
        { sub: user.id, email: user.email, roles: user.roles },
        process.env.JWT_SECRET!,
      );
    }
  }, 240000);

  afterAll(async () => {
    try {
      const tag = `nex_p08_s3rb_${RUN_ID}`;
      await prisma.outboxEvent.deleteMany({
        where: { aggregateId: { in: [sampleId, leadId].filter(Boolean) as string[] } },
      });
      await prisma.sampleStageLog.deleteMany({ where: { sampleRequestId: { in: [sampleId].filter(Boolean) as string[] } } });
      await prisma.sampleRequest.deleteMany({ where: { id: { in: [sampleId].filter(Boolean) as string[] } } });
      // Filters are never left `undefined`: that would widen them to "every row".
      await prisma.salesLead.deleteMany({ where: { clientName: `${tag} Corp` } });
      await prisma.bussdevStaff.deleteMany({ where: { name: `${tag} Staff` } });
      await prisma.user.deleteMany({ where: { email: { startsWith: `${tag}.` } } });
    } finally {
      await app.close();
    }
  }, 120000);

  it('the governed verify-payment write rolls back with zero partial audit or outbox effect', async () => {
    const before = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sampleId } });
    expect(before.stage).toBe('WAITING_FINANCE');

    const res = await request(app.getHttpServer())
      .post(`/rnd/sample/${sampleId}/verify-payment`)
      .set({ Authorization: `Bearer ${tokenFinance}` })
      .send({ note: 'this must not survive' });

    expect(res.status).toBe(500);

    // the money-path write, its audit row and its outbox event all rolled back
    const after = await prisma.sampleRequest.findUniqueOrThrow({ where: { id: sampleId } });
    expect(after.stage).toBe('WAITING_FINANCE');
    expect(after.paymentApprovedAt).toBeNull();
    expect(after.paymentApprovedById).toBeNull();
    expect(await prisma.auditLog.count({ where: { entityId: sampleId } })).toBe(0);
    expect(await prisma.outboxEvent.count({ where: { aggregateId: sampleId } })).toBe(0);

    // and no stage log was appended either
    expect(await prisma.sampleStageLog.count({ where: { sampleRequestId: sampleId } })).toBe(1);
  }, 90000);
});
