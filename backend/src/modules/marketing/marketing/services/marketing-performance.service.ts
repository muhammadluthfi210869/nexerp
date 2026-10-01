import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import { MarketingAdsService } from './marketing-ads.service';
import { MarketingOrganicService } from './marketing-organic.service';

function getWeek(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

@Injectable()
export class MarketingPerformanceService {
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
    private readonly prisma: PrismaService,
    private readonly adsService: MarketingAdsService,
    private readonly organicService: MarketingOrganicService,
  ) {}

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
      leadsReported: adsLeads || crmLeads,
      leadsQualified: leadsQualified || crmLeads || adsLeads,
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

    const topContent = await this.prisma.contentAsset.findMany({
      where: {
        publishDate: { gte: startDate, lte: endDate },
      },
      orderBy: { views: 'desc' },
      take: 10,
    });

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
      },
    });

    return {
      topContent,
      aggregatedOrganic: organicAggregation._sum,
    };
  }

  async getRealizedROI(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const paidSources = ['IG_ADS', 'TIKTOK_ADS', 'FB_ADS', 'GOOGLE_ADS'];

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
      return daysSinceShipped > 7;
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
      avgDaysToFeedback: 0,
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

  async getDashboardAnalytics(startDate: Date, endDate: Date) {
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
      this.adsService.getBudgetAudit(startDate, endDate),
      this.getContentPerformance(month, year),
      this.adsService.getMonthlyTargets(month, year),
      this.organicService.getOrganicAnalytics(startDate, endDate),
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
      trends: trends,
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
