import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { RegStage, RegType, LegalApplicability } from '@prisma/client';
import {
  eligibleDownstreamFormulaOrder,
  eligibleDownstreamFormulaWhere,
} from '../rnd/formula-eligibility';

/**
 * BATCH 3 — Legalitas operational service (corrected).
 *
 * Applicability is now an EXPLICIT decision recorded on SampleRequest:
 *
 *   UNKNOWN         → legal gate BLOCKS (must not silently bypass)
 *   REQUIRED        → a RegulatoryPipeline must reach PUBLISHED
 *   NOT_APPLICABLE  → no pipeline is required (explicit operator decision)
 *
 * The auto-intake R&D listener no longer hardcodes BPOM for every
 * approved sample — it consults sampleRequest.legalApplicability.
 * If applicability is UNKNOWN, the listener leaves the decision to a
 * human and emits an explicit "applicability decision required" event.
 *
 * Formula is selected deterministically: the sample's CURRENT eligible
 * formula (PRODUCTION_LOCKED, highest version, never SUPERSEDED).
 *
 * Ownership: legalPicId is left NULL on auto-intake so the item lands
 * in the Legalitas department queue. The R&D handoff actor is recorded
 * in logHistory as the actor of the handoff — NOT the Legalitas owner.
 */
@Injectable()
export class LegalityBatch3Service {
  private readonly logger = new Logger(LegalityBatch3Service.name);

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
   * Idempotent intake. Two cases:
   *  - Auto (R&D APPROVED listener): respects sample.legalApplicability.
   *    UNKNOWN => no pipeline, log + emit decision-required event.
   *    REQUIRED => create pipeline with sample.legalType ?? BPOM.
   *    NOT_APPLICABLE => no pipeline, no event.
   *  - Manual endpoint: callers may pass applicability override.
   */
  async intakeForCompletedSample(
    sampleRequestId: string,
    actorId: string,
    override?: { applicability?: LegalApplicability; legalType?: RegType },
  ) {
    this.logger.log(
      `[INTAKE] called sampleRequestId=${sampleRequestId} actorId=${actorId}`,
    );
    const sample = await this.prisma.sampleRequest.findUnique({
      where: { id: sampleRequestId },
      include: {
        formulas: {
          where: eligibleDownstreamFormulaWhere(sampleRequestId),
          orderBy: eligibleDownstreamFormulaOrder,
          take: 1,
        },
        lead: true,
      },
    });
    if (!sample)
      throw new NotFoundException(`Sample ${sampleRequestId} not found`);

    const applicability = override?.applicability ?? sample.legalApplicability;

    if (applicability === LegalApplicability.NOT_APPLICABLE) {
      this.logger.log(
        `[INTAKE] skipped — sample ${sample.id} explicitly NOT_APPLICABLE`,
      );
      return { pipeline: null, idempotent: true, applicability };
    }

    if (applicability === LegalApplicability.UNKNOWN) {
      this.logger.warn(
        `[INTAKE] blocked — sample ${sample.id} applicability is UNKNOWN. Human decision required.`,
      );
      // Persist the override (if provided) so a subsequent retry can succeed.
      if (override?.applicability) {
        await this.prisma.sampleRequest.update({
          where: { id: sample.id },
          data: {
            legalApplicability: override.applicability,
            legalType: override.legalType ?? sample.legalType ?? null,
          },
        });
        // Fall through and continue with the new decision if it became REQUIRED.
        if (override.applicability === LegalApplicability.NOT_APPLICABLE) {
          return { pipeline: null, idempotent: true, applicability };
        }
      } else {
        this.eventEmitter.emit('legality.batch3.applicability_required', {
          sampleRequestId: sample.id,
          leadId: sample.leadId,
          handoffActorId: actorId,
        });
        throw new BadRequestException(
          'LEGAL_APPLICABILITY_UNKNOWN: Sample has no explicit legal applicability. A human must mark it REQUIRED or NOT_APPLICABLE before intake can proceed.',
        );
      }
    }

    // REQUIRED path.
    const formula = sample.formulas[0];
    if (!formula) {
      throw new BadRequestException(
        'LEGALITAS_INTAKE_BLOCKED: Sample has no eligible downstream Formula (must be PRODUCTION_LOCKED / SAMPLE_LOCKED / MINOR_COMPLIANCE_FIX / BPOM_REGISTRATION_PROCESS, non-SUPERSEDED). R&D must lock the formula first.',
      );
    }

    // No silent BPOM default. REQUIRED applicability MUST carry an explicit
    // legalType (BPOM / HKI_BRAND / HALAL / etc.) before a pipeline can be
    // created. If the decision was REQUIRED but no type was provided, fail
    // closed and force a human decision via PATCH /legality/sample/:id/applicability.
    const legalType: RegType | null =
      override?.legalType ?? sample.legalType ?? null;
    if (!legalType) {
      this.logger.warn(
        `[INTAKE] blocked — sample ${sample.id} applicability=REQUIRED but no explicit legalType. Human decision required.`,
      );
      this.eventEmitter.emit('legality.batch3.legal_type_required', {
        sampleRequestId: sample.id,
        leadId: sample.leadId,
        handoffActorId: actorId,
      });
      throw new BadRequestException(
        'LEGAL_TYPE_REQUIRED: Sample applicability is REQUIRED but no explicit legalType has been recorded. Call PATCH /legality/sample/:sampleId/applicability with {applicability:"REQUIRED", legalType:"BPOM|HKI_BRAND|HALAL"} before intake can proceed.',
      );
    }

    // Idempotency: one pipeline per (leadId, sampleRequestId, type).
    // The DB-level UNIQUE constraint backstops the lookup-then-create
    // race when the listener fires concurrently from duplicate events.
    const existing = await this.prisma.regulatoryPipeline.findFirst({
      where: {
        leadId: sample.leadId,
        sampleRequestId: sample.id,
        type: legalType,
      },
    });
    if (existing) {
      this.logger.log(
        `[INTAKE] idempotent — returning existing pipeline ${existing.id}`,
      );
      return { pipeline: existing, idempotent: true, applicability };
    }

    let pipeline;
    try {
      pipeline = await this.prisma.$transaction(async (tx) => {
        return tx.regulatoryPipeline.create({
          data: {
            leadId: sample.leadId,
            sampleRequestId: sample.id,
            formulaId: formula.id,
            type: legalType,
            currentStage: RegStage.DRAFT,
            // legalPicId deliberately NULL — item goes to Legalitas queue.
            legalPicId: null,
            daysInStage: 0,
            logHistory: [
              {
                at: new Date().toISOString(),
                action: 'INTAKE',
                fromStage: null,
                toStage: RegStage.DRAFT,
                handoffActorId: actorId,
                note: `Auto-intake from R&D APPROVED sample ${sample.sampleCode}. Formula=${formula.formulaCode}@v${formula.version}`,
              },
            ],
          },
        });
      });
    } catch (err: any) {
      // P2002 = unique constraint violation. A concurrent listener beat
      // us to the create — read and return the winner.
      if (err?.code === 'P2002') {
        const winner = await this.prisma.regulatoryPipeline.findFirst({
          where: {
            leadId: sample.leadId,
            sampleRequestId: sample.id,
            type: legalType,
          },
        });
        if (winner) {
          this.logger.log(
            `[INTAKE] race resolved — returning existing pipeline ${winner.id}`,
          );
          return { pipeline: winner, idempotent: true, applicability };
        }
      }
      throw err;
    }

    this.logger.log(
      `[INTAKE] created pipeline ${pipeline.id} for sample ${sample.id}`,
    );
    this.eventEmitter.emit('legality.batch3.intake', {
      pipelineId: pipeline.id,
      leadId: sample.leadId,
      sampleRequestId: sample.id,
      formulaId: formula.id,
    });

    return { pipeline, idempotent: false, applicability };
  }

  async advancePipelineStage(
    pipelineId: string,
    targetStage: RegStage,
    actorId: string,
    reason?: string,
  ) {
    const pipeline = await this.prisma.regulatoryPipeline.findUnique({
      where: { id: pipelineId },
    });
    if (!pipeline)
      throw new NotFoundException(`Pipeline ${pipelineId} not found`);

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
   * Deterministic SO eligibility probe.
   *
   *   UNKNOWN          → eligible=false, reason=LEGAL_UNKNOWN (BLOCKED)
   *   NOT_APPLICABLE   → eligible=true,  reason=NOT_APPLICABLE
   *   REQUIRED + all PUBLISHED → eligible=true, reason=LEGAL_READY
   *   REQUIRED + any REVISION  → eligible=false, reason=LEGAL_REVISION
   *   REQUIRED + otherwise     → eligible=false, reason=LEGAL_PENDING
   *
   * Absence of pipeline rows is NEVER treated as NOT_APPLICABLE — only an
   * explicit sample.legalApplicability === NOT_APPLICABLE does that.
   */
  async getReadinessForLead(leadId: string, sampleId: string) {
    const sample = await this.prisma.sampleRequest.findUnique({
      where: { id: sampleId },
      select: { legalApplicability: true, legalType: true },
    });
    if (!sample) {
      return {
        eligible: false,
        reason: 'LEGAL_UNKNOWN',
        message: 'Sample not found; cannot determine legal applicability.',
        pipelines: [],
      };
    }

    if (sample.legalApplicability === LegalApplicability.UNKNOWN) {
      return {
        eligible: false,
        reason: 'LEGAL_UNKNOWN',
        message:
          'Legal applicability has not been decided. A Legalitas user must mark REQUIRED or NOT_APPLICABLE.',
        pipelines: [],
      };
    }

    if (sample.legalApplicability === LegalApplicability.NOT_APPLICABLE) {
      return {
        eligible: true,
        reason: 'NOT_APPLICABLE',
        message: 'Sample is explicitly NOT_APPLICABLE for legal review.',
        pipelines: [],
      };
    }

    if (!sample.legalType) {
      return {
        eligible: false,
        reason: 'LEGAL_TYPE_REQUIRED',
        message:
          'Applicability is REQUIRED but no legal type has been decided. Record an explicit legalType before intake can proceed.',
        pipelines: [],
      };
    }

    // REQUIRED — pipeline check.
    const pipelines = await this.prisma.regulatoryPipeline.findMany({
      where: { leadId, sampleRequestId: sampleId },
    });

    if (pipelines.length === 0) {
      // applicability is REQUIRED but no pipeline exists — fail-closed.
      return {
        eligible: false,
        reason: 'LEGAL_UNKNOWN',
        message:
          'Applicability is REQUIRED but no RegulatoryPipeline exists. Intake must run.',
        pipelines: [],
      };
    }

    const allPublished = pipelines.every(
      (p) => p.currentStage === RegStage.PUBLISHED,
    );
    const anyInRevision = pipelines.some(
      (p) => p.currentStage === RegStage.REVISION,
    );

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

  /**
   * Small admin helper: set explicit legal applicability + type on a
   * sample. Used by the manual intake endpoint and by tests.
   */
  async setApplicability(
    sampleRequestId: string,
    applicability: LegalApplicability,
    legalType?: RegType | null,
    actorId?: string,
  ) {
    const sample = await this.prisma.sampleRequest.findUnique({
      where: { id: sampleRequestId },
    });
    if (!sample)
      throw new NotFoundException(`Sample ${sampleRequestId} not found`);
    return this.prisma.sampleRequest.update({
      where: { id: sampleRequestId },
      data: {
        legalApplicability: applicability,
        legalType: legalType ?? sample.legalType ?? null,
      },
    });
  }
}

export const LEGALITY_BATCH3_EVENTS = {
  INTAKE: 'legality.batch3.intake',
  PUBLISHED: 'legality.batch3.published',
  APPLICABILITY_REQUIRED: 'legality.batch3.applicability_required',
} as const;
