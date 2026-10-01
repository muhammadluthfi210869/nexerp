import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScmPlannerService } from './scm-planner.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { PRStatus } from '@prisma/client';

describe('ScmPlannerService', () => {
  let service: ScmPlannerService;

  const mockIdGeneratorService = {
    generateId: jest.fn().mockResolvedValue('PO-AUTO-TEST-001'),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockPrismaService: Record<string, any> = {
    materialItem: { findUnique: jest.fn() },
    materialInventory: { findMany: jest.fn() },
    workOrder: { findMany: jest.fn() },
    purchaseOrder: { create: jest.fn() },
    purchaseRequest: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn().mockResolvedValue({ id: 'wh1', status: 'ACTIVE' }),
    },
    sampleRequest: { findFirst: jest.fn() },
    salesOrder: { findFirst: jest.fn() },
    salesLead: { findFirst: jest.fn() },
    $transaction: jest.fn((fn: (...args: any[]) => any) =>
      fn(mockPrismaService),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScmPlannerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: IdGeneratorService, useValue: mockIdGeneratorService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ScmPlannerService>(ScmPlannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autoCreatePurchaseRequestFromLead', () => {
    it('should skip if no approved sample is found', async () => {
      mockPrismaService.sampleRequest.findFirst.mockResolvedValue(null);
      const res = await service.autoCreatePurchaseRequestFromLead('lead-1');
      expect(res.status).toBe('SKIPPED');
    });

    it('should create PR if shortage exists', async () => {
      mockPrismaService.sampleRequest.findFirst.mockResolvedValue({
        id: 'sample-1',
        lead: { clientName: 'Client A', moq: 100 },
        billOfMaterials: [
          {
            materialId: 'mat-1',
            quantityPerUnit: 2,
            material: { unitPrice: 5000 },
          },
        ],
      });
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        quantity: 100,
      });
      mockPrismaService.materialInventory.findMany.mockResolvedValue([
        { currentStock: 50 },
      ]);
      mockPrismaService.purchaseRequest.create.mockResolvedValue({
        id: 'pr-1',
        items: [{ id: 'pri-1' }],
      });

      const res = await service.autoCreatePurchaseRequestFromLead('lead-1');
      expect(res.status).toBe('PR_CREATED');
      expect(res.prId).toBe('pr-1');
    });
  });

  describe('approvePurchaseRequest', () => {
    it('should generate PO and approve PR', async () => {
      mockPrismaService.purchaseRequest.findUnique.mockResolvedValue({
        id: 'pr-1',
        status: PRStatus.SUBMITTED,
        supplierId: 'sup-1',
        items: [{ materialId: 'mat-1', qtyRequired: 10, estimatedPrice: 1000 }],
        notes: 'Need urgently',
      });
      mockPrismaService.purchaseOrder.create.mockResolvedValue({
        id: 'po-1',
        poNumber: 'PO-AUTO-TEST-001',
      });
      mockPrismaService.purchaseRequest.update.mockResolvedValue({
        id: 'pr-1',
        status: PRStatus.APPROVED,
      });

      const po = await service.approvePurchaseRequest('pr-1', 'user-1');
      expect(po.id).toBe('po-1');
      expect(mockPrismaService.purchaseRequest.update).toHaveBeenCalledWith({
        where: { id: 'pr-1' },
        data: { status: PRStatus.APPROVED },
      });
    });
  });
});
