// KpiService unit tests — covers computePerson, computeDivision,
// period helpers, topPerformers, and the empty-state fallback.

import { Test, TestingModule } from '@nestjs/testing';
import { KpiService } from '../../../src/modules/kpi/kpi.service';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';
import { ActivityLogService } from '../../../src/modules/activity-log/activity-log.service';
import { Division, LogActivityType } from '@prisma/client';

describe('KpiService', () => {
  let service: KpiService;
  let prismaMock: any;

  const mockActivityLog = {
    log: jest.fn(),
    findForUser: jest.fn(),
    purgeOlderThan: jest.fn(),
  };

  beforeEach(async () => {
    prismaMock = {
      activityLog: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ActivityLogService, useValue: mockActivityLog },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
    jest.clearAllMocks();
  });

  describe('period helpers', () => {
    it('periodLast7Days returns a 7-day window ending now', () => {
      const { from, to } = service.periodLast7Days();
      expect(from).toBeInstanceOf(Date);
      expect(to).toBeInstanceOf(Date);
      const spanMs = to!.getTime() - from!.getTime();
      expect(spanMs).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000 - 100);
      expect(spanMs).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 100);
    });

    it('periodThisMonth starts on day 1 of current month', () => {
      const { from, to } = service.periodThisMonth();
      expect(from!.getDate()).toBe(1);
      expect(from!.getHours()).toBe(0);
      expect(from!.getMinutes()).toBe(0);
      // to is exclusive boundary of next month
      expect(to!.getTime()).toBeGreaterThan(from!.getTime());
    });
  });

  describe('computePerson', () => {
    it('returns zeros + breakdown with all known types', async () => {
      prismaMock.activityLog.groupBy.mockResolvedValue([]);
      const result = await service.computePerson('user-1', {});
      expect(result.userId).toBe('user-1');
      expect(result.total).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.pageViews).toBe(0);
      expect(result.mutations).toBe(0);
      expect(result.period.from).toBeNull();
      expect(result.period.to).toBeNull();
    });

    it('aggregates groupBy rows by type and computes totals', async () => {
      prismaMock.activityLog.groupBy.mockResolvedValue([
        { type: LogActivityType.CREATE, _count: { _all: 3 } },
        { type: LogActivityType.PAGE_VIEW, _count: { _all: 7 } },
        { type: LogActivityType.STATE_TRANSITION, _count: { _all: 2 } },
      ]);
      const result = await service.computePerson('user-1', {});
      expect(result.total).toBe(12);
      expect(result.breakdown[LogActivityType.CREATE]).toBe(3);
      expect(result.breakdown[LogActivityType.PAGE_VIEW]).toBe(7);
      expect(result.breakdown[LogActivityType.STATE_TRANSITION]).toBe(2);
      expect(result.pageViews).toBe(7);
      expect(result.mutations).toBe(3); // only CREATE counts (no UPDATE/DELETE)
      expect(result.completionRate).toBe(2 / 3); // STATE_TRANSITION / CREATE
    });

    it('passes from/to into where.createdAt when provided', async () => {
      prismaMock.activityLog.groupBy.mockResolvedValue([]);
      const from = new Date('2026-01-01');
      const to = new Date('2026-01-31');
      await service.computePerson('user-1', { from, to });
      expect(prismaMock.activityLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            createdAt: { gte: from, lte: to },
          }),
        }),
      );
    });

    it('completionRate is 0 when there are zero CREATE rows', async () => {
      prismaMock.activityLog.groupBy.mockResolvedValue([
        { type: LogActivityType.PAGE_VIEW, _count: { _all: 5 } },
      ]);
      const result = await service.computePerson('user-1', {});
      expect(result.mutations).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });

  describe('computeDivision', () => {
    it('returns empty aggregate when no users found in division', async () => {
      prismaMock.activityLog.findMany.mockResolvedValue([]);
      const result = await service.computeDivision(Division.BD, {});
      expect(result.division).toBe(Division.BD);
      expect(result.aggregateScore).toBe(0);
      expect(result.metricCount).toBe(0);
      expect(result.metrics).toEqual([]);
      expect(result.topPerformers).toEqual([]);
      expect(result.aggregateFunction).toBe('MEAN');
      expect(result.formulaNote).toMatch(/MEAN of per-person scores/);
    });

    it('aggregates per-person scores via MEAN when division has activity', async () => {
      // Two distinct users in BD with activity
      prismaMock.activityLog.findMany.mockResolvedValue([
        { userId: 'u1' },
        { userId: 'u2' },
      ]);

      // groupBy for computePerson: each user has CREATE=2 + STATE_TRANSITION=1
      // → completionRate = 1/2 = 0.5 for each
      prismaMock.activityLog.groupBy.mockResolvedValue([
        { type: LogActivityType.CREATE, _count: { _all: 2 } },
        { type: LogActivityType.STATE_TRANSITION, _count: { _all: 1 } },
      ]);

      prismaMock.user.findMany.mockResolvedValue([
        { id: 'u1', fullName: 'Alice' },
        { id: 'u2', fullName: 'Bob' },
      ]);

      const result = await service.computeDivision(Division.BD, {});
      expect(result.metricCount).toBe(2);
      expect(result.aggregateScore).toBe(0.5); // MEAN(0.5, 0.5)
      expect(result.metrics[0]).toMatchObject({
        metricKey: 'person:u1',
        value: 0.5,
      });
      expect(result.topPerformers.length).toBe(2);
      expect(result.topPerformers[0].fullName).toMatch(/Alice|Bob/);
      expect(result.aggregateFunction).toBe('MEAN');
      expect(result.formulaNote).toMatch(/MEAN of 2 per-person/);
    });

    it('falls back to aggregateScore=0 when only one user with 0 completion', async () => {
      prismaMock.activityLog.findMany.mockResolvedValue([{ userId: 'lonely' }]);
      prismaMock.activityLog.groupBy.mockResolvedValue([
        { type: LogActivityType.PAGE_VIEW, _count: { _all: 3 } },
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'lonely', fullName: 'Solo' },
      ]);
      const result = await service.computeDivision(Division.SCM, {});
      expect(result.aggregateScore).toBe(0);
      expect(result.topPerformers[0].userId).toBe('lonely');
    });
  });

  describe('getDashboardMetrics', () => {
    it('returns the metrics slice of computeDivision', async () => {
      prismaMock.activityLog.findMany.mockResolvedValue([{ userId: 'u1' }]);
      prismaMock.activityLog.groupBy.mockResolvedValue([
        { type: LogActivityType.CREATE, _count: { _all: 1 } },
        { type: LogActivityType.STATE_TRANSITION, _count: { _all: 1 } },
      ]);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'u1', fullName: 'A' },
      ]);
      const result = await service.getDashboardMetrics(Division.FINANCE, {});
      expect(result.division).toBe(Division.FINANCE);
      expect(result.metrics.length).toBe(1);
      expect(result.metrics[0].metricKey).toBe('person:u1');
      expect(result.formulaNote).toMatch(/MEAN of 1 per-person/);
    });
  });

  describe('topPerformers', () => {
    it('returns ranked list, capped at limit, with user fullNames', async () => {
      prismaMock.activityLog.groupBy.mockResolvedValue([
        { userId: 'u1', _count: { _all: 10 } },
        { userId: 'u2', _count: { _all: 5 } },
      ]);
      // u1 completion = 1/2 = 0.5, u2 completion = 0/0 = 0
      prismaMock.activityLog.groupBy
        .mockResolvedValueOnce([
          { userId: 'u1', _count: { _all: 10 } },
          { userId: 'u2', _count: { _all: 5 } },
        ])
        .mockResolvedValueOnce([
          { type: LogActivityType.CREATE, _count: { _all: 2 } },
          { type: LogActivityType.STATE_TRANSITION, _count: { _all: 1 } },
        ])
        .mockResolvedValueOnce([
          { type: LogActivityType.PAGE_VIEW, _count: { _all: 3 } },
        ]);

      prismaMock.user.findMany.mockResolvedValue([
        { id: 'u1', fullName: 'Top' },
        { id: 'u2', fullName: 'Other' },
      ]);

      const result = await service.topPerformers({}, 5);
      expect(result.length).toBe(2);
      expect(result[0].userId).toBe('u1');
      expect(result[0].score).toBe(0.5);
      expect(result[0].fullName).toBe('Top');
    });

    it('returns empty list when no activity in period', async () => {
      prismaMock.activityLog.groupBy.mockResolvedValue([]);
      const result = await service.topPerformers({}, 10);
      expect(result).toEqual([]);
    });
  });
});