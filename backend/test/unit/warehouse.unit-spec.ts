import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from '../../src/modules/warehouse/warehouse.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScmService } from '../../src/modules/scm/services/scm.service';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { StockLedgerService } from '../../src/modules/warehouse/services/stock-ledger.service';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { TestModule } from '../utilities/test-module';

describe('WarehouseService — Unit', () => {
  let service: WarehouseService;
  let prisma: any;

  const materialId = 'MAT-001';
  const supplierId = 'SUP-001';

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: TestModule.mockEventEmitter() },
        { provide: ScmService, useValue: {} },
        { provide: FinanceService, useValue: {} },
        { provide: StockLedgerService, useValue: {} },
        {
          provide: IdGeneratorService,
          useValue: { generateId: jest.fn().mockResolvedValue('STK-001') },
        },
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
  });

  describe('receiveGoods', () => {
    it('creates inventory and transaction records', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.materialInventory.create = jest
        .fn()
        .mockResolvedValue({ id: 'INV-1', batchNumber: 'BATCH-001' });
      prisma.materialValuation.findFirst = jest.fn().mockResolvedValue(null);
      prisma.materialItem.findUnique = jest
        .fn()
        .mockResolvedValue({ id: materialId, unitPrice: 50000 });
      prisma.materialItem.update = jest.fn();
      prisma.inventoryTransaction.create = jest.fn();

      const result = await service.receiveGoods({
        materialId,
        supplierId,
        batchNumber: 'BATCH-001',
        quantity: 100,
      });

      expect(result.batchNumber).toBe('BATCH-001');
      expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'INBOUND' }),
        }),
      );
    });
  });

  describe('getSuggestedBatch (FEFO)', () => {
    it('suggests oldest expiring batch', async () => {
      prisma.materialItem.findUnique = jest
        .fn()
        .mockResolvedValue({ name: 'Test', outMethod: 'FEFO' });
      prisma.materialInventory.findFirst = jest.fn().mockResolvedValue({
        id: 'INV-1',
        batchNumber: 'OLD-BATCH',
        currentStock: 100,
        expDate: new Date('2026-01-01'),
        location: { code: 'A-01' },
        supplier: { name: 'Sup' },
      });

      const result = await service.getSuggestedBatch(materialId);
      expect(result.outMethod).toBe('FEFO');
      expect(result.suggestedBatch?.batchNumber).toBe('OLD-BATCH');
    });
  });

  describe('syncStockCache', () => {
    it('recalculates stock from transactions', async () => {
      prisma.inventoryTransaction.findMany = jest.fn().mockResolvedValue([
        { id: 'TX-1', type: 'INBOUND', quantity: 300 },
        { id: 'TX-2', type: 'INBOUND', quantity: 200 },
      ]);
      prisma.materialItem.update = jest.fn();

      const result = await service.syncStockCache(materialId);
      expect(result).toBe(500);
    });
  });

  describe('getTransactionHistory', () => {
    it('returns recent transactions', async () => {
      prisma.inventoryTransaction.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 'TX-1', type: 'INBOUND' }]);
      const result = await service.getTransactionHistory(materialId);
      expect(result).toHaveLength(1);
    });
  });
});
