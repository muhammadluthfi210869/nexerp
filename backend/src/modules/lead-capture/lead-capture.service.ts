import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { LeadSource, LeadStatus, WorkflowStatus } from '@prisma/client';
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
    assignedName?: string;   // Round-robin agent name
    assignedPhone?: string;  // Round-robin agent phone number
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
    dateFrom?: string;
    dateTo?: string;
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
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

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

  async getDashboardAnalytics(query?: { dateFrom?: string; dateTo?: string }) {
    const where: any = {};
    if (query?.dateFrom || query?.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      total,
      byStatus,
      byWorkflow,
      assignedStatus,
      assignedWorkflow,
      leads,
      unassigned,
      noPhone,
      noName,
      pendingOver24h,
      newLast7Days,
      won,
      lost,
      kommoImported,
      websiteTracked,
      csvImported,
    ] = await Promise.all([
      this.prisma.leadCapture.count({ where }),
      this.prisma.leadCapture.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.leadCapture.groupBy({ by: ['workflowStatus'], where, _count: true }),
      this.prisma.leadCapture.groupBy({ by: ['assignedTo', 'status'], where, _count: true }),
      this.prisma.leadCapture.groupBy({ by: ['assignedTo', 'workflowStatus'], where, _count: true }),
      this.prisma.leadCapture.findMany({
        where,
        select: {
          id: true,
          trackingCode: true,
          source: true,
          utmSource: true,
          assignedTo: true,
          kommoPipelineName: true,
          kommoStatusName: true,
          kommoSourceName: true,
          kommoTags: true,
          kommoTalkStatus: true,
          kommoTalkIsRead: true,
          kommoTalkIsInWork: true,
          kommoFirstResponseSec: true,
          status: true,
          workflowStatus: true,
          createdAt: true,
          contactedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leadCapture.count({ where: { ...where, assignedTo: null } }),
      this.prisma.leadCapture.count({ where: { ...where, phone: null } }),
      this.prisma.leadCapture.count({ where: { ...where, fullName: null, waName: null } }),
      this.prisma.leadCapture.count({
        where: {
          ...where,
          status: 'PENDING',
          createdAt: { ...(where.createdAt || {}), lte: oneDayAgo },
        },
      }),
      this.prisma.leadCapture.count({
        where: {
          ...where,
          createdAt: { ...(where.createdAt || {}), gte: sevenDaysAgo },
        },
      }),
      this.prisma.leadCapture.count({ where: { ...where, workflowStatus: 'WON_DEAL' } }),
      this.prisma.leadCapture.count({ where: { ...where, workflowStatus: 'LOST' } }),
      this.prisma.leadCapture.count({ where: { ...where, trackingCode: { startsWith: 'KM' } } }),
      this.prisma.leadCapture.count({ where: { ...where, trackingCode: { startsWith: 'DL' } } }),
      this.prisma.leadCapture.count({ where: { ...where, trackingCode: { startsWith: 'CSV' } } }),
    ]);

    const userIds = Array.from(new Set(leads.map((lead) => lead.assignedTo).filter(Boolean) as string[]));
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    const sourceMap = new Map<string, number>();
    const dailyMap = new Map<string, number>();
    for (const lead of leads) {
      const source = this.normalizeAnalyticsSource(lead);
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);

      if (lead.createdAt >= fourteenDaysAgo) {
        const key = lead.createdAt.toISOString().slice(0, 10);
        dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
      }
    }

    const busdevMap = new Map<string, any>();
    for (const lead of leads) {
      const busdevName = this.extractBusdevName(lead.kommoPipelineName);
      const key = busdevName || lead.assignedTo || 'UNASSIGNED';
      const user = lead.assignedTo ? userMap.get(lead.assignedTo) : null;
      if (!busdevMap.has(key)) {
        busdevMap.set(key, {
          id: key,
          name: busdevName || user?.fullName || user?.email || 'Unassigned',
          email: user?.email || null,
          total: 0,
          contacted: 0,
          qualified: 0,
          won: 0,
          lost: 0,
          active: 0,
          conversationsInWork: 0,
          unanswered: 0,
          avgResponseSec: null,
          responseSamples: 0,
          byStatus: {},
          byWorkflow: {},
        });
      }
      const item = busdevMap.get(key);
      item.total++;
      item.byStatus[lead.status] = (item.byStatus[lead.status] || 0) + 1;
      item.byWorkflow[lead.workflowStatus] = (item.byWorkflow[lead.workflowStatus] || 0) + 1;
      if (lead.status === 'WA_CONTACTED') item.contacted++;
      if (lead.status === 'QUALIFIED') item.qualified++;
      if (lead.workflowStatus === 'WON_DEAL') item.won++;
      if (lead.workflowStatus === 'LOST') item.lost++;
      if (!['WON_DEAL', 'LOST', 'ABORTED'].includes(lead.workflowStatus)) item.active++;
      if (lead.kommoTalkIsInWork || lead.kommoTalkStatus === 'in_work') item.conversationsInWork++;
      if (lead.kommoTalkIsRead === false) item.unanswered++;
      if (lead.kommoFirstResponseSec != null) {
        item._responseTotal = (item._responseTotal || 0) + lead.kommoFirstResponseSec;
        item.responseSamples++;
      }
    }

    for (const row of assignedStatus) {
      const item = busdevMap.get(row.assignedTo || 'UNASSIGNED');
      if (item) item.byStatus[row.status] = row._count;
    }
    for (const row of assignedWorkflow) {
      const item = busdevMap.get(row.assignedTo || 'UNASSIGNED');
      if (item) item.byWorkflow[row.workflowStatus] = row._count;
    }

    const qualified = byStatus.find((row) => row.status === 'QUALIFIED')?._count || 0;
    const busdev = Array.from(busdevMap.values())
      .map((item) => ({
        ...item,
        _responseTotal: undefined,
        avgResponseSec: item.responseSamples > 0 ? Math.round(item._responseTotal / item.responseSamples) : null,
        conversionRate: item.total > 0 ? item.won / item.total : 0,
        qualificationRate: item.total > 0 ? item.qualified / item.total : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const conversationsInWork = leads.filter((lead) => lead.kommoTalkIsInWork || lead.kommoTalkStatus === 'in_work').length;
    const unanswered = leads.filter((lead) => lead.kommoTalkIsRead === false).length;
    const responseSamples = leads.filter((lead) => lead.kommoFirstResponseSec != null);
    const avgResponseSec = responseSamples.length
      ? Math.round(responseSamples.reduce((sum, lead) => sum + (lead.kommoFirstResponseSec || 0), 0) / responseSamples.length)
      : null;

    return {
      total,
      newLast7Days,
      conversionRate: total > 0 ? won / total : 0,
      qualificationRate: total > 0 ? qualified / total : 0,
      byStatus: byStatus.reduce((acc, row) => ({ ...acc, [row.status]: row._count }), {}),
      byWorkflow: byWorkflow.reduce((acc, row) => ({ ...acc, [row.workflowStatus]: row._count }), {}),
      bySource: Object.fromEntries([...sourceMap.entries()].sort((a, b) => b[1] - a[1])),
      dailyTrend: [...dailyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      busdev,
      dataQuality: {
        unassigned,
        noPhone,
        noName,
        pendingOver24h,
      },
      conversations: {
        inWork: conversationsInWork,
        unanswered,
        avgResponseSec,
        responseSamples: responseSamples.length,
      },
      importSources: {
        kommoImported,
        websiteTracked,
        csvImported,
      },
      won,
      lost,
    };
  }

  private normalizeAnalyticsSource(lead: {
    source: unknown;
    utmSource: string | null;
    trackingCode: string;
    kommoSourceName?: string | null;
    kommoStatusName?: string | null;
    kommoPipelineName?: string | null;
    kommoTags?: string | null;
  }): string {
    const raw = [
      lead.kommoSourceName,
      lead.kommoStatusName,
      lead.kommoTags,
      lead.kommoPipelineName,
      lead.utmSource,
      lead.source,
    ].filter(Boolean).join(' ').toLowerCase();

    if (raw.includes('link tree') || raw.includes('linktree')) return 'Linktree';
    if (raw.includes('tiktok') || raw.includes('tik tok')) return 'TikTok';
    if (raw.includes('meta')) return 'Meta Ads';
    if (raw.includes('instagram') || raw.includes('ig/fb') || raw.includes(' dm')) return 'Instagram DM';
    if (raw.includes('google')) return 'Google';
    if (raw.includes('sales smaple') || raw.includes('sales sample') || raw.includes('sample')) return 'Sales Sample';
    if (raw.includes('webinar')) return 'Webinar';
    if (raw.includes('webform') || raw.includes('website')) return 'Website';
    if (lead.source) return String(lead.source);
    if (lead.utmSource) return lead.utmSource.toUpperCase();
    if (lead.trackingCode.startsWith('CSV')) return 'CSV Import';
    if (lead.trackingCode.startsWith('DL')) return 'Website WA';
    return 'UNKNOWN';
  }

  private extractBusdevName(pipelineName?: string | null): string | null {
    if (!pipelineName) return null;
    const normalized = pipelineName.toLowerCase();
    if (normalized.includes('jessica')) return 'Jessica';
    if (normalized.includes('ami')) return 'Ami';
    if (normalized.includes('sansan')) return 'Sansan';
    if (normalized.includes('dilla') || normalized.includes('dila')) return 'Bu Dilla';
    if (normalized.includes('anisa')) return 'Anisa';
    if (normalized.includes('mutmah')) return 'Mutmah';
    if (normalized.includes('shierly')) return 'Bu Shierly';
    if (normalized.includes('mada')) return 'Bu Mada';
    if (normalized.includes('round robin')) return 'Round Robin';
    return pipelineName.replace(/_/g, ' ').replace(/\s*pipeline\s*busdev\s*/ig, '').replace(/\s+/g, ' ').trim();
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

  // ──────────────────────────────────────────────
  //  SAVE pulled leads from Kommo
  // ──────────────────────────────────────────────

  async saveKommoLeads(
    leads: any[],
    contacts: any[],
    metadata?: { pipelines?: any[]; users?: any[]; talks?: any[]; events?: any[] },
  ): Promise<number> {
    const contactMap = new Map<string, any>();
    for (const c of contacts) {
      contactMap.set(String(c.id), c);
    }
    const pipelineMap = this.buildPipelineMap(metadata?.pipelines ?? []);
    const userMap = new Map((metadata?.users ?? []).map((user) => [Number(user.id), user]));
    const talkMap = this.buildTalkMap(metadata?.talks ?? []);
    const responseMap = this.buildFirstResponseMap(metadata?.events ?? []);

    let saved = 0;
    let updated = 0;
    for (let i = 0; i < leads.length; i += 500) {
      const batch = leads.slice(i, i + 500);
      const trackingCodes = batch.map((lead) => `KM${lead.id}`);
      const existing = await this.prisma.leadCapture.findMany({
        where: { trackingCode: { in: trackingCodes } },
        select: { trackingCode: true },
      });
      const existingCodes = new Set(existing.map((lead) => lead.trackingCode));

      const enriched = batch.map((lead) => this.mapKommoLeadRow(
        lead,
        contactMap,
        pipelineMap,
        userMap,
        talkMap,
        responseMap,
      ));

      const rows = enriched.filter((row) => !existingCodes.has(row.trackingCode));

      if (rows.length > 0) {
        await this.prisma.leadCapture.createMany({ data: rows, skipDuplicates: true });
        saved += rows.length;
      }

      const updates = enriched.filter((row) => existingCodes.has(row.trackingCode));
      for (let j = 0; j < updates.length; j += 50) {
        const updateBatch = updates.slice(j, j + 50);
        await Promise.all(updateBatch.map((row) =>
          this.prisma.leadCapture.update({
            where: { trackingCode: row.trackingCode },
            data: {
              fullName: row.fullName,
              phone: row.phone,
              source: row.source,
              intent: row.intent,
              status: row.status,
              workflowStatus: row.workflowStatus,
              wonAt: row.wonAt,
              lostAt: row.lostAt,
              kommoLeadId: row.kommoLeadId,
              kommoResponsibleUserId: row.kommoResponsibleUserId,
              kommoResponsibleUserName: row.kommoResponsibleUserName,
              kommoPipelineId: row.kommoPipelineId,
              kommoPipelineName: row.kommoPipelineName,
              kommoStatusId: row.kommoStatusId,
              kommoStatusName: row.kommoStatusName,
              kommoSourceName: row.kommoSourceName,
              kommoTags: row.kommoTags,
              kommoTalkStatus: row.kommoTalkStatus,
              kommoTalkOrigin: row.kommoTalkOrigin,
              kommoTalkIsRead: row.kommoTalkIsRead,
              kommoTalkIsInWork: row.kommoTalkIsInWork,
              kommoFirstResponseSec: row.kommoFirstResponseSec,
            },
          })
        ));
        updated += updateBatch.length;
      }
    }

    this.logger.log(`[Kommo Save] Saved ${saved} new leads, updated ${updated} existing leads`);
    return saved;
  }

  private mapKommoLeadRow(
    lead: any,
    contactMap: Map<string, any>,
    pipelineMap: Map<number, any>,
    userMap: Map<number, any>,
    talkMap: Map<number, any>,
    responseMap: Map<number, number>,
  ) {
    let contact: any | null = null;
    const embeddedContacts = lead._embedded?.contacts ?? [];
    if (embeddedContacts.length > 0) {
      contact = contactMap.get(String(embeddedContacts[0].id));
    }

    const pipeline = pipelineMap.get(Number(lead.pipeline_id));
    const status = pipeline?.statusMap?.get(Number(lead.status_id));
    const user = userMap.get(Number(lead.responsible_user_id));
    const talk = talkMap.get(Number(lead.id));
    const workflowStatus = this.mapKommoWorkflowStatus(lead, status?.name);
    const closedAt = this.fromKommoTimestamp(lead.closed_at);

    return {
      trackingCode: `KM${lead.id}`,
      fullName: lead.name || contact?.name || null,
      phone: this.extractPhoneFromLead(lead, contact),
      source: this.detectSource(lead, status?.name, pipeline?.name),
      intent: lead.name || null,
      status: workflowStatus === 'WON_DEAL' ? 'CONVERTED' as LeadStatus : 'PENDING' as LeadStatus,
      workflowStatus,
      createdAt: this.fromKommoTimestamp(lead.created_at) || new Date(),
      wonAt: workflowStatus === 'WON_DEAL' ? closedAt || new Date() : null,
      lostAt: workflowStatus === 'LOST' ? closedAt || new Date() : null,
      kommoLeadId: Number(lead.id) || null,
      kommoResponsibleUserId: Number(lead.responsible_user_id) || null,
      kommoResponsibleUserName: user?.name || null,
      kommoPipelineId: Number(lead.pipeline_id) || null,
      kommoPipelineName: pipeline?.name || null,
      kommoStatusId: Number(lead.status_id) || null,
      kommoStatusName: status?.name || null,
      kommoSourceName: this.extractKommoSourceName(lead, status?.name),
      kommoTags: this.extractKommoTags(lead),
      kommoTalkStatus: talk?.status || null,
      kommoTalkOrigin: talk?.origin || null,
      kommoTalkIsRead: typeof talk?.is_read === 'boolean' ? talk.is_read : null,
      kommoTalkIsInWork: typeof talk?.is_in_work === 'boolean' ? talk.is_in_work : null,
      kommoFirstResponseSec: responseMap.get(Number(lead.id)) ?? null,
    };
  }

  private buildPipelineMap(pipelines: any[]) {
    const map = new Map<number, any>();
    for (const pipeline of pipelines) {
      const statusMap = new Map<number, any>();
      for (const status of pipeline?._embedded?.statuses ?? []) {
        statusMap.set(Number(status.id), status);
      }
      map.set(Number(pipeline.id), { ...pipeline, statusMap });
    }
    return map;
  }

  private buildTalkMap(talks: any[]) {
    const map = new Map<number, any>();
    for (const talk of talks) {
      if (talk.entity_type !== 'lead' || !talk.entity_id) continue;
      const current = map.get(Number(talk.entity_id));
      if (!current || Number(talk.updated_at || 0) > Number(current.updated_at || 0)) {
        map.set(Number(talk.entity_id), talk);
      }
    }
    return map;
  }

  private buildFirstResponseMap(events: any[]) {
    const map = new Map<number, number>();
    const grouped = new Map<number, any[]>();
    for (const event of events) {
      if (event.entity_type !== 'lead' || !event.entity_id) continue;
      const key = Number(event.entity_id);
      const list = grouped.get(key) ?? [];
      list.push(event);
      grouped.set(key, list);
    }

    for (const [leadId, leadEvents] of grouped.entries()) {
      const sorted = leadEvents.sort((a, b) => Number(a.created_at || 0) - Number(b.created_at || 0));
      let incomingAt: number | null = null;
      for (const event of sorted) {
        if (event.type === 'incoming_chat_message' && incomingAt == null) {
          incomingAt = Number(event.created_at);
        }
        if (event.type === 'outgoing_chat_message' && incomingAt != null) {
          const diff = Number(event.created_at) - incomingAt;
          if (diff >= 0) map.set(leadId, diff);
          break;
        }
      }
    }
    return map;
  }

  private extractPhoneFromLead(lead: any, contact: any): string | null {
    if (contact) {
      // Check contact custom fields for phone
      if (contact.custom_fields_values) {
        for (const field of contact.custom_fields_values) {
          const fname = (field.field_name || '').toLowerCase();
          if (fname.includes('phone') || fname.includes('hp') || fname.includes('wa')) {
            const val = field.values?.[0]?.value;
            if (val) return String(val);
          }
        }
      }
      if (contact.phone) return String(contact.phone);
    }
    return null;
  }

  private detectSource(lead: any, statusName?: string, pipelineName?: string): LeadSource | null {
    // Try to detect source from custom fields or pipeline
    if (lead.custom_fields_values) {
      for (const field of lead.custom_fields_values) {
        const fname = (field.field_name || '').toLowerCase();
        if (fname.includes('source') || fname.includes('utm')) {
          const val = field.values?.[0]?.value;
          const source = this.mapLeadSource(String(val));
          if (source) return source;
        }
      }
    }
    const embeddedSource = lead._embedded?.source?.external_id || lead._embedded?.source?.type || lead._embedded?.source?.name;
    if (embeddedSource) return this.mapLeadSource(String(embeddedSource));
    const fromStatus = this.mapLeadSource([statusName, pipelineName, this.extractKommoTags(lead)].filter(Boolean).join(' '));
    if (fromStatus) return fromStatus;
    return null;
  }

  private mapLeadSource(value: string): LeadSource | null {
    const normalized = value.toLowerCase();
    if (normalized.includes('instagram') || normalized.includes('ig')) return 'INSTAGRAM';
    if (normalized.includes('tiktok')) return 'TIKTOK';
    if (normalized.includes('linktree') || normalized.includes('link tree')) return 'LINKTREE';
    if (normalized.includes('google')) return 'GOOGLE';
    if (normalized.includes('website') || normalized.includes('web')) return 'WEBSITE';
    if (normalized.includes('referral')) return 'REFERRAL';
    if (normalized.includes('direct')) return 'DIRECT';
    if (normalized.includes('offline')) return 'OFFLINE';
    return null;
  }

  private mapKommoWorkflowStatus(lead: any, resolvedStatusName?: string): WorkflowStatus {
    if (lead.closed_at && lead.status_id === 142) return 'WON_DEAL';
    if (lead.closed_at && lead.loss_reason_id) return 'LOST';
    const statusName = String(resolvedStatusName || lead._embedded?.status?.name || lead.status_name || '').toLowerCase();
    if (statusName.includes('won') || statusName.includes('deal')) return 'WON_DEAL';
    if (statusName.includes('lost') || statusName.includes('reject')) return 'LOST';
    if (statusName.includes('sample') || statusName.includes('smaple')) return 'SAMPLE_REQUESTED';
    if (statusName.includes('follow') || statusName.includes('fu ')) return 'FOLLOW_UP_1';
    if (statusName.includes('hot')) return 'NEGOTIATION';
    if (statusName.includes('warm')) return 'FOLLOW_UP_2';
    if (statusName.includes('cold')) return 'NEW_LEAD';
    if (statusName.includes('negotiation') || statusName.includes('nego')) return 'NEGOTIATION';
    if (statusName.includes('contact') || statusName.includes('traffic')) return 'CONTACTED';
    return 'NEW_LEAD';
  }

  private extractKommoSourceName(lead: any, statusName?: string): string | null {
    const source = lead._embedded?.source?.name || lead._embedded?.source?.type || lead._embedded?.source?.external_id;
    const raw = [source, statusName, this.extractKommoTags(lead)].filter(Boolean).join(' ');
    const normalized = raw.toLowerCase();
    if (normalized.includes('link tree') || normalized.includes('linktree')) return 'Linktree';
    if (normalized.includes('tiktok') || normalized.includes('tik tok')) return 'TikTok';
    if (normalized.includes('meta')) return 'Meta Ads';
    if (normalized.includes('instagram') || normalized.includes('ig/fb') || normalized.includes(' dm')) return 'Instagram DM';
    if (normalized.includes('google')) return 'Google';
    if (normalized.includes('sales smaple') || normalized.includes('sales sample') || normalized.includes('sample')) return 'Sales Sample';
    if (normalized.includes('webinar')) return 'Webinar';
    if (normalized.includes('webform') || normalized.includes('website')) return 'Website';
    return source ? String(source) : null;
  }

  private extractKommoTags(lead: any): string | null {
    const tags = lead._embedded?.tags ?? [];
    const names = tags.map((tag: any) => tag?.name).filter(Boolean);
    return names.length ? names.join(', ') : null;
  }

  private fromKommoTimestamp(value: unknown): Date | null {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
    return new Date(timestamp * 1000);
  }

  // ──────────────────────────────────────────────
  //  BULK IMPORT from CSV
  // ──────────────────────────────────────────────

  async bulkImportLeads(leads: { date?: string; name?: string; phone?: string; source?: string; intent?: string }[]): Promise<number> {
    let imported = 0;
    for (const item of leads) {
      if (!item.phone && !item.name) continue;
      const trackingCode = `CSV${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      await this.prisma.leadCapture.create({
        data: {
          trackingCode,
          fullName: item.name || null,
          phone: item.phone?.replace(/[^0-9]/g, '') || null,
          source: item.source || null,
          intent: item.intent || null,
          status: 'PENDING',
          workflowStatus: 'NEW_LEAD',
        },
      });
      imported++;
    }
    this.logger.log(`[CSV Import] Imported ${imported} leads`);
    return imported;
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
