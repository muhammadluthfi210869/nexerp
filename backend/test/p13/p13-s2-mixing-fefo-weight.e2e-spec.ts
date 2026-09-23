import request from 'supertest';
import { bootP13App, P13App, p13Message } from './p13-http-harness';
import { randomUUID } from 'crypto';

describe('P13-S2: Mixing Execution (FEFO Guard & Weight Tolerance 0.5%)', () => {
  let p13: P13App;
  let operatorToken: string;
  let supervisorUser: any;
  let supervisorToken: string;
  const supervisorPin = '882211';

  let testLeadId: string;
  let testStaffId: string;
  let workOrderId: string;
  let machineId: string;
  let mixingScheduleId: string;
  let materialId: string;
  let stepDetailId: string;
  let olderInventoryId: string;
  let newerInventoryId: string;

  beforeAll(async () => {
    p13 = await bootP13App();

    const operator = await p13.createUser('PROD_OP_S2', ['SUPER_ADMIN', 'PRODUCTION_OPERATOR']);
    operatorToken = operator.token;

    const supervisor = await p13.createUser('SUPERVISOR_S2', ['SUPER_ADMIN', 'PRODUCTION_SUPERVISOR'], undefined, supervisorPin);
    supervisorUser = supervisor.user;
    supervisorToken = supervisor.token;

    const staff = await p13.createStaff('nex_p13_s2_staff');
    testStaffId = staff.id;

    // Machine
    const machine = await p13.prisma.machine.create({
      data: {
        name: `nex_p13_s2_mixer_${randomUUID().slice(0, 8)}`,
        type: 'MIXING_MACHINE' as any,
        capacityPerBatch: 1000,
        costPerHour: 50000,
      },
    });
    machineId = machine.id;

    // Lead & WorkOrder
    const lead = await p13.prisma.salesLead.create({
      data: {
        clientName: `nex_p13_s2_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456788',
        source: 'DIRECT',
        productInterest: 'Hydrating Essence',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const wo = await p13.prisma.workOrder.create({
      data: {
        woNumber: `WO-P13-S2-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 500,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
    workOrderId = wo.id;

    // Material
    const mat = await p13.prisma.materialItem.create({
      data: {
        name: `nex_p13_s2_niacinamide_${randomUUID().slice(0, 8)}`,
        code: `MAT-P13-S2-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 120000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 20,
        stockQty: 100,
      },
    });
    materialId = mat.id;

    // Supplier
    const supplier = await p13.prisma.supplier.create({
      data: {
        name: `nex_p13_s2_sup_${randomUUID().slice(0, 8)}`,
      },
    });

    // Two Inventory Batches for FEFO test:
    // Older Batch: expDate = today + 30 days
    const olderBatch = await p13.prisma.materialInventory.create({
      data: {
        materialId,
        supplierId: supplier.id,
        batchNumber: `BATCH-OLD-${randomUUID().slice(0, 4)}`,
        internalQrCode: `QR-OLD-${randomUUID().slice(0, 6)}`,
        currentStock: 25,
        receivingDate: new Date(),
        expDate: new Date(Date.now() + 30 * 86400000),
        qcStatus: 'GOOD',
      },
    });
    olderInventoryId = olderBatch.id;

    // Newer Batch: expDate = today + 90 days
    const newerBatch = await p13.prisma.materialInventory.create({
      data: {
        materialId,
        supplierId: supplier.id,
        batchNumber: `BATCH-NEW-${randomUUID().slice(0, 4)}`,
        internalQrCode: `QR-NEW-${randomUUID().slice(0, 6)}`,
        currentStock: 50,
        receivingDate: new Date(),
        expDate: new Date(Date.now() + 90 * 86400000),
        qcStatus: 'GOOD',
      },
    });
    newerInventoryId = newerBatch.id;

    // Mixing Schedule with Step Detail (Target: 10.0 KG)
    const sch = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-S2-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'MIXING' as any,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        targetQty: 500,
        status: 'SCHEDULED',
      },
    });
    mixingScheduleId = sch.id;

    const detail = await p13.prisma.productionStepDetail.create({
      data: {
        scheduleId: mixingScheduleId,
        materialId,
        materialCode: mat.code,
        qtyTheoretical: 10.0, // 10 kg target
        category: 'RAW',
      },
    });
    stepDetailId = detail.id;
  });

  afterAll(async () => {
    await p13.prisma.productionLog.deleteMany({ where: { workOrderId } });
    await p13.prisma.productionStepDetail.deleteMany({ where: { scheduleId: mixingScheduleId } });
    await p13.prisma.productionSchedule.deleteMany({ where: { id: mixingScheduleId } });
    await p13.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    await p13.prisma.materialInventory.deleteMany({ where: { id: { in: [olderInventoryId, newerInventoryId] } } });
    await p13.prisma.supplier.deleteMany({ where: { name: { startsWith: 'nex_p13_' } } });
    await p13.prisma.materialItem.deleteMany({ where: { id: materialId } });
    await p13.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    await p13.prisma.machine.deleteMany({ where: { id: machineId } });
    await p13.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    await p13.prisma.user.deleteMany({ where: { email: { contains: 'nex-p13.test' } } });
    await p13.app.close();
  });

  it('BUS-RULE-031: FEFO rejection when operator scans a newer batch while older unexpired stock exists', async () => {
    // Attempting to scan newerBatch when olderBatch has earlier expDate and stock > 0
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${mixingScheduleId}/actuals`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actuals: [
          {
            detailId: stepDetailId,
            qtyActual: 10.0,
            inventoryId: newerInventoryId,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(p13Message(res)).toMatch(/FEFO_VIOLATION|FEFO|terlebih dahulu/i);
  });

  it('BUS-RULE-030: Weight deviation > 0.5% without supervisor PIN is rejected', async () => {
    // Target 10.0 kg, input 10.2 kg (deviation = 2.0% > 0.5%)
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${mixingScheduleId}/actuals`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actuals: [
          {
            detailId: stepDetailId,
            qtyActual: 10.2,
            inventoryId: olderInventoryId, // Valid older FEFO batch
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(p13Message(res)).toMatch(/TOLERANCE_EXCEEDED|Supervisor PIN/i);
  });

  it('BUS-RULE-030: Weight deviation > 0.5% with valid Supervisor PIN is approved', async () => {
    // Target 10.0 kg, input 10.08 kg (deviation = 0.8% > 0.5%) with valid supervisor PIN
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${mixingScheduleId}/actuals`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actuals: [
          {
            detailId: stepDetailId,
            qtyActual: 10.08,
            inventoryId: olderInventoryId,
          },
        ],
        supervisorId: supervisorUser.id,
        supervisorPin: supervisorPin,
      });

    expect(res.status).toBe(201);
    expect(Number(res.body.stepDetails[0].qtyActual)).toBe(10.08);
  });

  it('Mixing completes and records bulk yield and logs', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${mixingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 500,
        notes: 'Mixing successfully finished, bulk transferred to quarantine drum',
        elapsedSeconds: 7200,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.resultQty).toBe(500);
  });
});
