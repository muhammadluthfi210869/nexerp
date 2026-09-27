import request from 'supertest';
import { bootP13App, P13App } from './p13-http-harness';
import { randomUUID } from 'crypto';

describe('P13-S5: Floor Controls (Breakdown Recovery & Material Returns)', () => {
  let p13: P13App;
  let operatorToken: string;

  let testLeadId: string;
  let testStaffId: string;
  let workOrderId: string;
  let machineId: string;
  let rawMaterialId: string;

  beforeAll(async () => {
    p13 = await bootP13App();

    const operator = await p13.createUser('FLOOR_OP_S5', ['SUPER_ADMIN', 'PRODUCTION_OPERATOR']);
    operatorToken = operator.token;

    const staff = await p13.createStaff('nex_p13_s5_staff');
    testStaffId = staff.id;

    // Machine
    const machine = await p13.prisma.machine.create({
      data: {
        name: `nex_p13_s5_filler_${randomUUID().slice(0, 8)}`,
        type: 'FILLING_MACHINE' as any,
        capacityPerBatch: 1000,
        costPerHour: 45000,
        isActive: true,
      },
    });
    machineId = machine.id;

    // Lead & Work Order
    const lead = await p13.prisma.salesLead.create({
      data: {
        clientName: `nex_p13_s5_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456785',
        source: 'DIRECT',
        productInterest: 'Soothing Serum',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const wo = await p13.prisma.workOrder.create({
      data: {
        woNumber: `WO-P13-S5-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 500,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
    workOrderId = wo.id;

    // Raw Material for return
    const mat = await p13.prisma.materialItem.create({
      data: {
        name: `nex_p13_s5_glycerin_${randomUUID().slice(0, 8)}`,
        code: `GLY-P13-S5-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL' as any,
        unit: 'KG',
        unitPrice: 30000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
        stockQty: 50,
      },
    });
    rawMaterialId = mat.id;
  });

  afterAll(async () => {
    if (workOrderId) {
      await p13.prisma.materialReturn.deleteMany({ where: { workOrderId } });
      await p13.prisma.productionLog.deleteMany({ where: { workOrderId } });
      await p13.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    }
    if (rawMaterialId) {
      await p13.prisma.inventoryTransaction.deleteMany({ where: { materialId: rawMaterialId } });
      await p13.prisma.materialInventory.deleteMany({ where: { materialId: rawMaterialId } });
      await p13.prisma.materialItem.deleteMany({ where: { id: rawMaterialId } });
    }
    if (testLeadId) {
      await p13.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    }
    if (machineId) {
      await p13.prisma.machine.deleteMany({ where: { id: machineId } });
    }
    if (testStaffId) {
      await p13.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    }
    await p13.prisma.user.deleteMany({ where: { email: { contains: 'nex-p13.test' } } });
    await p13.app.close();
  });

  it('Protokol 3: Machine breakdown reporting pauses machine and creates incident alert log', async () => {
    const res = await request(p13.app.getHttpServer())
      .post('/production/breakdown')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        workOrderId,
        stage: 'FILLING',
        machineId,
        notes: 'Piston valve nozzle jammed during filling cycle',
      });

    expect(res.status).toBe(201);
    expect(res.body.notes).toMatch(/BREAKDOWN.*valve nozzle jammed/i);

    // Verify machine isActive status is updated to false (paused)
    const machine = await p13.prisma.machine.findUnique({ where: { id: machineId } });
    expect(machine?.isActive).toBe(false);
  });

  it('BUS-RULE-054: Material return reconciliation creates PENDING return to warehouse', async () => {
    const res = await request(p13.app.getHttpServer())
      .post('/production/reconciliation/return')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        workOrderId,
        materialId: rawMaterialId,
        qtyReturned: 2.5,
        reason: 'Unused excess glycerin after batch completion',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(Number(res.body.qtyReturned)).toBe(2.5);

    // Verify record in DB
    const ret = await p13.prisma.materialReturn.findFirst({
      where: { workOrderId, materialId: rawMaterialId },
    });
    expect(ret).toBeDefined();
    expect(Number(ret?.qtyReturned)).toBe(2.5);
  });
});
