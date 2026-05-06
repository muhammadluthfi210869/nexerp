import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { ProductionService } from '../src/modules/production/production.service';
import { WarehouseService } from '../src/modules/warehouse/warehouse.service';
import { PurchaseOrdersService } from '../src/modules/scm/services/purchase-orders.service';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { LifecycleStatus } from '@prisma/client';
import { LegalityModule } from '../src/modules/legality/legality.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../src/prisma/prisma.module';
import { FinanceService } from '../src/modules/finance/finance.service';
import { ScmService } from '../src/modules/scm/services/scm.service';
import { SystemModule } from '../src/modules/system/system.module';
import { WarehouseModule } from '../src/modules/warehouse/warehouse.module';

describe('QC Intelligence & Audit Automation (Phase 4 Verification)', () => {
  let productionService: ProductionService;
  let warehouseService: WarehouseService;
  let purchaseOrdersService: PurchaseOrdersService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        EventEmitterModule.forRoot(),
        LegalityModule,
        SystemModule,
        WarehouseModule,
      ],
      providers: [
        ProductionService,
        WarehouseService,
        PurchaseOrdersService,
        FinanceService,
        ScmService,
      ],
    }).compile();

    productionService = module.get<ProductionService>(ProductionService);
    warehouseService = module.get<WarehouseService>(WarehouseService);
    purchaseOrdersService = module.get<PurchaseOrdersService>(
      PurchaseOrdersService,
    );
    prisma = module.get<PrismaService>(PrismaService);

    // Deep Cleanup
    await prisma.cOPQRecord.deleteMany({});
    await prisma.auditEscalation.deleteMany({});
    await prisma.workOrder.deleteMany({
      where: { woNumber: { contains: 'AUDIT' } },
    });
    await prisma.productionPlan.deleteMany({
      where: { batchNo: { contains: 'AUDIT' } },
    });
    await prisma.materialInventory.deleteMany({
      where: { batchNumber: { contains: 'AUDIT' } },
    });
    await prisma.materialItem.deleteMany({
      where: { code: { contains: 'AUDIT' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'audit.com' } },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe('Scenario 1: FTY & COPQ Integrity Check', () => {
    it('should set isFirstPass=false and create COPQRecord on rejection', async () => {
      const admin = await prisma.user.findFirst();
      if (!admin) throw new Error('User missing');

      const staff =
        (await prisma.bussdevStaff.findFirst()) ||
        (await prisma.bussdevStaff.create({
          data: { name: 'Audit Staff' },
        }));

      const lead = await prisma.salesLead.create({
        data: {
          clientName: 'Audit Client',
          contactInfo: '08123',
          source: 'AUDIT',
          productInterest: 'QC Test',
          picId: staff.id,
        },
      });

      const sample =
        (await prisma.sampleRequest.findFirst()) ||
        (await prisma.sampleRequest.create({
          data: {
            leadId: lead.id,
            productName: 'Test Sample',
            sampleCode: 'SMP-QC-' + Math.random().toString(36).substring(7),
          } as any,
        }));

      const so = await prisma.salesOrder.create({
        data: {
          id: randomUUID(),
          orderNumber: 'SO-AUDIT-' + Math.random().toString(36).substring(7),
          leadId: lead.id,
          sampleId: sample.id,
          totalAmount: 1000000,
          quantity: 1000,
          status: 'ACTIVE',
        },
      });

      const plan = await prisma.productionPlan.create({
        data: {
          batchNo: 'AUDIT-FTY-' + Math.random().toString(36).substring(7),
          isFirstPass: true,
          adminId: admin.id,
          soId: so.id,
        },
      });

      const wo = await prisma.workOrder.create({
        data: {
          woNumber: 'WO-AUDIT-' + Math.random().toString(36).substring(7),
          targetQty: 1000,
          planId: plan.id,
          stage: LifecycleStatus.WAITING_MATERIAL,
          leadId: lead.id,
          targetCompletion: new Date(),
        },
      });

      await productionService.submitStageLog(wo.id, {
        stage: LifecycleStatus.MIXING,
        goodQty: 900,
        rejectQty: 100,
        operatorId: admin.id,
      });

      const updatedPlan = await prisma.productionPlan.findUnique({
        where: { id: plan.id },
      });
      expect(updatedPlan?.isFirstPass).toBe(false);

      const copq = await prisma.cOPQRecord.findFirst({
        where: { planId: plan.id },
      });
      expect(copq).toBeTruthy();
      expect(Number(copq?.totalLoss)).toBeGreaterThan(0);
    });
  });

  describe('Scenario 2: Vendor Soft-Block & PIN Escalation', () => {
    it('should block PO creation for blacklisted vendor without PIN', async () => {
      const supplier = await prisma.supplier.create({
        data: {
          name: 'Bad Vendor Audit ' + Math.random().toString(36).substring(7),
          isBlacklisted: true,
          phone: '000',
          email: 'bad@vendor.com',
          address: 'Audit Street',
        },
      });

      const admin = await prisma.user.findFirst();
      if (!admin) throw new Error('Admin missing');

      await expect(
        purchaseOrdersService.create(admin.id, {
          id: randomUUID(),
          supplierId: supplier.id,
          items: [],
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow PO creation for blacklisted vendor WITH correct PIN', async () => {
      const supplier = await prisma.supplier.create({
        data: {
          name:
            'Block-Override-Audit ' + Math.random().toString(36).substring(7),
          isBlacklisted: true,
          phone: '111',
          email: 'override@vendor.com',
        },
      });

      const admin = await prisma.user.findFirst();
      if (!admin) throw new Error('Admin missing');

      const uniquePin = Math.floor(1000 + Math.random() * 9000).toString();
      await prisma.user.update({
        where: { id: admin.id },
        data: { managerPin: uniquePin },
      });

      const poId = randomUUID();
      const po = await purchaseOrdersService.create(admin.id, {
        id: poId,
        supplierId: supplier.id,
        items: [],
        escalationPin: uniquePin,
        escalationReason: 'Emergency Procurement',
      } as any);

      expect(po).toBeTruthy();

      // expect(escalation).toBeTruthy();
    });
  });

  describe('Scenario 3: Hold Monitor (Spoilage Watchdog)', () => {
    it('should detect batches exceeding maxHoldHours', async () => {
      const material = await prisma.materialItem.create({
        data: {
          name:
            'Sensitive Liquid Audit ' + Math.random().toString(36).substring(7),
          code: 'MAT-AUDIT-' + Math.random().toString(36).substring(7),
          type: 'RAW_MATERIAL',
          maxHoldHours: 1,
          unit: 'L',
          unitPrice: 1000,
          minLevel: 0,
          maxLevel: 100,
          reorderPoint: 0,
        },
      });

      const supplier = await prisma.supplier.findFirst();
      if (!supplier) throw new Error('Supplier missing');

      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      await prisma.materialInventory.create({
        data: {
          materialId: material.id,
          supplierId: supplier.id,
          batchNumber: 'AUDIT-HOLD-' + Math.random().toString(36).substring(7),
          currentStock: 100,
          receivingDate: twoHoursAgo,
        },
      });

      const audit = await warehouseService.checkHoldThresholds();
      const anyCritical = audit.anomalies.some(
        (a) => a.risk === 'CRITICAL_SPOILAGE',
      );
      expect(anyCritical).toBe(true);
    });
  });
});
