import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  LegalStatus,
  FormulaStatus,
  IngredientCategory,
  RegStage,
  RegType,
} from '@prisma/client';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions/api-exception';
import {
  ARTWORK_NOT_ON_FILE,
  GovernedArtwork,
  injectTimeMetrics,
  permitAuditRisk,
} from './legality-common';

@Injectable()
export class LegalityBpomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getBpomRecords() {
    const records = await this.prisma.bpomRecord.findMany({
      include: { pic: true },
      orderBy: { applicationDate: 'desc' },
    });
    return records.map((r) => injectTimeMetrics(r));
  }

  async createBpom(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const { picId, ...rest } = data;
      const record = await tx.bpomRecord.create({
        data: {
          ...rest,
          pic: picId ? { connect: { id: picId } } : undefined,
          status: rest.status ?? LegalStatus.IN_PROGRESS,
          stage: rest.stage ?? 'DRAFT',
          auditRisk: permitAuditRisk(rest.expiryDate),
        },
      });

      await tx.legalTimelineLog.create({
        data: {
          recordId: record.id,
          recordType: 'BPOM',
          action: 'CREATED',
          newStage: 'DRAFT',
          notes: 'Record initialized in auditory log.',
          staffName: 'System',
        },
      });

      return record;
    });
  }

  async advanceBpomStage(id: string) {
    const record = await this.prisma.bpomRecord.findUnique({ where: { id } });
    if (!record) throw new ResourceNotFoundException('BPOM Record', id);
    if (record.status === LegalStatus.DONE)
      throw new BusinessRuleViolationException(
        'legality-already-completed',
        'Record BPOM sudah selesai dan tidak bisa dilanjutkan.',
        { entity: 'BpomRecord', id, status: record.status },
      );

    const stageOrder = [
      'DRAFT',
      'SUBMITTED',
      'EVALUATION',
      'REVISION',
      'PUBLISHED',
    ];
    const currentIdx = stageOrder.indexOf(record.stage);
    if (currentIdx === -1 || currentIdx >= stageOrder.length - 1) {
      throw new BusinessRuleViolationException(
        'legality-no-next-stage',
        `Stage BPOM tidak bisa dilanjutkan dari "${record.stage}": sudah di stage terakhir.`,
        { entity: 'BpomRecord', id, stage: record.stage, stageOrder },
      );
    }

    const nextStage = stageOrder[currentIdx + 1] as any;
    const nextStatus =
      nextStage === 'PUBLISHED' ? LegalStatus.DONE : LegalStatus.IN_PROGRESS;

    return this.prisma.$transaction(async (tx) => {
      await tx.bpomRecord.update({
        where: { id },
        data: { stage: nextStage, status: nextStatus },
      });

      if (nextStage === 'PUBLISHED') {
        const bpom = await tx.bpomRecord.findUnique({
          where: { id },
          include: { pic: true },
        });
        this.eventEmitter.emit('BPOM_REGISTERED', {
          employeeId: (bpom as any)?.pic?.userId,
          referenceId: id,
          metadata: { newStage: nextStage, status: nextStatus, recordType: 'BPOM' },
        });
      }

      return tx.legalTimelineLog.create({
        data: {
          recordId: id,
          recordType: 'BPOM',
          action: 'STAGE_UPDATED',
          previousStage: record.stage,
          newStage: nextStage,
          notes: `Automated advance from ${record.stage} to ${nextStage}`,
          staffName: 'System',
        },
      });
    });
  }

  // --- V4 REGULATORY ENGINE ---

  async validateFormula(formulaId: string) {
    const formula = await this.prisma.formula.findUnique({
      where: { id: formulaId },
      include: {
        phases: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    });

    if (!formula) throw new ResourceNotFoundException('Formula');

    const violations = [];
    let riskScore: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    // Flatten items
    const allItems = formula.phases.flatMap((p) => p.items);

    for (const item of allItems) {
      if (!item.material?.inciName) continue;

      const inciLimit = await this.prisma.masterInci.findUnique({
        where: { inciName: item.material.inciName },
      });

      if (!inciLimit) continue;

      const dosage = Number(item.dosagePercentage);

      if (inciLimit.category === IngredientCategory.PROHIBITED) {
        violations.push({
          ingredient: inciLimit.inciName,
          type: 'PROHIBITED',
          message:
            inciLimit.prohibitedContext ||
            'Ingredient is prohibited in cosmetic products.',
          actual: dosage,
          limit: 0,
        });
        riskScore = 'HIGH';
      } else if (
        inciLimit.category === IngredientCategory.RESTRICTED &&
        inciLimit.maxConcentration &&
        dosage > Number(inciLimit.maxConcentration)
      ) {
        violations.push({
          ingredient: inciLimit.inciName,
          type: 'RESTRICTED_LIMIT_EXCEEDED',
          message: `Exceeds maximum concentration of ${inciLimit.maxConcentration}%`,
          actual: dosage,
          limit: Number(inciLimit.maxConcentration),
        });
        if (riskScore !== 'HIGH') riskScore = 'MEDIUM';
      }
    }

    return {
      formulaId,
      riskScore,
      violations,
      canProceed: riskScore !== 'HIGH',
      timestamp: new Date().toISOString(),
    };
  }

  async reviewFormula(
    formulaId: string,
    decision: 'APPROVE' | 'MINOR_FIX' | 'REJECT',
    notes?: string,
  ) {
    let status: FormulaStatus;

    switch (decision) {
      case 'APPROVE':
        status = FormulaStatus.BPOM_REGISTRATION_PROCESS;
        break;
      case 'MINOR_FIX':
        status = FormulaStatus.MINOR_COMPLIANCE_FIX;
        break;
      case 'REJECT':
        status = FormulaStatus.REVISION_REQUIRED;
        break;
    }

    return this.prisma.formula.update({
      where: { id: formulaId },
      data: { status },
    });
  }

  // --- SMART-GATES ---

  async checkScmGate(
    leadId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const pipeline = await this.prisma.regulatoryPipeline.findFirst({
      where: { leadId },
      include: { artworkReviews: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!pipeline) {
      return {
        allowed: false,
        reason:
          'SCM GATE: No regulatory pipeline found. BPOM registration required before packaging order.',
      };
    }

    const latestReview = pipeline.artworkReviews[0];
    if (!latestReview || !latestReview.isApproved) {
      return {
        allowed: false,
        reason: 'SCM GATE: Artwork not approved. Packaging order blocked.',
      };
    }

    return { allowed: true };
  }

  async checkProductionGate(
    leadId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const pipeline = await this.prisma.regulatoryPipeline.findFirst({
      where: { leadId },
    });

    if (!pipeline) {
      return {
        allowed: false,
        reason:
          'PRODUCTION GATE: No regulatory pipeline found. BPOM registration required before production.',
      };
    }

    if (!pipeline.registrationNo && pipeline.type === 'BPOM') {
      return {
        allowed: false,
        reason:
          'PRODUCTION GATE: BPOM NA Number missing. Filling & Packing blocked.',
      };
    }

    return { allowed: true };
  }

  // --- REGULATORY PIPELINE (PHASE 2) ---

  async getAllPipelines(query: {
    search?: string;
    stage?: string;
    client?: string;
  }) {
    const { search, stage, client } = query;
    const raw = await this.prisma.regulatoryPipeline.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { registrationNo: { contains: search, mode: 'insensitive' } },
                  {
                    lead: {
                      clientName: { contains: search, mode: 'insensitive' },
                    },
                  },
                  {
                    lead: {
                      brandName: { contains: search, mode: 'insensitive' },
                    },
                  },
                ],
              }
            : {},
          stage ? { currentStage: stage as RegStage } : {},
          client
            ? {
                lead: { clientName: { contains: client, mode: 'insensitive' } },
              }
            : {},
        ],
      },
      include: {
        lead: true,
        legalPic: true,
        artworkReviews: { orderBy: { createdAt: 'desc' }, take: 1 },
        pnbpRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lead: { updatedAt: 'desc' } },
    });

    return raw.map((p) => ({
      ...p,
      legalPIC: p.legalPic
        ? {
            id: p.legalPic.id,
            name: p.legalPic.fullName || p.legalPic.email || 'Unassigned',
          }
        : null,
    }));
  }

  async getPipelineDetails(id: string) {
    return this.prisma.regulatoryPipeline.findUnique({
      where: { id },
      include: {
        lead: true,
        legalPic: true,
        artworkReviews: true,
        pnbpRequests: true,
        materialItem: true,
      },
    });
  }

  async updatePipeline(id: string, data: any) {
    const current = await this.prisma.regulatoryPipeline.findUnique({
      where: { id },
    });
    if (!current) throw new ResourceNotFoundException('Regulatory Pipeline', id);

    const { notes, ...updateData } = data;
    const history = (current.logHistory as any[]) || [];

    if (data.currentStage && data.currentStage !== current.currentStage) {
      history.push({
        stage: data.currentStage,
        date: new Date().toISOString(),
        notes: notes || `Stage updated to ${data.currentStage}`,
      });
    }

    const updated = await this.prisma.regulatoryPipeline.update({
      where: { id },
      data: {
        ...updateData,
        logHistory: history as any,
      },
    });

    // TRIGGER A: If Published, unblock Production
    if (data.currentStage === RegStage.PUBLISHED) {
      this.eventEmitter.emit('legality.pipeline_published', {
        pipelineId: id,
        leadId: updated.leadId,
        registrationNo: updated.registrationNo,
      });
    }

    // TRIGGER B: If Revision, notify BusDev
    if (data.currentStage === RegStage.REVISION) {
      this.eventEmitter.emit('legality.pipeline_revision', {
        pipelineId: id,
        leadId: updated.leadId,
        notes: notes || 'Pipeline sent for revision.',
      });
    }

    return updated;
  }

  async getPipelineStats() {
    const all = await this.prisma.regulatoryPipeline.findMany();
    const scmBlocked = await this.prisma.regulatoryPipeline.count({
      where: { artworkReviews: { none: { isApproved: true } } },
    });

    const prodBlocked = await this.prisma.regulatoryPipeline.count({
      where: { currentStage: { not: RegStage.PUBLISHED } },
    });

    return {
      activeTotal: all.length,
      onProgress: all.filter((p) => p.currentStage !== RegStage.PUBLISHED)
        .length,
      blockedByFinance: all.filter((p) => !p.pnbpStatus).length,
      scmBlocked,
      prodBlocked,
    };
  }

  // --- COMPLIANCE INBOX & WORKSPACE (PHASE 3) ---

  private badRequest(reasonCode: string, message: string) {
    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message,
      reason_code: reasonCode,
    });
  }

  async governedArtworkByLead(
    leadIds: string[],
  ): Promise<Map<string, GovernedArtwork>> {
    const unique = [...new Set(leadIds)];
    const byLead = new Map<string, { artwork: GovernedArtwork; finalized: boolean }>();
    if (unique.length === 0) return new Map();

    const tasks = await this.prisma.designTask.findMany({
      where: { leadId: { in: unique } },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    });

    for (const task of tasks) {
      const current = byLead.get(task.leadId);
      if (current && (current.finalized || !task.isFinal)) continue;

      const version = task.versions[0];
      byLead.set(task.leadId, {
        artwork: {
          artworkUrl:
            (task.isFinal ? task.finalArtworkUrl : null) ??
            version?.artworkUrl ??
            null,
          previewUrl: version?.mockupUrl ?? null,
          version: version?.versionNumber ?? null,
        },
        finalized: task.isFinal,
      });
    }

    return new Map([...byLead].map(([leadId, entry]) => [leadId, entry.artwork]));
  }

  async getPendingTasks() {
    const pipelines = await this.prisma.regulatoryPipeline.findMany({
      where: { currentStage: { not: RegStage.PUBLISHED } },
      include: {
        lead: true,
        formula: { select: { id: true } },
        artworkReviews: { orderBy: { createdAt: 'desc' }, take: 1 },
        pnbpRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const artwork = await this.governedArtworkByLead(
      pipelines.map((p) => p.leadId),
    );

    const tasks = [];

    for (const p of pipelines) {
      // Task 1: Formula Validation (If newly created or in DRAFT)
      if (p.currentStage === RegStage.DRAFT) {
        tasks.push({
          id: `formula-${p.id}`,
          type: 'FORMULA_VALIDATION',
          priority: 'HIGH',
          title: `Validate Formula: ${p.lead?.brandName || 'Unnamed'}`,
          pipelineId: p.id,
          formulaId: (p as any).formula?.id || null,
          createdAt: p.createdAt,
        });
      }

      // Task 2: Artwork Review (If no approved review exists)
      const lastReview = p.artworkReviews[0];
      if (!lastReview || !lastReview.isApproved) {
        const artworkOfLead = artwork.get(p.leadId);
        tasks.push({
          id: `artwork-${p.id}`,
          type: 'ARTWORK_REVIEW',
          priority: 'MEDIUM',
          title: `Review Artwork: ${p.lead?.brandName || 'Unnamed'}`,
          pipelineId: p.id,
          createdAt: lastReview?.createdAt || p.createdAt,
          artworkUrl: artworkOfLead?.artworkUrl ?? null,
          artworkPreviewUrl: artworkOfLead?.previewUrl ?? null,
          artworkVersion: artworkOfLead?.version ?? null,
        });
      }

      // Task 3: PNBP Filing (If pnbpStatus is false and not yet requested)
      if (!p.pnbpStatus && (p as any).pnbpRequests.length === 0) {
        tasks.push({
          id: `pnbp-${p.id}`,
          type: 'PNBP_FILING',
          priority: 'MEDIUM',
          title: `File PNBP Request: ${(p as any).lead?.brandName || 'Unnamed'}`,
          pipelineId: p.id,
          createdAt: p.createdAt,
        });
      }
    }

    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async submitArtworkReview(
    pipelineId: string,
    data: { isApproved: boolean; notes: string; reviewer: string },
  ) {
    const pipeline = await this.prisma.regulatoryPipeline.findUnique({
      where: { id: pipelineId },
      include: { pnbpRequests: { where: { isPaid: true } } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found');

    const governed = (
      await this.governedArtworkByLead([pipeline.leadId])
    ).get(pipeline.leadId);
    if (!governed?.artworkUrl) {
      throw this.badRequest(
        ARTWORK_NOT_ON_FILE,
        'Belum ada artwork pada versi desain ini. Minta Creative mengunggah versi terlebih dahulu.',
      );
    }

    const review = await this.prisma.artworkReview.create({
      data: {
        pipelineId,
        isApproved: data.isApproved,
        notes: data.notes,
        designerPicId: (await this.prisma.user.findFirst())?.id || '', // Fallback
        artworkUrl: governed.artworkUrl,
      },
    });

    if (data.isApproved) {
      if (
        pipeline.currentStage === RegStage.SUBMITTED &&
        pipeline.pnbpRequests.length > 0
      ) {
        await this.updatePipeline(pipelineId, {
          currentStage: RegStage.EVALUATION,
          notes: 'AUTO-ADVANCE: Artwork approved and PNBP Paid.',
        });
      }
    }

    return review;
  }

  async requestPNBP(
    pipelineId: string,
    data: {
      amount: number;
      description: string;
      pic: string;
      billingCode?: string;
    },
  ) {
    return this.prisma.pNBPRequest.create({
      data: {
        pipelineId,
        amount: data.amount,
        billingCode: data.billingCode || null,
        isPaid: false,
      },
    });
  }

  async payPnbp(
    pnbpId: string,
    financeRecordId: string,
  ): Promise<{ success: boolean; message: string }> {
    const pnbp = await this.prisma.pNBPRequest.findUnique({
      where: { id: pnbpId },
      include: { pipeline: true },
    });

    if (!pnbp) {
      return { success: false, message: 'PNBP Request not found' };
    }

    if (pnbp.isPaid) {
      return { success: false, message: 'PNBP already paid' };
    }

    await this.prisma.pNBPRequest.update({
      where: { id: pnbpId },
      data: {
        isPaid: true,
        paidAt: new Date(),
        financeRecordId,
      },
    });

    this.eventEmitter.emit('legality.pnbp_paid', { pnbpId });

    return {
      success: true,
      message: `PNBP ${pnbpId} verified. Pipeline advancing to EVALUATION.`,
    };
  }

  // --- MASTER INCI MANAGEMENT ---

  async getMasterIncis(query: { search?: string; category?: string }) {
    const { search, category } = query;
    return this.prisma.masterInci.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { inciName: { contains: search, mode: 'insensitive' } },
                  { casNumber: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          category && category !== 'ALL'
            ? { category: category as IngredientCategory }
            : {},
        ],
      },
      orderBy: { inciName: 'asc' },
    });
  }

  async createMasterInci(data: any) {
    return this.prisma.masterInci.create({ data });
  }

  async updateMasterInci(id: string, data: any) {
    return this.prisma.masterInci.update({
      where: { id },
      data,
    });
  }

  async deleteMasterInci(id: string) {
    return this.prisma.masterInci.delete({ where: { id } });
  }

  async bulkImportMasterInci(items: any[]) {
    let importedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const existing = await this.prisma.masterInci.findUnique({
        where: { inciName: item.inciName },
      });

      if (existing) {
        await this.prisma.masterInci.update({
          where: { id: existing.id },
          data: item,
        });
        updatedCount++;
      } else {
        await this.prisma.masterInci.create({ data: item });
        importedCount++;
      }
    }

    return { importedCount, updatedCount };
  }
}
