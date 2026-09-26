import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { CreateSampleRequestDto } from './dto/create-sample-request.dto';
import { CreateSampleDto } from './dto/create-sample.dto';
import { CreateNPFDto } from './dto/create-npf.dto';
import { AdvanceSampleDto } from './dto/advance-sample-request.dto';
import {
  SampleStage,
  WorkflowStatus,
  Division,
  StreamEventType,
  UserRole,
  RevisionStatus,
} from '@prisma/client';
import type { SampleRequest, Formula } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT } from '../activity-stream/events/activity.events';

import { IdGeneratorService } from '../system/id-generator.service';
import { StateTransitionService } from '../system/state-transition.service';
import { AuditService } from '../../platform/audit/audit.service';
import { OutboxService } from '../../platform/outbox/outbox.service';

/** Canonical error codes for the sample-fee gate (BUS-RULE-107). */
export const SAMPLE_FEE_NOT_VERIFIED = 'SAMPLE_FEE_NOT_VERIFIED';
export const SAMPLE_NOT_AWAITING_FINANCE = 'SAMPLE_NOT_AWAITING_FINANCE';

/** Event names emitted on the sample-fee path (08_INTEGRATION_EVENT_CONTRACT.yaml). */
export const EVENT_SAMPLE_PAYMENT_REQUESTED = 'sample.payment_requested';
export const EVENT_SAMPLE_PAYMENT_VERIFIED = 'sample.payment_verified';
export const EVENT_SAMPLE_PAYMENT_REJECTED = 'sample.payment_rejected';

/**
 * Fase 3a — P08 tenant scope (DEC-2026-09-20-059 LOCKED).
 *
 * The P08 tables carry no `organizationId` column, and none is added: the
 * canonically locked rule is that the P08 chain's tenant is read through its
 * PARENT LEAD. `SampleRequest.lead` is a required relation and
 * `SalesLead.organizationId` exists, so `where: { lead: { organizationId } }`
 * filters the P08 slice with zero DDL.
 *
 * The actor's tenant is the trusted `req.user.organizationId` (from the verified
 * JWT, `jwt.strategy.ts:60`). It is NEVER read from the body, query or headers.
 */
export interface RndActorContext {
  userId?: string;
  organizationId?: string;
  roles?: string[];
  /**
   * `true` on every context built from a verified HTTP request; absent for the
   * in-process callers (`test/*.e2e-spec.ts`, seeds, jobs) that hold no tenant
   * identity. It gates ONLY the `TENANT_UNRESOLVED` refusal on the blanket
   * reads — never the tenant predicate. A context that carries a tenant is
   * always scoped, enforced or not.
   */
  enforce?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * The trusted actor context of a request, built only from `req.user`.
 * Mirrors `P07ActorContext` in `bussdev/services/lead.service.ts` so both
 * modules resolve tenant identity the same way.
 */
export function rndActorFromRequest(req: any): RndActorContext {
  const user = req?.user ?? {};
  return {
    userId: user.id,
    organizationId: user.organizationId || user.tenantId,
    roles: Array.isArray(user.roles) ? user.roles : [],
    enforce: true,
  };
}

@Injectable()
export class RndService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    private stateTransition: StateTransitionService,
    private audit: AuditService,
    private outbox: OutboxService,
  ) {}

  /**
   * The sample-fee gate (BUS-RULE-107 / DEC-2026-09-20-051).
   *
   * One guard on the shared path: every route that would start formulation must
   * pass through here, so no caller can re-introduce the auto-approval that used
   * to live in `acceptSample`. Finance verification is the ONLY writer of
   * `paymentApprovedAt` / `paymentApprovedById`.
   */
  private assertSampleFeeVerified(
    sample: { sampleCode: string; paymentApprovedAt: Date | null; paymentApprovedById: string | null },
  ): void {
    if (!sample.paymentApprovedAt || !sample.paymentApprovedById) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Pembayaran sample belum diverifikasi Finance. Formulasi tidak dapat dimulai untuk ${sample.sampleCode}.`,
        reason_code: SAMPLE_FEE_NOT_VERIFIED,
      });
    }
  }

  // ── Tenant scope (Fase 3a / DEC-2026-09-20-059) ─────────────────────────────

  /**
   * Resolves the caller's tenant from the server-side context only.
   *
   * An unresolved tenant is NOT treated as "every tenant" — that fail-open is
   * exactly the shape this guards against. A missing claim is a bad request
   * (`TENANT_UNRESOLVED`), so the caller learns its context is incomplete
   * instead of silently reading across organizations.
   *
   * There is deliberately no "allocate a fresh tenant" branch: a P08 row has no
   * `organizationId` of its own, so a made-up tenant could never match its
   * parent Lead and every create would be dead on arrival.
   */
  private resolveTenant(actor: RndActorContext | undefined): string {
    const orgId = actor?.organizationId;
    if (typeof orgId === 'string' && UUID_RE.test(orgId)) return orgId;
    throw new BadRequestException({
      code: 'TENANT_UNRESOLVED',
      message: 'Tenant wajib diisi dari konteks server.',
    });
  }

  /**
   * The tenant predicate for a request, or `{}` when the caller carries no
   * tenant at all.
   *
   * `{}` is not fail-open by accident: Prisma drops an empty `where`, which is
   * exactly the pre-Fase-3a behaviour, and the only callers without a tenant are
   * in-process ones that never crossed the HTTP boundary. A request with a
   * tenant claim is always scoped — `enforce` cannot loosen that.
   */
  private scopeWhere(actor: RndActorContext | undefined): Record<string, any> {
    const orgId = actor?.organizationId;
    if (typeof orgId === 'string' && UUID_RE.test(orgId)) {
      return this.tenantWhere(orgId);
    }
    if (actor?.enforce) this.resolveTenant(actor);
    return {};
  }

  /** Refuses a read that a verified request cannot be trusted to scope. */
  private assertTenantResolved(actor: RndActorContext | undefined): void {
    if (actor?.enforce) this.resolveTenant(actor);
  }

  /** The Prisma predicate that scopes a P08 row to its parent Lead's tenant. */
  private tenantWhere(organizationId: string) {
    return { lead: { organizationId } };
  }

  /** `scopeWhere` re-rooted at a related model the caller is keyed by. */
  private scopeWhereAt(
    actor: RndActorContext | undefined,
    root: 'sampleRequest' | 'formula',
  ): Record<string, any> {
    const lead = this.scopeWhere(actor);
    if (Object.keys(lead).length === 0) return {};
    return root === 'sampleRequest'
      ? { sampleRequest: lead }
      : { formula: { sampleRequest: lead } };
  }

  /** Non-disclosing refusal: cross-tenant reads and writes look alike. */
  private refuseCrossTenant(): never {
    throw new ForbiddenException({
      code: 'TENANT_ISOLATION_VIOLATION',
      message: 'Tenant isolation violation',
    });
  }

  /**
   * Loads one P08 row under the actor's tenant, refusing cross-tenant access.
   *
   * `loader` is called with the tenant predicate merged in, so a foreign bare id
   * simply does not match — the same query that returns the owner's row returns
   * nothing for tenant B, and the refusal discloses nothing about existence.
   */
  private async readScopedByLead<T>(
    actor: RndActorContext | undefined,
    loader: (where: any) => Promise<T | null>,
  ): Promise<T | null> {
    const scoped = await loader(this.scopeWhere(actor));
    if (!scoped && actor?.organizationId) this.refuseCrossTenant();
    return scoped;
  }

  /** Refuses a read of a child collection whose parent Sample is another tenant's. */
  private async assertParentSampleVisible(
    sampleId: string,
    actor: RndActorContext | undefined,
  ): Promise<void> {
    const scope = this.scopeWhere(actor);
    if (Object.keys(scope).length === 0) return;
    const own = await this.prisma.sampleRequest.findFirst({
      where: { id: sampleId, ...scope },
      select: { id: true },
    });
    if (!own) this.refuseCrossTenant();
  }

  /** Asserts a P08 row's parent Lead belongs to the actor's tenant. */
  private async assertSampleInTenant(
    tx: any,
    sample: { id: string; leadId: string } | null,
    actor: RndActorContext | undefined,
  ) {
    if (!sample) throw new NotFoundException('Sample request not found');
    const orgId = actor?.organizationId;
    if (!(typeof orgId === 'string' && UUID_RE.test(orgId))) {
      this.assertTenantResolved(actor);
      return;
    }
    const lead = await tx.salesLead.findFirst({
      where: { id: sample.leadId, organizationId: orgId },
      select: { id: true },
    });
    if (!lead) this.refuseCrossTenant();
  }

  /** Asserts a formula's owning sample belongs to the actor's tenant. */
  private async assertFormulaInTenant(
    tx: any,
    formula: { id: string } | null,
    actor: RndActorContext | undefined,
  ) {
    if (!formula) throw new NotFoundException('Formula not found');
    const orgId = actor?.organizationId;
    if (!(typeof orgId === 'string' && UUID_RE.test(orgId))) {
      this.assertTenantResolved(actor);
      return;
    }
    const owned = await tx.formula.findFirst({
      where: { id: formula.id, sampleRequest: this.tenantWhere(orgId) },
      select: { id: true },
    });
    if (!owned) this.refuseCrossTenant();
  }

  async createSample(dto: CreateSampleRequestDto, actor?: RndActorContext) {
    const sampleCode = await this.idGenerator.generateId('SMP');
    return this.prisma.$transaction(async (tx) => {
      // The tenant of a P08 row is its parent Lead's, so a create can only be
      // honoured when the Lead belongs to the caller's organization. Without
      // this, any caller could plant a sample on another tenant's Lead.
      //
      // In-process callers with no actor (the gated P08 golden thread, seeds)
      // keep the pre-Fase-3a path: there is no tenant to check against, and the
      // HTTP boundary already refuses such a request with TENANT_UNRESOLVED.
      const orgId = actor?.organizationId;
      if (typeof orgId === 'string' && UUID_RE.test(orgId)) {
        const lead = await tx.salesLead.findFirst({
          where: { id: dto.leadId, organizationId: orgId },
          select: { id: true },
        });
        if (!lead) this.refuseCrossTenant();
      } else {
        this.assertTenantResolved(actor);
      }

      const sample = await tx.sampleRequest.create({
        data: {
          sampleCode: sampleCode,
          leadId: dto.leadId,
          productName: dto.productName,
          targetFunction: dto.targetFunction,
          textureReq: dto.textureReq,
          colorReq: dto.colorReq,
          aromaReq: dto.aromaReq,
          targetHpp: dto.targetHpp,
          targetDeadline: dto.targetDeadline
            ? new Date(dto.targetDeadline)
            : null,
          difficultyLevel: dto.difficultyLevel || 1,
          picId: dto.picId,
          // BUS-RULE-107: a new sample waits for Finance. It cannot reach
          // FORMULATING until the fee is verified, so it must not start in QUEUE.
          stage: SampleStage.WAITING_FINANCE,
          stageLogs: {
            create: {
              stage: SampleStage.WAITING_FINANCE,
              enteredAt: new Date(),
            },
          },
        },
      });

      // Emit Activity Log
      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: dto.leadId,
        senderDivision: Division.RND,
        eventType: StreamEventType.STATE_CHANGE,
        notes: `R&D memulai inisialisasi sampel: ${dto.productName}`,
        loggedBy: 'SYSTEM_RND',
      });

      await tx.leadTimelineLog.create({
        data: {
          leadId: dto.leadId,
          action: 'RND_INITIATED',
          notes: `R&D memulai inisialisasi sampel: ${dto.productName}`,
          loggedBy: 'SYSTEM_RND',
        },
      });

      return sample;
    });
  }

  async createFormulationSample(dto: CreateSampleDto, actor?: RndActorContext) {
    if (dto.rndId === '00000000-0000-0000-0000-000000000000') {
      const rndUser = await this.prisma.user.findFirst({
        where: { roles: { has: UserRole.RND } },
      });
      if (rndUser) dto.rndId = rndUser.id;
    }

    const npf = await this.prisma.newProductForm.findUnique({
      where: { id: dto.npfId },
      select: { leadId: true },
    });

    if (!npf || !npf.leadId) {
      throw new BadRequestException(
        `NPF ${dto.npfId} not found or has no associated lead. Cannot create sample without a valid lead.`,
      );
    }

    await this.assertSampleInTenant(
      this.prisma,
      { id: dto.npfId, leadId: npf.leadId },
      actor,
    );

    const sampleCode = await this.idGenerator.generateId('SMP');

    return this.prisma.sampleRequest.create({
      data: {
        sampleCode: sampleCode,
        npfId: dto.npfId,
        rndId: dto.rndId,
        version: dto.version || 1,
        leadId: npf.leadId,
        productName: 'Sample from NPF',
        targetFunction: 'General',
        textureReq: 'Standard',
        colorReq: 'Natural',
        aromaReq: 'Fresh',
        // BUS-RULE-107: same fee gate as createSample.
        stage: SampleStage.WAITING_FINANCE,
        stageLogs: {
          create: {
            stage: SampleStage.WAITING_FINANCE,
            enteredAt: new Date(),
          },
        },
      },
    });
  }

  async createNPF(dto: CreateNPFDto, actor?: RndActorContext) {
    const orgId = this.resolveTenant(actor);
    const lead = await this.prisma.salesLead.findFirst({
      where: { id: dto.leadId, organizationId: orgId },
      select: { id: true },
    });
    if (!lead) this.refuseCrossTenant();

    const npf = await this.prisma.newProductForm.create({
      data: {
        productName: dto.productName,
        targetPrice: dto.targetPrice,
        conceptNotes: dto.conceptNotes,
        leadId: dto.leadId,
      },
    });

    const rndUser = await this.prisma.user.findFirst({
      where: { roles: { has: UserRole.RND }, status: 'ACTIVE' },
    });

    if (rndUser) {
      const sampleCode = await this.idGenerator.generateId('SMP');
      await this.prisma.sampleRequest.create({
        data: {
          sampleCode: sampleCode,
          npfId: npf.id,
          rndId: rndUser.id,
          version: 1,
          leadId: dto.leadId,
          productName: dto.productName,
          targetFunction: 'General',
          textureReq: 'Standard',
          colorReq: 'Natural',
          aromaReq: 'Fresh',
        },
      });
    }

    return npf;
  }

  async getNPFs(actor?: RndActorContext) {
    return this.prisma.newProductForm.findMany({
      where: this.scopeWhere(actor),
      include: { lead: { select: { clientName: true } } },
      orderBy: { productName: 'asc' },
    });
  }

  async getNPF(id: string, actor?: RndActorContext) {
    this.assertTenantResolved(actor);
    return this.readScopedByLead(actor, (where: any) =>
      this.prisma.newProductForm.findFirst({
        where: { id, ...where },
        include: { lead: true, samples: true },
      }),
    );
  }

  async acceptSample(
    sampleId: string,
    actorId?: string,
    actor?: RndActorContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({
        where: { id: sampleId },
      });

      if (!sample) throw new NotFoundException('Sample request not found');
      await this.assertSampleInTenant(tx, sample, actor);

      // BUS-RULE-107 / DEC-2026-09-20-051. The previous "Auto-approve payment on
      // acceptance (dev mode)" block was removed, not flagged: it fabricated the
      // verification fact and left paymentApprovedById null, so the audit trail
      // could not name a verifier. Finance verification is now the only writer.
      this.assertSampleFeeVerified(sample);

      const formulaCode = await this.idGenerator.generateId('FRM');

      return this.audit.withAudit<{ sample: SampleRequest; formula: Formula }>(
        tx,
        {
          actorUserId: actorId ?? null,
          actorRoleSlug: UserRole.RND,
          actorPermissionSnapshot: { module: 'rnd', action: 'accept_sample' },
          source: 'rnd.service.acceptSample',
          entityType: 'SampleRequest',
          entityId: sampleId,
          action: 'ACCEPT_SAMPLE',
          beforeSnapshot: { stage: sample.stage },
          afterSnapshot: { stage: SampleStage.FORMULATING, formulaCode },
        },
        async (tx2: any) => {
          const updatedSample = await tx2.sampleRequest.update({
            where: { id: sampleId },
            data: { stage: SampleStage.FORMULATING },
          });

          const formula = await tx2.formula.create({
            data: {
              formulaCode: formulaCode,
              sampleRequestId: sampleId,
              targetYieldGram: 1000.0, // Default 1kg
              status: 'DRAFT',
              version: 1,
              phases: {
                create: [
                  {
                    prefix: 'A',
                    customName: 'Phase A',
                    order: 1,
                  },
                ],
              },
              qcparameter: {
                create: {},
              },
            },
          });

          await this.outbox.enqueue(
            tx2,
            {
              eventType: 'sample.formulation_started',
              aggregateType: 'SampleRequest',
              aggregateId: sampleId,
              payload: {
                sample_id: sampleId,
                lead_id: sample.leadId,
                formula_id: formula.id,
                formula_code: formulaCode,
              },
              correlationId: `sample:${sampleId}`,
            },
            { requireExternalTransaction: true },
          );

          this.eventEmitter.emit(ACTIVITY_EVENT, {
            leadId: sample.leadId,
            senderDivision: Division.RND,
            eventType: StreamEventType.STATE_CHANGE,
            notes: `R&D Menerima Task: Formula V1 (${formulaCode}) diinisialisasi.`,
            loggedBy: actorId ?? 'SYSTEM_RND',
          });

          return { sample: updatedSample, formula };
        },
      );
    });
  }

  /**
   * R&D hands the sample fee to Finance for verification.
   * SUBMITTED -> WAITING_FINANCE (03_WORKFLOW_STATE_MACHINE.yaml, sales_pipeline).
   */
  async requestSamplePayment(
    sampleId: string,
    actorId?: string,
    proofUrl?: string,
    actor?: RndActorContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({ where: { id: sampleId } });
      if (!sample) throw new NotFoundException('Sample request not found');
      await this.assertSampleInTenant(tx, sample, actor);

      if (sample.stage === SampleStage.WAITING_FINANCE) {
        // Already awaiting Finance; treat as the same single business effect.
        return sample;
      }

      this.stateTransition.validateTransition(
        'SampleStage',
        sample.stage,
        SampleStage.WAITING_FINANCE,
      );

      return this.audit.withAudit<SampleRequest>(
        tx,
        {
          actorUserId: actorId ?? null,
          actorRoleSlug: UserRole.RND,
          actorPermissionSnapshot: { module: 'rnd', action: 'request_sample_payment' },
          source: 'rnd.service.requestSamplePayment',
          entityType: 'SampleRequest',
          entityId: sampleId,
          action: 'REQUEST_SAMPLE_PAYMENT',
          beforeSnapshot: { stage: sample.stage },
          afterSnapshot: { stage: SampleStage.WAITING_FINANCE },
        },
        async (tx2: any) => {
          const updated = await tx2.sampleRequest.update({
            where: { id: sampleId },
            data: {
              stage: SampleStage.WAITING_FINANCE,
              paymentProofUrl: proofUrl ?? sample.paymentProofUrl,
              stageLogs: {
                create: { stage: SampleStage.WAITING_FINANCE, enteredAt: new Date() },
              },
            },
          });

          await this.outbox.enqueue(
            tx2,
            {
              eventType: EVENT_SAMPLE_PAYMENT_REQUESTED,
              aggregateType: 'SampleRequest',
              aggregateId: sampleId,
              payload: { sample_id: sampleId, lead_id: sample.leadId },
              correlationId: `sample:${sampleId}`,
            },
            { requireExternalTransaction: true },
          );

          return updated;
        },
      );
    });
  }

  /**
   * Finance confirms the sample fee was received. This is the ONLY writer of
   * paymentApprovedAt / paymentApprovedById (BUS-RULE-107).
   * WAITING_FINANCE -> QUEUE (R&D inbox; formulation may now start).
   */
  async verifySamplePayment(
    sampleId: string,
    actorId: string,
    note?: string,
    proofUrl?: string,
    actor?: RndActorContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({ where: { id: sampleId } });
      if (!sample) throw new NotFoundException('Sample request not found');
      await this.assertSampleInTenant(tx, sample, actor);

      if (sample.stage !== SampleStage.WAITING_FINANCE) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: `Sample ${sample.sampleCode} tidak sedang menunggu verifikasi Finance (stage: ${sample.stage}).`,
          reason_code: SAMPLE_NOT_AWAITING_FINANCE,
        });
      }

      this.stateTransition.validateTransition(
        'SampleStage',
        sample.stage,
        SampleStage.QUEUE,
      );

      const verifiedAt = new Date();

      return this.audit.withAudit<SampleRequest>(
        tx,
        {
          actorUserId: actorId,
          actorRoleSlug: UserRole.FINANCE,
          actorPermissionSnapshot: { module: 'finance', action: 'verify_sample_payment' },
          source: 'rnd.service.verifySamplePayment',
          entityType: 'SampleRequest',
          entityId: sampleId,
          action: 'VERIFY_SAMPLE_PAYMENT',
          beforeSnapshot: {
            stage: sample.stage,
            paymentApprovedAt: sample.paymentApprovedAt,
            paymentApprovedById: sample.paymentApprovedById,
          },
          afterSnapshot: {
            stage: SampleStage.QUEUE,
            paymentApprovedAt: verifiedAt,
            paymentApprovedById: actorId,
            note: note ?? null,
          },
        },
        async (tx2: any) => {
          const updated = await tx2.sampleRequest.update({
            where: { id: sampleId },
            data: {
              stage: SampleStage.QUEUE,
              paymentApprovedAt: verifiedAt,
              paymentApprovedById: actorId,
              paymentProofUrl: proofUrl ?? sample.paymentProofUrl,
              stageLogs: {
                create: { stage: SampleStage.QUEUE, enteredAt: verifiedAt },
              },
            },
          });

          await this.outbox.enqueue(
            tx2,
            {
              eventType: EVENT_SAMPLE_PAYMENT_VERIFIED,
              aggregateType: 'SampleRequest',
              aggregateId: sampleId,
              // Deliberately free of per-call timestamps so the outbox idempotency
              // key stays stable: a repeated verification cannot enqueue a second
              // event for the same fact.
              payload: {
                sample_id: sampleId,
                lead_id: sample.leadId,
                verified_by: actorId,
              },
              correlationId: `sample:${sampleId}`,
            },
            { requireExternalTransaction: true },
          );

          this.eventEmitter.emit(ACTIVITY_EVENT, {
            leadId: sample.leadId,
            senderDivision: Division.FINANCE,
            eventType: StreamEventType.STATE_CHANGE,
            notes: `Finance memverifikasi pembayaran sample ${sample.sampleCode}. Formulasi dapat dimulai.`,
            loggedBy: actorId,
          });

          return updated;
        },
      );
    });
  }

  /** Finance records that the sample fee was not received. WAITING_FINANCE -> REJECTED. */
  async rejectSamplePayment(
    sampleId: string,
    actorId: string,
    reason: string,
    actor?: RndActorContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({ where: { id: sampleId } });
      if (!sample) throw new NotFoundException('Sample request not found');
      await this.assertSampleInTenant(tx, sample, actor);

      if (sample.stage !== SampleStage.WAITING_FINANCE) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: `Sample ${sample.sampleCode} tidak sedang menunggu verifikasi Finance (stage: ${sample.stage}).`,
          reason_code: SAMPLE_NOT_AWAITING_FINANCE,
        });
      }

      return this.audit.withAudit<SampleRequest>(
        tx,
        {
          actorUserId: actorId,
          actorRoleSlug: UserRole.FINANCE,
          actorPermissionSnapshot: { module: 'finance', action: 'reject_sample_payment' },
          source: 'rnd.service.rejectSamplePayment',
          entityType: 'SampleRequest',
          entityId: sampleId,
          action: 'REJECT_SAMPLE_PAYMENT',
          beforeSnapshot: { stage: sample.stage },
          afterSnapshot: { stage: SampleStage.REJECTED, reason },
        },
        async (tx2: any) => {
          const updated = await tx2.sampleRequest.update({
            where: { id: sampleId },
            data: {
              stage: SampleStage.REJECTED,
              rejectionReason: reason,
              stageLogs: {
                create: { stage: SampleStage.REJECTED, enteredAt: new Date() },
              },
            },
          });

          await this.outbox.enqueue(
            tx2,
            {
              eventType: EVENT_SAMPLE_PAYMENT_REJECTED,
              aggregateType: 'SampleRequest',
              aggregateId: sampleId,
              payload: { sample_id: sampleId, rejected_by: actorId, reason },
              correlationId: `sample:${sampleId}`,
            },
            { requireExternalTransaction: true },
          );

          return updated;
        },
      );
    });
  }

  // Canonical sample stage transition map
  private readonly sampleStageTransitions: Record<SampleStage, SampleStage[]> =
    {
      [SampleStage.WAITING_FINANCE]: [SampleStage.QUEUE, SampleStage.CANCELLED],
      [SampleStage.QUEUE]: [SampleStage.FORMULATING, SampleStage.CANCELLED],
      [SampleStage.FORMULATING]: [SampleStage.LAB_TEST, SampleStage.CANCELLED],
      [SampleStage.LAB_TEST]: [
        SampleStage.READY_TO_SHIP,
        SampleStage.CANCELLED,
      ],
      [SampleStage.READY_TO_SHIP]: [SampleStage.SHIPPED, SampleStage.CANCELLED],
      [SampleStage.SHIPPED]: [SampleStage.RECEIVED, SampleStage.CANCELLED],
      [SampleStage.RECEIVED]: [
        SampleStage.CLIENT_REVIEW,
        SampleStage.CANCELLED,
      ],
      [SampleStage.CLIENT_REVIEW]: [
        SampleStage.APPROVED,
        SampleStage.REJECTED,
        SampleStage.CANCELLED,
      ],
      [SampleStage.APPROVED]: [],
      [SampleStage.REJECTED]: [],
      [SampleStage.CANCELLED]: [],
    };

  async advanceSampleStage(
    sampleId: string,
    dto: AdvanceSampleDto,
    actor?: RndActorContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.sampleRequest.findUnique({
        where: { id: sampleId },
      });

      if (!current) throw new NotFoundException('Sample request not found');
      await this.assertSampleInTenant(tx, current, actor);

      // BUS-RULE-107: the shared transition path is the one place every caller
      // routes through, so the fee gate lives here rather than being re-checked
      // per caller. Starting formulation without a verified fee is refused.
      if (
        dto.newStage === SampleStage.FORMULATING &&
        current.stage !== SampleStage.FORMULATING
      ) {
        this.assertSampleFeeVerified(current);
      }

      // Validate state transition via canonical service
      this.stateTransition.validateTransition(
        'SampleStage',
        current.stage,
        dto.newStage,
      );

      const updateData: any = {
        stage: dto.newStage,
      };

      if (dto.newStage === SampleStage.APPROVED) {
        updateData.completedAt = new Date();
        updateData.revisionStatus = RevisionStatus.DONE;
      }

      if (dto.newStage === SampleStage.REJECTED || dto.feedback) {
        updateData.feedback = dto.feedback;
        updateData.rejectionReason = dto.rejectionReason;
      }

      const updatedSample = await tx.sampleRequest.update({
        where: { id: sampleId },
        data: updateData,
      });

      // Emit Activity Log for Stage Change
      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: current.leadId,
        senderDivision: Division.RND,
        eventType: StreamEventType.STATE_CHANGE,
        notes: `R&D Update: Sampel ${current.productName} berpindah ke tahap ${dto.newStage}`,
        payload: { stage: dto.newStage, feedback: dto.feedback },
        loggedBy: 'SYSTEM_RND',
      });

      // CROSS-MODULE AUTOMATION: Sync with Sales Pipeline
      if (dto.newStage === SampleStage.APPROVED) {
        await tx.salesLead.update({
          where: { id: current.leadId },
          data: { status: 'SAMPLE_APPROVED' },
        });

        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: current.leadId,
          senderDivision: Division.RND,
          eventType: StreamEventType.HANDOVER,
          notes: 'AUTO-TRIGGER: Formula Approved. Siapkan SPK Negosiasi.',
          loggedBy: 'SYSTEM_RND',
        });
      }

      // --- STAGE VELOCITY TRACKING ---
      const activeLog = await tx.sampleStageLog.findFirst({
        where: { sampleRequestId: sampleId, leftAt: null },
        orderBy: { enteredAt: 'desc' },
      });

      if (activeLog) {
        const leftAt = new Date();
        const durationDays =
          (leftAt.getTime() - activeLog.enteredAt.getTime()) /
          (1000 * 60 * 60 * 24);
        await tx.sampleStageLog.update({
          where: { id: activeLog.id },
          data: {
            leftAt,
            durationDays: Math.round(durationDays * 100) / 100,
          },
        });
      }

      await tx.sampleStageLog.create({
        data: {
          sampleRequestId: sampleId,
          stage: dto.newStage,
          enteredAt: new Date(),
          notes: dto.feedback,
          rejectionReason: dto.rejectionReason,
        },
      });

      return updatedSample;
    });
  }

  async getDashboardMetrics(actor?: RndActorContext) {
    const [allSamples, staffs] = await Promise.all([
      this.prisma.sampleRequest.findMany({
        where: this.scopeWhere(actor),
        take: 200,
        orderBy: { createdAt: 'desc' },
        include: {
          pic: { select: { name: true } },
          lead: {
            select: {
              clientName: true,
              brandName: true,
              pic: { select: { name: true } },
            },
          },
          stageLogs: { orderBy: { enteredAt: 'desc' }, take: 1 },
          formulas: { select: { version: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { roles: { has: 'RND' } },
        select: { id: true, fullName: true, email: true },
      }),
    ]);

    const approvedSamples = allSamples.filter(
      (s) => s.stage === SampleStage.APPROVED,
    );
    const completedSamples = allSamples.filter(
      (s) => s.stage === SampleStage.APPROVED && s.completedAt,
    );
    const rejectedSamples = allSamples.filter(
      (s) => s.stage === SampleStage.REJECTED,
    );
    const activeSamples = allSamples.filter(
      (s) =>
        s.stage !== SampleStage.APPROVED && s.stage !== SampleStage.CANCELLED,
    );

    // 1. TIMELINESS
    let avgCycleTime = 0;
    let onTimeCount = 0;
    if (completedSamples.length > 0) {
      const totalDays = completedSamples.reduce((sum, s) => {
        const start = new Date(s.requestedAt).getTime();
        const end = new Date(s.completedAt!).getTime();
        if (s.targetDeadline && s.completedAt! <= s.targetDeadline)
          onTimeCount++;
        return sum + (end - start) / (1000 * 60 * 60 * 24);
      }, 0);
      avgCycleTime = totalDays / completedSamples.length;
    }

    // 2. ACCURACY
    const firstTimeApprovedCount = approvedSamples.filter(
      (s) => (s.revisionCount || 0) === 0,
    ).length;
    const firstTimeApprovalRate =
      approvedSamples.length > 0
        ? (firstTimeApprovedCount / approvedSamples.length) * 100
        : 0;

    const avgRevisions =
      allSamples.length > 0
        ? allSamples.reduce((sum, s) => sum + (s.revisionCount || 0), 0) /
          allSamples.length
        : 0;

    // 3. PERFORMANCE EVALUATION (PER PIC)
    const performanceEvaluation = staffs.map((staff) => {
      const mySamples = allSamples.filter((s) => s.picId === staff.id);
      const myCompleted = mySamples.filter(
        (s) => s.stage === SampleStage.APPROVED,
      );
      const onTimeCompleted = myCompleted.filter(
        (s) => !s.targetDeadline || s.completedAt! <= s.targetDeadline,
      ).length;
      const efficiency =
        myCompleted.length > 0
          ? Math.round((onTimeCompleted / myCompleted.length) * 100)
          : 0;
      const myAvgRevisions =
        mySamples.length > 0
          ? mySamples.reduce((sum, s) => sum + (s.revisionCount || 0), 0) /
            mySamples.length
          : 0;
      const quality = Math.max(0, 100 - Math.round(myAvgRevisions * 15));
      const myActiveProjects = mySamples.filter(
        (s) =>
          s.stage !== SampleStage.APPROVED && s.stage !== SampleStage.CANCELLED,
      ).length;
      const utilization = Math.min(
        Math.round((myActiveProjects / 10) * 100),
        100,
      );
      return {
        picName: staff.fullName || staff.email,
        output: `${myCompleted.length} / ${mySamples.length}`,
        efficiency: `${efficiency}% OT`,
        quality: `${quality}% ACC`,
        utilization: `${utilization}%`,
      };
    });

    // 4. FAILURE LOGS (Recent Rejections)
    const failureLogs = allSamples
      .filter((s) => s.stage === SampleStage.REJECTED || s.rejectionReason)
      .slice(0, 5)
      .map((s) => ({
        productName: s.productName,
        stage: s.stage,
        reason: s.rejectionReason || 'Technical Adjustment',
        picName: s.pic?.name || 'Unassigned',
      }));

    // 5. PIPELINE MASTER
    const pipelineMaster = allSamples.slice(0, 10).map((s) => {
      const activeLog = s.stageLogs.find((l) => !l.leftAt);
      const daysInStage = activeLog
        ? Math.round(
            (new Date().getTime() - activeLog.enteredAt.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;
      const totalDays = Math.round(
        (new Date().getTime() - s.requestedAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return {
        id: s.sampleCode,
        brand: s.lead?.brandName || 'Generic',
        product: s.productName,
        pic: s.pic?.name || 'TBD',
        bd: s.lead?.pic?.name || 'System',
        stage: s.stage,
        timeAudit: `In Stage: ${daysInStage} Days`,
        totalTime: `Total: ${totalDays} Days`,
        revisions: `${s.revisionCount}x`,
        status: s.stage === SampleStage.APPROVED ? 'APPROVED' : 'ONGOING',
      };
    });

    // 6. OVERALL UTILIZATION
    const totalActive = activeSamples.length;
    const totalCapacity = (staffs.length || 1) * 10;
    const overallUtilization = Math.min(
      Math.round((totalActive / totalCapacity) * 100),
      100,
    );

    return {
      timeliness: {
        onTimeRate: Math.round(
          (onTimeCount / (completedSamples.length || 1)) * 100,
        ),
        avgCycleTime: Math.round(avgCycleTime * 10) / 10,
        overdueCount: activeSamples.filter(
          (s) => s.targetDeadline && new Date() > s.targetDeadline,
        ).length,
        insight:
          onTimeCount / (completedSamples.length || 1) < 0.8
            ? 'Bottleneck detected in formula review'
            : 'Velocity is within operational SLA',
      },
      accuracy: {
        firstTimeApprovalRate: Math.round(firstTimeApprovalRate * 10) / 10,
        avgRevision: Math.round(avgRevisions * 10) / 10,
        failedItemsCount: rejectedSamples.length,
        insight:
          avgRevisions > 2
            ? 'High revision count: review briefing protocol'
            : 'Formulation accuracy is stabilizing',
      },
      approval: {
        overallRate: Math.round(
          (approvedSamples.length / (allSamples.length || 1)) * 100,
        ),
        submitted: allSamples.length,
        approved: approvedSamples.length,
        insight: 'Lead-to-Sample conversion flow is healthy',
      },
      performance: {
        activeProjects: totalActive,
        completedProjects: completedSamples.length,
        utilizationRate: overallUtilization,
        insight:
          overallUtilization > 85
            ? 'Capacity critical: Staff reallocation required'
            : 'Resource utilization is optimized',
      },
      tables: {
        performanceEvaluation,
        failureLogs,
        pipelineMaster,
      },
    };
  }

  async getSample(id: string, actor?: RndActorContext) {
    this.assertTenantResolved(actor);
    return this.readScopedByLead(actor, (where: any) =>
      this.prisma.sampleRequest.findFirst({
        where: { id, ...where },
        include: {
          lead: { include: { pic: true } },
          pic: true,
          stageLogs: { orderBy: { enteredAt: 'desc' }, take: 1 },
          formulas: {
            orderBy: { version: 'desc' },
            include: {
              phases: { include: { items: true } },
            },
          },
          feedbacks: { orderBy: { createdAt: 'desc' } },
        },
      }),
    );
  }

  async getInboxSamples(actor?: RndActorContext) {
    return this.prisma.sampleRequest.findMany({
      where: {
        stage: SampleStage.QUEUE,
        ...this.scopeWhere(actor),
      },
      include: {
        lead: { include: { pic: true } },
        pic: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSamples(actor?: RndActorContext) {
    return this.prisma.sampleRequest.findMany({
      where: this.scopeWhere(actor),
      include: {
        lead: { include: { pic: true } },
        pic: true,
        stageLogs: { orderBy: { enteredAt: 'desc' }, take: 1 },
        formulas: {
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            phases: {
              include: {
                items: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getStaffs() {
    return this.prisma.user.findMany({
      where: { roles: { has: 'RND' } },
      select: { id: true, fullName: true, email: true },
    });
  }

  async assignPIC(id: string, picId: string, actor?: RndActorContext) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({ where: { id } });
      await this.assertSampleInTenant(tx, sample, actor);
      return tx.sampleRequest.update({
        where: { id },
        data: { picId },
      });
    });
  }

  async getVersions(sampleId: string, actor?: RndActorContext) {
    this.assertTenantResolved(actor);
    await this.assertParentSampleVisible(sampleId, actor);
    return this.prisma.formula.findMany({
      where: { sampleRequestId: sampleId, ...this.scopeWhereAt(actor, 'sampleRequest') },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getFeedback(sampleId: string, actor?: RndActorContext) {
    this.assertTenantResolved(actor);
    await this.assertParentSampleVisible(sampleId, actor);
    return this.prisma.sampleFeedback.findMany({
      where: { sampleRequestId: sampleId, ...this.scopeWhereAt(actor, 'sampleRequest') },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLabTestResults(formulaId: string, actor?: RndActorContext) {
    this.assertTenantResolved(actor);
    await this.assertFormulaInTenant(this.prisma, { id: formulaId }, actor);
    return this.prisma.labTestResult.findMany({
      where: { formulaId, ...this.scopeWhereAt(actor, 'formula') },
      include: { tester: { select: { fullName: true } } },
      orderBy: { testDate: 'desc' },
    });
  }

  async createLabTestResult(
    dto: {
      formulaId: string;
      testerId: string;
      actualPh?: string;
      actualViscosity?: string;
      actualDensity?: string;
      colorResult?: string;
      aromaResult?: string;
      textureResult?: string;
      stability40C?: string;
      stabilityRT?: string;
      stability4C?: string;
      notes?: string;
    },
    actor?: RndActorContext,
  ) {
    this.assertTenantResolved(actor);
    await this.assertFormulaInTenant(this.prisma, { id: dto.formulaId }, actor);
    return this.prisma.labTestResult.create({
      data: {
        formulaId: dto.formulaId,
        testerId: dto.testerId,
        actualPh: dto.actualPh,
        actualViscosity: dto.actualViscosity,
        actualDensity: dto.actualDensity,
        colorResult: dto.colorResult,
        aromaResult: dto.aromaResult,
        textureResult: dto.textureResult,
        stability40C: dto.stability40C,
        stabilityRT: dto.stabilityRT,
        stability4C: dto.stability4C,
        notes: dto.notes,
      },
    });
  }

  async setQcParameters(
    formulaId: string,
    dto: {
      targetPh?: string;
      targetViscosity?: string;
      targetColor?: string;
      targetAroma?: string;
      appearance?: string;
    },
    actor?: RndActorContext,
  ) {
    const formula = await this.prisma.formula.findUnique({
      where: { id: formulaId },
    });

    if (!formula) throw new NotFoundException('Formula not found');
    await this.assertFormulaInTenant(this.prisma, formula, actor);

    return this.prisma.qCParameter.upsert({
      where: { formulaId },
      update: {
        targetPh: dto.targetPh,
        targetViscosity: dto.targetViscosity,
        targetColor: dto.targetColor,
        targetAroma: dto.targetAroma,
        appearance: dto.appearance,
      },
      create: {
        formulaId,
        targetPh: dto.targetPh,
        targetViscosity: dto.targetViscosity,
        targetColor: dto.targetColor,
        targetAroma: dto.targetAroma,
        appearance: dto.appearance,
      },
    });
  }

  // --- REVISION TRACKER ---

  async getRevisions(actor?: RndActorContext) {
    return this.prisma.sampleRequest.findMany({
      where: {
        revisionStatus: {
          in: [RevisionStatus.NOT_STARTED, RevisionStatus.IN_PROGRESS],
        },
        ...this.scopeWhere(actor),
      },
      include: {
        lead: { select: { clientName: true, brandName: true } },
        pic: { select: { name: true } },
        formulas: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { id: true, formulaCode: true, version: true },
        },
      },
      orderBy: { latestRevisionDate: 'desc' },
    });
  }

  async getRevisionHistory(actor?: RndActorContext) {
    return this.prisma.sampleRequest.findMany({
      where: {
        revisionStatus: {
          in: [RevisionStatus.DONE, RevisionStatus.CANCELLED],
        },
        ...this.scopeWhere(actor),
      },
      include: {
        lead: { select: { clientName: true, brandName: true } },
        pic: { select: { name: true } },
        formulas: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { id: true, formulaCode: true, version: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async updateRevisionScoped(
    id: string,
    data: Record<string, any>,
    actor?: RndActorContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({ where: { id } });
      await this.assertSampleInTenant(tx, sample, actor);
      return tx.sampleRequest.update({ where: { id }, data });
    });
  }

  async startRevision(id: string, actor?: RndActorContext) {
    return this.updateRevisionScoped(
      id,
      { revisionStatus: RevisionStatus.IN_PROGRESS, latestRevisionDate: new Date() },
      actor,
    );
  }

  async completeRevision(id: string, actor?: RndActorContext) {
    return this.updateRevisionScoped(
      id,
      { revisionStatus: RevisionStatus.DONE, completedAt: new Date() },
      actor,
    );
  }

  async getAllLabTestResults(type?: string, actor?: RndActorContext) {
    const where: any = this.scopeWhereAt(actor, 'formula');
    if (type === 'stability') {
      where.stability40C = { not: null };
    }
    return this.prisma.labTestResult
      .findMany({
        where,
        include: {
          formula: {
            select: {
              formulaCode: true,
              sampleRequest: {
                select: { productName: true, sampleCode: true },
              },
            },
          },
          tester: { select: { fullName: true } },
        },
        orderBy: { testDate: 'desc' },
      })
      .then((results) =>
        results.map((r) => ({
          ...r,
          formula: r.formula
            ? {
                name:
                  r.formula.sampleRequest?.productName || r.formula.formulaCode,
                sampleRequest: r.formula.sampleRequest,
              }
            : null,
        })),
      );
  }

  async getFormulas(actor?: RndActorContext) {
    return this.prisma.formula.findMany({
      where: this.scopeWhereAt(actor, 'formula'),
      include: {
        sampleRequest: {
          select: {
            id: true,
            sampleCode: true,
            productName: true,
            lead: {
              select: { id: true, clientName: true, brandName: true },
            },
          },
        },
        phases: {
          include: {
            items: {
              include: { material: true },
            },
          },
        },
        lockedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPipeline(actor?: RndActorContext) {
    return this.prisma.sampleRequest.findMany({
      where: this.scopeWhere(actor),
      include: {
        formulas: {
          include: { phases: true },
        },
        lead: { select: { clientName: true, brandName: true } },
        pic: { select: { name: true } },
        stageLogs: { orderBy: { enteredAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
