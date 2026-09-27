import request from 'supertest';
import { bootP12App, P12App, p12Message } from './p12-http-harness';
import { randomUUID } from 'crypto';

describe('P12-S1: Demand Ingestion & MRP-to-WO Generation (AC-P12-01)', () => {
  let p12: P12App;
  let ppicToken: string;
  let testLeadId: string;
  let testMaterialId: string;
  let testSampleId: string;
  let testFormulaId: string;
  let validSoId: string;
  let unpaidSoId: string;

  let testStaffId: string;

  beforeAll(async () => {
    p12 = await bootP12App();

    const ppicUser = await p12.createUser('PPIC_S1', ['SUPER_ADMIN']);
    ppicToken = ppicUser.token;

    const staff = await p12.createStaff();
    testStaffId = staff.id;

    // Create test lead
    const lead = await p12.prisma.salesLead.create({
      data: {
        clientName: `nex_p12_client_s1_${randomUUID().slice(0, 8)}`,
        contactInfo: '081299991201',
        source: 'DIRECT',
        productInterest: 'Day Cream SPF 30',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    // Create raw material for BOM
    const mat = await p12.prisma.materialItem.create({
      data: {
        name: `nex_p12_mat_s1_${randomUUID().slice(0, 8)}`,
        code: `MAT-P12-S1-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 45000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 500,
      },
    });
    testMaterialId = mat.id;

    // Create sample
    const sample = await p12.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P12-S1-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: `nex_p12_sample_s1`,
        targetFunction: 'Moisturizing',
        textureReq: 'Cream',
        colorReq: 'White',
        aromaReq: 'Vanilla',
      },
    });
    testSampleId = sample.id;

    // Create formula with phases and locked status
    const formula = await p12.prisma.formula.create({
      data: {
        formulaCode: `FOR-P12-S1-${randomUUID().slice(0, 6)}`,
        sampleRequestId: testSampleId,
        version: 1,
        targetYieldGram: 100,
        status: 'PRODUCTION_LOCKED',
        phases: {
          create: [
            {
              prefix: 'A',
              customName: 'Phase A',
              order: 1,
              items: {
                create: [
                  {
                    materialId: testMaterialId,
                    dosagePercentage: 15.0,
                  },
                ],
              },
            },
          ],
        },
      },
    });
    testFormulaId = formula.id;

    // Create valid SO with ACTIVE (DP paid)
    const validSo = await p12.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P12-S1-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: testSampleId,
        quantity: 1000,
        totalAmount: 50000000,
        status: 'ACTIVE',
      },
    });
    validSoId = validSo.id;

    // Create unpaid SO with PENDING_DP
    const unpaidSo = await p12.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P12-S1-UNPAID-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: testSampleId,
        quantity: 1000,
        totalAmount: 50000000,
        status: 'PENDING_DP',
      },
    });
    unpaidSoId = unpaidSo.id;
  });

  afterAll(async () => {
    await p12.prisma.productionSchedule.deleteMany({
      where: { workOrder: { leadId: testLeadId } },
    });
    await p12.prisma.materialRequisition.deleteMany({
      where: { materialId: testMaterialId },
    });
    await p12.prisma.workOrder.deleteMany({
      where: { leadId: testLeadId },
    });
    await p12.prisma.productionPlan.deleteMany({
      where: { soId: { in: [validSoId, unpaidSoId] } },
    });
    await p12.prisma.salesOrder.deleteMany({
      where: { id: { in: [validSoId, unpaidSoId] } },
    });
    await p12.prisma.formulaItem.deleteMany({
      where: { materialId: testMaterialId },
    });
    await p12.prisma.formulaPhase.deleteMany({
      where: { formulaId: testFormulaId },
    });
    await p12.prisma.formula.deleteMany({
      where: { id: testFormulaId },
    });
    await p12.prisma.sampleRequest.deleteMany({
      where: { id: testSampleId },
    });
    await p12.prisma.materialItem.deleteMany({
      where: { id: testMaterialId },
    });
    await p12.prisma.salesLead.deleteMany({
      where: { id: testLeadId },
    });
    await p12.prisma.bussdevStaff.deleteMany({
      where: { id: testStaffId },
    });
    await p12.prisma.user.deleteMany({
      where: { email: { contains: 'nex-p12.test' } },
    });
    await p12.app.close();
  });

  it('rejects Work Order creation if SO has unpaid DP (status PENDING_DP)', async () => {
    const res = await request(p12.app.getHttpServer())
      .post('/production/work-orders/from-so')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({ salesOrderId: unpaidSoId });

    expect(res.status).toBe(400);
    expect(p12Message(res)).toContain('DP must be paid');
  });

  it('creates Work Order with exploded BOM requisitions for approved SO with ACTIVE status', async () => {
    const res = await request(p12.app.getHttpServer())
      .post('/production/work-orders/from-so')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({ salesOrderId: validSoId });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.woNumber).toMatch(/^WO-/);
    expect(res.body.stage).toBe('WAITING_MATERIAL');
    expect(res.body.requisitions).toHaveLength(1);

    const reqItem = res.body.requisitions[0];
    expect(reqItem.materialId).toBe(testMaterialId);
    // (15% / 100) * 100g yield * 1000 order qty = 15,000g
    expect(Number(reqItem.qtyRequested)).toBe(15000);
    expect(reqItem.status).toBe('PENDING');
  });
});
