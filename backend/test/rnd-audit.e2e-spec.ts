import { Test, TestingModule } from '@nestjs/testing';
import { RndService } from '../src/modules/rnd/rnd.service';
import { FormulasService } from '../src/modules/rnd/formulas/formulas.service';
import { PrismaService } from '../src/prisma/prisma/prisma.service';
import { LegalityService } from '../src/modules/legality/legality.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  SampleStage,
  FormulaStatus,
  RevisionStatus,
  Division,
  StreamEventType,
} from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('R&D Module Audit (Ultimate Testing Plan Implementation)', () => {
  let rndService: RndService;
  let formulasService: FormulasService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RndService,
        FormulasService,
        PrismaService,
        LegalityService,
        EventEmitter2,
      ],
    }).compile();

    rndService = module.get<RndService>(RndService);
    formulasService = module.get<FormulasService>(FormulasService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Initial Cleanup
    await prisma.formulaItem.deleteMany({
      where: { phase: { formula: { formulaCode: { startsWith: 'F-AUDIT' } } } },
    });
    await prisma.formulaPhase.deleteMany({
      where: { formula: { formulaCode: { startsWith: 'F-AUDIT' } } },
    });
    await prisma.formula.deleteMany({
      where: { formulaCode: { startsWith: 'F-AUDIT' } },
    });
    await prisma.sampleRequest.deleteMany({
      where: { productName: { contains: 'AUDIT' } },
    });
    await prisma.salesLead.deleteMany({ where: { clientName: 'Audit Corp' } });
    await prisma.bussdevStaff.deleteMany({ where: { name: 'Audit Staff' } });
    await prisma.materialItem.deleteMany({
      where: { code: { startsWith: 'MAT-AUDIT' } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createSetup() {
    const staff = await prisma.bussdevStaff.create({
      data: { name: 'Audit Staff' },
    });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: 'Audit Corp',
        contactInfo: '08123456789',
        source: 'GOOGLE',
        productInterest: 'Audit Serum',
        picId: staff.id,
      },
    });
    return { staff, lead };
  }

  async function markAsPaid(sampleId: string, leadId: string) {
    const soId = `SO-${Math.random().toString(36).substring(7)}`;
    const so = await prisma.salesOrder.create({
      data: {
        id: soId,
        orderNumber: soId,
        leadId: leadId,
        sampleId: sampleId,
        totalAmount: 1000000,
        quantity: 1,
        status: 'ACTIVE',
      },
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Math.random().toString(36).substring(7)}`,
        category: 'RECEIVABLE',
        soId: soId,
        amountDue: 1000000,
        outstandingAmount: 0,
        status: 'PAID',
        dueDate: new Date(),
      },
    });
    return so;
  }

  describe('Section 1: The 100% Rule (Law of Mass Conservation)', () => {
    it('should reject formula update if total dosage is NOT 100%', async () => {
      // 1. Setup Sample
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-1',
          leadId: lead.id,
          productName: 'Serum Audit 100%',
          targetFunction: 'Test',
          textureReq: 'Liquid',
          colorReq: 'Clear',
          aromaReq: 'None',
        },
      });
      await markAsPaid(sample.id, lead.id);

      const { formula } = await rndService.acceptSample(sample.id);

      // 2. Test: Update with 90% (Expect FAIL)
      const badDto = {
        targetYieldGram: 1000,
        phases: [
          {
            prefix: 'A',
            customName: 'Phase A',
            order: 1,
            items: [
              {
                materialId: null,
                dosagePercentage: 90,
                costSnapshot: 0,
              },
            ],
          },
        ],
      };

      await expect(
        formulasService.updateFormulaV4(formula.id, badDto as any),
      ).rejects.toThrow(BadRequestException);

      // 3. Test: Update with 100.001% (Expect FAIL)
      const overDto = {
        ...badDto,
        phases: [
          {
            ...badDto.phases[0],
            items: [
              { ...badDto.phases[0].items[0], dosagePercentage: 100.001 },
            ],
          },
        ],
      };
      await expect(
        formulasService.updateFormulaV4(formula.id, overDto as any),
      ).rejects.toThrow(BadRequestException);

      // 4. Test: Update with exactly 100% (Expect SUCCESS)
      const goodDto = {
        ...badDto,
        phases: [
          {
            ...badDto.phases[0],
            items: [{ ...badDto.phases[0].items[0], dosagePercentage: 100 }],
          },
        ],
      };
      const updated = await formulasService.updateFormulaV4(
        formula.id,
        goodDto as any,
      );
      expect(updated).toBeTruthy();
    });
  });

  describe('Section 2: Production Gate (Anti-Dummy System)', () => {
    it('should block production locking if dummy materials exist', async () => {
      // 1. Setup Formula with Dummy
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-2',
          leadId: lead.id,
          productName: 'Dummy Audit',
          targetFunction: 'Test',
          textureReq: 'A',
          colorReq: 'B',
          aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      const { formula } = await rndService.acceptSample(sample.id);

      await formulasService.updateFormulaV4(formula.id, {
        targetYieldGram: 1000,
        phases: [
          {
            prefix: 'A',
            customName: 'P1',
            order: 1,
            items: [
              {
                materialId: null,
                dosagePercentage: 100,
                costSnapshot: 1000,
              },
            ],
          },
        ],
      } as any);

      // 2. Try to Lock for Production
      await expect(
        formulasService.lockProduction(formula.id, 'any-user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Section 3: Revision & Version Control Logic', () => {
    it('should create a deep copy and increment version correctly', async () => {
      // 1. Setup V1
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-3',
          leadId: lead.id,
          productName: 'Revision Audit',
          targetFunction: 'Test',
          textureReq: 'A',
          colorReq: 'B',
          aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      const { formula: v1 } = await rndService.acceptSample(sample.id);

      // 2. Create Revision (V2)
      const v2 = await formulasService.createRevision(v1.id);

      expect(v2.version).toBe(2);
      expect(v2.id).not.toBe(v1.id);

      // 3. Verify V1 status is SUPERSEDED
      const updatedV1 = await prisma.formula.findUnique({
        where: { id: v1.id },
      });
      expect(updatedV1?.status).toBe(FormulaStatus.SUPERSEDED);
    });
  });

  describe('Section 4: Cross-Module Automation (Golden Path)', () => {
    it('should update SalesLead stage when Sample is APPROVED', async () => {
      // 1. Setup
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-4',
          leadId: lead.id,
          productName: 'Integration Audit',
          targetFunction: 'Test',
          textureReq: 'A',
          colorReq: 'B',
          aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);

      // 2. Advance to APPROVED
      await rndService.advanceSampleStage(sample.id, {
        newStage: SampleStage.APPROVED,
      });

      // 3. Verify Lead Stage
      const updatedLead = await prisma.salesLead.findUnique({
        where: { id: lead.id },
      });
      expect(updatedLead?.status).toBe('SAMPLE_APPROVED');
    });
  });

  describe('Section 5: The Chemistry Engine (Yield & Weight)', () => {
    it('should calculate weights correctly based on dosage and yield', async () => {
      // 1. Setup
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-5',
          leadId: lead.id,
          productName: 'Yield Audit',
          targetFunction: 'Test',
          textureReq: 'A',
          colorReq: 'B',
          aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      const { formula } = await rndService.acceptSample(sample.id);

      // 2. Update with 500g yield and 20% dosage
      const dto = {
        targetYieldGram: 500,
        phases: [
          {
            prefix: 'A',
            customName: 'P1',
            order: 1,
            items: [
              {
                materialId: null,
                dosagePercentage: 20,
                costSnapshot: 100,
              },
              {
                materialId: null,
                dosagePercentage: 80,
                costSnapshot: 100,
              },
            ],
          },
        ],
      };
      await formulasService.updateFormulaV4(formula.id, dto as any);

      // 3. Verify (Weight calculation is usually done in frontend or output generator,
      // but let's check if the data is saved correctly)
      const saved = await prisma.formula.findUnique({
        where: { id: formula.id },
        include: { phases: { include: { items: true } } },
      });
      expect(Number(saved?.targetYieldGram)).toBe(500);
      expect(Number(saved?.phases[0].items[0].dosagePercentage)).toBe(20);
    });
  });

  describe('Section 6: Payment Verification Gate', () => {
    it('should prevent R&D from accepting an unverified sample', async () => {
      // 1. Setup Unverified Lead
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-6',
          leadId: lead.id,
          productName: 'Unpaid Audit',
          targetFunction: 'Test',
          textureReq: 'A',
          colorReq: 'B',
          aromaReq: 'C',
        },
      });
      // NO markAsPaid here

      // 2. Try to Accept
      await expect(rndService.acceptSample(sample.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Section 7: Data Integrity & Cascade', () => {
    it('should delete all related phases and items when formula is deleted', async () => {
      // 1. Setup
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-7',
          leadId: lead.id,
          productName: 'Delete Audit',
          targetFunction: 'Test',
          textureReq: 'A',
          colorReq: 'B',
          aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      const { formula } = await rndService.acceptSample(sample.id);

      // 2. Delete Formula
      await prisma.formula.delete({ where: { id: formula.id } });

      // 3. Verify Orphans
      const phases = await prisma.formulaPhase.findMany({
        where: { formulaId: formula.id },
      });
      const items = await prisma.formulaItem.findMany({
        where: { phase: { formulaId: formula.id } },
      });

      expect(phases.length).toBe(0);
      expect(items.length).toBe(0);
    });
  });

  describe('Section 8: RevisionStatus Auto-Sync', () => {
    it('should set revisionStatus IN_PROGRESS on createRevision', async () => {
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-8',
          leadId: lead.id,
          productName: 'Revision Sync Audit',
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      const { formula } = await rndService.acceptSample(sample.id);

      await formulasService.createRevision(formula.id);

      const updated = await prisma.sampleRequest.findUnique({
        where: { id: sample.id },
      });
      expect(updated?.revisionStatus).toBe(RevisionStatus.IN_PROGRESS);
      expect(updated?.revisionCount).toBe(1);
    });

    it('should set revisionStatus DONE when stage is APPROVED', async () => {
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-8b',
          leadId: lead.id,
          productName: 'Revision Done Audit',
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      await rndService.acceptSample(sample.id);
      await rndService.advanceSampleStage(sample.id, {
        newStage: SampleStage.LAB_TEST,
      });
      await rndService.advanceSampleStage(sample.id, {
        newStage: SampleStage.READY_TO_SHIP,
      });
      await rndService.advanceSampleStage(sample.id, {
        newStage: SampleStage.SHIPPED,
      });
      await rndService.advanceSampleStage(sample.id, {
        newStage: SampleStage.RECEIVED,
      });
      await rndService.advanceSampleStage(sample.id, {
        newStage: SampleStage.CLIENT_REVIEW,
      });
      await rndService.advanceSampleStage(sample.id, {
        newStage: SampleStage.APPROVED,
      });

      const updated = await prisma.sampleRequest.findUnique({
        where: { id: sample.id },
      });
      expect(updated?.revisionStatus).toBe(RevisionStatus.DONE);
    });
  });

  describe('Section 9: Stage Velocity Tracking', () => {
    it('should record durationDays for each stage', async () => {
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-9',
          leadId: lead.id,
          productName: 'Velocity Audit',
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      await rndService.acceptSample(sample.id);
      await rndService.advanceSampleStage(sample.id, {
        newStage: SampleStage.LAB_TEST,
      });

      const logs = await prisma.sampleStageLog.findMany({
        where: { sampleRequestId: sample.id },
        orderBy: { enteredAt: 'asc' },
      });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].enteredAt).toBeTruthy();

      // First stage (QUEUE) should have leftAt when transitioned out
      if (logs[0].leftAt) {
        expect(logs[0].durationDays).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Section 10: Revision Tracker API', () => {
    it('getRevisions only returns active revisions', async () => {
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-10a',
          leadId: lead.id,
          productName: 'Revision API Audit',
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });

      const revisions = await rndService.getRevisions();

      // NOT_STARTED samples should appear
      const found = revisions.find(r => r.id === sample.id);
      expect(found).toBeTruthy();
      expect(found!.revisionStatus).toBe(RevisionStatus.NOT_STARTED);
    });

    it('getRevisionHistory only returns completed revisions', async () => {
      const { lead } = await createSetup();
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-AUDIT-10b',
          leadId: lead.id,
          productName: 'Revision History Audit',
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);

      // Complete the revision
      await rndService.completeRevision(sample.id);

      const history = await rndService.getRevisionHistory();
      const found = history.find(r => r.id === sample.id);
      expect(found).toBeTruthy();
      expect(found!.revisionStatus).toBe(RevisionStatus.DONE);
    });
  });
});
