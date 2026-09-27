import request from 'supertest';
import { bootP12App, P12App, p12Message } from './p12-http-harness';
import { randomUUID } from 'crypto';

describe('P12-S5: Idempotent Dispatch & Warehouse Handover (AC-P12-05)', () => {
  let p12: P12App;
  let ppicToken: string;
  let testLeadId: string;
  let testWorkOrderId: string;
  let testMaterialId: string;
  let testReqId: string;
  let testStaffId: string;

  beforeAll(async () => {
    p12 = await bootP12App();

    const ppicUser = await p12.createUser('PPIC_S5', ['SUPER_ADMIN']);
    ppicToken = ppicUser.token;

    const staff = await p12.createStaff();
    testStaffId = staff.id;

    // Create test lead
    const lead = await p12.prisma.salesLead.create({
      data: {
        clientName: `nex_p12_client_s5_${randomUUID().slice(0, 8)}`,
        contactInfo: '081299991205',
        source: 'DIRECT',
        productInterest: 'Night Cream',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    // Create material
    const mat = await p12.prisma.materialItem.create({
      data: {
        name: `nex_p12_mat_s5_${randomUUID().slice(0, 8)}`,
        code: `MAT-P12-S5-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 50000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 500,
      },
    });
    testMaterialId = mat.id;

    // Create WorkOrder
    const wo = await p12.prisma.workOrder.create({
      data: {
        woNumber: `WO-P12-S5-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        stage: 'WAITING_MATERIAL',
      },
    });
    testWorkOrderId = wo.id;

    // Create Material Requisition
    const reqItem = await p12.prisma.materialRequisition.create({
      data: {
        reqNumber: `REQ-P12-S5-${randomUUID().slice(0, 6)}`,
        workOrderId: testWorkOrderId,
        materialId: testMaterialId,
        qtyRequested: 150,
        status: 'PENDING',
      },
    });
    testReqId = reqItem.id;
  });

  afterAll(async () => {
    await p12.prisma.materialRequisition.deleteMany({
      where: { workOrderId: testWorkOrderId },
    });
    await p12.prisma.workOrder.deleteMany({
      where: { id: testWorkOrderId },
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

  it('dispatches Work Order to floor and transitions stage and warehouse requisitions', async () => {
    const res = await request(p12.app.getHttpServer())
      .post(`/production/work-orders/${testWorkOrderId}/dispatch`)
      .set('Authorization', `Bearer ${ppicToken}`);

    expect(res.status).toBe(201);
    expect(res.body.workOrderId).toBe(testWorkOrderId);
    expect(res.body.dispatched).toBe(true);
    expect(res.body.stage).toBe('READY_TO_PRODUCE');

    // Verify requisition remains bound and ready
    const reqInDb = await p12.prisma.materialRequisition.findUnique({
      where: { id: testReqId },
    });
    expect(reqInDb?.status).toBe('PENDING');
  });

  it('handles repeated dispatch idempotently without creating duplicate transitions', async () => {
    const res = await request(p12.app.getHttpServer())
      .post(`/production/work-orders/${testWorkOrderId}/dispatch`)
      .set('Authorization', `Bearer ${ppicToken}`);

    expect(res.status).toBe(201);
    expect(res.body.workOrderId).toBe(testWorkOrderId);
    expect(res.body.dispatched).toBe(true);
    expect(res.body.message).toContain('idempotent');
  });
});
