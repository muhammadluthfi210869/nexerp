import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { ProductionOeeService } from '../../src/modules/production/services/production-oee.service';
import { ProductionKpiService } from '../../src/modules/production/services/production-kpi.service';
import { ProductionCapacityService } from '../../src/modules/production/services/production-capacity.service';
import { ProductionAnalyticsService } from '../../src/modules/production/production-analytics.service';

describe('Production Analytics Domain Services (Sub-Fase B4)', () => {
  let prismaMock: any;
  let oeeService: ProductionOeeService;
  let capacityService: ProductionCapacityService;
  let kpiService: ProductionKpiService;
  let facadeService: ProductionAnalyticsService;

  beforeEach(() => {
    prismaMock = {
      machine: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      workOrder: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      productionLog: {
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _sum: {} }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      qCAudit: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      cOPQRecord: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      salesLead: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      productionSchedule: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      productionStepLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    oeeService = new ProductionOeeService(prismaMock);
    capacityService = new ProductionCapacityService(prismaMock);
    kpiService = new ProductionKpiService(prismaMock, capacityService);
    facadeService = new ProductionAnalyticsService(
      prismaMock,
      oeeService,
      kpiService,
      capacityService,
    );
  });

  describe('Instantiation & Backwards Compatibility', () => {
    it('instantiates facade with default dependencies (single prisma arg)', () => {
      const standaloneFacade = new ProductionAnalyticsService(prismaMock);
      expect(standaloneFacade).toBeDefined();
    });

    it('instantiates KPI service with default capacity service', () => {
      const standaloneKpi = new ProductionKpiService(prismaMock);
      expect(standaloneKpi).toBeDefined();
    });
  });

  describe('ProductionOeeService', () => {
    it('getMachineOEE returns 100% baseline when no logs exist', async () => {
      prismaMock.machine.findMany.mockResolvedValue([
        { id: 'm-1', name: 'Mixer 1', productionLogs: [] },
      ]);
      const res = await oeeService.getMachineOEE();
      expect(res).toHaveLength(1);
      expect(res[0].oee).toBe(100);
      expect(res[0].availability).toBe(100);
    });

    it('getQCStats computes passRate and metrics correctly', async () => {
      prismaMock.qCAudit.findMany.mockResolvedValue([
        { id: 'audit-1', status: 'GOOD', stepLogId: 's-1', notes: '' },
        { id: 'audit-2', status: 'REJECT', stepLogId: 's-2', notes: 'Viscosity fail' },
      ]);
      const res = await oeeService.getQCStats();
      expect(res.totalInspected).toBe(2);
      expect(res.passed).toBe(1);
      expect(res.rejected).toBe(1);
      expect(res.passRate).toBe('50.0');
    });

    it('getLeakageData returns aggregated leakages', async () => {
      const res = await oeeService.getLeakageData();
      expect(res).toHaveProperty('materialLeakage');
      expect(res).toHaveProperty('timeLeakage');
      expect(res).toHaveProperty('summary');
    });
  });

  describe('ProductionCapacityService', () => {
    it('getFloorData organizes active WOs by stage', async () => {
      prismaMock.workOrder.findMany.mockResolvedValue([]);
      const res = await capacityService.getFloorData();
      expect(res.stages).toBeDefined();
      expect(res.totalActive).toBe(0);
    });

    it('getMicroFlowDiagnostics returns wait times and heat status', async () => {
      prismaMock.workOrder.findMany.mockResolvedValue([]);
      const res = await capacityService.getMicroFlowDiagnostics();
      expect(res).toHaveLength(4);
      expect(res[0].stage).toBe('WAITING_MATERIAL');
      expect(res[0].heat).toBe('STABLE');
    });

    it('getProductionLeads fetches leads in production status', async () => {
      prismaMock.salesLead.findMany.mockResolvedValue([
        { id: 'lead-1', brandName: 'Brand X', productInterest: 'Serum' },
      ]);
      const res = await capacityService.getProductionLeads();
      expect(res).toHaveLength(1);
      expect(res[0].brandName).toBe('Brand X');
    });
  });

  describe('ProductionKpiService', () => {
    it('getDashboardAnalytics calculates cards and workshop metrics', async () => {
      prismaMock.workOrder.findMany.mockResolvedValue([]);
      prismaMock.productionLog.aggregate.mockResolvedValue({
        _sum: { inputQty: 1000, goodQty: 950, rejectQty: 50 },
      });
      prismaMock.productionLog.findMany.mockResolvedValue([]);
      const res = await kpiService.getDashboardAnalytics();
      expect(res.cards).toBeDefined();
      expect(res.workshops).toBeDefined();
      expect(res.period).toBe('Month-to-Date');
    });

    it('getExecutiveSummary calculates global yield', async () => {
      prismaMock.productionLog.aggregate.mockResolvedValue({
        _sum: { goodQty: 1000, rejectQty: 50, quarantineQty: 0 },
      });
      prismaMock.workOrder.groupBy.mockResolvedValue([]);
      prismaMock.productionLog.groupBy.mockResolvedValue([]);
      const res = await kpiService.getExecutiveSummary();
      expect(res.stats.totalGood).toBe(1000);
      expect(res.stats.totalLost).toBe(50);
      expect(res.stats.yieldPercentage).toBe('95.2');
    });
  });

  describe('ProductionAnalyticsService Facade Delegation', () => {
    it('delegates getDashboardAnalytics to KPI service', async () => {
      const spy = jest.spyOn(kpiService, 'getDashboardAnalytics').mockResolvedValue({} as any);
      await facadeService.getDashboardAnalytics();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('delegates getMachineOEE to OEE service', async () => {
      const spy = jest.spyOn(oeeService, 'getMachineOEE').mockResolvedValue([] as any);
      await facadeService.getMachineOEE();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('delegates getFloorData to Capacity service', async () => {
      const spy = jest.spyOn(capacityService, 'getFloorData').mockResolvedValue({} as any);
      await facadeService.getFloorData();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
