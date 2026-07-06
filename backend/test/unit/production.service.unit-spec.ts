import { Test, TestingModule } from '@nestjs/testing';
import { ProductionService } from '../../src/modules/production/production.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { LegalityService } from '../../src/modules/legality/legality.service';
import { TestModule } from '../utilities/test-module';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ProductionService — Unit', () => {
  let service: ProductionService;
  let prisma: any;
  let eventEmitter: any;
  let idGenerator: any;
  let legalityService: any;

  const mockLeadId = 'LEAD-001';
  const mockWoId = '550e8400-e29b-41d4-a716-446655440000';
  const mockMachineId = 'MACH-001';
  const mockOperatorId = 'OP-001';

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    eventEmitter = TestModule.mockEventEmitter();
    idGenerator = {
      generateId: jest.fn().mockResolvedValue('WO-2026-00001'),
      generateStageId: jest.fn().mockResolvedValue('LOG-MIX-001'),
    };
    legalityService = {
      checkProductionGate: jest.fn().mockResolvedValue({ allowed: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: IdGeneratorService, useValue: idGenerator },
        { provide: LegalityService, useValue: legalityService },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  describe('startProduction', () => {
    it('should reject if materials not released (pending requisitions)', async () => {
      prisma.materialRequisition.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 'REQ-1', status: 'PENDING' }]);

      await expect(service.startProduction(mockWoId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if packaging design not approved', async () => {
      prisma.materialRequisition.findMany = jest.fn().mockResolvedValue([]);
      prisma.workOrder.findUnique = jest.fn().mockResolvedValue({
        id: mockWoId,
        targetQty: 500,
        woNumber: 'WO-001',
        lead: { designTasks: [] },
      });

      await expect(service.startProduction(mockWoId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should start production and create log', async () => {
      prisma.materialRequisition.findMany = jest.fn().mockResolvedValue([]);
      prisma.workOrder.findUnique = jest
        .fn()
        .mockResolvedValue({
          id: mockWoId,
          targetQty: 500,
          woNumber: 'WO-001',
          lead: { designTasks: [{ isFinal: true }] },
        });
      prisma.workOrder.update = jest
        .fn()
        .mockResolvedValue({ woNumber: 'WO-001', stage: 'MIXING' });
      prisma.productionLog.create = jest.fn().mockResolvedValue({ id: 'LOG-1' });
      prisma.machine.update = jest.fn();

      const result = await service.startProduction(
        mockWoId,
        mockMachineId,
        mockOperatorId,
      );

      expect(result.woNumber).toBe('WO-001');
      expect(result.message).toContain('Production started');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'production.work_order.started',
        expect.any(Object),
      );
    });
  });

  describe('startStage', () => {
    it('should create a production log for the given stage', async () => {
      prisma.productionLog.create = jest
        .fn()
        .mockResolvedValue({ id: 'LOG-1', logNumber: 'LOG-MIX-001' });

      const result = await service.startStage(
        mockWoId,
        'MIXING' as any,
        mockMachineId,
        mockOperatorId,
      );

      expect(result.logNumber).toBe('LOG-MIX-001');
      expect(prisma.productionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stage: 'MIXING' }),
        }),
      );
    });
  });

  describe('reportBreakdown', () => {
    it('should set machine to DOWN and log breakdown', async () => {
      prisma.machine.findUnique = jest.fn().mockResolvedValue({
        id: mockMachineId,
        name: 'Mixer A',
        status: 'IDLE',
      });
      prisma.workOrder.findUnique = jest.fn().mockResolvedValue({
        id: mockWoId,
        stage: 'MIXING',
      });
      prisma.machine.update = jest.fn();
      prisma.productionLog.create = jest
        .fn()
        .mockResolvedValue({ id: 'LOG-BRK' });

      const result = await service.reportBreakdown(
        mockWoId,
        'MIXING' as any,
        mockMachineId,
        'Motor overheated',
      );

      expect(prisma.machine.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockMachineId },
          data: { isActive: false },
        }),
      );
      expect(result.id).toBe('LOG-BRK');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'production.breakdown.reported',
        expect.any(Object),
      );
    });
  });

  describe('submitStageLog', () => {
    const baseDto = {
      stage: 'MIXING',
      inputQty: 500,
      goodQty: 450,
      quarantineQty: 20,
      rejectQty: 10,
      notes: 'Test run',
      nextStage: 'FILLING',
      machineId: mockMachineId,
      downtimeMinutes: 15,
    };

    it('should calculate shrinkage correctly', async () => {
      prisma.workOrder.findUnique = jest
        .fn()
        .mockResolvedValue({ id: mockWoId, targetQty: 500 });
      prisma.productionLog.findFirst = jest.fn().mockResolvedValue(null);
      prisma.productionLog.create = jest
        .fn()
        .mockResolvedValue({ id: 'LOG-1' });
      idGenerator.generateStageId = jest.fn().mockResolvedValue('LOG-FINAL-001');
      prisma.machine.update = jest.fn();

      await service.submitStageLog(mockWoId, baseDto);

      const createdLog = prisma.productionLog.create.mock.calls[0][0];
      expect(createdLog.data.shrinkageQty).toBe(
        500 - 450 - 10 - 20, // input - good - reject - quarantine = 20 shrinkage
      );
    });

    it('should set FTY = false when reject > 0', async () => {
      prisma.workOrder.findUnique = jest.fn().mockResolvedValue({
        id: mockWoId,
        targetQty: 500,
        planId: 'PLAN-001',
      });
      prisma.productionLog.findFirst = jest.fn().mockResolvedValue(null);
      prisma.productionLog.create = jest.fn();
      idGenerator.generateStageId = jest.fn().mockResolvedValue('LOG-FINAL-001');
      prisma.machine.update = jest.fn();

      await service.submitStageLog(mockWoId, baseDto);

      expect(prisma.productionPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'PLAN-001' },
          data: { isFirstPass: false },
        }),
      );
    });

    it('should require BPOM gate for FILLING stage', async () => {
      const fillingDto = { ...baseDto, stage: 'FILLING', nextStage: 'PACKING' };
      prisma.workOrder.findUnique = jest.fn().mockResolvedValue({
        id: mockWoId,
        targetQty: 500,
        leadId: mockLeadId,
      });
      prisma.productionLog.findFirst = jest.fn().mockResolvedValue(null);
      prisma.productionLog.create = jest.fn();
      idGenerator.generateStageId = jest.fn().mockResolvedValue('LOG-FINAL-001');
      legalityService.checkProductionGate = jest
        .fn()
        .mockResolvedValue({ allowed: false, reason: 'BPOM not approved' });

      await expect(
        service.submitStageLog(mockWoId, fillingDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createWorkOrder', () => {
    it('should create WO with WAITING_MATERIAL stage and auto-create requisitions', async () => {
      const dto = {
        leadId: mockLeadId,
        targetQty: 500,
        targetCompletion: '2026-07-30',
      };

      prisma.workOrder.create = jest.fn().mockResolvedValue({
        id: mockWoId,
        woNumber: 'WO-001',
        stage: 'WAITING_MATERIAL',
        lead: { sampleRequests: [] },
      });
      prisma.materialRequisition.create = jest.fn();

      const result = await service.createWorkOrder(dto);

      expect(result.woNumber).toBe('WO-001');
      expect(result.stage).toBe('WAITING_MATERIAL');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'production.work_order.created',
        expect.any(Object),
      );
    });
  });

  describe('issueMaterial', () => {
    it('should reject if insufficient stock', async () => {
      prisma.materialRequisition.findUnique = jest.fn().mockResolvedValue({
        id: 'REQ-1',
        qtyRequested: 100,
        material: { stockQty: 50, name: 'Test Material', unit: 'kg' },
      });

      await expect(service.issueMaterial('REQ-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should decrement stock and create transaction', async () => {
      prisma.materialRequisition.findUnique = jest.fn().mockResolvedValue({
        id: 'REQ-1',
        materialId: 'MAT-1',
        qtyRequested: 100,
        material: { stockQty: 200, name: 'Test Material', unit: 'kg' },
        workOrderId: mockWoId,
        workOrder: { id: mockWoId, stage: 'WAITING_MATERIAL' },
      });
      prisma.materialRequisition.update = jest.fn().mockResolvedValue({
        id: 'REQ-1',
        workOrderId: mockWoId,
        qtyIssued: 100,
        workOrder: { id: mockWoId, stage: 'WAITING_MATERIAL' },
      });
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));

      await service.issueMaterial('REQ-1');

      expect(prisma.materialItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'MAT-1' },
          data: { stockQty: { decrement: 100 } },
        }),
      );
      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'OUTBOUND' }),
        }),
      );
    });
  });

  describe('flagShortage', () => {
    it('should set requisition to SHORTAGE and escalate WO', async () => {
      prisma.materialRequisition.update = jest.fn().mockResolvedValue({
        id: 'REQ-1',
        workOrderId: mockWoId,
      });
      prisma.workOrder.update = jest.fn();
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));

      await service.flagShortage('REQ-1');

      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockWoId },
          data: { stage: 'WAITING_PROCUREMENT' },
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'production.material.shortage',
        expect.any(Object),
      );
    });
  });

  describe('submitAudit', () => {
    it('should advance WO on GOOD audit', async () => {
      prisma.productionLog.findUnique = jest.fn().mockResolvedValue({
        id: 'LOG-1',
        workOrderId: mockWoId,
        stage: 'MIXING',
      });
      prisma.workOrder.findUnique = jest
        .fn()
        .mockResolvedValue({ id: mockWoId, stage: 'PENDING_QC' });
      prisma.workOrder.update = jest.fn();
      prisma.qCAudit.create = jest.fn().mockResolvedValue({ id: 'AUDIT-1' });
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));

      const result = await service.submitAudit('LOG-1', 'QC-USER', 'GOOD', 'Pass');

      expect(result.id).toBe('AUDIT-1');
      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockWoId },
          data: { stage: 'FILLING' },
        }),
      );
    });

    it('should set WO to REWORK on REJECT audit', async () => {
      prisma.productionLog.findUnique = jest.fn().mockResolvedValue({
        id: 'LOG-1',
        workOrderId: mockWoId,
        stage: 'MIXING',
      });
      prisma.workOrder.findUnique = jest
        .fn()
        .mockResolvedValue({ id: mockWoId, stage: 'PENDING_QC' });
      prisma.workOrder.update = jest.fn();
      prisma.qCAudit.create = jest.fn().mockResolvedValue({ id: 'AUDIT-1' });
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));

      await service.submitAudit('LOG-1', 'QC-USER', 'REJECT', 'Failed');

      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockWoId },
          data: { stage: 'REWORK' },
        }),
      );
    });
  });

  describe('updateScheduleResult', () => {
    it('should block FILLING stage if MIXING QC not passed', async () => {
      prisma.productionSchedule.findUnique = jest.fn().mockResolvedValue({
        id: 'SCH-1',
        stage: 'FILLING',
        workOrderId: mockWoId,
        machineId: mockMachineId,
        targetQty: 500,
        stepDetails: [],
        status: 'SCHEDULED',
        machine: { costPerHour: 50000 },
      });
      prisma.productionStepLog = {
        findFirst: jest.fn().mockResolvedValue({ qcAudits: [] }),
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      };
      prisma.productionSchedule.update = jest.fn().mockResolvedValue({
        id: 'SCH-1',
        stage: 'FILLING',
        targetQty: 500,
        stepDetails: [],
        status: 'COMPLETED',
        machine: { costPerHour: 50000 },
      });
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));

      await expect(
        service.updateScheduleResult('SCH-1', 480, 'Test', 5400, 15),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDashboardAnalytics', () => {
    it('should return structured dashboard data', async () => {
      prisma.workOrder.findMany = jest.fn().mockResolvedValue([]);
      prisma.productionLog.aggregate = jest.fn().mockResolvedValue({
        _sum: { inputQty: 0, goodQty: 0, rejectQty: 0 },
      });
      prisma.productionLog.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getDashboardAnalytics();

      expect(result).toHaveProperty('cards');
      expect(result.cards).toHaveProperty('achievement');
      expect(result.cards).toHaveProperty('timeliness');
      expect(result.cards).toHaveProperty('efficiency');
      expect(result.cards).toHaveProperty('quality');
      expect(result.cards).toHaveProperty('alerts');
      expect(result).toHaveProperty('workshops');
    });
  });

  describe('getMachineOEE', () => {
    it('should calculate OEE with no logs (default 100)', async () => {
      prisma.machine.findMany = jest.fn().mockResolvedValue([
        { id: 'M-1', name: 'Mixer A', isActive: true, productionLogs: [] },
      ]);

      const result = await service.getMachineOEE();

      expect(result[0].oee).toBe(100);
      expect(result[0].availability).toBe(100);
      expect(result[0].performance).toBe(100);
      expect(result[0].quality).toBe(100);
    });
  });

  describe('getExecutiveSummary', () => {
    it('should return yield stats', async () => {
      prisma.productionLog.aggregate = jest.fn().mockResolvedValue({
        _sum: { goodQty: 1000, rejectQty: 50, quarantineQty: 20 },
      });
      prisma.workOrder.groupBy = jest.fn().mockResolvedValue([]);
      prisma.productionLog.groupBy = jest.fn().mockResolvedValue([]);

      const result = await service.getExecutiveSummary();

      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('stageShrinkage');
    });
  });

  describe('getChainOfCustody', () => {
    it('should return flow with anomaly status', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      prisma.workOrder.findMany = jest.fn().mockResolvedValue([
        {
          id: mockWoId,
          woNumber: 'WO-001',
          targetCompletion: yesterday,
          stage: 'MIXING',
          lead: { productInterest: 'Serum', brandName: 'Test' },
          logs: [],
        },
      ]);

      const result = await service.getChainOfCustody();

      expect(result[0].anomalyStatus).toBe('LATE');
      expect(result[0].flow).toHaveLength(5);
    });
  });
});
