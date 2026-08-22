import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { RegStage, RegType } from '@prisma/client';

/**
 * BATCH 3 — Legalitas operational service.
 *
 * Owns three flows that did NOT exist before Batch 3:
 *
 *   1. intakeForCompletedSample(sampleId, actorId)
 *      R&D APPROVED → creates a RegulatoryPipeline row idempotently.
 *      Pins sampleRequestId + formulaId. No re-entry of upstream facts.
 *
 *   2. advancePipelineStage(pipelineId, targetStage, actorId, reason?)
 *      Linear RegStage advance with revision preservation:
 *      REVISION is a back-edge that retains currentStage's logHistory entry.
 *
 *   3. getReadinessForLead(leadId, sampleId)
 *      SO eligibility check: if any RegulatoryPipeline exists for the
 *      (leadId, sampleId) tuple, ALL must be PUBLISHED. Otherwise
 *      NOT_APPLICABLE — some products don't need legal.
 *
 * Existing HKI/BPOM/Halal flows (separate legacy tables) are NOT touched.
 * They remain operational via LegalityService but are out of Batch 3 scope.
 */
@Injectable()
export class LegalityBatch3Service {
  private readonly logger = new Logger(LegalityBatch3Service.name);

  // Linear advance map. PUBLISHED is terminal.
  // REVISION is a one-way back-edge from EVALUATION (per existing schema semantics).
  private readonly advanceMap: Record<RegStage, RegStage[]> = {
    [RegStage.DRAFT]: [RegStage.SUBMITTED],
    [RegStage.SUBMITTED]: [RegStage.EVALUATION, RegStage.REVISION],
    [RegStage.EVALUATION]: [RegStage.REVISION, RegStage.PUBLISHED],
    [RegStage.REVISION]: [RegStage.EVALUATION],
    [RegStage.PUBLISHED]: [],
  };

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * INV-05: idempotent intake. Repeated R&D→Legal calls return the existing
   * pipeline row, never a duplicate.
   */
  async intakeForCompletedSample(
    sampleRequestId: string,
    actorId: string,
  ) {
    this.logger.log(`[INTAKE] called sampleRequestId=${sampleRequestId} actorId=${actorId}`);
    const sample = await this.prisma.sampleRequest.findUnique({
      where: { id: sampleRequestId },
      include: {
        formulas: { where: { status: { not: 'SUPERSEDED' } }, orderBy: { version: 'desc' } },
        lead: true,
      },
    });
    if (!sample) throw new NotFoundException(`Sample ${sampleRequestId} not found`);

    const formula = sample.formulas[0];
    if (!formula) {
      throw new BadRequestException(
        'LEGALITAS_INTAKE_BLOCKED: Sample has no active Formula. R&D must complete formulation first.',
      );
    }

    // Idempotency: one pipeline per (leadId, sampleRequestId, type). Look up first.
    const existing = await this.prisma.regulatoryPipeline.findFirst({
      where: {
        leadId: sample.leadId,
        sampleRequestId: sample.id,
        type: RegType.BPOM,
      },
    });
    if (existing) {
      this.logger.log(
        `[INTAKE] idempotent — returning existing pipeline ${existing.id} for sample ${sample.id}`,
      );
      return { pipeline: existing, idempotent: true };
    }

    // Create new pipeline. Use $transaction so the row + logHistory are atomic.
    const pipeline = await this.prisma.$transaction(async (tx) => {
      const created = await tx.regulatoryPipeline.create({
        data: {
          leadId: sample.leadId,
          sampleRequestId: sample.id,
          formulaId: formula.id,
          type: RegType.BPOM,
          currentStage: RegStage.DRAFT,
          legalPicId: actorId,
          daysInStage: 0,
          logHistory: [
            {
              at: new Date().toISOString(),
              action: 'INTAKE',
              fromStage: null,
              toStage: RegStage.DRAFT,
              actorId,
              note: `Auto-intake from R&D APPROVED sample ${sample.sampleCode}`,
            },
          ],
        },
      });
      return created;
    });

    this.logger.log(`[INTAKE] created pipeline ${pipeline.id} for sample ${sample.id}`);
    this.eventEmitter.emit('legality.batch3.intake', {
      pipelineId: pipeline.id,
      leadId: sample.leadId,
      sampleRequestId: sample.id,
      formulaId: formula.id,
    });

    return { pipeline, idempotent: false };
  }

  /**
   * INV-12: invalid transitions are backend-blocked. REVISION is preserved
   * as a logHistory entry (history preservation — INV-11).
   */
  async advancePipelineStage(
    pipelineId: string,
    targetStage: RegStage,
    actorId: string,
    reason?: string,
  ) {
    const pipeline = await this.prisma.regulatoryPipeline.findUnique({
      where: { id: pipelineId },
    });
    if (!pipeline) throw new NotFoundException(`Pipeline ${pipelineId} not found`);

    const allowed = this.advanceMap[pipeline.currentStage];
    if (!allowed.includes(targetStage)) {
      throw new BadRequestException(
        `STATE_TRANSITION_INVALID: Cannot advance pipeline from ${pipeline.currentStage} to ${targetStage}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const previousStage = pipeline.currentStage;
    const logHistory = Array.isArray(pipeline.logHistory)
      ? (pipeline.logHistory as any[])
      : [];

    const updated = await this.prisma.regulatoryPipeline.update({
      where: { id: pipelineId },
      data: {
        currentStage: targetStage,
        daysInStage: 0,
        logHistory: [
          ...logHistory,
          {
            at: new Date().toISOString(),
            action: 'ADVANCE',
            fromStage: previousStage,
            toStage: targetStage,
            actorId,
            reason: reason ?? null,
          },
        ],
      },
    });

    if (targetStage === RegStage.PUBLISHED) {
      this.eventEmitter.emit('legality.batch3.published', {
        pipelineId,
        leadId: pipeline.leadId,
        sampleRequestId: pipeline.sampleRequestId,
      });
    }

    return { pipeline: updated, previousStage };
  }

  /**
   * INV-03: legal gate is backend-enforced. Used by SO creation.
   *
   * Rule (deterministic, documented in Batch 3 closure §13):
   *   - If ANY RegulatoryPipeline exists for (leadId, sampleId), ALL must
   *     be PUBLISHED. Otherwise the project is NOT_READY.
   *   - If NONE exists, project is NOT_APPLICABLE — eligible for SO
   *     without legal gating (per current product mix).
   *   - If any pipeline is in REVISION, blocked (reason required downstream).
   */
  async getReadinessForLead(leadId: string, sampleId: string) {
    const pipelines = await this.prisma.regulatoryPipeline.findMany({
      where: { leadId, sampleRequestId: sampleId },
    });

    if (pipelines.length === 0) {
      return {
        eligible: true,
        reason: 'NOT_APPLICABLE',
        message: 'No legal pipeline required for this project.',
        pipelines: [],
      };
    }

    const allPublished = pipelines.every((p) => p.currentStage === RegStage.PUBLISHED);
    const anyInRevision = pipelines.some((p) => p.currentStage === RegStage.REVISION);

    if (allPublished) {
      return {
        eligible: true,
        reason: 'LEGAL_READY',
        message: 'All legal pipelines are published.',
        pipelines,
      };
    }

    if (anyInRevision) {
      return {
        eligible: false,
        reason: 'LEGAL_REVISION',
        message: 'One or more pipelines require revision.',
        pipelines,
      };
    }

    return {
      eligible: false,
      reason: 'LEGAL_PENDING',
      message: `Pipelines in progress: ${pipelines.map((p) => p.currentStage).join(', ')}.`,
      pipelines,
    };
  }

  /** Convenience used by SO service. */
  async assertEligible(leadId: string, sampleId: string) {
    const readiness = await this.getReadinessForLead(leadId, sampleId);
    if (!readiness.eligible) {
      throw new BadRequestException({
        message: `SO_ELIGIBILITY_BLOCKED: ${readiness.reason} — ${readiness.message}`,
        reason: readiness.reason,
      });
    }
    return readiness;
  }
}

/** Event names emitted/consumed by this service. */
export const LEGALITY_BATCH3_EVENTS = {
  INTAKE: 'legality.batch3.intake',
  PUBLISHED: 'legality.batch3.published',
} as const;
