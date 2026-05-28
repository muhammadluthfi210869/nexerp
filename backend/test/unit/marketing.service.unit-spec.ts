import { Test, TestingModule } from '@nestjs/testing';
import { MarketingService } from '../../src/modules/marketing/marketing/marketing.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestModule } from '../utilities/test-module';

describe('MarketingService — Unit', () => {
  let service: MarketingService;
  let prisma: any;
  let eventEmitter: any;

  beforeEach(async () => {
    const defaultMethods = [
      'findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete', 'count', 'aggregate', 'upsert', 'groupBy',
    ];
    const allCollections = [
      'user', 'salesLead', 'sampleRequest', 'salesOrder', 'invoice',
      'dailyAdsMetric', 'accountHealthLog', 'contentAsset', 'marketingTarget',
      'searchVisibilityMetric', 'payment', 'leadActivity', 'activityStream',
    ];
    prisma = {
      $transaction: jest.fn((fn: any) => fn(prisma)),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
    for (const col of allCollections) {
      const obj: Record<string, jest.Mock> = {};
      for (const method of defaultMethods) {
        obj[method] = jest.fn();
      }
      prisma[col] = obj;
    }
    eventEmitter = TestModule.mockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketingService,
        { provide: PrismaService, useValue: prisma },
        { provide: FinanceService, useValue: {} },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<MarketingService>(MarketingService);
  });

  describe('createDailyAds', () => {
    it('upserts daily ads metric and emits events', async () => {
      const mockResult = {
        id: 'ADS-1',
        date: new Date('2026-05-01'),
        platform: 'IG_ADS',
        campaignName: 'General',
        spend: 500000,
        impressions: 10000,
        reach: 8000,
        clicks: 200,
        leadsGenerated: 15,
      };
      prisma.dailyAdsMetric.upsert.mockResolvedValue(mockResult);

      const result = await service.createDailyAds({
        date: '2026-05-01',
        platform: 'IG_ADS',
        campaignName: 'General',
        spend: 500000,
        impressions: 10000,
        reach: 8000,
        clicks: 200,
        leadsGenerated: 15,
      });

      expect(result).toEqual(mockResult);
      expect(prisma.dailyAdsMetric.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date_platform_campaignName: expect.any(Object),
          }),
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'marketing.ads.created',
        expect.objectContaining({ platform: 'IG_ADS', spend: 500000 }),
      );
    });
  });

  describe('getDailyAdsLogs', () => {
    it('returns recent daily ads metrics with verifier', async () => {
      const mockLogs = [
        {
          id: 'ADS-1',
          platform: 'IG_ADS',
          spend: 500000,
          verifier: { fullName: 'Finance User', email: 'fin@test.com' },
        },
      ];
      prisma.dailyAdsMetric.findMany.mockResolvedValue(mockLogs);

      const result = await service.getDailyAdsLogs();

      expect(result).toEqual(mockLogs);
      expect(prisma.dailyAdsMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            verifier: { select: { fullName: true, email: true } },
          }),
          orderBy: { date: 'desc' },
          take: 100,
        }),
      );
    });

    it('returns empty array when no logs exist', async () => {
      prisma.dailyAdsMetric.findMany.mockResolvedValue([]);

      const result = await service.getDailyAdsLogs();

      expect(result).toEqual([]);
    });
  });

  describe('getBudgetAudit', () => {
    it('calculates cost per lead and cost per acquisition', async () => {
      prisma.dailyAdsMetric.aggregate.mockResolvedValue({
        _sum: { spend: 2000000 },
      });
      prisma.salesLead.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(5);
      prisma.sampleRequest.count.mockResolvedValue(20);

      const result = await service.getBudgetAudit(
        new Date('2026-05-01'),
        new Date('2026-05-31'),
      );

      expect(result.totalSpend).toBe(2000000);
      expect(result.totalLeads).toBe(50);
      expect(result.totalAcquisitions).toBe(5);
      expect(result.totalSamples).toBe(20);
      expect(result.costPerLead).toBe(40000);
      expect(result.costPerAcquisition).toBe(400000);
    });

    it('returns zero costs when no data exists', async () => {
      prisma.dailyAdsMetric.aggregate.mockResolvedValue({
        _sum: { spend: null },
      });
      prisma.salesLead.count.mockResolvedValue(0);
      prisma.sampleRequest.count.mockResolvedValue(0);

      const result = await service.getBudgetAudit(
        new Date('2026-05-01'),
        new Date('2026-05-31'),
      );

      expect(result.totalSpend).toBe(0);
      expect(result.costPerLead).toBe(0);
      expect(result.costPerAcquisition).toBe(0);
    });
  });

  describe('getPlatformPerformance', () => {
    it('returns platform metrics with ROAS and CPC', async () => {
      prisma.dailyAdsMetric.groupBy.mockResolvedValue([
        {
          platform: 'IG_ADS',
          _sum: {
            spend: 1000000,
            impressions: 50000,
            reach: 30000,
            clicks: 1000,
            leadsGenerated: 30,
          },
        },
      ]);
      prisma.salesLead.groupBy.mockResolvedValue([]);
      prisma.salesLead.findMany.mockResolvedValue([]);

      const result = await service.getPlatformPerformance(
        new Date('2026-05-01'),
        new Date('2026-05-31'),
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('IG_ADS');
      expect(result[0].spend).toBe(1000000);
      expect(result[0].cpc).toBe(1000);
      expect(result[0].cpm).toBe(20000);
      expect(result[0].roas).toBe(0);
    });
  });

  describe('getAcquisitionHub', () => {
    it('returns revenue, target, and ROAS metrics', async () => {
      prisma.salesOrder.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000000 },
      });
      prisma.marketingTarget.findUnique.mockResolvedValue({
        revenueTarget: 100000000,
      });
      prisma.salesLead.count.mockResolvedValue(10);
      prisma.dailyAdsMetric.aggregate.mockResolvedValue({
        _sum: { spend: 5000000 },
      });

      const result = await service.getAcquisitionHub(
        new Date('2026-05-01'),
        new Date('2026-05-31'),
        5,
        2026,
      );

      expect(result.revenue).toBe(50000000);
      expect(result.target).toBe(100000000);
      expect(result.clientAcq).toBe(10);
      expect(result.avgCPA).toBe(500000);
      expect(result.roas).toBe(10);
    });
  });

  describe('getFunnelEfficiency', () => {
    it('returns funnel metrics with conversion rates', async () => {
      prisma.salesLead.groupBy.mockResolvedValue([
        { status: 'NEW_LEAD', _count: { _all: 30 } },
        { status: 'WON_DEAL', _count: { _all: 5 } },
      ]);
      prisma.sampleRequest.count.mockResolvedValue(15);
      prisma.salesLead.count.mockResolvedValue(30);
      prisma.dailyAdsMetric.aggregate.mockResolvedValue({
        _sum: { leadsGenerated: 50 },
      });

      const result = await service.getFunnelEfficiency(
        new Date('2026-05-01'),
        new Date('2026-05-31'),
      );

      expect(result.leadsReported).toBe(50);
      expect(result.samples).toBe(15);
      expect(result.deals).toBe(5);
      expect(result.leadToSampleRate).toBe(30);
      expect(result.closingRate).toBe(10);
    });
  });

  describe('getContentPerformance', () => {
    it('returns top content and organic aggregation', async () => {
      prisma.contentAsset.findMany.mockResolvedValue([
        { id: 'CT-1', title: 'Post 1', views: 5000 },
      ]);
      prisma.accountHealthLog.aggregate.mockResolvedValue({
        _sum: {
          postsCount: 10,
          totalReach: 100000,
          likesCount: 500,
          commentsCount: 50,
          sharesCount: 30,
          savesCount: 20,
          followerGrowth: 200,
        },
      });

      const result = await service.getContentPerformance(5, 2026);

      expect(result.topContent).toHaveLength(1);
      expect(result.aggregatedOrganic.postsCount).toBe(10);
      expect(result.aggregatedOrganic.totalReach).toBe(100000);
    });
  });

  describe('getRealizedROI', () => {
    it('calculates realized ROAS from confirmed payments', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { amountPaid: 25000000 },
        { amountPaid: 25000000 },
      ]);
      prisma.dailyAdsMetric.aggregate.mockResolvedValue({
        _sum: { spend: 5000000 },
      });

      const result = await service.getRealizedROI(5, 2026);

      expect(result.realizedRevenue).toBe(50000000);
      expect(result.totalSpend).toBe(5000000);
      expect(result.realizedRoas).toBe(10);
      expect(result.paymentCount).toBe(2);
    });

    it('returns zero ROAS when no spend', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.dailyAdsMetric.aggregate.mockResolvedValue({
        _sum: { spend: null },
      });

      const result = await service.getRealizedROI(5, 2026);

      expect(result.realizedRevenue).toBe(0);
      expect(result.realizedRoas).toBe(0);
    });
  });

  describe('getSampleEfficiency', () => {
    it('returns sample metrics with conversion rate', async () => {
      const now = new Date();
      prisma.sampleRequest.findMany.mockResolvedValue([
        {
          shippedAt: new Date(now.getTime() - 3 * 86400000),
          completedAt: now,
          isApprovedByClient: true,
          lead: { status: 'WON_DEAL' },
        },
        {
          shippedAt: new Date(now.getTime() - 10 * 86400000),
          completedAt: null,
          isApprovedByClient: false,
          lead: { status: 'NEW_LEAD' },
        },
      ]);

      const result = await service.getSampleEfficiency();

      expect(result.totalShipped).toBe(2);
      expect(result.stuckInTransit).toBe(1);
      expect(result.conversionToDeal).toBe(50);
    });

    it('returns zero metrics when no samples shipped', async () => {
      prisma.sampleRequest.findMany.mockResolvedValue([]);

      const result = await service.getSampleEfficiency();

      expect(result.totalShipped).toBe(0);
      expect(result.conversionToDeal).toBe(0);
    });
  });

  describe('getMonthlyTargets', () => {
    it('returns target when found', async () => {
      prisma.marketingTarget.findUnique.mockResolvedValue({
        revenueTarget: 100000000,
        spendTarget: 10000000,
        leadTarget: 200,
      });

      const result = await service.getMonthlyTargets(5, 2026);

      expect(result.revenueTarget).toBe(100000000);
      expect(result.spendTarget).toBe(10000000);
    });

    it('returns default zero targets when not found', async () => {
      prisma.marketingTarget.findUnique.mockResolvedValue(null);

      const result = await service.getMonthlyTargets(5, 2026);

      expect(result.revenueTarget).toBe(0);
      expect(result.spendTarget).toBe(0);
      expect(result.leadTarget).toBe(0);
    });
  });

  describe('getLeadSourceRanking', () => {
    it('returns top 5 lead sources', async () => {
      prisma.salesLead.groupBy.mockResolvedValue([
        { source: 'IG_ADS', _count: { id: 45 } },
        { source: 'TIKTOK_ADS', _count: { id: 30 } },
      ]);

      const result = await service.getLeadSourceRanking(
        new Date('2026-05-01'),
        new Date('2026-05-31'),
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('IG_ADS');
      expect(result[0].leads).toBe('45 Leads');
    });
  });

  describe('deleteDailyAds', () => {
    it('deletes metric and emits events', async () => {
      prisma.dailyAdsMetric.delete.mockResolvedValue({});

      await service.deleteDailyAds('ADS-1');

      expect(prisma.dailyAdsMetric.delete).toHaveBeenCalledWith({
        where: { id: 'ADS-1' },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('marketing.ads.deleted', {
        id: 'ADS-1',
      });
    });
  });

  describe('updateDailyAds', () => {
    it('updates metric and emits events', async () => {
      const mockUpdated = { id: 'ADS-1', spend: 750000 };
      prisma.dailyAdsMetric.update.mockResolvedValue(mockUpdated);

      const result = await service.updateDailyAds('ADS-1', { spend: 750000 });

      expect(result).toEqual(mockUpdated);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'marketing.ads.updated',
        { id: 'ADS-1' },
      );
    });
  });
});
