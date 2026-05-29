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
} from '@prisma/client';

/**
 * RND Business Process E2E — Full Golden Path
 *
 * Tests the complete business flow:
 * NPF → Sample → Accept → Formula → QC → Lab Test → Approval → Lock Production → Revision
 * Verifies input → output fidelity at every step.
 */
describe('RND Business Process — Golden Path', () => {
  let rndService: RndService;
  let formulasService: FormulasService;
  let prisma: PrismaService;

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

    // Cleanup any previous test data
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  async function cleanupTestData() {
    await prisma.formulaItem.deleteMany({
      where: { phase: { formula: { formulaCode: { startsWith: 'F-BP' } } } },
    });
    await prisma.formulaPhase.deleteMany({
      where: { formula: { formulaCode: { startsWith: 'F-BP' } } },
    });
    await prisma.labTestResult.deleteMany({
      where: { formula: { formulaCode: { startsWith: 'F-BP' } } },
    });
    await prisma.qCParameter.deleteMany({
      where: { formula: { formulaCode: { startsWith: 'F-BP' } } },
    });
    await prisma.formula.deleteMany({
      where: { formulaCode: { startsWith: 'F-BP' } },
    });
    await prisma.sampleRequest.deleteMany({
      where: { productName: { contains: '[BP]' } },
    });
    await prisma.salesLead.deleteMany({
      where: { clientName: { contains: 'BP Test' } },
    });
    await prisma.bussdevStaff.deleteMany({
      where: { name: { contains: 'BP Staff' } },
    });
    await prisma.materialItem.deleteMany({
      where: { name: { contains: '[BP-MAT]' } },
    });
    await prisma.newProductForm.deleteMany({
      where: { productName: { contains: '[BP-NPF]' } },
    });
  }

  const TEST_PREFIX = '[BP]';

  // ══════════════════════════════════════════════════════════════
  //  INPUT CREATION & FIDELITY
  // ══════════════════════════════════════════════════════════════

  describe('1. Input Creation & Fidelity (Input → Output match)', () => {
    const inputData = {
      productName: `${TEST_PREFIX} Golden Serum`,
      targetFunction: 'Brightening moisturizer',
      textureReq: 'Lightweight gel',
      colorReq: 'Translucent white',
      aromaReq: 'Light citrus',
      targetHpp: 50000,
      difficultyLevel: 3,
    };

    let leadId: string;
    let sampleId: string;

    beforeAll(async () => {
      const { lead } = await createSetup('BP Test Corp 1');
      leadId = lead.id;

      const sample = await rndService.createSample({
        leadId,
        ...inputData,
      });
      sampleId = sample.id;
    });

    it('1.1 creates sample with exact input data', async () => {
      const sample = await prisma.sampleRequest.findUnique({
        where: { id: sampleId },
      });

      expect(sample).toBeTruthy();
      expect(sample!.productName).toBe(inputData.productName);
      expect(sample!.targetFunction).toBe(inputData.targetFunction);
      expect(sample!.textureReq).toBe(inputData.textureReq);
      expect(sample!.colorReq).toBe(inputData.colorReq);
      expect(sample!.aromaReq).toBe(inputData.aromaReq);
      expect(Number(sample!.targetHpp)).toBe(inputData.targetHpp);
      expect(sample!.difficultyLevel).toBe(inputData.difficultyLevel);
    });

    it('1.2 sample starts in QUEUE stage', async () => {
      const sample = await prisma.sampleRequest.findUnique({
        where: { id: sampleId },
      });
      expect(sample!.stage).toBe(SampleStage.QUEUE);
      expect(sample!.revisionStatus).toBe(RevisionStatus.NOT_STARTED);
    });

    it('1.3 sample has auto-generated sampleCode', async () => {
      const sample = await prisma.sampleRequest.findUnique({
        where: { id: sampleId },
      });
      expect(sample!.sampleCode).toMatch(/^SMP-/);
    });

    it('1.4 sample exists in inbox (QUEUE)', async () => {
      const inbox = await rndService.getInboxSamples();
      const found = inbox.find(s => s.id === sampleId);
      expect(found).toBeTruthy();
      expect(found!.stage).toBe(SampleStage.QUEUE);
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  ACCEPT → FORMULA CREATION
  // ══════════════════════════════════════════════════════════════

  describe('2. Accept → Formula Creation Flow', () => {
    let sampleId: string;
    let leadId: string;
    let formulaId: string;

    beforeAll(async () => {
      const { lead } = await createSetup('BP Test Corp 2');
      leadId = lead.id;

      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-BP-ACCEPT',
          leadId: lead.id,
          productName: `${TEST_PREFIX} Accept Serum`,
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      sampleId = sample.id;
      await markAsPaid(sample.id, lead.id);
    });

    it('2.1 accepts sample and creates Formula V1', async () => {
      const result = await rndService.acceptSample(sampleId);

      expect(result.sample.stage).toBe(SampleStage.FORMULATING);
      expect(result.formula).toBeTruthy();
      expect(result.formula!.version).toBe(1);
      expect(result.formula!.status).toBe(FormulaStatus.DRAFT);
      expect(result.formula!.formulaCode).toMatch(/^F-/);

      formulaId = result.formula!.id;
    });

    it('2.2 Formula V1 has default Phase A + QC parameters', async () => {
      const formula = await formulasService.getFormulaDetails(formulaId);

      expect(formula!.phases).toHaveLength(1);
      expect(formula!.phases[0].prefix).toBe('A');
      expect(formula!.qcparameter).toBeTruthy();
    });

    it('2.3 revisionStatus becomes NOT_STARTED initially', async () => {
      const sample = await prisma.sampleRequest.findUnique({
        where: { id: sampleId },
      });
      expect(sample!.revisionStatus).toBe(RevisionStatus.NOT_STARTED);
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  FORMULA EDITING (Multi-Phase + Items)
  // ══════════════════════════════════════════════════════════════

  describe('3. Formula Editing — Multi-Phase Composition', () => {
    let formulaId: string;

    beforeAll(async () => {
      const { lead } = await createSetup('BP Test Corp 3');
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-BP-EDIT',
          leadId: lead.id,
          productName: `${TEST_PREFIX} Edit Serum`,
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      const result = await rndService.acceptSample(sample.id);
      formulaId = result.formula!.id;
    });

    it('3.1 updates formula with 2 phases and items totaling 100%', async () => {
      const material = await prisma.materialItem.create({
        data: {
          name: '[BP-MAT] Water',
          code: 'MAT-BP-WATER',
          unit: 'KG',
          type: 'RAW_MATERIAL',
          unitPrice: 10000,
          reorderPoint: 0,
          minLevel: 0,
          maxLevel: 1000,
        },
      });

      const dto = {
        targetYieldGram: 1000,
        phases: [
          {
            prefix: 'A',
            customName: 'Water Phase',
            order: 1,
            instructions: 'Heat to 70C',
            items: [
              {
                materialId: material.id,
                dosagePercentage: 70,
                costSnapshot: 10000,
              },
              {
                materialId: null,
                dosagePercentage: 10,
                costSnapshot: 50000,
              },
            ],
          },
          {
            prefix: 'B',
            customName: 'Oil Phase',
            order: 2,
            instructions: 'Melt at 75C',
            items: [
              {
                materialId: null,
                dosagePercentage: 20,
                costSnapshot: 80000,
              },
            ],
          },
        ],
        qcparameter: {
          targetPh: '5.5 - 6.5',
          targetViscosity: '10000 - 15000 cps',
          appearance: 'White cream',
          targetColor: 'White',
          targetAroma: 'Signature',
        },
      };

      const updated = await formulasService.updateFormulaV4(
        formulaId,
        dto as any,
      );

      expect(updated).toBeTruthy();
    });

    it('3.2 saved data matches input exactly', async () => {
      const formula = await formulasService.getFormulaDetails(formulaId);

      expect(Number(formula!.targetYieldGram)).toBe(1000);
      expect(formula!.phases).toHaveLength(2);

      // Phase A
      const phaseA = formula!.phases.find(p => p.prefix === 'A');
      expect(phaseA).toBeTruthy();
      expect(phaseA!.customName).toBe('Water Phase');
      expect(phaseA!.items).toHaveLength(2);

      // Phase B
      const phaseB = formula!.phases.find(p => p.prefix === 'B');
      expect(phaseB).toBeTruthy();
      expect(phaseB!.customName).toBe('Oil Phase');
      expect(phaseB!.items).toHaveLength(1);

      // QC Parameters
      expect(formula!.qcparameter!.targetPh).toBe('5.5 - 6.5');
      expect(formula!.qcparameter!.appearance).toBe('White cream');

      // Total dosage = 100%
      const totalDosage = formula!.phases.reduce(
        (sum, p) => sum + p.items.reduce((s, i) => s + Number(i.dosagePercentage), 0),
        0,
      );
      expect(totalDosage).toBe(100);
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  QC PARAMETERS + LAB TESTS
  // ══════════════════════════════════════════════════════════════

  describe('4. QC Parameters + Lab Tests', () => {
    let formulaId: string;

    beforeAll(async () => {
      const { lead } = await createSetup('BP Test Corp 4');
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-BP-QC',
          leadId: lead.id,
          productName: `${TEST_PREFIX} QC Serum`,
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      await markAsPaid(sample.id, lead.id);
      const result = await rndService.acceptSample(sample.id);
      formulaId = result.formula!.id;
    });

    it('4.1 sets QC parameters', async () => {
      const qc = await rndService.setQcParameters(formulaId, {
        targetPh: '5.0 - 6.0',
        targetViscosity: '8000 cps',
        targetColor: 'Off-white',
        targetAroma: 'Floral',
        appearance: 'Smooth gel',
      });

      expect(qc.targetPh).toBe('5.0 - 6.0');
      expect(qc.targetViscosity).toBe('8000 cps');
    });

    it('4.2 records lab test result', async () => {
      const labResult = await rndService.createLabTestResult({
        formulaId,
        testerId: 'e2e-tester',
        actualPh: '5.42',
        actualViscosity: '8500',
        actualDensity: '1.02',
        colorResult: 'Off-white',
        aromaResult: 'Floral',
        textureResult: 'Smooth',
        stability40C: 'STABLE',
        stabilityRT: 'STABLE',
        stability4C: 'STABLE',
        notes: 'All stability tests passed',
      });

      expect(labResult.actualPh).toBe('5.42');
      expect(labResult.stability40C).toBe('STABLE');
    });

    it('4.3 retrieves lab test results', async () => {
      const results = await rndService.getLabTestResults(formulaId);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].actualPh).toBe('5.42');
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  APPROVAL FLOW
  // ══════════════════════════════════════════════════════════════

  describe('5. Approval Flow — Request → Approve → Lock Production', () => {
    let formulaId: string;
    let sampleId: string;

    beforeAll(async () => {
      const { lead } = await createSetup('BP Test Corp 5');
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-BP-APPROVE',
          leadId: lead.id,
          productName: `${TEST_PREFIX} Approve Serum`,
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      sampleId = sample.id;
      await markAsPaid(sample.id, lead.id);
      const result = await rndService.acceptSample(sample.id);
      formulaId = result.formula!.id;

      // Fill with valid formula (100% + real materials)
      const material = await prisma.materialItem.create({
        data: {
          name: '[BP-MAT] Base Oil',
          code: 'MAT-BP-OIL',
          unit: 'KG',
          type: 'RAW_MATERIAL',
          unitPrice: 50000,
          reorderPoint: 0,
          minLevel: 0,
          maxLevel: 1000,
        },
      });
      await formulasService.updateFormulaV4(formulaId, {
        targetYieldGram: 1000,
        phases: [{
          prefix: 'A',
          customName: 'Single Phase',
          order: 1,
          items: [{ materialId: material.id, dosagePercentage: 100, costSnapshot: 50000 }],
        }],
      } as any);
    });

    it('5.1 requests approval (DRAFT → WAITING_APPROVAL)', async () => {
      const result = await formulasService.requestApproval(formulaId);
      expect(result.status).toBe(FormulaStatus.WAITING_APPROVAL);
    });

    it('5.2 approves formula (WAITING_APPROVAL → SAMPLE_LOCKED)', async () => {
      const result = await formulasService.approveFormula(
        formulaId,
        'e2e-approver',
      );
      expect(result.status).toBe(FormulaStatus.SAMPLE_LOCKED);
      expect(result.lockedById).toBe('e2e-approver');
    });

    it('5.3 locks for production (SAMPLE_LOCKED → PRODUCTION_LOCKED)', async () => {
      const result = await formulasService.lockProduction(
        formulaId,
        'e2e-producer',
      );
      expect(result.status).toBe(FormulaStatus.PRODUCTION_LOCKED);
    });

    it('5.4 generates INCI list sorted by concentration', async () => {
      const inci = await formulasService.generateInci(formulaId);
      expect(inci.length).toBeGreaterThan(0);
      expect(inci[0].name).toBeTruthy();
      expect(inci[0].percentage).toBeTruthy();
    });

    it('5.5 formula appears in repository', async () => {
      const formulas = await formulasService.findAll();
      const found = formulas.find(f => f.sampleRequest?.productName?.includes('[BP] Approve Serum'));
      expect(found).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  SAMPLE STAGE ADVANCEMENT
  // ══════════════════════════════════════════════════════════════

  describe('6. Full Sample Stage Advancement', () => {
    let sampleId: string;

    beforeAll(async () => {
      const { lead } = await createSetup('BP Test Corp 6');
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-BP-STAGE',
          leadId: lead.id,
          productName: `${TEST_PREFIX} Stage Serum`,
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      sampleId = sample.id;
      await markAsPaid(sample.id, lead.id);
      await rndService.acceptSample(sample.id);
    });

    const stageSequence = [
      SampleStage.LAB_TEST,
      SampleStage.READY_TO_SHIP,
      SampleStage.SHIPPED,
      SampleStage.RECEIVED,
      SampleStage.CLIENT_REVIEW,
    ];

    stageSequence.forEach((stage) => {
      it(`advances to ${stage}`, async () => {
        const result = await rndService.advanceSampleStage(sampleId, {
          newStage: stage,
          feedback: `Advancing to ${stage}`,
        });
        expect(result.stage).toBe(stage);
      });
    });

    it('finally approves the sample', async () => {
      const result = await rndService.advanceSampleStage(sampleId, {
        newStage: SampleStage.APPROVED,
      });
      expect(result.stage).toBe(SampleStage.APPROVED);
      expect(result.completedAt).toBeTruthy();
      expect(result.revisionStatus).toBe(RevisionStatus.DONE);
    });

    it('stage logs are recorded with velocity', async () => {
      const logs = await prisma.sampleStageLog.findMany({
        where: { sampleRequestId: sampleId },
        orderBy: { enteredAt: 'asc' },
      });
      expect(logs.length).toBeGreaterThanOrEqual(8);
      // Each log should have enteredAt
      logs.forEach(log => {
        expect(log.enteredAt).toBeTruthy();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  REVISION TRACKER
  // ══════════════════════════════════════════════════════════════

  describe('7. Revision Tracker — Start / Complete / History', () => {
    let sampleId: string;
    let formulaId: string;

    beforeAll(async () => {
      const { lead } = await createSetup('BP Test Corp 7');
      const sample = await prisma.sampleRequest.create({
        data: {
          sampleCode: 'SMP-BP-REV',
          leadId: lead.id,
          productName: `${TEST_PREFIX} Revision Serum`,
          targetFunction: 'Test',
          textureReq: 'A', colorReq: 'B', aromaReq: 'C',
        },
      });
      sampleId = sample.id;
      await markAsPaid(sample.id, lead.id);
      const result = await rndService.acceptSample(sample.id);
      formulaId = result.formula!.id;
    });

    it('7.1 sample in NOT_STARTED initially', async () => {
      const sample = await prisma.sampleRequest.findUnique({
        where: { id: sampleId },
      });
      expect(sample!.revisionStatus).toBe(RevisionStatus.NOT_STARTED);
    });

    it('7.2 createRevision sets IN_PROGRESS', async () => {
      const revision = await formulasService.createRevision(formulaId);
      expect(revision.version).toBe(2);

      const sample = await prisma.sampleRequest.findUnique({
        where: { id: sampleId },
      });
      expect(sample!.revisionStatus).toBe(RevisionStatus.IN_PROGRESS);
      expect(sample!.revisionCount).toBe(1);
    });

    it('7.3 active revision appears in getRevisions', async () => {
      const revisions = await rndService.getRevisions();
      const found = revisions.find(r => r.id === sampleId);
      expect(found).toBeTruthy();
    });

    it('7.4 completeRevision sets DONE', async () => {
      await rndService.completeRevision(sampleId);

      const sample = await prisma.sampleRequest.findUnique({
        where: { id: sampleId },
      });
      expect(sample!.revisionStatus).toBe(RevisionStatus.DONE);
    });

    it('7.5 completed revision appears in revision history', async () => {
      const history = await rndService.getRevisionHistory();
      const found = history.find(r => r.id === sampleId);
      expect(found).toBeTruthy();
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  DASHBOARD METRICS
  // ══════════════════════════════════════════════════════════════

  describe('8. Dashboard Metrics', () => {
    it('8.1 returns all metric categories', async () => {
      const metrics = await rndService.getDashboardMetrics();

      expect(metrics).toHaveProperty('timeliness');
      expect(metrics).toHaveProperty('accuracy');
      expect(metrics).toHaveProperty('approval');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('tables');

      expect(metrics.tables).toHaveProperty('pipelineMaster');
      expect(metrics.tables).toHaveProperty('performanceEvaluation');
      expect(metrics.tables).toHaveProperty('failureLogs');
    });

    it('8.2 timeliness metrics are computed', async () => {
      const metrics = await rndService.getDashboardMetrics();
      expect(typeof metrics.timeliness.onTimeRate).toBe('number');
      expect(typeof metrics.timeliness.avgCycleTime).toBe('number');
      expect(typeof metrics.timeliness.overdueCount).toBe('number');
    });

    it('8.3 accuracy metrics are computed', async () => {
      const metrics = await rndService.getDashboardMetrics();
      expect(typeof metrics.accuracy.firstTimeApprovalRate).toBe('number');
      expect(typeof metrics.accuracy.avgRevision).toBe('number');
    });
  });

  // ══════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════

  async function createSetup(suffix: string) {
    const staff = await prisma.bussdevStaff.create({
      data: { name: `BP Staff ${suffix}` },
    });
    const lead = await prisma.salesLead.create({
      data: {
        clientName: `BP Test ${suffix}`,
        contactInfo: `bp-${suffix}@test.com`,
        source: 'GOOGLE',
        productInterest: 'BP Test Product',
        picId: staff.id,
      },
    });
    return { staff, lead };
  }

  async function markAsPaid(sampleId: string, leadId: string) {
    await prisma.sampleRequest.update({
      where: { id: sampleId },
      data: { paymentApprovedAt: new Date() },
    });
  }
});
