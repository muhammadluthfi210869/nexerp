import request from 'supertest';
import { bootP14App, P14App, p14Message, cleanP14Residuals } from './p14-http-harness';
import { randomUUID } from 'crypto';

describe('P14-S4: Idempotent Stock Release & APJ COA Sign-off (AC-P14-04)', () => {
  let p14: P14App;
  let apjToken: string;
  let apjUserId: string;

  let testLeadId: string;
  let testStaffId: string;
  let sampleRequestId: string;
  let planId: string;
  let workOrderId: string;
  let finishedGoodId: string;

  beforeAll(async () => {
    p14 = await bootP14App();

    const apjUser = await p14.createUser('APJ_PHARMACIST_S4', ['APJ', 'QC_LAB']);
    apjToken = apjUser.token;
    apjUserId = apjUser.user.id;

    const staff = await p14.createStaff('nex_p14_s4_staff');
    testStaffId = staff.id;

    // Lead & Work Order
    const lead = await p14.prisma.salesLead.create({
      data: {
        clientName: `nex_p14_s4_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456785',
        source: 'DIRECT',
        productInterest: 'Brightening Niacinamide Serum',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const sample = await p14.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P14-S4-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: 'Brightening Niacinamide Serum',
        targetFunction: 'Brightening',
        textureReq: 'Serum',
        colorReq: 'Translucent',
        aromaReq: 'Fresh',
      },
    });
    sampleRequestId = sample.id;

    const so = await p14.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P14-S4-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: sampleRequestId,
        totalAmount: 40000000,
        status: 'ACTIVE' as any,
      },
    });

    const plan = await p14.prisma.productionPlan.create({
      data: {
        batchNo: `BATCH-P14-S4-${randomUUID().slice(0, 6)}`,
        soId: so.id,
        adminId: apjUserId,
        status: 'READY_TO_PRODUCE',
      },
    });
    planId = plan.id;

    const wo = await p14.prisma.workOrder.create({
      data: {
        woNumber: `WO-P14-S4-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        planId: plan.id,
        targetQty: 500,
        targetCompletion: new Date(Date.now() + 3 * 86400000),
      },
    });
    workOrderId = wo.id;

    // FinishedGood created in QUARANTINE (stockQty = 0 available)
    const fg = await p14.prisma.finishedGood.create({
      data: {
        woId: plan.id,
        stockQty: 0,
      },
    });
    finishedGoodId = fg.id;
  });

  afterAll(async () => {
    if (finishedGoodId) {
      await p14.prisma.finishedGood.deleteMany({ where: { id: finishedGoodId } });
    }
    if (planId) {
      await p14.prisma.workOrder.deleteMany({ where: { planId } });
      await p14.prisma.productionPlan.deleteMany({ where: { id: planId } });
    }
    if (testLeadId) {
      await p14.prisma.salesOrder.deleteMany({ where: { leadId: testLeadId } });
    }
    if (sampleRequestId) {
      await p14.prisma.sampleRequest.deleteMany({ where: { id: sampleRequestId } });
    }
    if (testLeadId) {
      await p14.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    }
    if (testStaffId) {
      await p14.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    }
    await cleanP14Residuals(p14.prisma);
    await p14.app.close();
  });

  it('1. BUS-RULE-047: Authorized APJ releases quarantined Finished Goods to AVAILABLE stock with COA generation', async () => {
    const coaCode = 'COA-20260921-888';
    const idempotencyKey = `idem_p14_release_${randomUUID()}`;

    const res = await request(p14.app.getHttpServer())
      .post('/qc/release')
      .set('Authorization', `Bearer ${apjToken}`)
      .send({
        workOrderId,
        releaseQty: 500,
        coaNumber: coaCode,
        apjName: 'apt. Siti Rahmawati, S.Farm',
        apjSipa: '19920815/SIPA_32.73/2022/2044',
        notes: 'Final microbiological & chemical release. Full CPKB compliance verified.',
        idempotencyKey,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('RELEASED');
    expect(res.body.availability).toBe('AVAILABLE');
    expect(res.body.releasedQty).toBe(500);
    expect(res.body.coaNumber).toBe(coaCode);
    expect(res.body.apjName).toContain('Siti Rahmawati');

    // FinishedGood stock balance is now incremented to 500
    const fg = await p14.prisma.finishedGood.findUnique({
      where: { id: finishedGoodId },
    });
    expect(Number(fg?.stockQty)).toBe(500);
  });

  it('2. Release Idempotency: Repeating release with identical idempotencyKey returns cached result without duplicating stock', async () => {
    const initialFg = await p14.prisma.finishedGood.findUnique({
      where: { id: finishedGoodId },
    });
    const initialStock = Number(initialFg?.stockQty);

    const coaCode = 'COA-20260921-REPEAT-889';
    const idempotencyKey = 'idem_p14_release_repeat_test';

    // Call 1
    const res1 = await request(p14.app.getHttpServer())
      .post('/qc/release')
      .set('Authorization', `Bearer ${apjToken}`)
      .send({
        workOrderId,
        releaseQty: 250,
        coaNumber: coaCode,
        idempotencyKey,
      });
    expect(res1.status).toBe(201);

    // Call 2 (Idempotent replay)
    const res2 = await request(p14.app.getHttpServer())
      .post('/qc/release')
      .set('Authorization', `Bearer ${apjToken}`)
      .send({
        workOrderId,
        releaseQty: 250,
        coaNumber: coaCode,
        idempotencyKey,
      });
    expect(res2.status).toBe(201);
    expect(res2.body.idempotentReplay).toBe(true);

    // Stock should have incremented once (from 500 to 750), NOT twice (to 1000)
    const finalFg = await p14.prisma.finishedGood.findUnique({
      where: { id: finishedGoodId },
    });
    expect(Number(finalFg?.stockQty)).toBe(initialStock + 250);
  });

  it('3. GET /qc/release/batches returns released batches with COA and APJ metadata', async () => {
    const res = await request(p14.app.getHttpServer())
      .get('/qc/release/batches')
      .set('Authorization', `Bearer ${apjToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const released = res.body.find((b: any) => b.notes?.includes('[APJ_RELEASE]'));
    expect(released).toBeDefined();
    expect(released.status).toBe('RELEASED');
    expect(released.coaNumber).toBeDefined();
  });
});
