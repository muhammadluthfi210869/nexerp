import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  WorkflowStatus,
  SampleStage,
  SOStatus,
  StreamEventType,
  Division,
} from '@prisma/client';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';
import { ScmService } from '../../scm/services/scm.service';

@Injectable()
export class PipelineService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => ScmService))
    private scmService: ScmService,
  ) {}

  async getLeads() {
    return this.prisma.salesLead.findMany({
      include: {
        pic: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeadsByGroup(
    group: 'guest' | 'sample' | 'production' | 'ro' | 'lost',
  ) {
    let where: any = {};

    switch (group) {
      case 'guest':
        where = { status: WorkflowStatus.NEW_LEAD };
        break;
      case 'sample':
        where = {
          status: {
            in: [
              WorkflowStatus.CONTACTED,
              WorkflowStatus.NEGOTIATION,
              WorkflowStatus.SAMPLE_REQUESTED,
              WorkflowStatus.SAMPLE_APPROVED,
            ],
          },
        };
        break;
      case 'production':
        where = {
          status: {
            in: [
              WorkflowStatus.SPK_SIGNED,
              WorkflowStatus.PRODUCTION_PLAN,
              WorkflowStatus.READY_TO_SHIP,
            ],
          },
        };
        break;
      case 'ro':
        where = { status: WorkflowStatus.WON_DEAL };
        break;
      case 'lost':
        where = { status: WorkflowStatus.LOST };
        break;
    }

    const leads = await this.prisma.salesLead.findMany({
      where,
      include: {
        pic: { select: { id: true, name: true, userId: true } },
        timelineLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        sampleRequests: { take: 1, orderBy: { updatedAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return leads.map((lead) => ({
      id: lead.id,
      clientName: lead.clientName,
      brandName: lead.brandName,
      productInterest: lead.productInterest,
      category: lead.categoryEnum,
      source: lead.source,
      moq: lead.moq,
      unitPrice: Number(lead.unitPrice || 0),
      estimatedValue: Number(lead.estimatedValue || 0),
      status: lead.status,
      notes: lead.notes,
      slaDays: Math.floor(
        (Date.now() - (lead.lastStageAt || lead.createdAt).getTime()) /
          86400000,
      ),
      lastActionBy: lead.timelineLogs?.[0]?.loggedBy || null,
      lastActionAt: lead.timelineLogs?.[0]?.createdAt || null,
    }));
  }

  async getStaffs() {
    return this.prisma.bussdevStaff.findMany({
      where: { isActive: true },
      select: { id: true, name: true, userId: true },
    });
  }

  async getPipelineV2Leads() {
    const leads = await this.prisma.salesLead.findMany({
      where: {
        NOT: [
          { status: WorkflowStatus.WON_DEAL },
          { status: WorkflowStatus.LOST },
          { status: WorkflowStatus.ABORTED },
        ],
      },
      include: {
        pic: { select: { name: true } },
        timelineLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return leads.map((lead) => ({
      id: lead.id,
      clientName: lead.clientName,
      brandName: lead.brandName,
      productInterest: lead.productInterest,
      category: lead.category?.name || lead.categoryEnum || null,
      estimatedValue: Number(lead.estimatedValue),
      status: lead.status,
      slaDays: Math.floor(
        (Date.now() - (lead.lastStageAt || lead.createdAt).getTime()) /
          86400000,
      ),
      lastActionBy: lead.timelineLogs?.[0]?.loggedBy || null,
      lastActionAt: lead.timelineLogs?.[0]?.createdAt || null,
      notes: lead.notes || lead.timelineLogs?.[0]?.notes || null,
    }));
  }

  async getPipelineV2Audit() {
    const logs = await this.prisma.leadTimelineLog.findMany({
      where: {
        action: { not: 'CREATED' },
      },
      include: {
        lead: { select: { clientName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => {
      const effects: string[] = [];
      if (log.newStatus === 'SAMPLE_REQUESTED')
        effects.push('R&D: NPF & Sample Request Created');
      if (log.newStatus === 'SPK_SIGNED')
        effects.push('System: SO PENDING_DP Created');
      if (log.newStatus === 'WAITING_FINANCE_APPROVAL') {
        if (log.previousStatus === 'SPK_SIGNED')
          effects.push('Finance: G2 Production DP Notification');
        if (log.previousStatus === 'SAMPLE_REQUESTED')
          effects.push('Finance: G1 Sample Payment Notification');
      }
      if (log.action === 'SO_DRAFT_CREATED')
        effects.push('System: Sales Order Drafted');
      if (log.action === 'SAMPLE_SHIPPED')
        effects.push('Logistics: Sample in transit');

      return {
        id: log.id,
        timestamp: log.createdAt,
        clientName: log.lead.clientName,
        fromStage: log.previousStatus,
        toStage: log.newStatus,
        action: log.action,
        performedBy: log.loggedBy,
        effects: effects.length > 0 ? effects : ['Status updated'],
        artifacts: [] as string[],
      };
    });
  }

  async checkSalesOrderReadiness(leadId: string) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
      include: {
        registrations: true,
        designTasks: true,
        salesOrders: {
          where: { status: SOStatus.LOCKED_ACTIVE },
        },
      },
    });

    if (!lead || lead.salesOrders.length === 0) return;

    const so = lead.salesOrders[0];

    const legalReady =
      lead.registrations.length > 0 &&
      lead.registrations.every((r) => r.currentStage === 'PUBLISHED');

    const designReady =
      lead.designTasks.length > 0 &&
      lead.designTasks.every((t) => t.kanbanState === 'LOCKED');

    const scmReady = { status: 'READY' };

    console.log(`[PROD_HANDOVER] Readiness for Lead ${lead.brandName}:`, {
      legalReady,
      designReady,
      scmReady: scmReady.status === 'READY',
    });

    if (legalReady && designReady && scmReady.status === 'READY') {
      await this.prisma.$transaction(async (tx) => {
        await tx.salesOrder.update({
          where: { id: so.id },
          data: { status: SOStatus.READY_TO_PRODUCE },
        });

        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: leadId,
          senderDivision: Division.SYSTEM,
          eventType: StreamEventType.STATE_CHANGE,
          notes: `AUTOMATED HANDOVER: Semua jalur paralel (Legal, Design, SCM) telah OK. Order siap diproduksi.`,
          loggedBy: 'SYSTEM_ORCHESTRATOR',
        });
      });
    }
  }

  async createTask(
    leadId: string,
    brief: string,
    soId?: string,
    taskType?: string,
  ) {
    return this.prisma.designTask.create({
      data: {
        leadId,
        brief,
        soId,
        taskType,
      },
    });
  }

  async getClientSamples() {
    return this.prisma.sampleRequest.findMany({
      where: {
        stage: {
          in: [
            SampleStage.LAB_TEST,
            SampleStage.READY_TO_SHIP,
            SampleStage.SHIPPED,
            SampleStage.RECEIVED,
            SampleStage.CLIENT_REVIEW,
          ],
        },
      },
      include: {
        lead: {
          include: { pic: true },
        },
        pic: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async shipSample(
    id: string,
    dto: { courierName: string; trackingNumber: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({
        where: { id },
        include: { lead: true },
      });

      if (!sample) throw new NotFoundException('Sample not found');

      const updatedSample = await tx.sampleRequest.update({
        where: { id },
        data: {
          courierName: dto.courierName,
          trackingNumber: dto.trackingNumber,
          shippedAt: new Date(),
          stage: SampleStage.SHIPPED,
        },
      });

      await tx.leadTimelineLog.create({
        data: {
          leadId: sample.leadId,
          action: 'SAMPLE_SHIPPED',
          notes: `Sampel dikirim via ${dto.courierName} (Resi: ${dto.trackingNumber})`,
          loggedBy: 'LOGISTICS_HUB',
        },
      });

      return updatedSample;
    });
  }

  async submitSampleFeedback(
    id: string,
    dto: {
      rating: number;
      comment: string;
      status: 'APPROVED' | 'REVISION';
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({
        where: { id },
        include: { lead: true },
      });

      if (!sample) throw new NotFoundException('Sample not found');

      const updatedSample = await tx.sampleRequest.update({
        where: { id },
        data: {
          clientRating: dto.rating,
          clientComment: dto.comment,
          stage:
            dto.status === 'APPROVED'
              ? SampleStage.APPROVED
              : SampleStage.QUEUE,
          isApprovedByClient: dto.status === 'APPROVED',
          revisionCount:
            dto.status === 'REVISION'
              ? sample.revisionCount + 1
              : sample.revisionCount,
          feedbackHistory:
            dto.status === 'REVISION'
              ? JSON.parse(
                  JSON.stringify([
                    ...((sample.feedbackHistory as any[]) || []),
                    {
                      stage: 'CLIENT_FEEDBACK',
                      rating: dto.rating,
                      comment: dto.comment,
                      timestamp: new Date(),
                    },
                  ]),
                )
              : sample.feedbackHistory,
        },
      });

      const newLeadStage =
        dto.status === 'APPROVED'
          ? WorkflowStatus.SAMPLE_APPROVED
          : WorkflowStatus.SAMPLE_REQUESTED;
      await tx.salesLead.update({
        where: { id: sample.leadId },
        data: { status: newLeadStage },
      });

      await tx.leadTimelineLog.create({
        data: {
          leadId: sample.leadId,
          action:
            dto.status === 'APPROVED'
              ? 'SAMPLE_APPROVED_BY_CLIENT'
              : 'SAMPLE_REVISION_REQUESTED',
          notes: `Rating: ${dto.rating}/5. Comment: ${dto.comment}`,
          loggedBy: 'BUSSDEV_HUB',
        },
      });

      const MAX_REVISIONS = 3;
      if (
        dto.status === 'REVISION' &&
        sample.revisionCount + 1 > MAX_REVISIONS
      ) {
        this.eventEmitter.emit('sample.revision.overlimit', {
          leadId: sample.leadId,
          clientName: sample.lead?.clientName || 'Unknown',
          revisionCount: sample.revisionCount + 1,
        });
      }

      return updatedSample;
    });
  }
}
