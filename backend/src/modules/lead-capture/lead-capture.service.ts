import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { LeadStatus, WorkflowStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class LeadCaptureService {
  private readonly logger = new Logger(LeadCaptureService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  //  GENERATE UNIQUE TRACKING CODE
  // ──────────────────────────────────────────────

  private generateTrackingCode(): string {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `DL${rand}`;
  }

  // ──────────────────────────────────────────────
  //  TRACK: Store pre-click data before WA redirect
  // ──────────────────────────────────────────────

  async track(data: {
    intent?: string;
    pageUrl?: string;
    pageTitle?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    deviceType?: string;
    browser?: string;
    ipAddress?: string;
    city?: string;
    country?: string;
    sessionId?: string;
  }) {
    const trackingCode = this.generateTrackingCode();

    const lead = await this.prisma.leadCapture.create({
      data: {
        trackingCode,
        status: 'PENDING' as LeadStatus,
        workflowStatus: 'NEW_LEAD' as WorkflowStatus,
        ...data,
      },
    });

    this.logger.log(`🎯 Lead tracked: ${trackingCode} | intent: ${data.intent || 'N/A'} | page: ${data.pageUrl || 'N/A'}`);

    return {
      trackingCode,
      waUrl: this.buildWaUrl(trackingCode, data.intent),
    };
  }

  // ──────────────────────────────────────────────
  //  BUILD WHATSAPP URL with tracking code
  // ──────────────────────────────────────────────

  private buildWaUrl(trackingCode: string, intent?: string): string {
    const phone = process.env.WA_BUSINESS_PHONE || '6281234567890';
    let message = `Halo%20DreamLab!`;
    if (intent) {
      message += `%0ASaya%20tertarik%20dengan%3A%20${encodeURIComponent(intent)}`;
    }
    message += `%0A%0A[Kode%3A%20${trackingCode}]`;
    return `https://wa.me/${phone}?text=${message}`;
  }

  // ──────────────────────────────────────────────
  //  UPDATE: When user messages on WA (via API or manual)
  // ──────────────────────────────────────────────

  async updateFromWhatsApp(trackingCode: string, data: {
    phone: string;
    waName?: string;
    waMessage?: string;
  }) {
    const lead = await this.prisma.leadCapture.findUnique({
      where: { trackingCode },
    });

    if (!lead) {
      // If tracking code not found, create a new lead record
      this.logger.warn(`Tracking code ${trackingCode} not found, creating orphan lead`);
      return this.prisma.leadCapture.create({
        data: {
          trackingCode,
          phone: data.phone,
          waName: data.waName,
          waMessage: data.waMessage,
          status: 'WA_CONTACTED' as LeadStatus,
          contactedAt: new Date(),
        },
      });
    }

    return this.prisma.leadCapture.update({
      where: { trackingCode },
      data: {
        phone: data.phone,
        waName: data.waName,
        waMessage: data.waMessage,
        status: 'WA_CONTACTED' as LeadStatus,
        contactedAt: new Date(),
      },
    });
  }

  // ──────────────────────────────────────────────
  //  UPDATE LEAD INFO (name, notes, status, etc.)
  // ──────────────────────────────────────────────

  async updateLead(id: string, data: {
    fullName?: string;
    company?: string;
    email?: string;
    phone?: string;
    notes?: string;
    status?: LeadStatus;
    workflowStatus?: WorkflowStatus;
    assignedTo?: string;
    lostReason?: string;
  }) {
    const lead = await this.prisma.leadCapture.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    const updateData: Record<string, unknown> = {};
    // Only set defined fields to prevent mass assignment
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.workflowStatus !== undefined) updateData.workflowStatus = data.workflowStatus;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.lostReason !== undefined) updateData.lostReason = data.lostReason;

    if (data.status === 'CONVERTED') updateData.wonAt = new Date();
    if (data.workflowStatus === 'LOST' || data.workflowStatus === 'ABORTED') {
      updateData.lostAt = new Date();
    }

    return this.prisma.leadCapture.update({
      where: { id },
      data: updateData,
    });
  }

  // ──────────────────────────────────────────────
  //  LIST LEADS (with filters & pagination)
  // ──────────────────────────────────────────────

  async listLeads(query: {
    status?: LeadStatus;
    workflowStatus?: WorkflowStatus;
    source?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.workflowStatus) where.workflowStatus = query.workflowStatus;
    if (query.source) where.source = query.source;

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { trackingCode: { contains: query.search, mode: 'insensitive' } },
        { intent: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.leadCapture.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          assignedUser: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.leadCapture.count({ where }),
    ]);

    return {
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────────
  //  GET SINGLE LEAD
  // ──────────────────────────────────────────────

  async getLead(id: string) {
    const lead = await this.prisma.leadCapture.findUnique({
      where: { id },
      include: {
        assignedUser: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  // ──────────────────────────────────────────────
  //  STATISTICS
  // ──────────────────────────────────────────────

  async getStats() {
    const [total, byStatus, bySource, today, thisWeek, thisMonth] =
      await Promise.all([
        this.prisma.leadCapture.count(),
        this.prisma.leadCapture.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.prisma.leadCapture.groupBy({
          by: ['source'],
          _count: true,
        }),
        this.prisma.leadCapture.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        this.prisma.leadCapture.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        }),
        this.prisma.leadCapture.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)),
            },
          },
        }),
      ]);

    return {
      total,
      today,
      thisWeek,
      thisMonth,
      byStatus: byStatus.reduce(
        (acc, curr) => ({ ...acc, [curr.status]: curr._count }),
        {} as Record<string, number>,
      ),
      bySource: bySource.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.source || 'UNKNOWN']: curr._count,
        }),
        {} as Record<string, number>,
      ),
    };
  }

  // ──────────────────────────────────────────────
  //  BULK UPDATE
  // ──────────────────────────────────────────────

  async bulkUpdate(ids: string[], data: {
    status?: LeadStatus;
    workflowStatus?: WorkflowStatus;
    assignedTo?: string;
  }) {
    const updateData: any = { ...data };
    if (data.status === 'CONVERTED') updateData.wonAt = new Date();

    await this.prisma.leadCapture.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return { updated: ids.length };
  }

  // ──────────────────────────────────────────────
  //  DELETE LEAD
  // ──────────────────────────────────────────────

  async deleteLead(id: string) {
    const lead = await this.prisma.leadCapture.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.prisma.leadCapture.delete({ where: { id } });
    return { deleted: true };
  }

  // ══════════════════════════════════════════════
  //  ROUND ROBIN — distribute leads to 3 WA numbers
  // ══════════════════════════════════════════════

  async getNextRoundRobinAgent() {
    // Atomic transaction: read state, increment, return agent
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Get or create state
      let state = await tx.roundRobinState.findUnique({
        where: { id: 'singleton' },
      });

      if (!state) {
        state = await tx.roundRobinState.create({
          data: { id: 'singleton', currentIndex: 0 },
        });
      }

      // 2. Get all active agents ordered by orderIndex
      const agents = await tx.roundRobinAgent.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
      });

      if (agents.length === 0) {
        throw new NotFoundException('No active round robin agents');
      }

      // 3. Get current agent
      const agent = agents[state.currentIndex];

      // 4. Increment index (wrap around)
      const nextIndex = (state.currentIndex + 1) % agents.length;
      await tx.roundRobinState.update({
        where: { id: 'singleton' },
        data: { currentIndex: nextIndex },
      });

      // 5. Increment agent's lead counter
      await tx.roundRobinAgent.update({
        where: { id: agent.id },
        data: { totalLeads: { increment: 1 } },
      });

      return {
        id: agent.id,
        name: agent.name,
        phoneNumber: agent.phoneNumber,
        orderIndex: agent.orderIndex,
      };
    });

    this.logger.log(`🔄 Round Robin: ${result.name} (${result.phoneNumber}) — lead #${result.orderIndex + 1}`);

    return result;
  }

  async getRoundRobinStatus() {
    const agents = await this.prisma.roundRobinAgent.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    const state = await this.prisma.roundRobinState.findUnique({
      where: { id: 'singleton' },
    });

    return {
      agents,
      currentIndex: state?.currentIndex ?? 0,
      total: agents.reduce((sum, a) => sum + a.totalLeads, 0),
    };
  }

  async upsertRoundRobinAgent(data: {
    id?: string;
    name: string;
    phoneNumber: string;
    orderIndex: number;
    isActive?: boolean;
  }) {
    if (data.id) {
      return this.prisma.roundRobinAgent.update({
        where: { id: data.id },
        data,
      });
    }
    return this.prisma.roundRobinAgent.create({ data });
  }

  async deleteRoundRobinAgent(id: string) {
    return this.prisma.roundRobinAgent.delete({ where: { id } });
  }

  // ──────────────────────────────────────────────
  //  Find leads with phone but no name (for Kommo sync)
  // ──────────────────────────────────────────────

  async findLeadsWithoutName(limit = 50) {
    return this.prisma.leadCapture.findMany({
      where: {
        phone: { not: null },
        waName: null,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ══════════════════════════════════════════════
  //  UPDATE LEAD FROM KOMMO DATA
  // ══════════════════════════════════════════════

  async updateLeadFromKommo(phone: string, name: string) {
    // Normalize phone
    const cleaned = phone.replace(/[^0-9]/g, '');
    // Remove leading 0 or 62
    const variants = [
      cleaned,
      '62' + cleaned.replace(/^0?62?/, ''),
      '0' + cleaned.replace(/^0?62?/, ''),
    ];

    const lead = await this.prisma.leadCapture.findFirst({
      where: {
        OR: variants.map((p) => ({ phone: { contains: p.slice(-10) } })),
        waName: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lead) {
      this.logger.warn(`[Kommo] No lead found for phone: ${phone} (cleaned: ${cleaned})`);
      return null;
    }

    const updated = await this.prisma.leadCapture.update({
      where: { id: lead.id },
      data: {
        waName: name,
        fullName: lead.fullName || name,
      },
    });

    this.logger.log(`[Kommo] Updated lead ${lead.trackingCode} with name: ${name}`);
    return updated;
  }
}
