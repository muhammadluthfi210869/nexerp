import request from 'supertest';
import { bootP14App, P14App, p14Message, cleanP14Residuals } from './p14-http-harness';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

describe('P14-S2: 4-Phase QC Inspections & Parameter Validation with Supervisor PIN (AC-P14-02)', () => {
  let p14: P14App;
  let qcToken: string;
  let qcUserId: string;

  let formulaId: string;
  let sampleRequestId: string;
  let planId: string;
  let stepLogId: string;
  let testLeadId: string;
  let testStaffId: string;
  let testMaterialId: string;
  const supervisorPin = '778899';

  beforeAll(async () => {
    p14 = await bootP14App();

    const hashedPin = await bcrypt.hash(supervisorPin, 10);
    const qcUser = await p14.createUser('QC_ANALYST_S2', ['QC_LAB'], undefined, hashedPin);
    qcToken = qcUser.token;
    qcUserId = qcUser.user.id;

    const staff = await p14.createStaff('nex_p14_s2_staff');
    testStaffId = staff.id;

    // Lead & Sample Request
    const lead = await p14.prisma.salesLead.create({
      data: {
        clientName: `nex_p14_s2_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456788',
        source: 'DIRECT',
        productInterest: 'Hydrating Essence',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const sample = await p14.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P14-S2-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: 'Hydrating Essence',
        targetFunction: 'Moisturizing',
        textureReq: 'Watery Gel',
        colorReq: 'Clear',
        aromaReq: 'Rose',
      },
    });
    sampleRequestId = sample.id;

    // Formula with QC Parameters (Target pH: 5.0 - 6.0, Target Viscosity: 2000 - 4000)
    const formula = await p14.prisma.formula.create({
      data: {
        formulaCode: `FORM-P14-S2-${randomUUID().slice(0, 6)}`,
        sampleRequestId,
        version: 1,
      },
    });
    formulaId = formula.id;

    await p14.prisma.qCParameter.create({
      data: {
        formulaId,
        targetPh: '5.0-6.0',
        targetViscosity: '2000-4000',
        appearance: 'Clear Gel',
      },
    });

    // Material for Inbound test
    const mat = await p14.prisma.materialItem.create({
      data: {
        name: `nex_p14_s2_extract_${randomUUID().slice(0, 8)}`,
        code: `MAT-P14-S2-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 120000,
        minLevel: 5,
        maxLevel: 500,
        reorderPoint: 20,
      },
    });
    testMaterialId = mat.id;

    // Production Plan & Step Log
    const so = await p14.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P14-S2-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: sampleRequestId,
        totalAmount: 50000000,
        status: 'ACTIVE' as any,
      },
    });

    const plan = await p14.prisma.productionPlan.create({
      data: {
        batchNo: `BATCH-P14-S2-${randomUUID().slice(0, 6)}`,
        soId: so.id,
        adminId: qcUserId,
        formulaId,
        status: 'READY_TO_PRODUCE',
      },
    });
    planId = plan.id;

    // Create Work Order
    const wo = await p14.prisma.workOrder.create({
      data: {
        woNumber: `WO-P14-S2-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        planId: plan.id,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 5 * 86400000),
      },
    });

    const stepLog = await p14.prisma.productionStepLog.create({
      data: {
        woId: plan.id,
        stage: 'MIXING',
        inputQty: 100,
        qtyResult: 98,
        qtyQuarantine: 98,
        qtyReject: 2,
      },
    });
    stepLogId = stepLog.id;

    await p14.prisma.productionLog.create({
      data: {
        id: stepLog.id,
        planId: plan.id,
        workOrderId: wo.id,
        stage: 'MIXING',
        inputQty: 100,
        goodQty: 98,
        quarantineQty: 98,
        rejectQty: 2,
      },
    });
  });

  afterAll(async () => {
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
    if (formulaId) {
      await p14.prisma.qCParameter.deleteMany({ where: { formulaId } });
      await p14.prisma.formula.deleteMany({ where: { id: formulaId } });
    }
    if (sampleRequestId) {
      await p14.prisma.sampleRequest.deleteMany({ where: { id: sampleRequestId } });
    }
    if (testMaterialId) {
      await p14.prisma.materialItem.deleteMany({ where: { id: testMaterialId } });
    }
    if (testLeadId) {
      await p14.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    }
    if (testStaffId) {
      await p14.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    }
    await p14.app.close();
  });

  it('1. Inbound QC: Records CoA verification and organoleptic checks', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        phase: 'INBOUND',
        status: 'GOOD',
        coaVerified: 'PASS',
        organoleptic: 'PASS',
        notes: 'Inbound Rose Extract CoA verified, odor and color within standard',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('GOOD');
    expect(res.body.phase).toBe('INBOUND');
    expect(res.body.coaVerified).toBe(true);
  });

  it('2. Mixing QC: Parameter validation passes when values are within formula targets', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId,
        phase: 'MIXING',
        status: 'GOOD',
        ph: 5.5, // Target: 5.0 - 6.0
        viscosity: 3000, // Target: 2000 - 4000
        homogenityPass: 'PASS',
        notes: 'Bulk lotion homogenous, pH 5.5 in spec',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('GOOD');
    expect(Number(res.body.phValue)).toBe(5.5);
  });

  it('3. Mixing QC Hard-Gate: Rejects out-of-spec parameters without Supervisor PIN', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId,
        phase: 'MIXING',
        status: 'GOOD',
        ph: 7.8, // OUT OF SPEC! (Target: 5.0 - 6.0)
        viscosity: 1200, // OUT OF SPEC! (Target: 2000 - 4000)
        notes: 'Attempting pass with acidic/alkaline shift',
      });

    expect(res.status).toBe(400);
    expect(p14Message(res)).toMatch(/Parameters out of spec|Supervisor PIN/i);
  });

  it('4. Mixing QC Supervisor Override: Allows out-of-spec parameters with valid Supervisor PIN', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId,
        phase: 'MIXING',
        status: 'GOOD',
        ph: 6.2, // Slightly out of spec
        viscosity: 3100,
        supervisorPin,
        bypassReason: 'R&D Head confirmed acceptable buffer tolerance for batch',
        notes: 'Authorized bypass with supervisor PIN',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('GOOD');
    expect(res.body.bypassReason).toContain('R&D Head confirmed');
  });

  it('5. Filling QC: Verifies torque value and vacuum leak test', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        phase: 'FILLING',
        status: 'GOOD',
        torqueValue: 18, // 18 in-lb
        leakTestPass: 'PASS',
        fillingWeight: 100.2, // 100g +/- 0.5g
        notes: 'Filling line 2: Torque 18 in-lb, vacuum chamber leak-free',
      });

    expect(res.status).toBe(201);
    expect(res.body.torqueValue).toBe(18);
    expect(res.body.leakTestPass).toBe(true);
  });

  it('6. Packing QC: Verifies inkjet batch printing and tamper seal', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        phase: 'PACKING',
        status: 'GOOD',
        inkjetCheck: 'PASS',
        sealingCheck: 'PASS',
        labelingCheck: 'PASS',
        expDateCheck: 'PASS',
        notes: 'Carton packaging complete, inkjet code crisp and readable',
      });

    expect(res.status).toBe(201);
    expect(res.body.inkjetCheck).toBe(true);
    expect(res.body.sealingCheck).toBe(true);
  });
});
