import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import {
  LegalStatus,
  FormulaStatus,
  IngredientCategory,
  ClaimRisk,
  RegStage,
  RegType,
} from '@prisma/client';

import { BussdevService } from '../bussdev/bussdev.service';

@Injectable()
export class LegalityService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => BussdevService))
    private bussdevService: BussdevService,
  ) {}

  async getDashboardMetrics() {
    const today = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + 90);

    const hkiAll = await this.prisma.hkiRecord.findMany({
      include: { pic: true },
    });
    const bpomAll = await this.prisma.bpomRecord.findMany({
      include: { pic: true },
    });

    // 1. Overall Metrics
    const thisMonthRecords = [...hkiAll, ...bpomAll].filter((r) => {
      const d = new Date(r.applicationDate);
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });
    const delayedRecords = [...hkiAll, ...bpomAll].filter(
      (r) =>
        r.status === LegalStatus.IN_PROGRESS &&
        r.expiryDate &&
        new Date(r.expiryDate) < today,
    );
    const expiredRecords = [...hkiAll, ...bpomAll].filter(
      (r) => r.expiryDate && new Date(r.expiryDate) < today,
    );
    const criticalHkis = hkiAll.filter(
      (r) =>
        r.expiryDate &&
        new Date(r.expiryDate) <= expiryThreshold &&
        new Date(r.expiryDate) >= today,
    );
    const criticalBpoms = bpomAll.filter(
      (r) =>
        r.expiryDate &&
        new Date(r.expiryDate) <= expiryThreshold &&
        new Date(r.expiryDate) >= today,
    );
    const criticalTotal = criticalHkis.length + criticalBpoms.length;

    // Compute average processing time
    const bpomDays = bpomAll
      .filter((r) => r.status === LegalStatus.DONE)
      .map((r) =>
        Math.floor(
          (new Date(r.expiryDate || today).getTime() -
            new Date(r.applicationDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
    const avgBpomDays =
      bpomDays.length > 0
        ? Math.round(bpomDays.reduce((a, b) => a + b, 0) / bpomDays.length)
        : 45;
    const hkiDays = hkiAll
      .filter((r) => r.status === LegalStatus.DONE)
      .map((r) =>
        Math.floor(
          (new Date(r.expiryDate || today).getTime() -
            new Date(r.applicationDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
    const avgHkiDays =
      hkiDays.length > 0
        ? Math.round(hkiDays.reduce((a, b) => a + b, 0) / hkiDays.length)
        : 120;

    // 3. Performance & Tables Data
    const staffs = await this.prisma.legalStaff.findMany({
      include: {
        _count: { select: { hkis: true, bpoms: true } },
        hkis: { where: { status: LegalStatus.DONE } },
        bpoms: { where: { status: LegalStatus.DONE } },
      },
    });

    const staffPerformance = staffs.map((s) => {
      const done = s.hkis.length + s.bpoms.length;
      const total = s._count.hkis + s._count.bpoms;
      const winRate = total > 0 ? (done / total) * 100 : 0;
      return {
        name: s.name,
        avg: `AVG: ${avgBpomDays}d`,
        stat: `${done} / ${total}`,
        delay: `${Math.max(0, total - done)} DELAYED`,
        rate: `${Math.round(winRate)}%`,
        color:
          winRate >= 80
            ? 'text-emerald-500'
            : winRate >= 50
              ? 'text-amber-500'
              : 'text-rose-500',
      };
    });

    const pipelines = await this.prisma.regulatoryPipeline.findMany({
      include: { lead: true, legalPic: true, artworkReviews: { take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
    const activePipelineCount = pipelines.filter(
      (p) => p.currentStage !== RegStage.PUBLISHED,
    ).length;
    const activeTotal =
      hkiAll.filter((r) => r.status === LegalStatus.IN_PROGRESS).length +
      bpomAll.filter((r) => r.status === LegalStatus.IN_PROGRESS).length;

    return {
      overall: {
        activeTotal: activeTotal + activePipelineCount,
        thisMonth: thisMonthRecords.length,
        onProgress: activeTotal + activePipelineCount,
        delayed: delayedRecords.length,
      },
      pipeline: {
        activeTotal: pipelines.length,
        onProgress: activePipelineCount,
        blockedByFinance: pipelines.filter((p) => !p.pnbpStatus).length,
        scmBlocked: pipelines.filter(
          (p: any) => !p.artworkReviews?.some((a: any) => a.isApproved),
        ).length,
        prodBlocked: pipelines.filter(
          (p) => p.currentStage !== RegStage.PUBLISHED,
        ).length,
      },
      bpomStats: {
        avgTime: `${avgBpomDays} Days`,
        labTest:
          bpomAll.filter((r) => r.stage === 'SUBMITTED').length +
          pipelines.filter(
            (p) =>
              p.type === RegType.BPOM && p.currentStage === RegStage.SUBMITTED,
          ).length,
        govEval:
          bpomAll.filter((r) => r.stage === 'EVALUATION').length +
          pipelines.filter(
            (p) =>
              p.type === RegType.BPOM && p.currentStage === RegStage.EVALUATION,
          ).length,
      },
      hkiStats: {
        avgTime: `${avgHkiDays} Days`,
        docPrep:
          hkiAll.filter((r) => r.stage === 'DRAFT').length +
          pipelines.filter(
            (p) =>
              (p.type === RegType.HKI_BRAND || p.type === RegType.HKI_LOGO) &&
              p.currentStage === RegStage.DRAFT,
          ).length,
        govProcess:
          hkiAll.filter((r) => r.stage === 'EVALUATION').length +
          pipelines.filter(
            (p) =>
              (p.type === RegType.HKI_BRAND || p.type === RegType.HKI_LOGO) &&
              p.currentStage === RegStage.EVALUATION,
          ).length,
      },
      riskMonitor: {
        expired: expiredRecords.length,
        under90Days: criticalTotal,
        criticalAction: expiredRecords.length > 0 ? expiredRecords.length : 0,
      },
      recentActivity: pipelines.slice(0, 10).map((p) => ({
        action: `${p.type} REGISTRATION INITIATED`,
        target: p.lead.brandName || p.lead.clientName,
        pic: p.legalPic?.fullName || p.legalPic?.email || 'UNASSIGNED',
        time: 'Just now',
      })),
      tables: {
        hkiTracking: hkiAll.map((r) => {
          const tm = this.injectTimeMetrics(r);
          return {
            brand: tm.brandName,
            id: tm.hkiId,
            type: tm.type,
            client: tm.clientName,
            pic: tm.pic?.name || 'UNASSIGNED',
            apply: new Date(tm.applicationDate).toISOString().split('T')[0],
            flow: tm.stage?.replace(/_/g, ' '),
            days: `${tm.daysElapsed} DAYS ELAPSED`,
            status: tm.status,
            risk: tm.auditRisk === 'DELAY' ? 'DELAY AUDIT' : 'OK',
          };
        }),
        bpomProgress: bpomAll.map((r) => {
          const tm = this.injectTimeMetrics(r);
          return {
            name: tm.productName,
            id: tm.bpomId,
            cat: tm.category,
            client: tm.clientName,
            pic: tm.pic?.name || 'UNASSIGNED',
            date: new Date(tm.applicationDate).toISOString().split('T')[0],
            stage: tm.stage?.replace(/_/g, ' '),
            status:
              tm.status === 'DONE'
                ? 'DONE'
                : tm.daysElapsed > 90
                  ? 'IN_PROGRESS_ROSE'
                  : 'IN_PROGRESS',
            days: `${tm.daysElapsed}d`,
          };
        }),
        pipelines: pipelines.map((p) => ({
          id: p.id,
          brand: p.lead.brandName,
          type: p.type,
          stage: p.currentStage,
          pnbp: p.pnbpStatus ? 'PAID' : 'PENDING',
        })),
        criticalExpiry: [...criticalHkis, ...criticalBpoms].map((r) => {
          const isBpom = 'bpomId' in r;
          const tm = this.injectTimeMetrics(r);
          const daysLeft = tm.daysLeft ?? 0;
          return {
            type: tm.brandName || tm.productName,
            sub: `[${isBpom ? 'BPOM' : 'HKI'}] | CLIENT: ${tm.clientName}`,
            cert: isBpom ? tm.bpomId : tm.hkiId,
            expiry: tm.expiryDate
              ? new Date(tm.expiryDate).toISOString().split('T')[0]
              : 'N/A',
            left: `${daysLeft}D`,
            color:
              daysLeft <= 0
                ? 'bg-rose-500'
                : daysLeft <= 90
                  ? 'bg-amber-500'
                  : 'bg-emerald-500',
          };
        }),
        staffHistory: staffPerformance,
      },
    };
  }

  async getHkiRecords() {
    const records = await this.prisma.hkiRecord.findMany({
      include: { pic: true },
      orderBy: { applicationDate: 'desc' },
    });
    return records.map((r) => this.injectTimeMetrics(r));
  }

  async createHki(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.hkiRecord.create({
        data: {
          ...data,
          status: LegalStatus.IN_PROGRESS,
          stage: 'DRAFT',
          auditRisk: 'OK',
        },
      });

      await tx.legalTimelineLog.create({
        data: {
          recordId: record.id,
          recordType: 'HKI',
          action: 'CREATED',
          newStage: 'DRAFT',
          notes: 'Record initialized in auditory log.',
          staffName: 'System', // Idealnya dari req.user
        },
      });

      return record;
    });
  }

  async advanceHkiStage(id: string) {
    const record = await this.prisma.hkiRecord.findUnique({ where: { id } });
    if (!record) throw new Error('HKI Record not found');

    let nextStage = record.stage;
    let nextStatus = record.status;

    if (record.stage === 'DRAFT') {
      nextStage = 'SUBMITTED';
    } else if (record.stage === 'SUBMITTED') {
      nextStage = 'EVALUATION';
    } else if (record.stage === 'EVALUATION') {
      nextStage = 'PUBLISHED';
      nextStatus = LegalStatus.DONE;
    }

    return this.addLog({
      recordId: id,
      recordType: 'HKI',
      action: 'STAGE_UPDATED',
      previousStage: record.stage,
      newStage: nextStage,
      notes: `Automated advance from ${record.stage} to ${nextStage}`,
      staffName: 'System',
    });
  }

  async getBpomRecords() {
    const records = await this.prisma.bpomRecord.findMany({
      include: { pic: true },
      orderBy: { applicationDate: 'desc' },
    });
    return records.map((r) => this.injectTimeMetrics(r));
  }

  async createBpom(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.bpomRecord.create({
        data: {
          ...data,
          status: LegalStatus.IN_PROGRESS,
          stage: 'DRAFT',
          auditRisk: 'OK',
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
    if (!record) throw new Error('BPOM Record not found');

    let nextStage = record.stage;
    let nextStatus = record.status;

    if (record.stage === 'DRAFT') {
      nextStage = 'SUBMITTED';
    } else if (record.stage === 'SUBMITTED') {
      nextStage = 'EVALUATION';
    } else if (record.stage === 'EVALUATION') {
      nextStage = 'PUBLISHED';
      nextStatus = LegalStatus.DONE;
    }

    return this.addLog({
      recordId: id,
      recordType: 'BPOM',
      action: 'STAGE_UPDATED',
      previousStage: record.stage,
      newStage: nextStage,
      notes: `Automated advance from ${record.stage} to ${nextStage}`,
      staffName: 'System',
    });
  }

  async addLog(payload: any) {
    return this.prisma.$transaction(async (tx) => {
      const {
        recordId,
        recordType,
        action,
        previousStage,
        newStage,
        notes,
        staffName,
      } = payload;

      // Update main record
      if (recordType === 'HKI') {
        const status =
          newStage === 'PUBLISHED' ? LegalStatus.DONE : LegalStatus.IN_PROGRESS;
        await tx.hkiRecord.update({
          where: { id: recordId },
          data: { stage: newStage, status },
        });
      } else if (recordType === 'BPOM') {
        const status =
          newStage === 'PUBLISHED' ? LegalStatus.DONE : LegalStatus.IN_PROGRESS;
        await tx.bpomRecord.update({
          where: { id: recordId },
          data: { stage: newStage, status },
        });

        if (newStage === 'PUBLISHED') {
          const bpom = await tx.bpomRecord.findUnique({
            where: { id: recordId },
            include: { pic: true },
          });
          this.eventEmitter.emit('BPOM_REGISTERED', {
            employeeId: (bpom as any)?.pic?.userId,
            referenceId: recordId,
            metadata: { newStage, status, recordType },
          });
        }
      }

      // Create log entry
      return tx.legalTimelineLog.create({
        data: {
          recordId,
          recordType,
          action,
          previousStage,
          newStage,
          notes,
          staffName,
        },
      });
    });
  }

  async getLogs(recordId: string) {
    return this.prisma.legalTimelineLog.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStaffs() {
    const staffs = await this.prisma.legalStaff.findMany();
    return staffs.map((s) => ({
      ...s,
      department:
        s.role === 'LEGAL_OFFICER'
          ? 'Compliance'
          : s.role === 'LEGAL_MANAGER'
            ? 'Legal Management'
            : 'Legal',
    }));
  }

  async getPermits() {
    const bpomWithReg = await this.prisma.bpomRecord.findMany({
      where: { bpomId: { not: '' } },
      orderBy: { applicationDate: 'desc' },
    });
    const hkiWithReg = await this.prisma.hkiRecord.findMany({
      where: { hkiId: { not: '' } },
      orderBy: { applicationDate: 'desc' },
    });
    const permits: Array<{
      id: string;
      name: string;
      type: string;
      expiry: string;
      status: string;
      issuer: string;
    }> = [];

    for (const bpom of bpomWithReg) {
      const expired = bpom.expiryDate && new Date(bpom.expiryDate) < new Date();
      const expiring =
        bpom.expiryDate &&
        new Date(bpom.expiryDate) > new Date() &&
        new Date(bpom.expiryDate) <= new Date(Date.now() + 90 * 86400000);
      permits.push({
        id: bpom.bpomId,
        name: `Izin Edar BPOM — ${bpom.productName}`,
        type: 'Health/Cosmetic',
        expiry: bpom.expiryDate
          ? new Date(bpom.expiryDate).toISOString().split('T')[0]
          : 'N/A',
        status: expired ? 'EXPIRED' : expiring ? 'EXPIRING_SOON' : 'ACTIVE',
        issuer: 'BPOM RI',
      });
    }

    for (const hki of hkiWithReg) {
      const expired = hki.expiryDate && new Date(hki.expiryDate) < new Date();
      const expiring =
        hki.expiryDate &&
        new Date(hki.expiryDate) > new Date() &&
        new Date(hki.expiryDate) <= new Date(Date.now() + 90 * 86400000);
      permits.push({
        id: hki.hkiId,
        name: `${hki.type} — ${hki.brandName}`,
        type: 'Trademark',
        expiry: hki.expiryDate
          ? new Date(hki.expiryDate).toISOString().split('T')[0]
          : 'N/A',
        status: expired ? 'EXPIRED' : expiring ? 'EXPIRING_SOON' : 'ACTIVE',
        issuer: 'DJKI',
      });
    }

    permits.push(
      {
        id: 'PRM-IUI-001',
        name: 'Izin Usaha Industri',
        type: 'Operational',
        expiry: '2027-11-30',
        status: 'ACTIVE',
        issuer: 'OSS / Kemenperin',
      },
      {
        id: 'PRM-HALAL-001',
        name: 'Sertifikasi Halal (Logistik)',
        type: 'Compliance',
        expiry: '2026-06-20',
        status: 'ACTIVE',
        issuer: 'MUI / BPJPH',
      },
    );

    return permits.sort((a, b) => a.status.localeCompare(b.status));
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

    if (!formula) throw new Error('Formula not found');

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
    // Check if lead has artwork review approved
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
    // Check if lead has BPOM registration number
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
    if (!current) throw new Error('Pipeline not found');

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

    // In real app, we would join with Production Schedule
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
        tasks.push({
          id: `artwork-${p.id}`,
          type: 'ARTWORK_REVIEW',
          priority: 'MEDIUM',
          title: `Review Artwork: ${p.lead?.brandName || 'Unnamed'}`,
          pipelineId: p.id,
          createdAt: lastReview?.createdAt || p.createdAt,
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
    const review = await this.prisma.artworkReview.create({
      data: {
        pipelineId,
        isApproved: data.isApproved,
        notes: data.notes,
        designerPicId: (await this.prisma.user.findFirst())?.id || '', // Fallback
        artworkUrl: 'https://placehold.co/600x400', // Placeholder for real storage link
      },
    });

    // If artwork is approved, check if we should advance stage
    if (data.isApproved) {
      const p = await this.prisma.regulatoryPipeline.findUnique({
        where: { id: pipelineId },
        include: { pnbpRequests: { where: { isPaid: true } } },
      });

      if (
        p &&
        p.currentStage === RegStage.SUBMITTED &&
        (p as any).pnbpRequests.length > 0
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
    data: { amount: number; description: string; pic: string },
  ) {
    return this.prisma.pNBPRequest.create({
      data: {
        pipelineId,
        amount: data.amount,
        billingCode: data.description, // Mapping description to billingCode for now
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

    // Emit event for legality.listener to advance pipeline
    this.eventEmitter.emit('legality.pnbp_paid', { pnbpId });

    return {
      success: true,
      message: `PNBP ${pnbpId} verified. Pipeline advancing to EVALUATION.`,
    };
  }

  private injectTimeMetrics(record: any) {
    const today = new Date();
    const appDate = new Date(record.applicationDate);

    // Days Elapsed since Application
    const daysElapsed = Math.floor(
      (today.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Days Left until Expiry
    let daysLeft: number | null = null;
    if (record.expiryDate) {
      const expDate = new Date(record.expiryDate);
      daysLeft = Math.floor(
        (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      ...record,
      daysElapsed,
      daysLeft,
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
