import request from 'supertest';
import { bootP13App, P13App, p13Message } from './p13-http-harness';
import { randomUUID } from 'crypto';

describe('P13-S3: Filling Execution (Bulk QC Interlock & Physical Limits)', () => {
  let p13: P13App;
  let operatorToken: string;
  let qcToken: string;

  let testLeadId: string;
  let testStaffId: string;
  let workOrderId: string;
  let machineId: string;
  let mixingScheduleId: string;
  let fillingScheduleId: string;
  let bulkMaterialId: string;
  let mixingLogId: string;

  beforeAll(async () => {
    p13 = await bootP13App();

    const operator = await p13.createUser('FILLING_OP_S3', ['SUPER_ADMIN', 'PRODUCTION_OPERATOR']);
    operatorToken = operator.token;

    const qcUser = await p13.createUser('QC_LAB_S3', ['SUPER_ADMIN', 'QC_LAB']);
    qcToken = qcUser.token;

    const staff = await p13.createStaff('nex_p13_s3_staff');
    testStaffId = staff.id;

    // Machine
    const machine = await p13.prisma.machine.create({
      data: {
        name: `nex_p13_s3_mach_${randomUUID().slice(0, 8)}`,
        type: 'FILLING_MACHINE' as any,
        capacityPerBatch: 1000,
        costPerHour: 45000,
      },
    });
    machineId = machine.id;

    // Lead & Work Order
    const lead = await p13.prisma.salesLead.create({
      data: {
        clientName: `nex_p13_s3_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456787',
        source: 'DIRECT',
        productInterest: 'Brightening Toner',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const wo = await p13.prisma.workOrder.create({
      data: {
        woNumber: `WO-P13-S3-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
    workOrderId = wo.id;

    // Bulk material item (representing the liquid bulk: e.g. 100 kg bulk for 1000 bottles @ 100ml)
    const bulkMat = await p13.prisma.materialItem.create({
      data: {
        name: `nex_p13_s3_bulk_${randomUUID().slice(0, 8)}`,
        code: `BULK-P13-S3-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL' as any,
        unit: 'KG',
        unitPrice: 50000,
        minLevel: 0,
        maxLevel: 1000,
        reorderPoint: 0,
        stockQty: 100,
      },
    });
    bulkMaterialId = bulkMat.id;

    // Mixing schedule marked COMPLETED
    const mixSch = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-MIX-S3-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'MIXING' as any,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
        targetQty: 1000,
        resultQty: 1000,
        status: 'COMPLETED',
      },
    });
    mixingScheduleId = mixSch.id;

    // Mixing production log (initial status: without QC sign-off)
    const mLog = await p13.prisma.productionLog.create({
      data: {
        logNumber: `LOG-MIX-S3-${randomUUID().slice(0, 6)}`,
        workOrderId,
        stage: 'MIXING' as any,
        inputQty: 100,
        goodQty: 98,
        quarantineQty: 98,
        rejectQty: 2,
        notes: 'nex_p13_s3 mixing done, waiting QC test',
      },
    });
    mixingLogId = mLog.id;

    // Filling schedule: Target 1000 pcs, consuming bulk 100 KG
    const fillSch = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-FILL-S3-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'FILLING' as any,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        targetQty: 1000,
        status: 'SCHEDULED',
      },
    });
    fillingScheduleId = fillSch.id;

    // Step detail for bulk consumption (Category = BULK)
    await p13.prisma.productionStepDetail.create({
      data: {
        scheduleId: fillingScheduleId,
        materialId: bulkMaterialId,
        category: 'BULK',
        qtyTheoretical: 100, // 100 kg
        qtyActual: 100,      // 100 kg consumed
      },
    });
  });

  afterAll(async () => {
    if (mixingLogId) {
      await p13.prisma.qCAudit.deleteMany({ where: { stepLogId: mixingLogId } });
    }
    if (workOrderId) {
      await p13.prisma.productionLog.deleteMany({ where: { workOrderId } });
    }
    if (fillingScheduleId) {
      await p13.prisma.productionStepDetail.deleteMany({ where: { scheduleId: fillingScheduleId } });
    }
    const schedIds = [mixingScheduleId, fillingScheduleId].filter(Boolean);
    if (schedIds.length > 0) {
      await p13.prisma.productionSchedule.deleteMany({ where: { id: { in: schedIds } } });
    }
    if (workOrderId) {
      await p13.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    }
    if (bulkMaterialId) {
      await p13.prisma.inventoryTransaction.deleteMany({ where: { materialId: bulkMaterialId } });
      await p13.prisma.materialInventory.deleteMany({ where: { materialId: bulkMaterialId } });
      await p13.prisma.materialItem.deleteMany({ where: { id: bulkMaterialId } });
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

  it('BUS-RULE-032: Filling rejected when Bulk WIP has not passed QC (QC Interlock)', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${fillingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 1000,
        notes: 'Attempting Filling without bulk QC pass',
      });

    expect(res.status).toBe(400);
    expect(p13Message(res)).toMatch(/QC_BULK_NOT_PASSED|DITOLAK|lulus uji/i);
  });

  it('QC verifies mixing bulk as GOOD (pH 5.5, viscosity in spec)', async () => {
    const res = await request(p13.app.getHttpServer())
      .post('/production/qc/verify')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId: mixingLogId,
        status: 'GOOD',
        notes: 'Bulk tested: pH 5.5, Viscosity 3200 cps - PASSED',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('GOOD');
  });

  it('BUS-RULE-033: Output exceeding theoretical physical capacity is rejected', async () => {
    // 100 kg bulk can produce at most 1000 pcs (+1% tolerance = 1010 pcs).
    // Attempting to output 1200 pcs should fail mathematical limit.
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${fillingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 1200,
        notes: 'Attempting output beyond physical capacity',
      });

    expect(res.status).toBe(400);
    expect(p13Message(res)).toMatch(/OUTPUT_EXCEEDS_PHYSICAL_LIMIT|Hukum Fisika|melebihi batas/i);
  });

  it('Filling succeeds within theoretical physical limits', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${fillingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 990,
        notes: 'Filling completed: 990 pcs filled, 10 pcs reject bottle',
        elapsedSeconds: 3600,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.resultQty).toBe(990);
  });
});
