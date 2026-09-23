import request from 'supertest';
import { bootP13App, P13App, p13Message } from './p13-http-harness';
import { randomUUID } from 'crypto';

describe('P13-S1: BatchRecord Lifecycle & Sequential Stage Progression', () => {
  let p13: P13App;
  let adminToken: string;
  let testLeadId: string;
  let testStaffId: string;
  let salesOrderId: string;
  let formulaId: string;
  let workOrderId: string;
  let mixingScheduleId: string;
  let fillingScheduleId: string;
  let packagingScheduleId: string;
  let machineId: string;
  let createdBatchId: string;

  beforeAll(async () => {
    p13 = await bootP13App();
    const admin = await p13.createUser('PROD_ADMIN_S1', ['SUPER_ADMIN', 'PRODUCTION_ADMIN']);
    adminToken = admin.token;

    const staff = await p13.createStaff('nex_p13_s1_staff');
    testStaffId = staff.id;

    // Create Machine
    const machine = await p13.prisma.machine.create({
      data: {
        name: `nex_p13_s1_mach_${randomUUID().slice(0, 8)}`,
        type: 'MIXING_MACHINE' as any,
        capacityPerBatch: 500,
        costPerHour: 60000,
      },
    });
    machineId = machine.id;

    // Create Lead & Formula
    const lead = await p13.prisma.salesLead.create({
      data: {
        clientName: `nex_p13_s1_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456789',
        source: 'DIRECT',
        productInterest: 'Acne Cleanser Cream',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const sample = await p13.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P13-S1-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: 'Acne Cleanser Sample',
        targetFunction: 'Cleansing',
        textureReq: 'Gel',
        colorReq: 'Green',
        aromaReq: 'Tea Tree',
      },
    });

    const formula = await p13.prisma.formula.create({
      data: {
        formulaCode: `FOR-P13-S1-${randomUUID().slice(0, 6)}`,
        sampleRequestId: sample.id,
        version: 1,
        targetYieldGram: 100,
        status: 'PRODUCTION_LOCKED',
      },
    });
    formulaId = formula.id;

    // Sales Order
    const so = await p13.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P13-S1-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: sample.id,
        status: 'ACTIVE' as any,
        totalAmount: 50000000,
      },
    });
    salesOrderId = so.id;

    // Work Order
    const wo = await p13.prisma.workOrder.create({
      data: {
        woNumber: `WO-P13-S1-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
    workOrderId = wo.id;

    // Create schedules: Mixing -> Filling -> Packaging
    const schMix = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-MIX-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'MIXING' as any,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        targetQty: 1000,
        status: 'SCHEDULED',
      },
    });
    mixingScheduleId = schMix.id;

    const schFill = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-FILL-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'FILLING' as any,
        startTime: new Date(Date.now() + 4000000),
        endTime: new Date(Date.now() + 7600000),
        targetQty: 1000,
        status: 'SCHEDULED',
      },
    });
    fillingScheduleId = schFill.id;

    const schPack = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-PACK-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'PACKING' as any,
        startTime: new Date(Date.now() + 8000000),
        endTime: new Date(Date.now() + 11600000),
        targetQty: 1000,
        status: 'SCHEDULED',
      },
    });
    packagingScheduleId = schPack.id;
  });

  afterAll(async () => {
    // Clean up created records in reverse dependency order
    if (workOrderId) {
      await p13.prisma.productionLog.deleteMany({ where: { workOrderId } });
    }
    const schedIds = [mixingScheduleId, fillingScheduleId, packagingScheduleId].filter(Boolean);
    if (schedIds.length > 0) {
      await p13.prisma.productionStepDetail.deleteMany({ where: { scheduleId: { in: schedIds } } });
      await p13.prisma.productionSchedule.deleteMany({ where: { id: { in: schedIds } } });
    }
    if (createdBatchId) {
      await p13.prisma.productionPlan.delete({ where: { id: createdBatchId } }).catch(() => {});
    }
    await p13.prisma.productionPlan.deleteMany({ where: { batchNo: { startsWith: 'nex_p13_' } } });
    if (workOrderId) {
      await p13.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    }
    if (salesOrderId) {
      await p13.prisma.salesOrder.deleteMany({ where: { id: salesOrderId } });
    }
    if (formulaId) {
      await p13.prisma.formulaPhase.deleteMany({ where: { formulaId } });
      await p13.prisma.formula.deleteMany({ where: { id: formulaId } });
    }
    if (testLeadId) {
      await p13.prisma.sampleRequest.deleteMany({ where: { leadId: testLeadId } });
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

  it('BUS-RULE-028: rejects BMR creation when salesOrderId bridge is missing', async () => {
    const res = await request(p13.app.getHttpServer())
      .post('/production/batch-records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        note: 'Invalid BMR without SO',
      });

    expect(res.status).toBe(400);
    expect(p13Message(res)).toMatch(/sales_order_id/i);
  });

  it('creates BatchRecord with salesOrderId bridge and links work order', async () => {
    const res = await request(p13.app.getHttpServer())
      .post('/production/batch-records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sales_order_id: salesOrderId,
        work_order_id: workOrderId,
        formulation_id: formulaId,
        note: 'nex_p13_s1 initial BMR draft',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.batchNo).toMatch(/^BMR-/);
    expect(res.body.data.status).toBe('PLANNING');
    createdBatchId = res.body.data.id;
  });

  it('fetches BatchRecord detail by id and batchNo', async () => {
    const res = await request(p13.app.getHttpServer())
      .get(`/production/batch-records/${createdBatchId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdBatchId);
    expect(res.body.data.soId).toBe(salesOrderId);
  });

  it('rejects invalid state machine jumping (e.g. DRAFT to COMPLETED)', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/batch-records/${createdBatchId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to_status: 'COMPLETED',
        notes: 'Trying to skip straight to COMPLETED',
      });

    expect(res.status).toBe(400);
    expect(p13Message(res)).toMatch(/INVALID_TRANSITION/i);
  });

  it('transitions DRAFT -> APPROVED when formula is linked', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/batch-records/${createdBatchId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to_status: 'APPROVED',
        notes: 'Formula validated and approved by Production Admin',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('transitions APPROVED -> LOCKED when schedules exist', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/batch-records/${createdBatchId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        to_status: 'LOCKED',
        notes: 'Schedules verified and batch locked for execution',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('LOCKED');
  });

  it('BUS-RULE-029: rejects Filling completion before Mixing is completed', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${fillingScheduleId}/result`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resultQty: 1000,
        notes: 'Attempting Filling before Mixing finishes',
      });

    expect(res.status).toBe(400);
    expect(p13Message(res)).toMatch(/STAGE_ORDER_VIOLATION|Mixing/i);
  });
});
