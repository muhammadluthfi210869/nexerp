import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { CreateSampleDto } from './dto/create-sample-request.dto';
import { AdvanceSampleDto } from './dto/advance-sample-request.dto';
import {
  SampleStage,
  WorkflowStatus,
  Division,
  StreamEventType,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT } from '../activity-stream/events/activity.events';

import { IdGeneratorService } from '../system/id-generator.service';

@Injectable()
export class RndService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  async createSample(dto: CreateSampleDto) {
    const sampleCode = await this.idGenerator.generateId('SMP');
    return this.prisma.$transaction(async (tx) => {
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
          stage: SampleStage.QUEUE,
          stageLogs: {
            create: {
              stage: SampleStage.QUEUE,
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

  async acceptSample(sampleId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({
        where: { id: sampleId },
      });

      if (!sample) throw new NotFoundException('Sample request not found');

      if (!sample.paymentApprovedAt) {
        throw new BadRequestException(
          'PAYMENT_REQUIRED: Sample cannot be accepted without Finance approval of the sample payment proof.',
        );
      }

      // 1. Update Sample Status
      const updatedSample = await tx.sampleRequest.update({
        where: { id: sampleId },
        data: {
          stage: SampleStage.FORMULATING,
        },
      });

      // 2. Generate Formula Code
      const formulaCode = await this.idGenerator.generateId('FRM');

      // 3. Create Blank Formula V1
      const formula = await tx.formula.create({
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
          qcParameters: {
            create: {},
          },
        },
      });

      // 4. Log Activity
      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: sample.leadId,
        senderDivision: Division.RND,
        eventType: StreamEventType.STATE_CHANGE,
        notes: `R&D Menerima Task: Formula V1 (${formulaCode}) diinisialisasi.`,
        loggedBy: 'SYSTEM_RND',
      });

      return {
        sample: updatedSample,
        formula: formula,
      };
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

  async advanceSampleStage(sampleId: string, dto: AdvanceSampleDto) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.sampleRequest.findUnique({
        where: { id: sampleId },
      });

      if (!current) throw new NotFoundException('Sample request not found');

      // Validate state transition
      const allowedTransitions = this.sampleStageTransitions[current.stage];
      if (!allowedTransitions || !allowedTransitions.includes(dto.newStage)) {
        throw new BadRequestException(
          `STATE_TRANSITION_INVALID: Tidak bisa berpindah dari ${current.stage} ke ${dto.newStage}. ` +
            `Transisi yang diizinkan: ${(allowedTransitions || []).join(', ') || 'tidak ada'}.`,
        );
      }

      const updateData: any = {
        stage: dto.newStage,
      };

      if (dto.newStage === SampleStage.APPROVED) {
        updateData.completedAt = new Date();
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

  async getDashboardMetrics() {
    const allSamples = await this.prisma.sampleRequest.findMany({
      include: {
        pic: true,
        lead: {
          select: {
            clientName: true,
            brandName: true,
            pic: { select: { name: true } },
          },
        },
        stageLogs: true,
        formulas: { select: { version: true } },
      },
    });

    const activeSamples = allSamples.filter(
      (s) =>
        s.stage !== SampleStage.APPROVED && s.stage !== SampleStage.CANCELLED,
    );
    const completedSamples = allSamples.filter(
      (s) => s.stage === SampleStage.APPROVED,
    );
    const rejectedSamples = allSamples.filter(
      (s) => s.stage === SampleStage.REJECTED,
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
    const firstTimeApprovedCount = completedSamples.filter(
      (s) => (s.revisionCount || 0) === 0,
    ).length;
    const firstTimeApprovalRate =
      completedSamples.length > 0
        ? (firstTimeApprovedCount / completedSamples.length) * 100
        : 0;

    const avgRevisions =
      allSamples.length > 0
        ? allSamples.reduce((sum, s) => sum + (s.revisionCount || 0), 0) /
          allSamples.length
        : 0;

    // 3. PERFORMANCE EVALUATION (PER PIC)
    const staffs = await this.prisma.user.findMany({
      where: { roles: { has: 'RND' } },
      include: { rndSamples: { include: { stageLogs: true } } },
    });

    const performanceEvaluation = staffs.map((staff) => {
      const mySamples = allSamples.filter((s) => s.picId === staff.id);
      const myCompleted = mySamples.filter(
        (s) => s.stage === SampleStage.APPROVED,
      );

      // Efficiency: On-Time Rate for completed projects
      const onTimeCompleted = myCompleted.filter(
        (s) => !s.targetDeadline || s.completedAt! <= s.targetDeadline,
      ).length;
      const efficiency =
        myCompleted.length > 0
          ? Math.round((onTimeCompleted / myCompleted.length) * 100)
          : 0;

      // Quality: 100 - (Avg Revisions * 15)
      const myAvgRevisions =
        mySamples.length > 0
          ? mySamples.reduce((sum, s) => sum + (s.revisionCount || 0), 0) /
            mySamples.length
          : 0;
      const quality = Math.max(0, 100 - Math.round(myAvgRevisions * 15));

      // Utilization: Active samples vs Capacity (Assume max 10 projects/person)
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
          (completedSamples.length / (allSamples.length || 1)) * 100,
        ),
        submitted: allSamples.length,
        approved: completedSamples.length,
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

  async getSample(id: string) {
    return this.prisma.sampleRequest.findUnique({
      where: { id },
      include: {
        lead: { include: { pic: true } },
        pic: true,
        formulas: {
          orderBy: { version: 'desc' },
          include: {
            phases: { include: { items: true } },
          },
        },
        feedbacks: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getInboxSamples() {
    return this.prisma.sampleRequest.findMany({
      where: {
        stage: SampleStage.QUEUE,
      },
      include: {
        lead: { include: { pic: true } },
        pic: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSamples() {
    return this.prisma.sampleRequest.findMany({
      include: {
        lead: { include: { pic: true } },
        pic: true,
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

  async assignPIC(id: string, picId: string) {
    return this.prisma.sampleRequest.update({
      where: { id },
      data: { picId },
    });
  }

  async getVersions(sampleId: string) {
    return this.prisma.formula.findMany({
      where: { sampleRequestId: sampleId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getFeedback(sampleId: string) {
    return this.prisma.sampleFeedback.findMany({
      where: { sampleRequestId: sampleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLabTestResults(formulaId: string) {
    return this.prisma.labTestResult.findMany({
      where: { formulaId },
      include: { tester: { select: { fullName: true } } },
      orderBy: { testDate: 'desc' },
    });
  }

  async createLabTestResult(dto: {
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
  }) {
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

  async getAllLabTestResults(type?: string) {
    const where: any = {};
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
}
