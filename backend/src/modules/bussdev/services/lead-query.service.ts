import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  WorkflowStatus,
  LostReason,
  StreamEventType,
  Division,
} from '@prisma/client';
import { P07ActorContext, LeadStageService } from './lead-stage.service';

@Injectable()
export class LeadQueryService {
  constructor(
    private prisma: PrismaService,
    private stageService: LeadStageService,
  ) {}

  private isUuid(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    );
  }

  private assertTrustedOrganization(orgId: unknown): string {
    if (!this.isUuid(orgId)) {
      throw new BadRequestException({
        code: 'TENANT_UNRESOLVED',
        message: 'Tenant wajib diisi dari konteks server.',
      });
    }
    return orgId;
  }

  async appendAttribution(
    leadId: string,
    snapshot: Record<string, unknown>,
    source: string,
  ): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      await this.stageService.ensureConsentNotWithdrawn(tx, leadId);
      const attr = await tx.leadAttribute.create({
        data: {
          leadId,
          key: 'attribution',
          value: JSON.stringify(snapshot),
          confirmed: true,
          source,
        },
      });
      return { id: attr.id };
    });
  }

  async logActivity(dto: {
    leadId: string;
    activityType: any;
    notes: string;
    newStatus?: WorkflowStatus;
    lostReason?: LostReason;
    sequenceNumber?: number;
    productConcept?: string;
    targetPrice?: number;
    productCategory?: any;
    estimatedMoq?: number;
    quotationFileUrl?: string;
    finalPaymentProofUrl?: string;
    isFormulaLocked?: boolean;
    downPaymentAmount?: number;
    paymentProofUrl?: string;
    pnfFileUrl?: string;
  }) {
    if (dto.newStatus) {
      throw new BadRequestException(
        'PROTOCOL_VIOLATION: Perubahan status tidak diizinkan melalui logActivity. Gunakan endpoint /advance.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let targetSequence = dto.sequenceNumber;

      if (!targetSequence) {
        const lastActivity = await tx.leadActivity.findFirst({
          where: { leadId: dto.leadId },
          orderBy: { sequenceNumber: 'desc' },
        });
        targetSequence = (lastActivity?.sequenceNumber || 0) + 1;
      }

      const activity = await tx.leadActivity.create({
        data: {
          leadId: dto.leadId,
          activityType: dto.activityType,
          notes: dto.notes,
          sequenceNumber: targetSequence,
          fileUrl:
            dto.paymentProofUrl ||
            dto.quotationFileUrl ||
            dto.pnfFileUrl ||
            dto.finalPaymentProofUrl,
          fileUrlSecondary:
            dto.paymentProofUrl && dto.pnfFileUrl ? dto.pnfFileUrl : undefined,
          amount: dto.downPaymentAmount,
          isValidated: false,
        },
      });

      await tx.activityStream.create({
        data: {
          leadId: dto.leadId,
          senderDivision: Division.BD,
          eventType: StreamEventType.MANUAL_LOG,
          notes: `[${dto.activityType}] ${dto.notes}`,
          loggedBy: 'system',
        },
      });

      await tx.salesLead.update({
        where: { id: dto.leadId },
        data: { lastFollowUpAt: new Date() },
      });

      return activity;
    });
  }

  async getActivityStream(leadId: string) {
    return this.prisma.activityStream.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeadBalance(leadId: string) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
      include: {
        activities: {
          where: { isValidated: true },
          select: { amount: true },
        },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    const totalEstimated = Number(lead.planOmset || lead.estimatedValue || 0);
    const totalValidated = lead.activities.reduce(
      (sum, act) => sum + Number(act.amount || 0),
      0,
    );

    return {
      totalEstimated,
      totalValidated,
      balance: totalEstimated - totalValidated,
    };
  }

  async getLeadByIdScoped(leadId: string, actor: P07ActorContext) {
    const orgId = this.assertTrustedOrganization(actor.organizationId);
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
      include: {
        pic: true,
        activities: { orderBy: { createdAt: 'desc' } },
        sampleRequests: true,
        salesOrders: { orderBy: { createdAt: 'desc' } },
        workOrders: true,
        timelineLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        registrations: true,
        designTasks: true,
      },
    });
    if (!lead || lead.organizationId !== orgId) {
      throw new NotFoundException('Lead tidak ditemukan');
    }
    return lead;
  }

  async listLeadsScoped(actor: P07ActorContext, opts?: { bdId?: string }) {
    const orgId = this.assertTrustedOrganization(actor.organizationId);
    return this.prisma.salesLead.findMany({
      where: {
        organizationId: orgId,
        ...(opts?.bdId ? { bdId: opts.bdId } : {}),
      },
      include: {
        pic: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeadScoped(leadId: string, dto: any, actor: P07ActorContext) {
    const orgId = this.assertTrustedOrganization(actor.organizationId);
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.salesLead.findUnique({ where: { id: leadId } });
      if (!lead || lead.organizationId !== orgId) {
        throw new NotFoundException('Lead tidak ditemukan');
      }
      return tx.salesLead.update({
        where: { id: leadId },
        data: {
          clientName: dto.clientName ?? lead.clientName,
          brandName: dto.brandName ?? lead.brandName,
          contactInfo: dto.contactInfo ?? lead.contactInfo,
          productInterest: dto.productInterest ?? lead.productInterest,
          estimatedValue: dto.estimatedValue ?? lead.estimatedValue,
          notes: dto.notes ?? lead.notes,
          moq: dto.moq ?? lead.moq,
          planOmset: dto.planOmset ?? lead.planOmset,
          province: dto.province ?? lead.province,
          city: dto.city ?? lead.city,
          district: dto.district ?? lead.district,
          addressDetail: dto.addressDetail ?? lead.addressDetail,
          launchingPlan: dto.launchingPlan ?? lead.launchingPlan,
          targetMarket: dto.targetMarket ?? lead.targetMarket,
          contactChannel: dto.contactChannel ?? lead.contactChannel,
          sku: dto.sku ?? lead.sku,
          unitPrice: dto.unitPrice ?? lead.unitPrice,
          packagingSuggestion:
            dto.packagingSuggestion ?? lead.packagingSuggestion,
          designSuggestion: dto.designSuggestion ?? lead.designSuggestion,
          valueSuggestion: dto.valueSuggestion ?? lead.valueSuggestion,
          picId: dto.picId ?? lead.picId,
        },
      });
    });
  }

  private static readonly WORKFLOW_PHASE: Record<string, string> = {
    NEW_LEAD: 'INTAKE',
    CONTACTED: 'ENGAGED',
    FOLLOW_UP_1: 'ENGAGED',
    FOLLOW_UP_2: 'ENGAGED',
    FOLLOW_UP_3: 'ENGAGED',
    COLD: 'ENGAGED',
    WARM: 'ENGAGED',
    HOT: 'ENGAGED',
    NEGOTIATION: 'NEGOTIATION',
    SAMPLE_REQUESTED: 'SAMPLING',
    SAMPLE_SENT: 'SAMPLING',
    SAMPLE_APPROVED: 'SAMPLING',
    SPK_SIGNED: 'CLOSING',
    WAITING_FINANCE_APPROVAL: 'CLOSING',
    DP_PAID: 'CLOSING',
    PRODUCTION_PLAN: 'CLOSING',
    READY_TO_SHIP: 'CLOSING',
    WON_DEAL: 'WON',
    LOST: 'LOST',
    ABORTED: 'ABORTED',
  };

  static readonly SLA_BUCKETS = ['ON_TRACK', 'AT_RISK', 'BREACHED'] as const;

  private static readonly SLA_AT_RISK_DAYS = 3;
  private static readonly SLA_BREACH_DAYS = 7;

  private slaRange(
    bucket: (typeof LeadQueryService.SLA_BUCKETS)[number],
    now: number,
  ): { gte?: Date; lt?: Date } {
    const day = 24 * 60 * 60 * 1000;
    if (bucket === 'ON_TRACK') {
      return { gte: new Date(now - LeadQueryService.SLA_AT_RISK_DAYS * day) };
    }
    if (bucket === 'AT_RISK') {
      return {
        gte: new Date(now - LeadQueryService.SLA_BREACH_DAYS * day),
        lt: new Date(now - LeadQueryService.SLA_AT_RISK_DAYS * day),
      };
    }
    return { lt: new Date(now - LeadQueryService.SLA_BREACH_DAYS * day) };
  }

  private intersectRanges(
    a: { gte?: Date; lt?: Date },
    b: { gte?: Date; lt?: Date },
  ): { gte?: Date; lt?: Date } {
    const gte = [a.gte, b.gte]
      .filter(Boolean)
      .sort((x, y) => y!.getTime() - x!.getTime())[0];
    const lt = [a.lt, b.lt]
      .filter(Boolean)
      .sort((x, y) => x!.getTime() - y!.getTime())[0];
    if (gte && lt && gte.getTime() >= lt.getTime()) return {};
    const out: { gte?: Date; lt?: Date } = {};
    if (gte) out.gte = gte;
    if (lt) out.lt = lt;
    return out;
  }

  async getLeadDashboardScoped(query: {
    organizationId: string;
    dateFrom?: string;
    dateTo?: string;
    ownerId?: string;
    source?: string;
    stage?: WorkflowStatus;
    sla?: (typeof LeadQueryService.SLA_BUCKETS)[number];
  }) {
    const orgId = this.assertTrustedOrganization(query.organizationId);
    const now = Date.now();

    const base: any = { organizationId: orgId };
    if (query.source) base.source = query.source;
    if (query.ownerId) base.picId = query.ownerId;
    if (query.stage) base.status = query.stage;
    if (query.dateFrom || query.dateTo) {
      base.createdAt = {};
      if (query.dateFrom) base.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) base.createdAt.lte = new Date(query.dateTo);
    }

    const where: any = { ...base };
    const slaFilter = query.sla ? this.slaRange(query.sla, now) : null;
    if (slaFilter) where.lastStageAt = slaFilter;

    const [total, byStatus, bySource, byOwner, byAttribution] =
      await Promise.all([
        this.prisma.salesLead.count({ where }),
        this.prisma.salesLead.groupBy({ by: ['status'], where, _count: true }),
        this.prisma.salesLead.groupBy({ by: ['source'], where, _count: true }),
        this.prisma.salesLead.groupBy({ by: ['picId'], where, _count: true }),
        this.prisma.salesLead.groupBy({
          by: ['campaignName'],
          where,
          _count: true,
        }),
      ]);

    const slaEntries = await Promise.all(
      LeadQueryService.SLA_BUCKETS.map(async (bucket) => {
        const range = this.slaRange(bucket, now);
        const effective = slaFilter
          ? this.intersectRanges(slaFilter, range)
          : range;
        const n = Object.keys(effective).length
          ? await this.prisma.salesLead.count({
              where: { ...base, lastStageAt: effective },
            })
          : 0;
        return [bucket, n] as const;
      }),
    );

    const byWorkflow: Record<string, number> = {};
    for (const row of byStatus) {
      const phase = LeadQueryService.WORKFLOW_PHASE[row.status] ?? 'OTHER';
      byWorkflow[phase] = (byWorkflow[phase] ?? 0) + row._count;
    }

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      byWorkflow,
      bySource: Object.fromEntries(bySource.map((r) => [r.source, r._count])),
      byOwner: Object.fromEntries(byOwner.map((r) => [r.picId, r._count])),
      byAttribution: Object.fromEntries(
        byAttribution.map((r) => [r.campaignName ?? 'UNATTRIBUTED', r._count]),
      ),
      bySla: Object.fromEntries(slaEntries),
    };
  }
}
