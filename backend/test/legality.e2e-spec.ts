import { Test, TestingModule } from '@nestjs/testing';
import { LegalityService } from '../src/modules/legality/legality.service';
import { PurchaseOrdersService } from '../src/modules/scm/services/purchase-orders.service';
import { ProductionService } from '../src/modules/production/production.service';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { RegStage, LifecycleStatus } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('Legality Module Ultimate Audit (APJ V4 Implementation)', () => {
  let legalityService: LegalityService;
  let poService: PurchaseOrdersService;
  let productionService: ProductionService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalityService,
        PurchaseOrdersService,
        ProductionService,
        PrismaService,
      ],
    }).compile();

    legalityService = module.get<LegalityService>(LegalityService);
    poService = module.get<PurchaseOrdersService>(PurchaseOrdersService);
    productionService = module.get<ProductionService>(ProductionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createSetup() {
    const suffix = Math.random().toString(36).substring(7);
    const staff = await prisma.bussdevStaff.create({
      data: { name: `Audit Staff ${suffix}` },
    });

    const lead = await prisma.salesLead.create({
      data: {
        clientName: `Audit Legal Corp ${suffix}`,
        brandName: `Audit Brand ${suffix}`,
        contactInfo: '08123456789',
        source: 'OFFLINE',
        productInterest: 'Audit Cream',
        status: 'DP_PAID',
        picId: staff.id,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `audit-user-${suffix}@example.com`,
        fullName: 'Audit User',
        roles: ['COMPLIANCE'],
      },
    });

    const pipeline = await prisma.regulatoryPipeline.create({
      data: {
        leadId: lead.id,
        type: 'BPOM',
        currentStage: RegStage.DRAFT,
        legalPicId: user.id,
      },
    });

    const material = await prisma.materialItem.create({
      data: {
        name: 'Audit Bottle',
        code: `MAT-LGL-${Math.random()}`,
        type: 'PACKAGING',
        unit: 'PCS',
        unitPrice: 1000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
        stockQty: 1000,
      },
    });

    const supplier = await prisma.supplier.create({
      data: {
        name: `Audit Supplier ${suffix}`,
        address: 'Test Address',
      },
    });

    return { lead, pipeline, material, user, supplier };
  }

  describe('SCM Smart-Gate: Artwork Sensor', () => {
    it('should BLOCK PO creation for packaging if artwork is not approved', async () => {
      const { lead, material, user, supplier } = await createSetup();

      const poDto = {
        id: '00000000-0000-4000-a000-000000000002',
        leadId: lead.id,
        supplierId: supplier.id,
        items: [{ materialId: material.id, quantity: 100, unitPrice: 1000 }],
        totalAmount: 100000,
        status: 'ORDERED' as any,
      };

      await expect(poService.create(user.id, poDto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should ALLOW PO creation after artwork is approved', async () => {
      const { lead, pipeline, material, user, supplier } = await createSetup();

      // Approve Artwork
      await legalityService.submitArtworkReview(pipeline.id, {
        isApproved: true,
        notes: 'Looks good for printing.',
        reviewer: 'QA Auditor',
      });

      const poDto = {
        id: '00000000-0000-4000-a000-000000000001',
        leadId: lead.id,
        supplierId: supplier.id,
        items: [{ materialId: material.id, quantity: 100, unitPrice: 1000 }],
        totalAmount: 100000,
        status: 'ORDERED' as any,
      };

      const po = await poService.create(user.id, poDto as any);
      expect(po).toBeTruthy();
    });
  });

  describe('Production Smart-Gate: BPOM NA Sensor', () => {
    it('should BLOCK Filling & Packing if BPOM NA is missing', async () => {
      const { lead } = await createSetup();

      // Create Work Order
      const wo = await prisma.workOrder.create({
        data: {
          woNumber: `WO-AUDIT-${Math.random().toString(36).substring(7)}`,
          leadId: lead.id,
          targetQty: 1000,
          targetCompletion: new Date(),
          stage: LifecycleStatus.MIXING,
        },
      });

      // Try to submit log that advances to FILLING
      const logDto = {
        stage: LifecycleStatus.MIXING,
        inputQty: 1000,
        goodQty: 1000,
        quarantineQty: 0,
        rejectQty: 0,
        nextStage: LifecycleStatus.FILLING,
      };

      await expect(
        productionService.submitStageLog(wo.id, logDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW Filling & Packing after BPOM NA is entered', async () => {
      const { lead, pipeline } = await createSetup();

      const wo = await prisma.workOrder.create({
        data: {
          woNumber: `WO-AUDIT-${Math.random().toString(36).substring(7)}`,
          leadId: lead.id,
          targetQty: 1000,
          targetCompletion: new Date(),
          stage: LifecycleStatus.MIXING,
        },
      });

      // Enter BPOM NA
      await legalityService.updatePipeline(pipeline.id, {
        registrationNo: 'NA18240000001',
        currentStage: RegStage.PUBLISHED,
      });

      const logDto = {
        stage: LifecycleStatus.MIXING,
        inputQty: 1000,
        goodQty: 1000,
        quarantineQty: 0,
        rejectQty: 0,
        nextStage: LifecycleStatus.FILLING,
      };

      const result = await productionService.submitStageLog(wo.id, logDto);
      expect(result).toBeTruthy();

      const updatedWo = await prisma.workOrder.findUnique({
        where: { id: wo.id },
      });
      expect(updatedWo?.stage).toBe(LifecycleStatus.FILLING);
    });
  });

  describe('Pipeline State Machine & History', () => {
    it('should record log history on stage changes', async () => {
      const { pipeline } = await createSetup();

      await legalityService.updatePipeline(pipeline.id, {
        currentStage: RegStage.SUBMITTED,
        notes: 'Document submitted to portal.',
      });

      const updated = await prisma.regulatoryPipeline.findUnique({
        where: { id: pipeline.id },
      });
      const history = updated?.logHistory as any[];

      expect(history).toBeTruthy();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].stage).toBe(RegStage.SUBMITTED);
    });
  });
});
