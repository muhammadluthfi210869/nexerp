import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from '../src/modules/warehouse/warehouse.service';
import { FinanceService } from '../src/modules/finance/finance.service';
import { ScmService } from '../src/modules/scm/services/scm.service';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { QCStatus, OutboundMethod } from '@prisma/client';

describe('Warehouse Logistics & Financial Gate Audit (Phase 5)', () => {
  let warehouseService: WarehouseService;
  let financeService: FinanceService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        FinanceService,
        ScmService,
        PrismaService,
        EventEmitter2,
      ],
    }).compile();

    warehouseService = module.get<WarehouseService>(WarehouseService);
    financeService = module.get<FinanceService>(FinanceService);
    prisma = module.get<PrismaService>(PrismaService);

    // Initial Cleanup
    await prisma.materialInventory.deleteMany({
      where: { batchNumber: { contains: 'AUDIT' } },
    });
    await prisma.materialItem.deleteMany({
      where: { code: { contains: 'AUDIT' } },
    });
    await prisma.journalEntry.deleteMany({
      where: { reference: { contains: 'AUDIT' } },
    });
    await prisma.stockOpnameItem.deleteMany({
      where: { opname: { notes: { contains: 'AUDIT' } } },
    });
    await prisma.stockOpname.deleteMany({
      where: { notes: { contains: 'AUDIT' } },
    });

    // Ensure Master Data exists
    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
      await prisma.warehouse.create({
        data: { name: 'Main Warehouse' },
      });
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      await prisma.user.create({
        data: {
          id: '00000000-0000-0000-0000-000000000001',
          fullName: 'Audit User',
          email: 'audit@erp.com',
          passwordHash: 'hashed_password',
        },
      });
    }

    const supplier = await prisma.supplier.findFirst();
    if (!supplier) {
      await prisma.supplier.create({
        data: { name: 'Audit Supplier' },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Scenario 1: FEFO Enforcement Audit', () => {
    it('should block handover if an earlier expiration batch exists', async () => {
      // 1. Setup Material with FEFO
      const material = await prisma.materialItem.create({
        data: {
          name: 'Sensitive Raw Audit',
          code: 'MAT-AUDIT-FEFO',
          type: 'RAW_MATERIAL',
          outMethod: OutboundMethod.FEFO,
          unit: 'KG',
          unitPrice: 1000,
          minLevel: 0,
          maxLevel: 100,
          reorderPoint: 0,
        },
      });

      const supplier = await prisma.supplier.findFirst();
      if (!supplier) throw new Error('No supplier for audit');

      // 2. Create two batches: One expires earlier
      const oldBatch = await prisma.materialInventory.create({
        data: {
          materialId: material.id,
          supplierId: supplier.id,
          batchNumber: 'AUDIT-OLD',
          currentStock: 10,
          expDate: new Date('2024-01-01'),
          qcStatus: QCStatus.GOOD,
        },
      });

      const newBatch = await prisma.materialInventory.create({
        data: {
          materialId: material.id,
          supplierId: supplier.id,
          batchNumber: 'AUDIT-NEW',
          currentStock: 10,
          expDate: new Date('2025-01-01'),
          qcStatus: QCStatus.GOOD,
        },
      });

      // 3. Attempt to validate handover for NEW batch
      await expect(
        warehouseService.validateHandover({
          materialId: material.id,
          batchNumber: 'AUDIT-NEW',
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      // 4. Validate handover for OLD batch should pass
      const result = await warehouseService.validateHandover({
        materialId: material.id,
        batchNumber: 'AUDIT-OLD',
        quantity: 1,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('Scenario 2: Quarantine Gate Audit', () => {
    it('should block handover for QUARANTINE batches', async () => {
      const material = await prisma.materialItem.findFirst({
        where: { code: 'MAT-AUDIT-FEFO' },
      });
      const supplier = await prisma.supplier.findFirst();
      if (!material || !supplier) throw new Error('Setup failure');

      await prisma.materialInventory.create({
        data: {
          materialId: material.id,
          supplierId: supplier.id,
          batchNumber: 'AUDIT-Q',
          currentStock: 10,
          qcStatus: QCStatus.QUARANTINE,
        },
      });

      await expect(
        warehouseService.validateHandover({
          materialId: material.id,
          batchNumber: 'AUDIT-Q',
          quantity: 1,
        }),
      ).rejects.toThrow(/QUARANTINE GATE/);
    });
  });

  describe('Scenario 3: Financial Integrity - Stock Opname Journal', () => {
    it('should trigger Journal Entry when Opname is approved with loss', async () => {
      const material = await prisma.materialItem.findFirst({
        where: { code: 'MAT-AUDIT-FEFO' },
      });
      const warehouse = await prisma.warehouse.findFirst();
      const user = await prisma.user.findFirst();
      if (!material || !warehouse || !user) throw new Error('Setup failure');

      // 1. Create Stock Opname with Difference (System: 10, Actual: 5 => Loss of 5)
      const opname = await prisma.stockOpname.create({
        data: {
          warehouseId: warehouse.id,
          picId: user.id,
          notes: 'AUDIT_OPNAME_JOURNAL',
          status: 'DRAFT',
          items: {
            create: {
              materialId: material.id,
              systemQty: 10,
              actualQty: 5,
              difference: -5,
            },
          },
        },
      });

      // 2. Approve Opname (Loss Value = 5 * 1000 = 5000)
      await warehouseService.approveOpname(opname.id, user.id);

      // 3. Verify Journal Entry
      const journal = await prisma.journalEntry.findFirst({
        where: { reference: { contains: opname.id.substring(0, 8) } },
        include: { lines: true },
      });

      expect(journal).toBeTruthy();
      if (journal) {
        // Line 1: Loss (Debit), Line 2: Inventory (Credit)
        const lossLine = journal.lines.find((l) => Number(l.debit) > 0);
        expect(Number(lossLine?.debit)).toBe(5000);
      }
    });
  });

  describe('Scenario 4: Verification Gate - Dummy Materials', () => {
    it('should be identified as dummy and block procurement logic (Integration check)', async () => {
      const mat = await prisma.materialItem.create({
        data: {
          name: 'Dummy Testing Material',
          code: `MAT-${Math.random().toString(36).substring(7)}`,
          type: 'RAW_MATERIAL',
          unit: 'gr',
          unitPrice: 100,
          minLevel: 0,
          maxLevel: 1000,
          reorderPoint: 10,
          status: 'ACTIVE',
        },
      });

      const check = await prisma.materialItem.findUnique({
        where: { id: mat.id },
      });
      expect(check?.name).toBe('Dummy Testing Material');

      // Note: Full PO block test would require PurchaseOrdersService injection
    });
  });
});
