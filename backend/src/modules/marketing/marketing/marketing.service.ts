import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FinanceService } from '../../finance/finance.service';

@Injectable()
export class MarketingService {
  private readonly PLATFORM_MAP: Record<string, string> = {
    Instagram: 'IG_ADS',
    Facebook: 'FB_ADS',
    TikTok: 'TIKTOK_ADS',
    Google: 'GOOGLE_ADS',
    IG_ADS: 'IG_ADS',
    FB_ADS: 'FB_ADS',
    TIKTOK_ADS: 'TIKTOK_ADS',
    GOOGLE_ADS: 'GOOGLE_ADS',
  };

  constructor(
    private prisma: PrismaService,
    private finance: FinanceService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createDailyAds(data: any) {
    const result = await this.prisma.dailyAdsMetric.upsert({
      where: {
        date_platform_campaignName: {
          date: new Date(data.date),
          platform: data.platform,
          campaignName: data.campaignName || 'General',
        },
      },
      update: {
        spend: Number(data.spend),
        impressions: Number(data.impressions || 0),
        reach: Number(data.reach || 0),
        clicks: Number(data.clicks || 0),
        leadsGenerated: Number(data.leadsGenerated || 0),
        isAudited: false,
      },
      create: {
        date: new Date(data.date),
        platform: data.platform,
        campaignName: data.campaignName || 'General',
        spend: Number(data.spend),
        impressions: Number(data.impressions || 0),
        reach: Number(data.reach || 0),
        clicks: Number(data.clicks || 0),
        leadsGenerated: Number(data.leadsGenerated || 0),
      },
    });

    this.eventEmitter.emit('marketing.ads.created', {
      date: data.date,
      platform: data.platform,
      campaignName: data.campaignName,
      spend: Number(data.spend),
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Daily ads metric recorded: ${data.platform} / ${data.campaignName || 'General'} — Rp ${Number(data.spend).toLocaleString()}`,
      loggedBy: 'SYSTEM:MARKETING',
    });

    return result;
  }

  async auditDailyAds(id: string, isAudited: boolean, auditorId: string) {
    const metric = await this.prisma.dailyAdsMetric.update({
      where: { id },
      data: {
        isAudited,
        auditedById: auditorId,
        auditedAt: isAudited ? new Date() : null,
      },
    });

    // CRITICAL: Log to SystemOverrideLog for security compliance
    await this.prisma.systemOverrideLog.create({
      data: {
        documentId: id,
        documentType: 'DAILY_ADS_METRIC',
        gateType: 'MARKETING_FINANCE_AUDIT',
        reason: isAudited ? 'Standard Finance Audit' : 'Rejected by Auditor',
        authorizedById: auditorId,
      },
    });

    this.eventEmitter.emit('marketing.ads.audited', {
      id,
      isAudited,
      auditorId,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'FINANCE',
      notes: `Daily ads metric ${id.slice(0, 8)} ${isAudited ? 'audited' : 'rejected'} by Finance`,
      loggedBy: auditorId,
    });

    return metric;
  }

  async createWeeklyOrganic(data: any) {
    const result = await this.prisma.accountHealthLog.upsert({
      where: {
        year_weekNumber_platform: {
          year: Number(data.year),
          weekNumber: Number(data.weekNumber),
          platform: data.platform,
        },
      },
      update: {
        totalFollowers: Number(data.totalFollowers),
        followerGrowth: Number(data.followerGrowth),
        unfollows: Number(data.unfollows || 0),
        totalReach: Number(data.totalReach),
        profileVisits: Number(data.profileVisits),
        postsCount: Number(data.postsCount || 0),
        storiesCount: Number(data.storiesCount || 0),
        avgStoryViews: Number(data.avgStoryViews || 0),
        likesCount: Number(data.likesCount || 0),
        commentsCount: Number(data.commentsCount || 0),
        savesCount: Number(data.savesCount || 0),
        sharesCount: Number(data.sharesCount || 0),
      },
      create: {
        year: Number(data.year),
        weekNumber: Number(data.weekNumber),
        platform: data.platform,
        totalFollowers: Number(data.totalFollowers),
        followerGrowth: Number(data.followerGrowth),
        unfollows: Number(data.unfollows || 0),
        totalReach: Number(data.totalReach),
        profileVisits: Number(data.profileVisits),
        postsCount: Number(data.postsCount || 0),
        storiesCount: Number(data.storiesCount || 0),
        avgStoryViews: Number(data.avgStoryViews || 0),
        likesCount: Number(data.likesCount || 0),
        commentsCount: Number(data.commentsCount || 0),
        savesCount: Number(data.savesCount || 0),
        sharesCount: Number(data.sharesCount || 0),
      },
    });

    this.eventEmitter.emit('marketing.organic.created', {
      platform: data.platform,
      year: data.year,
      weekNumber: data.weekNumber,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Weekly organic logged: ${data.platform} W${data.weekNumber}/${data.year}`,
      loggedBy: 'SYSTEM:MARKETING',
    });

    return result;
  }

  async createContentAsset(data: any) {
    const totalEng =
      Number(data.likes || 0) +
      Number(data.comments || 0) +
      Number(data.shares || 0) +
      Number(data.saves || 0);
    const engagementRate =
      Number(data.views) > 0 ? (totalEng / Number(data.views)) * 100 : 0;

    const result = await this.prisma.contentAsset.create({
      data: {
        title: data.title,
        publishDate: new Date(data.publishDate),
        platform: data.platform,
        contentPillar: data.contentPillar,
        url: data.url,
        views: Number(data.views),
        likes: Number(data.likes),
        comments: Number(data.comments),
        shares: Number(data.shares),
        saves: Number(data.saves),
        engagementRate: engagementRate,
      },
    });

    this.eventEmitter.emit('marketing.content.created', {
      id: result.id,
      title: result.title,
      platform: result.platform,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Content asset created: "${result.title}" on ${result.platform}`,
      loggedBy: 'SYSTEM:MARKETING',
    });

    return result;
  }

  async getBudgetAudit(startDate: Date, endDate: Date) {
    const paidSources = ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'];

    const adsAggregation = await this.prisma.dailyAdsMetric.aggregate({
      _sum: { spend: true },
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalSpend = Number(adsAggregation._sum.spend || 0);

    const totalLeads = await this.prisma.salesLead.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        source: { in: paidSources as any },
      },
    });

    const totalSamples = await this.prisma.sampleRequest.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        lead: { source: { in: paidSources as any } },
      },
    });

    const totalAcquisitions = await this.prisma.salesLead.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        source: { in: paidSources as any },
        status: 'WON_DEAL',
      },
    });

    return {
      totalSpend,
      totalLeads,
      totalAcquisitions,
      totalSamples,
      costPerLead: totalLeads > 0 ? totalSpend / totalLeads : 0,
      costPerSample: totalSamples > 0 ? totalSpend / totalSamples : 0,
      costPerAcquisition:
        totalAcquisitions > 0 ? totalSpend / totalAcquisitions : 0,
    };
  }

  async getPlatformPerformance(startDate: Date, endDate: Date) {
    const adsData = await this.prisma.dailyAdsMetric.groupBy({
      by: ['platform'],
      _sum: {
        spend: true,
        impressions: true,
        reach: true,
        clicks: true,
        leadsGenerated: true,
      },
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const leadData = await this.prisma.salesLead.groupBy({
      by: ['source'],
      _count: { _all: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Get revenue per source
    const sourceRevenue = await this.prisma.salesLead.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        salesOrders: {
          where: { status: 'COMPLETED' },
          select: { totalAmount: true },
        },
      },
    });

    const revenueMap = new Map<string, number>();
    sourceRevenue.forEach((l: any) => {
      const rawSource = l.source as string;
      const mappedSource = this.PLATFORM_MAP[rawSource] || rawSource;
      const rev = l.salesOrders.reduce(
        (sum: number, so: any) => sum + Number(so.totalAmount),
        0,
      );
      revenueMap.set(mappedSource, (revenueMap.get(mappedSource) || 0) + rev);
    });

    const allPlatforms = new Set([
      ...adsData.map((a) => a.platform),
      ...leadData.map((l) => this.PLATFORM_MAP[l.source] || l.source),
    ]);

    return Array.from(allPlatforms).map((targetPlatform: any) => {
      const ad = adsData.find((a) => a.platform === targetPlatform);
      const leadsCount = leadData
        .filter(
          (l: any) =>
            (this.PLATFORM_MAP[l.source] || l.source) === targetPlatform,
        )
        .reduce((sum, l) => sum + l._count._all, 0);

      const spend = Number(ad?._sum?.spend || 0);
      const impressions = ad?._sum?.impressions || 0;
      const clicks = ad?._sum?.clicks || 0;
      const leadsFromLogs = Number(ad?._sum?.leadsGenerated || 0);
      const revenue = revenueMap.get(targetPlatform) || 0;

      return {
        name: targetPlatform,
        spend,
        impressions,
        reach: ad?._sum?.reach || 0,
        clicks,
        leads: leadsFromLogs || leadsCount,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        cpl:
          (leadsFromLogs || leadsCount) > 0
            ? spend / (leadsFromLogs || leadsCount)
            : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      };
    });
  }

  async getAcquisitionHub(
    startDate: Date,
    endDate: Date,
    month: number,
    year: number,
  ) {
    const paidSources = ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'];

    // CONSOLIDATED ACQUISITION QUERY
    const [salesAggregation, targetAggregation, clientAcq, spendAggregation] =
      await Promise.all([
        this.prisma.salesOrder.aggregate({
          _sum: { totalAmount: true },
          where: {
            transactionDate: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
            lead: { source: { in: paidSources as any } },
          },
        }),
        this.prisma.marketingTarget.findUnique({
          where: { month_year: { month, year } },
          select: { revenueTarget: true },
        }),
        this.prisma.salesLead.count({
          where: {
            updatedAt: { gte: startDate, lte: endDate },
            status: 'WON_DEAL',
            source: { in: paidSources as any },
          },
        }),
        this.prisma.dailyAdsMetric.aggregate({
          _sum: { spend: true },
          where: { date: { gte: startDate, lte: endDate } },
        }),
      ]);

    const revenue = Number(salesAggregation._sum.totalAmount || 0);
    const target = Number(targetAggregation?.revenueTarget || 0);
    const totalSpend = Number(spendAggregation._sum.spend || 0);

    return {
      revenue,
      target,
      clientAcq,
      avgCPA: clientAcq > 0 ? totalSpend / clientAcq : 0,
      roas: totalSpend > 0 ? revenue / totalSpend : 0,
    };
  }

  async getFunnelEfficiency(startDate: Date, endDate: Date) {
    const paidSources = ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'];

    // HIGH PERFORMANCE GROUPED QUERY
    const [leadStats, samples, prospects, adsAgg] = await Promise.all([
      this.prisma.salesLead.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: {
          createdAt: { gte: startDate, lte: endDate },
          source: { in: paidSources as any },
        },
      }),
      this.prisma.sampleRequest.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          lead: { source: { in: paidSources as any } },
        },
      }),
      this.prisma.salesLead.count({
        where: {
          status: 'NEW_LEAD',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.dailyAdsMetric.aggregate({
        _sum: { leadsGenerated: true },
        where: { date: { gte: startDate, lte: endDate } },
      }),
    ]);

    const crmLeads = leadStats.reduce(
      (sum, s) => sum + (s._count?._all || 0),
      0,
    );
    const adsLeads = Number(adsAgg._sum.leadsGenerated || 0);
    const deals =
      leadStats.find((s) => (s as any).status === 'WON_DEAL')?._count?._all ||
      0;
    const leadsQualified =
      crmLeads -
      (leadStats.find((s) => (s as any).status === 'NEW_LEAD')?._count?._all ||
        0);

    return {
      leadsReported: adsLeads || crmLeads, // Use logs leads if available
      leadsQualified: leadsQualified || crmLeads || adsLeads, // Fallback chain
      samples,
      deals,
      prospects,
      leadToSampleRate:
        (adsLeads || crmLeads) > 0
          ? (samples / (adsLeads || crmLeads)) * 100
          : 0,
      closingRate:
        (adsLeads || crmLeads) > 0 ? (deals / (adsLeads || crmLeads)) * 100 : 0,
    };
  }

  async getContentPerformance(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 1. Top Leaders
    const topContent = await this.prisma.contentAsset.findMany({
      where: {
        publishDate: { gte: startDate, lte: endDate },
      },
      orderBy: { views: 'desc' },
      take: 10,
    });

    // 2. Vitality (Aggregate organic logs)
    const organicAggregation = await this.prisma.accountHealthLog.aggregate({
      _sum: {
        postsCount: true,
        totalReach: true,
        likesCount: true,
        commentsCount: true,
        sharesCount: true,
        savesCount: true,
        followerGrowth: true,
      },
      where: {
        year,
        // We might need a month mapping for weekly logs or just use the year/week logic
      },
    });

    return {
      topContent,
      aggregatedOrganic: organicAggregation._sum,
    };
  }

  /**
   * PHASE 2: FINANCE-BUSSDEV ROI BRIDGE
   * Calculates actual cash collected from marketing-driven leads
   */
  async getRealizedROI(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const paidSources = ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'];

    // 1. Get all payments confirmed in this period for marketing leads
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
        invoice: {
          so: {
            lead: {
              source: { in: paidSources as any },
            },
          },
        },
      },
      select: { amountPaid: true },
    });

    const realizedRevenue = payments.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0,
    );

    // 2. Get Ad Spend for the same period
    const adsAgg = await this.prisma.dailyAdsMetric.aggregate({
      _sum: { spend: true },
      where: { date: { gte: startDate, lte: endDate } },
    });

    const totalSpend = Number(adsAgg._sum.spend || 0);

    return {
      realizedRevenue,
      totalSpend,
      realizedRoas: totalSpend > 0 ? realizedRevenue / totalSpend : 0,
      paymentCount: payments.length,
    };
  }

  /**
   * PHASE 2: SAMPLE VELOCITY AUDIT
   * Monitors the time taken for samples to convert or provide feedback
   */
  async getSampleEfficiency() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const samples = await this.prisma.sampleRequest.findMany({
      where: {
        shippedAt: { gte: ninetyDaysAgo },
      },
      select: {
        shippedAt: true,
        completedAt: true,
        isApprovedByClient: true,
        lead: {
          select: { status: true },
        },
      },
    });

    const now = new Date();
    const stuckSamples = samples.filter((s) => {
      if (s.completedAt || s.isApprovedByClient) return false;
      const daysSinceShipped =
        (now.getTime() - s.shippedAt!.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceShipped > 7; // Stuck if > 7 days without feedback/completion
    });

    const convertedSamples = samples.filter(
      (s: any) => s.lead?.status === 'WON_DEAL',
    );

    return {
      totalShipped: samples.length,
      stuckInTransit: stuckSamples.length,
      conversionToDeal:
        samples.length > 0
          ? (convertedSamples.length / samples.length) * 100
          : 0,
      avgDaysToFeedback: 0, // Logic for feedback timeline could be added if logs exist
    };
  }

  async getProductPerformance(startDate: Date, endDate: Date) {
    const paidSources = ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'];

    const leads = await this.prisma.salesLead.groupBy({
      by: ['source'],
      _count: { _all: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
        source: { in: paidSources as any },
      },
    });

    const deals = await this.prisma.salesLead.groupBy({
      by: ['source'],
      _count: { _all: true },
      where: {
        updatedAt: { gte: startDate, lte: endDate },
        status: 'WON_DEAL',
        source: { in: paidSources as any },
      },
    });

    const paidLeads = await this.prisma.salesLead.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        source: { in: paidSources as any },
      },
      select: { id: true, source: true },
    });
    const leadIds = paidLeads.map((l) => l.id);

    const sampleCount = await this.prisma.sampleRequest.count({
      where: { leadId: { in: leadIds } },
    });

    const platformMap: Record<
      string,
      {
        name: string;
        leads: number;
        leadsStr: string;
        samples: number;
        samplesStr: string;
        deals: number;
        dealsStr: string;
        progress: number;
      }
    > = {
      IG_ADS: {
        name: 'Brightening Serum',
        leads: 0,
        leadsStr: '0',
        samples: 0,
        samplesStr: '0',
        deals: 0,
        dealsStr: '0 DEALS',
        progress: 0,
      },
      TIKTOK_ADS: {
        name: 'Acne Series',
        leads: 0,
        leadsStr: '0',
        samples: 0,
        samplesStr: '0',
        deals: 0,
        dealsStr: '0 DEALS',
        progress: 0,
      },
      FB_ADS: {
        name: 'Anti-Aging Retinol',
        leads: 0,
        leadsStr: '0',
        samples: 0,
        samplesStr: '0',
        deals: 0,
        dealsStr: '0 DEALS',
        progress: 0,
      },
      GOOGLE_ADS: {
        name: 'Moisturizer Gel',
        leads: 0,
        leadsStr: '0',
        samples: 0,
        samplesStr: '0',
        deals: 0,
        dealsStr: '0 DEALS',
        progress: 0,
      },
    };

    leads.forEach((l: any) => {
      const key = l.source as string;
      if (platformMap[key]) {
        platformMap[key].leads = l._count._all;
        platformMap[key].leadsStr = l._count._all.toLocaleString();
      }
    });

    deals.forEach((d: any) => {
      const key = d.source as string;
      if (platformMap[key]) {
        platformMap[key].deals = d._count._all;
        platformMap[key].dealsStr = `${d._count._all} DEALS`;
      }
    });

    const result = Object.values(platformMap)
      .map((p) => ({
        ...p,
        samples: Math.round(sampleCount / 4),
        samplesStr: Math.round(sampleCount / 4).toLocaleString(),
        progress:
          p.leads > 0
            ? Math.min(Math.round((p.deals / p.leads) * 100), 100)
            : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    return result;
  }

  async getLeadSourceRanking(startDate: Date, endDate: Date) {
    const sources = await this.prisma.salesLead.groupBy({
      by: ['source'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { _count: { id: 'desc' as any } },
      take: 5,
    });

    return sources.map((s: any) => ({
      name: s.source,
      leads: `${s._count.id} Leads`,
    }));
  }

  async getSearchVisibility(month: number, year: number) {
    const current = await this.prisma.searchVisibilityMetric.findUnique({
      where: { month_year: { month, year } },
    });

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previous = await this.prisma.searchVisibilityMetric.findUnique({
      where: { month_year: { month: prevMonth, year: prevYear } },
    });

    const curImp = Number(current?.impressions || 0);
    const curClicks = Number(current?.clicks || 0);
    const prevImp = Number(previous?.impressions || 0);
    const prevClicks = Number(previous?.clicks || 0);

    const impGrowth = prevImp > 0 ? ((curImp - prevImp) / prevImp) * 100 : 0;
    const clickGrowth =
      prevClicks > 0 ? ((curClicks - prevClicks) / prevClicks) * 100 : 0;

    return {
      totalImpressions: curImp,
      totalClicks: curClicks,
      avgCtr: Number(current?.avgCtr || 0),
      avgPosition: Number(current?.avgPosition || 0),
      growth: {
        impressions: `${impGrowth >= 0 ? '+' : ''}${impGrowth.toFixed(1)}% vs Prev`,
        clicks: `${clickGrowth >= 0 ? '+' : ''}${clickGrowth.toFixed(1)}% Growth`,
      },
    };
  }

  async getDailyAdsLogs() {
    return this.prisma.dailyAdsMetric.findMany({
      include: { verifier: { select: { fullName: true, email: true } } },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async getWeeklyOrganicLogs() {
    return this.prisma.accountHealthLog.findMany({
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      take: 100,
    });
  }

  async updateDailyAds(id: string, data: any) {
    const result = await this.prisma.dailyAdsMetric.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        spend: data.spend !== undefined ? Number(data.spend) : undefined,
        impressions:
          data.impressions !== undefined ? Number(data.impressions) : undefined,
        reach: data.reach !== undefined ? Number(data.reach) : undefined,
        clicks: data.clicks !== undefined ? Number(data.clicks) : undefined,
        leadsGenerated:
          data.leadsGenerated !== undefined
            ? Number(data.leadsGenerated)
            : undefined,
      },
    });

    this.eventEmitter.emit('marketing.ads.updated', {
      id,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Daily ads metric ${id.slice(0, 8)} updated`,
      loggedBy: 'SYSTEM:MARKETING',
    });

    return result;
  }

  async deleteDailyAds(id: string) {
    await this.prisma.dailyAdsMetric.delete({
      where: { id },
    });

    this.eventEmitter.emit('marketing.ads.deleted', {
      id,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Daily ads metric ${id.slice(0, 8)} deleted`,
      loggedBy: 'SYSTEM:MARKETING',
    });
  }

  async updateWeeklyOrganic(id: string, data: any) {
    const result = await this.prisma.accountHealthLog.update({
      where: { id },
      data: {
        ...data,
        year: data.year !== undefined ? Number(data.year) : undefined,
        weekNumber:
          data.weekNumber !== undefined ? Number(data.weekNumber) : undefined,
        totalFollowers:
          data.totalFollowers !== undefined
            ? Number(data.totalFollowers)
            : undefined,
        followerGrowth:
          data.followerGrowth !== undefined
            ? Number(data.followerGrowth)
            : undefined,
        unfollows:
          data.unfollows !== undefined ? Number(data.unfollows) : undefined,
        totalReach:
          data.totalReach !== undefined ? Number(data.totalReach) : undefined,
        profileVisits:
          data.profileVisits !== undefined
            ? Number(data.profileVisits)
            : undefined,
        postsCount:
          data.postsCount !== undefined ? Number(data.postsCount) : undefined,
        storiesCount:
          data.storiesCount !== undefined
            ? Number(data.storiesCount)
            : undefined,
        avgStoryViews:
          data.avgStoryViews !== undefined
            ? Number(data.avgStoryViews)
            : undefined,
        likesCount:
          data.likesCount !== undefined ? Number(data.likesCount) : undefined,
        commentsCount:
          data.commentsCount !== undefined
            ? Number(data.commentsCount)
            : undefined,
        savesCount:
          data.savesCount !== undefined ? Number(data.savesCount) : undefined,
        sharesCount:
          data.sharesCount !== undefined ? Number(data.sharesCount) : undefined,
      },
    });

    this.eventEmitter.emit('marketing.organic.updated', {
      id,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Weekly organic ${id.slice(0, 8)} updated`,
      loggedBy: 'SYSTEM:MARKETING',
    });

    return result;
  }

  async deleteWeeklyOrganic(id: string) {
    await this.prisma.accountHealthLog.delete({
      where: { id },
    });

    this.eventEmitter.emit('marketing.organic.deleted', {
      id,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Weekly organic ${id.slice(0, 8)} deleted`,
      loggedBy: 'SYSTEM:MARKETING',
    });
  }

  async getContentAssetLogs() {
    return this.prisma.contentAsset.findMany({
      orderBy: { publishDate: 'desc' },
      take: 100,
    });
  }

  async getMonthlyTargets(month: number, year: number) {
    const target = await this.prisma.marketingTarget.findUnique({
      where: { month_year: { month, year } },
    });

    return (
      target || {
        revenueTarget: 0,
        spendTarget: 0,
        leadTarget: 0,
        sampleTarget: 0,
        postTarget: 0,
        clientAcqTarget: 0,
      }
    );
  }

  async getOrganicAnalytics(startDate: Date, endDate: Date) {
    const topContents = await this.prisma.contentAsset.findMany({
      where: { publishDate: { gte: startDate, lte: endDate } },
      orderBy: { engagementRate: 'desc' },
      take: 5,
      select: {
        title: true,
        contentPillar: true,
        views: true,
        engagementRate: true,
        platform: true,
      },
    });

    const vitalityAgg = await this.prisma.contentAsset.aggregate({
      _sum: {
        views: true,
        likes: true,
        comments: true,
        shares: true,
        saves: true,
      },
      _count: { _all: true },
      where: { publishDate: { gte: startDate, lte: endDate } },
    });

    const healthLogs = await this.prisma.accountHealthLog.findMany({
      where: {
        OR: [
          {
            year: startDate.getFullYear(),
            weekNumber: { gte: getWeek(startDate) },
          },
          {
            year: endDate.getFullYear(),
            weekNumber: { lte: getWeek(endDate) },
          },
        ],
      },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });

    const platformMap: Record<string, any> = {};
    healthLogs.forEach((log) => {
      if (!platformMap[log.platform]) {
        platformMap[log.platform] = {
          platform: log.platform,
          totalFollowers: log.totalFollowers,
          followerGrowth: 0,
          totalReach: 0,
          profileVisits: 0,
          unfollows: 0,
          postsCount: 0,
          storiesCount: 0,
          likesCount: 0,
          commentsCount: 0,
          savesCount: 0,
          sharesCount: 0,
        };
      }
      platformMap[log.platform].followerGrowth += log.followerGrowth;
      platformMap[log.platform].unfollows += log.unfollows;
      platformMap[log.platform].totalReach += log.totalReach;
      platformMap[log.platform].profileVisits += log.profileVisits;
      platformMap[log.platform].postsCount += log.postsCount;
      platformMap[log.platform].storiesCount += log.storiesCount;
      platformMap[log.platform].likesCount += log.likesCount;
      platformMap[log.platform].commentsCount += log.commentsCount;
      platformMap[log.platform].savesCount += log.savesCount;
      platformMap[log.platform].sharesCount += log.sharesCount;
    });

    return {
      topContents,
      vitality: {
        totalViews: vitalityAgg._sum.views || 0,
        totalInteractions:
          (vitalityAgg._sum.likes || 0) +
          (vitalityAgg._sum.comments || 0) +
          (vitalityAgg._sum.shares || 0) +
          (vitalityAgg._sum.saves || 0),
        totalPosts: vitalityAgg._count._all || 0,
        engagementByCategory: {
          likes: vitalityAgg._sum.likes || 0,
          shares: vitalityAgg._sum.shares || 0,
          saves: vitalityAgg._sum.saves || 0,
        },
      },
      platformHealth: Object.values(platformMap),
    };
  }

  async getDashboardAnalytics(startDate: Date, endDate: Date) {
    // Use endDate for target month to better reflect current cycle
    const month = endDate.getMonth() + 1;
    const year = endDate.getFullYear();

    const [
      acquisition,
      funnel,
      budget,
      contentPerf,
      targets,
      organicAnalytics,
      platformHealth,
      realizedRoi,
      sampleEfficiency,
      trends,
      productPerformance,
      leadSourceRanking,
      searchVisibility,
    ] = await Promise.all([
      this.getAcquisitionHub(startDate, endDate, month, year),
      this.getFunnelEfficiency(startDate, endDate),
      this.getBudgetAudit(startDate, endDate),
      this.getContentPerformance(month, year),
      this.getMonthlyTargets(month, year),
      this.getOrganicAnalytics(startDate, endDate),
      this.getPlatformPerformance(startDate, endDate),
      this.getRealizedROI(month, year),
      this.getSampleEfficiency(),
      this.getTrends(startDate, endDate),
      this.getProductPerformance(startDate, endDate),
      this.getLeadSourceRanking(startDate, endDate),
      this.getSearchVisibility(month, year),
    ]);

    return {
      acquisition: {
        ...acquisition,
        revenueTarget: Number(targets?.revenueTarget || 0),
        realizedRevenue: Number(realizedRoi.realizedRevenue),
        realizedRoas: Number(realizedRoi.realizedRoas),
      },
      funnel: {
        ...funnel,
        syncHealth: 100,
        sampleStuckCount: sampleEfficiency.stuckInTransit,
        sampleToDealRate: sampleEfficiency.conversionToDeal,
      },
      budget: {
        ...budget,
        budgetTarget: Number(targets?.spendTarget || 0),
        budgetUsagePercent:
          Number(targets?.spendTarget || 0) > 0
            ? (budget.totalSpend / Number(targets?.spendTarget || 0)) * 100
            : 0,
      },
      vitality: {
        totalPosts: contentPerf.aggregatedOrganic.postsCount || 0,
        postTarget: Number(targets?.postTarget || 0),
        avgEngagement: 0,
        engagementByType: {
          likes: contentPerf.aggregatedOrganic.likesCount || 0,
          shares: contentPerf.aggregatedOrganic.sharesCount || 0,
          saves: contentPerf.aggregatedOrganic.savesCount || 0,
        },
      },
      platforms: platformHealth,
      trends: trends, // Reuse the trends from Promise.all
      topContent: contentPerf.topContent.map((ct) => ({
        title: ct.title,
        category: ct.contentPillar,
        views: ct.views,
        engagement: Number(ct.engagementRate),
        url: ct.url,
        status: ct.auditStatus,
      })),
      platformHealth: organicAnalytics.platformHealth,
      productPerformance,
      leadSourceRanking,
      searchVisibility,
      financeAudit: {
        lastRealizedRevenue: realizedRoi.realizedRevenue,
        paymentVerificationRate: 100,
      },
    };
  }

  async getTrends(startDate: Date, endDate: Date) {
    const [historyData, acquisitionData] = await Promise.all([
      this.prisma.dailyAdsMetric.groupBy({
        by: ['date'],
        _sum: { leadsGenerated: true, spend: true },
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.salesLead.groupBy({
        by: ['updatedAt'],
        _count: { _all: true },
        where: {
          updatedAt: { gte: startDate, lte: endDate },
          status: 'WON_DEAL',
        },
      }),
    ]);

    const dataMap = new Map(
      historyData.map((d: any) => [
        new Date(d.date).toDateString(),
        {
          leads: d._sum.leadsGenerated || 0,
          spend: Number(d._sum.spend || 0),
        },
      ]),
    );

    const acqMap = new Map();
    acquisitionData.forEach((d: any) => {
      const dateKey = new Date(d.updatedAt).toDateString();
      acqMap.set(dateKey, (acqMap.get(dateKey) || 0) + d._count._all);
    });

    const trends: any[] = [];
    const current = new Date(startDate);
    const safetyCap = 60;
    let count = 0;

    while (current <= endDate && count < safetyCap) {
      const dateKey = current.toDateString();
      const existing = dataMap.get(dateKey);
      const leads = existing?.leads || 0;
      const spend = existing?.spend || 0;
      const closing = acqMap.get(dateKey) || 0;

      trends.push({
        date: current.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
        }),
        leads,
        cpl: leads > 0 ? spend / leads : 0,
        closing,
        cpa: closing > 0 ? spend / closing : 0,
      });

      current.setDate(current.getDate() + 1);
      count++;
    }

    return trends;
  }

  // Target Management
  async setMonthlyTarget(data: any) {
    const result = await this.prisma.marketingTarget.upsert({
      where: { month_year: { month: data.month, year: data.year } },
      update: data,
      create: data,
    });

    this.eventEmitter.emit('marketing.targets.set', {
      month: data.month,
      year: data.year,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'FINANCE',
      notes: `Marketing targets set for ${data.month}/${data.year}`,
      loggedBy: 'SYSTEM:FINANCE',
    });

    return result;
  }

  async getMonthlyTarget(month: number, year: number) {
    return this.prisma.marketingTarget.findUnique({
      where: { month_year: { month, year } },
    });
  }

  async getComparisonData(date: string, type: 'ADS' | 'ORGANIC') {
    const targetDate = new Date(date);
    if (type === 'ADS') {
      return this.prisma.dailyAdsMetric.findMany({
        where: { date: targetDate },
      });
    } else {
      const year = targetDate.getFullYear();
      const weekNumber = getWeek(targetDate);
      return this.prisma.accountHealthLog.findMany({
        where: { year, weekNumber },
      });
    }
  }
}

function format(date: Date, str: string) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function getWeek(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
