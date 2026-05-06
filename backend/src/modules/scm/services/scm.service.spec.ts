import { Test, TestingModule } from '@nestjs/testing';
import { ScmService } from './scm.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';

describe('ScmService', () => {
  let service: ScmService;

  const mockIdGeneratorService = {
    generateId: jest.fn().mockResolvedValue('PO-AUTO-TEST-001'),
  };

  const mockPrismaService: Record<string, any> = {
    materialItem: { findMany: jest.fn(), findUnique: jest.fn() },
    materialInventory: { findMany: jest.fn() },
    workOrder: { findMany: jest.fn(), findUnique: jest.fn() },
    purchaseOrder: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
    inventoryTransaction: { findMany: jest.fn() },
    stockOpname: { findMany: jest.fn() },
    deliveryOrder: { findMany: jest.fn() },
    supplier: { findMany: jest.fn() },
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
    $transaction: jest.fn((fn: Function) => fn(mockPrismaService)),
  };

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScmService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: IdGeneratorService, useValue: mockIdGeneratorService },
      ],
    }).compile();

    service = module.get<ScmService>(ScmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard cards with 4 sections', async () => {
      const mockMaterial = {
        id: 'm1',
        name: 'Test',
        unitPrice: 100,
        stockQty: 50,
        boms: [],
        inventories: [{ currentStock: 50, supplier: { name: 'S1' } }],
        reorderPoint: 20,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        status: 'ACTIVE',
        minLevel: 10,
        maxLevel: 100,
        code: null,
        inciName: null,
        halalCertNo: null,
        isHalalValidated: false,
      };
      mockPrismaService.materialItem.findMany.mockResolvedValue([mockMaterial]);
      mockPrismaService.materialInventory.findMany.mockResolvedValue([
        {
          materialId: 'm1',
          currentStock: 50,
          material: { unitPrice: 100 },
          batchNumber: 'B001',
          expDate: null,
          qcStatus: 'GOOD',
          isSensitive: false,
        },
      ]);
      mockPrismaService.workOrder.findMany.mockResolvedValue([]);
      mockPrismaService.purchaseOrder.findMany.mockResolvedValue([]);
      mockPrismaService.purchaseOrder.count.mockResolvedValue(0);
      mockPrismaService.inventoryTransaction.findMany.mockResolvedValue([]);
      mockPrismaService.stockOpname.findMany.mockResolvedValue([]);
      mockPrismaService.deliveryOrder.findMany.mockResolvedValue([]);
      mockPrismaService.supplier.findMany.mockResolvedValue([]);

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('cards');
      expect(result.cards).toHaveProperty('inventory');
      expect(result.cards.inventory.totalSku).toBe(1);
      expect(result.cards).toHaveProperty('procurement');
      expect(result.cards).toHaveProperty('warehouse');
      expect(result.cards).toHaveProperty('logistics');
      expect(result).toHaveProperty('tables');
      expect(result).toHaveProperty('procurementSuggestions');
    });
  });
});
