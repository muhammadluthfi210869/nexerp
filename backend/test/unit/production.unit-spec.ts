import { Test, TestingModule } from '@nestjs/testing';
import { ProductionService } from '../../src/modules/production/production.service';
import { LegalityService } from '../../src/modules/legality/legality.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { BadRequestException } from '@nestjs/common';
import { TestModule } from '../utilities/test-module';

describe('ProductionService — Unit', () => {
  let service: ProductionService;
  let prisma: any;

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: LegalityService,
          useValue: {
            validateFormula: jest.fn(),
            checkProductionGate: jest.fn().mockResolvedValue({ allowed: true }),
          },
        },
        { provide: EventEmitter2, useValue: TestModule.mockEventEmitter() },
        {
          provide: IdGeneratorService,
          useValue: { generateId: jest.fn().mockResolvedValue('WO-001') },
        },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  describe('createWorkOrder', () => {
    it('creates WO with WAITING_MATERIAL stage', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.workOrder = {
        create: jest
          .fn()
          .mockResolvedValue({ id: 'WO-1', stage: 'WAITING_MATERIAL' }),
      };
      prisma.materialRequisition = { create: jest.fn() };
      prisma.materialItem = {
        findFirst: jest.fn().mockResolvedValue({ id: 'MAT-1' }),
      };

      const result = await service.createWorkOrder({
        leadId: 'LEAD-1',
        targetQty: 1000,
        targetCompletion: new Date(),
        notes: 'Test',
      });
      expect(result.stage).toBe('WAITING_MATERIAL');
    });
  });

  describe('issueMaterial', () => {
    it('issues material and creates production log', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.materialRequisition = {
        update: jest.fn().mockResolvedValue({
          id: 'REQ-1',
          workOrderId: 'WO-1',
          workOrder: { stage: 'WAITING_MATERIAL' },
        }),
      };
      prisma.productionLog = { create: jest.fn() };

      const result = await service.issueMaterial('REQ-1');
      expect(result.id).toBe('REQ-1');
    });
  });

  describe('flagShortage', () => {
    it('escalates WO to WAITING_PROCUREMENT', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.materialRequisition = {
        update: jest.fn().mockResolvedValue({
          id: 'REQ-1',
          workOrderId: 'WO-1',
          workOrder: {},
        }),
      };
      prisma.workOrder = { update: jest.fn() };

      await service.flagShortage('REQ-1');
      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { stage: 'WAITING_PROCUREMENT' } }),
      );
    });
  });

  describe('submitAudit', () => {
    const baseLog = {
      id: 'LOG-1',
      workOrderId: 'WO-1',
      stage: 'MIXING',
      quarantineQty: 0,
      rejectQty: 0,
    };

    beforeEach(() => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      jest
        .spyOn(service as any, 'calculateNextStage')
        .mockReturnValue('FILLING');
    });

    it('advances WO on GOOD audit in PENDING_QC', async () => {
      prisma.productionLog = {
        findUnique: jest.fn().mockResolvedValue(baseLog),
      };
      prisma.qCAudit = {
        create: jest.fn().mockResolvedValue({ id: 'QC-1', status: 'GOOD' }),
      };
      prisma.workOrder = {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'WO-1', stage: 'PENDING_QC' }),
        update: jest.fn(),
      };

      const result = await service.submitAudit(
        'LOG-1',
        'QC-USER',
        'GOOD' as any,
        'Pass',
      );
      expect(result.status).toBe('GOOD');
    });

    it('sends WO to REWORK on REJECT', async () => {
      prisma.productionLog = {
        findUnique: jest.fn().mockResolvedValue(baseLog),
      };
      prisma.qCAudit = {
        create: jest.fn().mockResolvedValue({ id: 'QC-2', status: 'REJECT' }),
      };
      prisma.workOrder = {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'WO-1', stage: 'PENDING_QC' }),
        update: jest.fn(),
      };

      await service.submitAudit('LOG-1', 'QC-USER', 'REJECT' as any, 'Failed');
      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { stage: 'REWORK' } }),
      );
    });

    it('throws when log not found', async () => {
      prisma.productionLog = { findUnique: jest.fn().mockResolvedValue(null) };
      await expect(
        service.submitAudit('VOID', 'QC-USER', 'GOOD' as any, ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMicroFlowDiagnostics', () => {
    it('returns diagnostics for all stages', async () => {
      prisma.workOrder = {
        findMany: jest.fn().mockResolvedValue([
          { id: 'WO-1', stage: 'MIXING', targetQty: 500, logs: [] },
          { id: 'WO-2', stage: 'MIXING', targetQty: 300, logs: [] },
        ]),
      };

      const result = await service.getMicroFlowDiagnostics();
      expect(result).toHaveLength(4);
    });
  });
});
