import request from 'supertest';
import { bootP12App, P12App, p12Message } from './p12-http-harness';
import { randomUUID } from 'crypto';

describe('P12-S2: Material Readiness & Shortage Detection (AC-P12-02)', () => {
  let p12: P12App;
  let ppicToken: string;
  let testLeadId: string;
  let testWorkOrderId: string;
  let testMatShortageId: string;
  let testMatSufficientId: string;
  let testStaffId: string;

  beforeAll(async () => {
    p12 = await bootP12App();

    const ppicUser = await p12.createUser('PPIC_S2', ['SUPER_ADMIN']);
    ppicToken = ppicUser.token;

    const staff = await p12.createStaff();
    testStaffId = staff.id;

    // Create test lead
    const lead = await p12.prisma.salesLead.create({
      data: {
        clientName: `nex_p12_client_s2_${randomUUID().slice(0, 8)}`,
        contactInfo: '081299991202',
        source: 'DIRECT',
        productInterest: 'Acne Serum',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    // Material with SHORTAGE: requires 100, stock is only 20 (deficit = 80)
    const matShortage = await p12.prisma.materialItem.create({
      data: {
        name: `nex_p12_mat_shortage_${randomUUID().slice(0, 8)}`,
        code: `MAT-P12-SHORT-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 60000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 20,
      },
    });
    testMatShortageId = matShortage.id;

    // Material SUFFICIENT: requires 50, stock is 200 (deficit = 0)
    const matSufficient = await p12.prisma.materialItem.create({
      data: {
        name: `nex_p12_mat_sufficient_${randomUUID().slice(0, 8)}`,
        code: `MAT-P12-SUFF-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 30000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 200,
      },
    });
    testMatSufficientId = matSufficient.id;

    // Create WorkOrder
    const wo = await p12.prisma.workOrder.create({
      data: {
        woNumber: `WO-P12-S2-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        stage: 'WAITING_MATERIAL',
      },
    });
    testWorkOrderId = wo.id;

    // Create Requisitions: 1 shortage, 1 sufficient
    await p12.prisma.materialRequisition.create({
      data: {
        reqNumber: `REQ-P12-S2-1-${randomUUID().slice(0, 6)}`,
        workOrderId: testWorkOrderId,
        materialId: testMatShortageId,
        qtyRequested: 100,
        status: 'PENDING',
      },
    });

    await p12.prisma.materialRequisition.create({
      data: {
        reqNumber: `REQ-P12-S2-2-${randomUUID().slice(0, 6)}`,
        workOrderId: testWorkOrderId,
        materialId: testMatSufficientId,
        qtyRequested: 50,
        status: 'PENDING',
      },
    });
  });

  afterAll(async () => {
    await p12.prisma.materialRequisition.deleteMany({
      where: { workOrderId: testWorkOrderId },
    });
    await p12.prisma.workOrder.deleteMany({
      where: { id: testWorkOrderId },
    });
    await p12.prisma.materialItem.deleteMany({
      where: { id: { in: [testMatShortageId, testMatSufficientId] } },
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

  it('detects material shortages and calculates readiness percentage honestly', async () => {
    const res = await request(p12.app.getHttpServer())
      .get(`/production/work-orders/${testWorkOrderId}/readiness`)
      .set('Authorization', `Bearer ${ppicToken}`);

    expect(res.status).toBe(200);
    expect(res.body.workOrderId).toBe(testWorkOrderId);
    expect(res.body.isReady).toBe(false);
    expect(res.body.shortagesCount).toBe(1);

    const shortageItem = res.body.shortages[0];
    expect(shortageItem.materialId).toBe(testMatShortageId);
    expect(Number(shortageItem.qtyRequired)).toBe(100);
    expect(Number(shortageItem.qtyAvailable)).toBe(20);
    expect(Number(shortageItem.deficit)).toBe(80);

    // Total required = 150. Satisfied = 20 (from shortage) + 50 (from sufficient) = 70. 70/150 = ~47%
    expect(res.body.readinessPercent).toBeLessThan(100);
  });

  it('returns isReady: true when all materials have sufficient stock', async () => {
    // Update the shortage material stock to 500
    await p12.prisma.materialItem.update({
      where: { id: testMatShortageId },
      data: { stockQty: 500 },
    });

    const res = await request(p12.app.getHttpServer())
      .get(`/production/work-orders/${testWorkOrderId}/readiness`)
      .set('Authorization', `Bearer ${ppicToken}`);

    expect(res.status).toBe(200);
    expect(res.body.isReady).toBe(true);
    expect(res.body.shortagesCount).toBe(0);
    expect(res.body.readinessPercent).toBe(100);
  });
});
