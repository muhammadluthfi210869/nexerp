import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import {
  ReportingQueryDto,
  UpsertChannelMetricDto,
  UpsertWeeklyReportDto,
  UpsertStoryMetricDto,
  ConfigureIntegrationDto,
  TriggerIntegrationSyncDto,
} from '../canonical-marketing.dto';
import {
  MarketingViewer,
  ensureMarketingTaskRole,
  isMarketingManager,
} from '../marketing-domain.policy';
import { MarketingBrandService } from './marketing-brand.service';

@Injectable()
export class MarketingReportService {
  private readonly logger = new Logger(MarketingReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brandService: MarketingBrandService,
  ) {}

  private ensureSocialWriter(viewer: MarketingViewer) {
    this.brandService.ensureSocialWriter(viewer);
  }

  private ensureManager(viewer: MarketingViewer) {
    this.brandService.ensureManager(viewer);
  }

  private assertDateOrder(start?: string, end?: string) {
    if (!start || !end) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (
      !isNaN(startDate.getTime()) &&
      !isNaN(endDate.getTime()) &&
      startDate > endDate
    ) {
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'Tanggal awal tidak boleh lebih lambat dari tanggal akhir.',
      });
    }
  }

  private encryptSecret(secret: string): {
    encryptedToken: string;
    tokenIv: string;
    tokenTag: string;
    tokenHash: string;
  } {
    const rawKey =
      process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
    const key = createHash('sha256').update(rawKey).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    let enc = cipher.update(secret, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    const tokenHash = createHash('sha256').update(secret).digest('hex');
    return {
      encryptedToken: enc,
      tokenIv: iv.toString('hex'),
      tokenTag: tag.toString('hex'),
      tokenHash,
    };
  }

  jsonSafe<T>(val: T): T {
    return JSON.parse(
      JSON.stringify(val, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      ),
    );
  }

  private reportingResponse(row: any) {
    return {
      id: row.id,
      brandId: row.brandId,
      brand: row.brand
        ? {
            id: row.brand.id,
            code: row.brand.code,
            name: row.brand.name,
            primaryPlatform: row.brand.primaryPlatform,
          }
        : null,
      periodStart: row.periodStart?.toISOString() ?? null,
      periodEnd: row.periodEnd?.toISOString() ?? null,
      channelMetrics: (row.channelMetrics ?? []).map((m: any) => ({
        id: m.id,
        channel: m.channel,
        source: m.source,
        followersStart: m.followersStart,
        followersEnd: m.followersEnd,
        followersGained: m.followersGained,
        followersLost: m.followersLost,
        reach: m.reach,
        views: m.views,
        impressions: m.impressions,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        saves: m.saves,
        clicks: m.clicks,
        leads: m.leads,
        sampleRequests: m.sampleRequests,
        deals: m.deals,
        spend: m.spend ? Number(m.spend) : 0,
        revenue: m.revenue ? Number(m.revenue) : 0,
      })),
      weeklyReports: (row.weeklyReports ?? []).map((w: any) => ({
        id: w.id,
        weekNumber: w.weekNumber,
        weekStart: w.weekStart?.toISOString() ?? null,
        weekEnd: w.weekEnd?.toISOString() ?? null,
        followersStart: w.followersStart,
        followersEnd: w.followersEnd,
        followersGained: w.followersGained,
        followersLost: w.followersLost,
        reach: w.reach,
        views: w.views,
        impressions: w.impressions,
        totalEngagement: w.totalEngagement,
        storiesCount: w.storiesCount,
        storyViews: w.storyViews,
        highlights: w.highlights,
        notes: w.notes,
      })),
      storyMetrics: (row.storyMetrics ?? []).map((s: any) => ({
        id: s.id,
        date: s.date?.toISOString() ?? null,
        storiesCount: s.storiesCount,
        views: s.views,
        replies: s.replies,
        linkClicks: s.linkClicks,
        shares: s.shares,
        completionPct: s.completionPct !== null ? Number(s.completionPct) : null,
        topic: s.topic,
        notes: s.notes,
      })),
    };
  }

  private page<T>(items: T[], page: number, limit: number, total: number) {
    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getReporting(viewer: MarketingViewer, query: ReportingQueryDto) {
    this.brandService.ensureMarketingRead(viewer);
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: any = {};
    if (query.brandId) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          query.brandId,
        );
      const brand = await this.prisma.marketingBrand.findFirst({
        where: {
          OR: [
            ...(isUuid ? [{ id: query.brandId }] : []),
            { name: { equals: query.brandId, mode: 'insensitive' } },
            { code: { equals: query.brandId, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      where.brandId = brand
        ? brand.id
        : isUuid
          ? query.brandId
          : '00000000-0000-0000-0000-000000000000';
    }
    if (query.periodStart || query.periodEnd)
      where.AND = [
        query.periodStart
          ? { periodEnd: { gte: new Date(query.periodStart) } }
          : {},
        query.periodEnd
          ? { periodStart: { lte: new Date(query.periodEnd) } }
          : {},
      ];
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.marketingReportingPeriod.findMany({
        where,
        include: {
          brand: true,
          channelMetrics: {
            where: query.channel ? { channel: query.channel } : {},
            orderBy: { channel: 'asc' },
          },
          weeklyReports: { orderBy: { weekNumber: 'asc' } },
          storyMetrics: { orderBy: { date: 'asc' } },
          funnels: { where: query.channel ? { channel: query.channel } : {} },
        },
        orderBy: { periodEnd: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.marketingReportingPeriod.count({ where }),
    ]);
    return this.page(
      rows.map((row: any) => this.reportingResponse(row)),
      page,
      limit,
      total,
    );
  }

  async upsertChannelMetric(
    viewer: MarketingViewer,
    dto: UpsertChannelMetricDto,
    key?: string,
  ) {
    this.ensureSocialWriter(viewer);
    this.assertDateOrder(dto.periodStart, dto.periodEnd);
    const brand = await this.brandService.ensureActiveBrand(this.prisma, dto.brandId);
    const resolvedBrandId = brand.id;
    const period = await this.prisma.marketingReportingPeriod.upsert({
      where: {
        brandId_periodStart_periodEnd: {
          brandId: resolvedBrandId,
          periodStart: new Date(dto.periodStart),
          periodEnd: new Date(dto.periodEnd),
        },
      },
      create: {
        brandId: resolvedBrandId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        createdById: viewer.id,
      },
      update: {},
    });
    const gained = Math.max(0, dto.followersEnd - dto.followersStart);
    const lost = Math.max(0, dto.followersStart - dto.followersEnd);
    const metricData = {
      channel: dto.channel,
      source: dto.source,
      followersStart: dto.followersStart,
      followersEnd: dto.followersEnd,
      followersGained: gained,
      followersLost: lost,
      reach: dto.reach,
      views: dto.views,
      impressions: dto.impressions,
      likes: dto.likes,
      comments: dto.comments,
      shares: dto.shares,
      saves: dto.saves,
      clicks: dto.clicks,
      leads: dto.leads,
      sampleRequests: dto.sampleRequests,
      deals: dto.deals,
      spend: dto.spend,
      revenue: dto.revenue,
      enteredById: viewer.id,
    };
    const metric = await this.prisma.brandChannelMetric.upsert({
      where: {
        periodId_channel_source: {
          periodId: period.id,
          channel: dto.channel,
          source: dto.source,
        },
      },
      create: { ...metricData, periodId: period.id },
      update: { ...metricData, verifiedById: null, verifiedAt: null },
    });
    return this.jsonSafe(metric);
  }

  async upsertWeeklyReport(
    viewer: MarketingViewer,
    dto: UpsertWeeklyReportDto,
    key?: string,
  ) {
    this.ensureSocialWriter(viewer);
    this.assertDateOrder(dto.periodStart, dto.periodEnd);
    this.assertDateOrder(dto.weekStart, dto.weekEnd);
    const brand = await this.brandService.ensureActiveBrand(this.prisma, dto.brandId);
    const resolvedBrandId = brand.id;
    const period = await this.prisma.marketingReportingPeriod.upsert({
      where: {
        brandId_periodStart_periodEnd: {
          brandId: resolvedBrandId,
          periodStart: new Date(dto.periodStart),
          periodEnd: new Date(dto.periodEnd),
        },
      },
      create: {
        brandId: resolvedBrandId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        createdById: viewer.id,
      },
      update: {},
    });
    const gained =
      dto.followersGained ??
      Math.max(0, dto.followersEnd - dto.followersStart);
    const lost =
      dto.followersLost ??
      Math.max(0, dto.followersStart - dto.followersEnd);
    const weeklyData = {
      weekStart: new Date(dto.weekStart),
      weekEnd: new Date(dto.weekEnd),
      followersStart: dto.followersStart,
      followersEnd: dto.followersEnd,
      followersGained: gained,
      followersLost: lost,
      reach: dto.reach,
      views: dto.views,
      impressions: dto.impressions,
      totalEngagement: dto.totalEngagement,
      storiesCount: dto.storiesCount,
      storyViews: dto.storyViews,
      highlights: dto.highlights?.trim() || null,
      notes: dto.notes?.trim() || null,
      enteredById: viewer.id,
    };
    const report = await this.prisma.weeklySocialReport.upsert({
      where: {
        periodId_weekNumber: {
          periodId: period.id,
          weekNumber: dto.weekNumber,
        },
      },
      create: {
        ...weeklyData,
        periodId: period.id,
        weekNumber: dto.weekNumber,
      },
      update: { ...weeklyData, verifiedById: null, verifiedAt: null },
    });
    return this.jsonSafe(report);
  }

  async upsertStoryMetric(
    viewer: MarketingViewer,
    dto: UpsertStoryMetricDto,
    key?: string,
  ) {
    this.ensureSocialWriter(viewer);
    this.assertDateOrder(dto.periodStart, dto.periodEnd);
    const brand = await this.brandService.ensureActiveBrand(this.prisma, dto.brandId);
    const resolvedBrandId = brand.id;
    const period = await this.prisma.marketingReportingPeriod.upsert({
      where: {
        brandId_periodStart_periodEnd: {
          brandId: resolvedBrandId,
          periodStart: new Date(dto.periodStart),
          periodEnd: new Date(dto.periodEnd),
        },
      },
      create: {
        brandId: resolvedBrandId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        createdById: viewer.id,
      },
      update: {},
    });
    const storyDate = new Date(dto.date);
    const storyData = {
      storiesCount: dto.storiesCount,
      views: dto.views,
      replies: dto.replies,
      linkClicks: dto.linkClicks,
      shares: dto.shares,
      completionPct:
        dto.completionPct !== undefined ? dto.completionPct : null,
      topic: dto.topic?.trim() || null,
      notes: dto.notes?.trim() || null,
      enteredById: viewer.id,
    };
    const story = await this.prisma.storyDailyMetric.upsert({
      where: {
        brandId_date: {
          brandId: resolvedBrandId,
          date: storyDate,
        },
      },
      create: {
        ...storyData,
        brandId: resolvedBrandId,
        periodId: period.id,
        date: storyDate,
      },
      update: {
        ...storyData,
        periodId: period.id,
        verifiedById: null,
        verifiedAt: null,
      },
    });
    return this.jsonSafe(story);
  }

  async listIntegrations(viewer: MarketingViewer, brandId?: string) {
    this.brandService.ensureMarketingRead(viewer);
    return this.prisma.marketingIntegrationConnection.findMany({
      where: brandId ? { brandId } : {},
      select: {
        id: true,
        brandId: true,
        provider: true,
        status: true,
        config: true,
        scopes: true,
        tokenExpiresAt: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
        brand: { select: { code: true, name: true } },
        syncJobs: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            importedCount: true,
            skippedCount: true,
            errorCode: true,
            errorMessage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: [{ brandId: 'asc' }, { provider: 'asc' }],
    });
  }

  async configureIntegration(
    viewer: MarketingViewer,
    dto: ConfigureIntegrationDto,
    key?: string,
  ) {
    this.ensureManager(viewer);
    await this.brandService.ensureActiveBrand(this.prisma, dto.brandId);
    const encrypted = dto.secret ? this.encryptSecret(dto.secret) : {};
    const connection = await this.prisma.marketingIntegrationConnection.upsert({
      where: {
        brandId_provider: { brandId: dto.brandId, provider: dto.provider },
      },
      create: {
        brandId: dto.brandId,
        provider: dto.provider,
        status: dto.secret ? 'CONNECTED' : 'DISCONNECTED',
        config: (dto.config ?? {}) as any,
        scopes: dto.scopes ?? [],
        ...encrypted,
      },
      update: {
        config: dto.config as any,
        scopes: dto.scopes,
        ...(dto.secret ? { status: 'CONNECTED', ...encrypted } : {}),
      },
      select: {
        id: true,
        brandId: true,
        provider: true,
        status: true,
        config: true,
        scopes: true,
        tokenExpiresAt: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return connection;
  }

  async triggerIntegrationSync(
    viewer: MarketingViewer,
    dto: TriggerIntegrationSyncDto,
    key?: string,
  ) {
    this.ensureSocialWriter(viewer);
    const connection = await this.prisma.marketingIntegrationConnection.findUnique({
      where: { id: dto.connectionId },
      select: { id: true, brandId: true, provider: true, status: true },
    });
    if (!connection)
      throw new NotFoundException({
        code: 'INTEGRATION_NOT_FOUND',
        message: 'Koneksi integrasi tidak ditemukan.',
      });
    if (connection.status !== 'CONNECTED')
      throw new ConflictException({
        code: 'INTEGRATION_NOT_CONNECTED',
        message: 'Koneksi belum aktif.',
      });
    return this.prisma.marketingIntegrationSyncJob.create({
      data: {
        connectionId: connection.id,
        brandId: connection.brandId,
        provider: connection.provider,
        triggeredById: viewer.id,
      },
      select: {
        id: true,
        connectionId: true,
        brandId: true,
        provider: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
