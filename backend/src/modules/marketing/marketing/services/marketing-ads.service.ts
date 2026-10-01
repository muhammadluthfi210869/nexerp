import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MarketingAdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
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

  async getDailyAdsLogs() {
    return this.prisma.dailyAdsMetric.findMany({
      include: { verifier: { select: { fullName: true, email: true } } },
      orderBy: { date: 'desc' },
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

    this.eventEmitter.emit('marketing.ads.updated', { id });
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

    this.eventEmitter.emit('marketing.ads.deleted', { id });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'MARKETING',
      notes: `Daily ads metric ${id.slice(0, 8)} deleted`,
      loggedBy: 'SYSTEM:MARKETING',
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
}
