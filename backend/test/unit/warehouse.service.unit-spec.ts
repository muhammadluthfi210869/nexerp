import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from '../../src/modules/warehouse/warehouse.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScmService } from '../../src/modules/scm/services/scm.service';
import { StockLedgerService } from '../../src/modules/warehouse/services/stock-ledger.service';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { ModuleRef } from '@nestjs/core';
import { TestModule } from '../utilities/test-module';

describe('WarehouseService — Stats/Catalog/Inbounds Unit', () => {
  let service: WarehouseService;
  let prisma: any;

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    prisma.warehouseLocation = { findMany: jest.fn() };
    prisma.warehouseInbound = { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() };
    prisma.materialRequisition = { count: jest.fn() };
    prisma.stockOpname = { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() };
    prisma.stockAdjustment = { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() };
    prisma.transferOrder = { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() };
    prisma.warehouse = { findFirst: jest.fn() };
    prisma.supplier = { findFirst: jest.fn() };
    prisma.account = { findFirst: jest.fn() };
    prisma.materialValuation = { findFirst: jest.fn(), create: jest.fn() };
    prisma.materialItem = { ...prisma.materialItem, findUnique: jest.fn(), update: jest.fn() };
    prisma.inventoryTransaction = { ...prisma.inventoryTransaction, findMany: jest.fn(), create: jest.fn(), aggregate: jest.fn() };
    prisma.materialInventory = { ...prisma.materialInventory, findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn() };
    prisma.productionLog = { findMany: jest.fn() };
    prisma.productionSchedule = { findUnique: jest.fn() };
    prisma.stateTransitionLog = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: TestModule.mockEventEmitter() },
        { provide: ScmService, useValue: {} },
        { provide: StockLedgerService, useValue: {} },
        { provide: ModuleRef, useValue: { get: jest.fn() } },
        {
          provide: IdGeneratorService,
          useValue: { generateId: jest.fn().mockResolvedValue('GRN-001') },
        },
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
  });

  describe('getDashboardStats', () => {
    it('returns warehouse stats with empty data', async () => {
      prisma.warehouseLocation.findMany = jest.fn().mockResolvedValue([]);
      prisma.materialItem.findMany = jest.fn().mockResolvedValue([]);
      prisma.inventoryTransaction.findMany = jest.fn().mockResolvedValue([]);
      prisma.materialInventory.aggregate = jest.fn().mockResolvedValue({ _avg: { auditAccuracy: 0 } });
      prisma.materialInventory.findMany = jest.fn().mockResolvedValue([]);
      prisma.inventoryTransaction.aggregate = jest.fn().mockResolvedValue({ _sum: { unitValueAtTransaction: 0 } });

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('capacity');
      expect(result).toHaveProperty('valuation');
      expect(result).toHaveProperty('turnover');
      expect(result).toHaveProperty('risk');
      expect(result.capacity.utility).toBe('0.0');
    });

    it('calculates valuation from materials', async () => {
      prisma.warehouseLocation.findMany = jest.fn().mockResolvedValue([]);
      prisma.materialItem.findMany = jest.fn().mockResolvedValue([
        {
          id: 'M-1',
          type: 'RAW_MATERIAL',
          stockQty: 100,
          unitPrice: 50000,
          minLevel: 10,
          isCritical: false,
          valuations: [{ movingAveragePrice: 55000 }],
        },
      ]);
      prisma.inventoryTransaction.findMany = jest.fn().mockResolvedValue([]);
      prisma.materialInventory.aggregate = jest.fn().mockResolvedValue({ _avg: { auditAccuracy: 95 } });
      prisma.materialInventory.findMany = jest.fn().mockResolvedValue([]);
      prisma.inventoryTransaction.aggregate = jest.fn().mockResolvedValue({ _sum: { unitValueAtTransaction: 0 } });

      const result = await service.getDashboardStats();
      expect(Number(result.valuation.total)).toBeGreaterThan(0);
    });
  });

  describe('getCatalog', () => {
    it('returns material catalog', async () => {
      prisma.materialItem.findMany = jest.fn().mockResolvedValue([
        {
          id: 'M-1',
          name: 'Material A',
          type: 'RAW_MATERIAL',
          category: { name: 'Chemical' },
          inventories: [{ currentStock: 100, qcStatus: 'GOOD' }],
          valuations: [{ movingAveragePrice: 50000 }],
        },
      ]);

      const result = await service.getCatalog();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Material A');
    });
  });

  describe('getInbounds', () => {
    it('returns inbound list', async () => {
      prisma.warehouseInbound.findMany = jest.fn().mockResolvedValue([
        {
          id: 'IN-1',
          inboundNumber: 'GRN-001',
          status: 'PENDING',
          items: [{ material: { id: 'M-1', name: 'Mat A', unit: 'kg' } }],
          po: { id: 'PO-1', poNumber: 'PO-001', supplier: { name: 'Sup A' } },
        },
      ]);

      const result = await service.getInbounds();
      expect(result).toHaveLength(1);
      expect(result[0].inboundNumber).toBe('GRN-001');
    });
  });
});
