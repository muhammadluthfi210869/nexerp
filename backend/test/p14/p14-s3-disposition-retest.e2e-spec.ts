import request from 'supertest';
import { bootP14App, P14App, p14Message, cleanP14Residuals } from './p14-http-harness';
import { randomUUID } from 'crypto';

describe('P14-S3: Dispositions, Partial Dispositions & Retest Workflow (AC-P14-03)', () => {
  let p14: P14App;
  let qcToken: string;
  let qcUserId: string;

  let testLeadId: string;
  let testStaffId: string;
  let sampleRequestId: string;
  let planId: string;
  let workOrderId: string;
  let stepLogId: string;

  beforeAll(async () => {
    p14 = await bootP14App();

    const qcUser = await p14.createUser('QC_DISPOSITION_S3', ['QC_LAB']);
    qcToken = qcUser.token;
    qcUserId = qcUser.user.id;

    const staff = await p14.createStaff('nex_p14_s3_staff');
    testStaffId = staff.id;

    // Lead & Work Order
    const lead = await p14.prisma.salesLead.create({
      data: {
        clientName: `nex_p14_s3_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456787',
        source: 'DIRECT',
        productInterest: 'Acne Cleanser Gel',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const sample = await p14.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P14-S3-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: 'Acne Cleanser Gel',
        targetFunction: 'Cleansing',
        textureReq: 'Gel',
        colorReq: 'Greenish',
        aromaReq: 'Tea Tree',
      },
    });
    sampleRequestId = sample.id;

    const so = await p14.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P14-S3-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: sampleRequestId,
        totalAmount: 60000000,
        status: 'ACTIVE' as any,
      },
    });

    const plan = await p14.prisma.productionPlan.create({
      data: {
        batchNo: `BATCH-P14-S3-${randomUUID().slice(0, 6)}`,
        soId: so.id,
        adminId: qcUserId,
        status: 'READY_TO_PRODUCE',
      },
    });
    planId = plan.id;

    const wo = await p14.prisma.workOrder.create({
      data: {
        woNumber: `WO-P14-S3-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        planId: plan.id,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 5 * 86400000),
      },
    });
    workOrderId = wo.id;

    const stepLog = await p14.prisma.productionStepLog.create({
      data: {
        woId: plan.id,
        stage: 'FILLING',
        inputQty: 1000,
        qtyResult: 950,
        qtyQuarantine: 950,
        qtyReject: 50,
      },
    });
    stepLogId = stepLog.id;

    await p14.prisma.productionLog.create({
      data: {
        id: stepLog.id,
        planId: plan.id,
        workOrderId: wo.id,
        stage: 'FILLING',
        inputQty: 1000,
        goodQty: 950,
        quarantineQty: 950,
        rejectQty: 50,
      },
    });
  });

  afterAll(async () => {
    await p14.prisma.cOPQRecord.deleteMany({ where: { planId } });
    await cleanP14Residuals(p14.prisma);
    if (stepLogId) {
      await p14.prisma.productionLog.deleteMany({ where: { id: stepLogId } });
      await p14.prisma.productionStepLog.deleteMany({ where: { id: stepLogId } });
    }
    if (planId) {
      await p14.prisma.workOrder.deleteMany({ where: { planId } });
      await p14.prisma.productionPlan.deleteMany({ where: { id: planId } });
    }
    await p14.prisma.salesOrder.deleteMany({ where: { leadId: testLeadId } });
    if (sampleRequestId) {
      await p14.prisma.sampleRequest.deleteMany({ where: { id: sampleRequestId } });
    }
    if (testLeadId) {
      await p14.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    }
    if (testStaffId) {
      await p14.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    }
    await p14.app.close();
  });

  it('1. BUS-RULE-078: Rejection records defect categorization and reason', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId,
        status: 'REJECT',
        phase: 'FILLING',
        defectCategory: 'FISIK',
        defectType: 'BOTOL_BOCOR',
        severity: 'MAJOR',
        disposition: 'REWORK',
        notes: 'Cap seal loose causing leakage in 15 bottles during filling test',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('REJECT');
    expect(res.body.defectCategory).toBe('FISIK');
    expect(res.body.defectType).toBe('BOTOL_BOCOR');
    expect(res.body.disposition).toBe('REWORK');
  });

  it('2. Partial Disposition: Splits 1,000 units into 800 Pass, 150 Rework, 50 Scrap', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/disposition/partial')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId,
        workOrderId,
        passQty: 800,
        reworkQty: 150,
        scrapQty: 50,
        defectCategory: 'FISIK',
        defectType: 'LABEL_MIRING',
        notes: 'Partial run: 800 units intact, 150 require relabeling, 50 crushed cartons scrapped',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.totalQty).toBe(1000);
    expect(res.body.dispositionSummary.passedForRelease).toBe(800);
    expect(res.body.dispositionSummary.heldForRework).toBe(150);
    expect(res.body.dispositionSummary.scrappedLoss).toBe(50);
  });

  it('3. BUS-RULE-077: Scrap quantity from partial disposition logs COPQ financial loss record', async () => {
    const copq = await p14.prisma.cOPQRecord.findFirst({
      where: { planId },
    });

    expect(copq).toBeDefined();
    expect(Number(copq?.materialLoss)).toBeGreaterThan(0);
    expect(copq?.reason).toContain('PARTIAL_DISPOSITION_SCRAP_50');
  });

  it('4. Retest Workflow: Re-evaluating rework lot creates linked audit passing the lot', async () => {
    // 1. Create an initial failing audit
    const failAudit = await p14.prisma.qCAudit.create({
      data: {
        qcId: qcUserId,
        stepLogId,
        status: 'REJECT',
        phase: 'FILLING',
        defectCategory: 'FISIK',
        defectType: 'TUTUP_PECAH',
        disposition: 'REWORK',
        notes: 'Lot held for cap replacement',
      },
    });

    // 2. Submit Retest after rework replacement
    const res = await request(p14.app.getHttpServer())
      .post(`/qc/audits/${failAudit.id}/retest`)
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        status: 'GOOD',
        torqueValue: 20,
        leakTestPass: 'PASS',
        notes: 'All 150 bottles recapped and retorqued. Retest passed 100%.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.parentAuditId).toBe(failAudit.id);
    expect(res.body.status).toBe('GOOD');
    expect(res.body.message).toContain('Lot is now eligible for final release');
  });
});
