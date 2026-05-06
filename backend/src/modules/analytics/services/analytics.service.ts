import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CacheService } from '../../../shared/cache.service';
import { WorkflowStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getMarketingAudit() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [
      mktAgg,
      totalLeads,
      totalClosed,
      totalRevenue,
      totalSamples,
      trends,
      contentLeaders,
      latestHealth,
      platformAudit,
      leadSources,
    ] = await Promise.all([
      this.prisma.dailyAdsMetric.aggregate({
        where: { date: { gte: thirtyDaysAgo } },
        _sum: { spend: true, impressions: true, clicks: true },
      }),
      this.prisma.salesLead.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.salesLead.count({
        where: {
          status: WorkflowStatus.WON_DEAL,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.salesOrder.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalAmount: true },
      }),
      this.prisma.salesLead.count({
        where: {
          status: WorkflowStatus.SAMPLE_REQUESTED,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.getTrendData(30),
      this.prisma.contentAsset.findMany({
        orderBy: { views: 'desc' },
        take: 4,
      }),
      this.prisma.accountHealthLog.findMany({
        orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
        take: 4,
      }),
      this.getPlatformAudit(thirtyDaysAgo),
      this.prisma.salesLead.groupBy({
        by: ['source'],
        _count: { id: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const spend = Number(mktAgg._sum.spend) || 0;
    const revenue = Number(totalRevenue._sum.totalAmount) || 0;
    const cpl = totalLeads > 0 ? spend / totalLeads : 0;
    const cpa = totalClosed > 0 ? spend / totalClosed : 0;

    return {
      acquisition: {
        revenue_mtd: revenue,
        target: 350000000,
        deal_count: totalClosed,
        avg_cpa: cpa,
      },
      funnel: {
        leads: totalLeads,
        qualified: Math.floor(totalLeads * 0.8),
        samples: totalSamples,
        closing_rate: totalLeads > 0 ? (totalClosed / totalLeads) * 100 : 0,
      },
      budget: {
        total_spend: spend,
        budget_limit: 150000000,
        cpl,
        cost_per_sample: totalSamples > 0 ? spend / totalSamples : 0,
      },
      trends,
      content: contentLeaders,
      vitality: {
        followers: latestHealth[0]?.totalFollowers || 0,
        growth: latestHealth.reduce(
          (acc, curr) => acc + curr.followerGrowth,
          0,
        ),
        total_reach: latestHealth.reduce(
          (acc, curr) => acc + curr.totalReach,
          0,
        ),
        profile_visits: latestHealth.reduce(
          (acc, curr) => acc + curr.profileVisits,
          0,
        ),
      },
      platform_audit: platformAudit,
      lead_ranking: leadSources.map((s) => ({
        source: s.source,
        count: s._count.id,
      })),
    };
  }

  async getExecutiveKPIs() {
    const cached = this.cache.get<any>('executive-kpis');
    if (cached) return cached;
    const data = await this.getMarketingAudit();
    this.cache.set('executive-kpis', data, 30_000);
    return data;
  }

  async getTrends() {
    return this.getTrendData(7);
  }

  async getProductPerformance() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const audit = await this.getPlatformAudit(thirtyDaysAgo);
    return audit;
  }

  async getSocialAnalytics() {
    const audit = await this.getMarketingAudit();
    return {
      metrics: [],
      content: audit.content,
      summary: audit.vitality,
    };
  }

  private async getTrendData(daysCount: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    startDate.setHours(0, 0, 0, 0);

    const [dailyLeads, dailySpend] = await Promise.all([
      this.prisma.salesLead.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      this.prisma.dailyAdsMetric.findMany({
        where: { date: { gte: startDate } },
        select: { date: true, spend: true },
      }),
    ]);

    const leadsByDate = new Map<string, number>();
    const spendByDate = new Map<string, number>();

    for (const lead of dailyLeads) {
      const key = lead.createdAt.toISOString().split('T')[0];
      leadsByDate.set(key, (leadsByDate.get(key) || 0) + 1);
    }

    for (const metric of dailySpend) {
      const key = metric.date.toISOString().split('T')[0];
      spendByDate.set(key, (spendByDate.get(key) || 0) + Number(metric.spend));
    }

    const result: {
      date: string;
      leads: number;
      cpl: number;
      spend: number;
    }[] = [];
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      const leads = leadsByDate.get(key) || 0;
      const spend = spendByDate.get(key) || 0;
      result.push({
        date: key,
        leads,
        cpl: leads > 0 ? spend / leads : 0,
        spend,
      });
    }

    return result;
  }

  private async getPlatformAudit(since: Date) {
    const agg = await this.prisma.dailyAdsMetric.groupBy({
      by: ['platform'],
      where: { date: { gte: since } },
      _sum: { spend: true, impressions: true, clicks: true },
    });

    const leadCounts = await this.prisma.salesLead.groupBy({
      by: ['source'],
      _count: { id: true },
      where: { createdAt: { gte: since } },
    });

    const leadMap = new Map(leadCounts.map((l) => [l.source, l._count.id]));

    return agg.map((entry) => {
      const platform = entry.platform;
      const spend = Number(entry._sum.spend) || 0;
      const pLeads = leadMap.get(platform as any) || 0;
      return {
        platform,
        spend,
        leads: pLeads,
        cpl: pLeads > 0 ? spend / pLeads : 0,
        impressions: entry._sum.impressions || 0,
        clicks: entry._sum.clicks || 0,
        cpc:
          Number(entry._sum.clicks) > 0 ? spend / Number(entry._sum.clicks) : 0,
      };
    });
  }
}
