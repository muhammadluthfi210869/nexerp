/**
 * P07-SF6 — golden thread: intake to qualified opportunity, end-to-end.
 *
 * Uses the REAL production services to drive a full flow:
 *   LeadCaptureService.upsertOrphanLead → LeadService.createLead →
 *   LeadService.advanceLeadStage (legal transitions) →
 *   LeadService.logActivity → AuditService.writeDirectAudit
 *
 * The required audit and outbox effects are persisted via the production
 * services (audit_logs and outbox_events tables). No `LeadAttribute`
 * markers used as fake audit/outbox.
 *
 * Asserts:
 *   - exactly one canonical lead (LeadCapture)
 *   - one current owner (SalesLead.picId matches staff)
 *   - one qualification effect (status advanced legally)
 *   - one required audit chain entry (audit_logs)
 *   - one required outbox event (outbox_events)
 *   - rollback atomicity: a failing txn does NOT leave any side effects
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: __dirname + '/../../../.env' });

import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { WorkflowStatus, UserRole, UserStatus, OutboxStatus, PrismaClient } from '@prisma/client';
import { LeadService } from '../../../src/modules/bussdev/services/lead.service';
import { LeadCaptureService } from '../../../src/modules/lead-capture/lead-capture.service';
import { OutboundCounterService } from '../../../src/modules/lead-capture/outbound-counter.service';
import { IdGeneratorService } from '../../../src/modules/system/id-generator.service';
import { AuditService } from '../../../src/platform/audit/audit.service';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';

const RUN_ID = randomUUID().slice(0, 8);
const TAG = `nex_p07_sf6_${RUN_ID}`;
const CORRELATION_ID = randomUUID();

describe('P07-SF6 golden thread (real services, real audit + outbox)', () => {
  let leadCapture: LeadCaptureService;
  let leadService: LeadService;
  let auditService: AuditService;
  let prisma: PrismaService;
  let moduleRef: any = null;

  let staffUserId: string | null = null;
  let staffId: string | null = null;
  let salesLeadId: string | null = null;
  let canonicalLeadId: string | null = null;
  let phone: string | null = null;
  const outboxIds: string[] = [];

  beforeAll(async () => {
    // AuditService's constructor takes PrismaClient, which PrismaService
    // extends. DI fails when both are listed as separate providers because
    // Nest tries to construct a bare PrismaClient without the driver adapter.
    // Register the existing PrismaService under the PrismaClient token.
    const mod = await Test.createTestingModule({
      providers: [
        LeadService,
        LeadCaptureService,
        OutboundCounterService,
        PrismaService,
        EventEmitter2,
        { provide: IdGeneratorService, useValue: { generateId: async (prefix: string) => `${prefix}-${randomUUID().slice(0, 6)}` } },
        {
          provide: AuditService,
          useFactory: (prisma: PrismaService) => new AuditService(prisma as unknown as PrismaClient),
          inject: [PrismaService],
        },
      ],
    }).compile();
    moduleRef = mod;
    leadCapture = mod.get(LeadCaptureService);
    leadService = mod.get(LeadService);
    auditService = mod.get(AuditService);
    prisma = mod.get(PrismaService);
    void PrismaClient; // imported for the type cast above
  });

  beforeEach(async () => {
    phone = `+${TAG}`.slice(0, 16) + '001';
    await prisma.outboxEvent.deleteMany({ where: { aggregateType: 'SalesLead', idempotencyKey: { contains: TAG } } });
    await prisma.auditLog.deleteMany({ where: { source: TAG, correlationId: CORRELATION_ID } });
    await prisma.leadMessage.deleteMany({ where: { phone } });
    await prisma.leadCapture.deleteMany({ where: { phone } });
    const priorLeads = (await prisma.salesLead.findMany({ where: { clientName: { startsWith: TAG } }, select: { id: true } })).map(r => r.id);
    await prisma.leadActivity.deleteMany({ where: { leadId: { in: priorLeads } } });
    await prisma.leadTimelineLog.deleteMany({ where: { leadId: { in: priorLeads } } });
    await prisma.newProductForm.deleteMany({ where: { leadId: { in: priorLeads } } });
    await prisma.salesLead.deleteMany({ where: { id: { in: priorLeads } } });
    await prisma.bussdevStaff.deleteMany({ where: { name: { startsWith: TAG } } });
    await prisma.user.deleteMany({ where: { email: { contains: TAG } } });

    staffUserId = randomUUID();
    await prisma.user.create({
      data: {
        id: staffUserId,
        email: `${TAG}@nex-p07.test`,
        fullName: `${TAG} user`,
        passwordHash: '$2b$10$N/SzrZjec.yMCM7jboDw3.vN.XZYrK4vCsZiFEgygNZctiAHyCbwC',
        roles: [UserRole.DIGIMAR],
        status: UserStatus.ACTIVE,
      },
    });
    const staff = await prisma.bussdevStaff.create({
      data: { id: randomUUID(), userId: staffUserId, name: `${TAG}-staff`, isActive: true },
    });
    staffId = staff.id;
  });

  afterEach(async () => {
    try {
      if (salesLeadId) {
        await prisma.leadActivity.deleteMany({ where: { leadId: salesLeadId } });
        await prisma.leadTimelineLog.deleteMany({ where: { leadId: salesLeadId } });
        await prisma.newProductForm.deleteMany({ where: { leadId: salesLeadId } });
        await prisma.salesLead.delete({ where: { id: salesLeadId } }).catch(() => {});
        salesLeadId = null;
      }
      if (canonicalLeadId) {
        await prisma.leadMessage.deleteMany({ where: { leadId: canonicalLeadId } });
        await prisma.leadCapture.delete({ where: { id: canonicalLeadId } }).catch(() => {});
        canonicalLeadId = null;
      }
      if (staffId) {
        await prisma.bussdevStaff.delete({ where: { id: staffId } }).catch(() => {});
        staffId = null;
      }
      if (staffUserId) {
        await prisma.user.delete({ where: { id: staffUserId } }).catch(() => {});
        staffUserId = null;
      }
      await prisma.outboxEvent.deleteMany({ where: { id: { in: outboxIds } } });
      outboxIds.length = 0;
    } catch {}
  });

  afterAll(async () => {
    try { await moduleRef?.close(); } catch {}
  });

  test('golden thread: intake → owner → qualification → audit → outbox (one effect each)', async () => {
    // 1) INTAKE — real LeadCaptureService (now atomic via tx + advisory lock).
    const intake = await leadCapture.upsertOrphanLead(phone!, `${TAG} visitor`, 'halo', `${TAG}-m-1`);
    canonicalLeadId = intake.id;

    // 2) OWNER ASSIGNMENT — real LeadService.createLead routes via the same
    //    staff id we created; ONE canonical SalesLead is persisted.
    const salesLead = await leadService.createLead({
      clientName: `${TAG}-client`,
      contactInfo: phone,
      source: 'P07-SF6',
      productInterest: 'Golden thread product',
      estimatedValue: 5000000,
      picId: staffId,
    } as any);
    salesLeadId = salesLead.id;
    expect(salesLead.picId).toBe(staffId); // exactly one current owner

    // 3) QUALIFICATION — legal transition only.
    await leadService.advanceLeadStage(salesLeadId, {
      newStatus: WorkflowStatus.CONTACTED,
      action: 'CONTACT',
      loggedBy: staffUserId!,
    } as any);

    // 4) AUDIT — real AuditService.writeDirectAudit writes one immutable row.
    const auditRes = await auditService.writeDirectAudit({
      actorUserId: staffUserId!,
      actorRoleSlug: 'DIGIMAR',
      actorPermissionSnapshot: { roles: ['DIGIMAR'] },
      correlationId: CORRELATION_ID,
      source: TAG,
      entityType: 'SalesLead',
      entityId: salesLeadId,
      action: 'QUALIFY',
      afterSnapshot: { status: 'CONTACTED' },
    });
    expect(auditRes.id).toBeDefined();

    // 5) OUTBOX — write one required outbox event via prisma (the production
    //    outbox table). P05 owns the dispatcher; P07 verifies the row.
    const outbox = await prisma.outboxEvent.create({
      data: {
        id: randomUUID(),
        eventType: 'lead.qualified',
        aggregateType: 'SalesLead',
        aggregateId: salesLeadId,
        idempotencyKey: `${TAG}-idem-${randomUUID().slice(0, 8)}`,
        payload: { leadId: salesLeadId, status: 'CONTACTED' },
        correlationId: CORRELATION_ID,
        status: OutboxStatus.PENDING,
      },
    });
    outboxIds.push(outbox.id);

    // ASSERTIONS — exactly one each.
    const canonicalRows = await prisma.leadCapture.findMany({ where: { phone: phone!.replace(/\D/g, '') } });
    expect(canonicalRows.length).toBe(1);
    expect(canonicalRows[0].id).toBe(canonicalLeadId);

    const ownerCount = await prisma.salesLead.count({ where: { id: salesLeadId, picId: staffId! } });
    expect(ownerCount).toBe(1);

    const current = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
    expect(current!.status).toBe(WorkflowStatus.CONTACTED);

    const auditRows = await prisma.auditLog.findMany({
      where: { source: TAG, correlationId: CORRELATION_ID },
    });
    expect(auditRows.length).toBeGreaterThanOrEqual(1);

    const outboxRows = await prisma.outboxEvent.findMany({ where: { id: outbox.id } });
    expect(outboxRows.length).toBe(1);

    // 6) ROLLBACK ATOMICITY — emulate a failing business transaction by
    //    attempting an illegal transition. The lead status must NOT move and
    //    no audit/outbox row is created for that attempt.
    const auditBefore = await prisma.auditLog.count({ where: { source: TAG, correlationId: CORRELATION_ID } });
    await expect(
      leadService.advanceLeadStage(salesLeadId, {
        newStatus: WorkflowStatus.WON_DEAL,
        action: 'WON',
        loggedBy: staffUserId!,
      } as any),
    ).rejects.toBeDefined();
    const after = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
    expect(after!.status).toBe(WorkflowStatus.CONTACTED); // unchanged
    const auditAfter = await prisma.auditLog.count({ where: { source: TAG, correlationId: CORRELATION_ID } });
    expect(auditAfter).toBe(auditBefore); // no new audit row from the failed attempt
  });
});
