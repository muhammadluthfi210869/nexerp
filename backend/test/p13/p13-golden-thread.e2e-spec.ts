import request from 'supertest';
import { bootP13App, P13App } from './p13-http-harness';
import { randomUUID } from 'crypto';

describe('P13 Golden Thread: End-to-End Production Execution & BMR Lifecycle', () => {
  let p13: P13App;
  let adminToken: string;
  let operatorToken: string;
  let qcToken: string;
  let supervisorUser: any;
  const supervisorPin = '994411';

  let testLeadId: string;
  let testStaffId: string;
  let supplierId: string;
  let salesOrderId: string;
  let sampleId: string;
  let formulaId: string;
  let workOrderId: string;
  let mixerMachineId: string;
  let fillerMachineId: string;
  let packerMachineId: string;
  let batchRecordId: string;

  let mixingScheduleId: string;
  let fillingScheduleId: string;
  let packagingScheduleId: string;

  let rawMatId: string;
  let olderInvId: string;
  let newerInvId: string;
  let mixingStepDetailId: string;
  let mixingLogId: string;
  let bulkMatId: string;
  let boxMatId: string;
  let designTaskId: string;

  beforeAll(async () => {
    p13 = await bootP13App();

    const admin = await p13.createUser('GT_ADMIN_P13', ['SUPER_ADMIN', 'PRODUCTION_ADMIN']);
    adminToken = admin.token;

    const op = await p13.createUser('GT_OP_P13', ['SUPER_ADMIN', 'PRODUCTION_OPERATOR']);
    operatorToken = op.token;

    const qc = await p13.createUser('GT_QC_P13', ['SUPER_ADMIN', 'QC_LAB']);
    qcToken = qc.token;

    const spv = await p13.createUser('GT_SPV_P13', ['SUPER_ADMIN', 'PRODUCTION_SUPERVISOR'], undefined, supervisorPin);
    supervisorUser = spv.user;

    const staff = await p13.createStaff('nex_p13_gt_staff');
    testStaffId = staff.id;

    // Supplier
    const sup = await p13.prisma.supplier.create({
      data: { name: `nex_p13_gt_sup_${randomUUID().slice(0, 8)}` },
    });
    supplierId = sup.id;

    // Machines
    const mixer = await p13.prisma.machine.create({
      data: {
        name: `nex_p13_gt_mixer_${randomUUID().slice(0, 8)}`,
        type: 'MIXING_MACHINE' as any,
        capacityPerBatch: 1000,
        costPerHour: 60000,
      },
    });
    mixerMachineId = mixer.id;

    const filler = await p13.prisma.machine.create({
      data: {
        name: `nex_p13_gt_filler_${randomUUID().slice(0, 8)}`,
        type: 'FILLING_MACHINE' as any,
        capacityPerBatch: 1000,
        costPerHour: 50000,
      },
    });
    fillerMachineId = filler.id;

    const packer = await p13.prisma.machine.create({
      data: {
        name: `nex_p13_gt_packer_${randomUUID().slice(0, 8)}`,
        type: 'PACKING_MACHINE' as any,
        capacityPerBatch: 1000,
        costPerHour: 40000,
      },
    });
    packerMachineId = packer.id;

    // Lead & Sample & Formula
    const lead = await p13.prisma.salesLead.create({
      data: {
        clientName: `nex_p13_gt_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456784',
        source: 'DIRECT',
        productInterest: 'Hydrating Glow Serum',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const sample = await p13.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P13-GT-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: 'Hydrating Glow Serum',
        targetFunction: 'Hydration',
        textureReq: 'Serum',
        colorReq: 'Clear',
        aromaReq: 'Unscented',
      },
    });
    sampleId = sample.id;

    const formula = await p13.prisma.formula.create({
      data: {
        formulaCode: `FOR-P13-GT-${randomUUID().slice(0, 6)}`,
        sampleRequestId: sampleId,
        version: 1,
        targetYieldGram: 100,
        status: 'PRODUCTION_LOCKED',
      },
    });
    formulaId = formula.id;

    // Design Task
    const dt = await p13.prisma.designTask.create({
      data: {
        leadId: testLeadId,
        brief: 'nex_p13_gt_artwork',
        isFinal: true,
        isLocked: true,
        kanbanState: 'LOCKED',
      },
    });
    designTaskId = dt.id;

    // Sales Order
    const so = await p13.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P13-GT-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId,
        status: 'ACTIVE' as any,
        totalAmount: 100000000,
      },
    });
    salesOrderId = so.id;

    // Work Order
    const wo = await p13.prisma.workOrder.create({
      data: {
        woNumber: `WO-P13-GT-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
    workOrderId = wo.id;

    // Materials
    const raw = await p13.prisma.materialItem.create({
      data: {
        name: `nex_p13_gt_hyaluronic_${randomUUID().slice(0, 8)}`,
        code: `MAT-P13-GT-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 250000,
        minLevel: 5,
        maxLevel: 500,
        reorderPoint: 10,
        stockQty: 50,
      },
    });
    rawMatId = raw.id;

    const bulk = await p13.prisma.materialItem.create({
      data: {
        name: `nex_p13_gt_bulk_${randomUUID().slice(0, 8)}`,
        code: `BULK-P13-GT-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL' as any,
        unit: 'KG',
        unitPrice: 75000,
        minLevel: 0,
        maxLevel: 1000,
        reorderPoint: 0,
        stockQty: 100,
      },
    });
    bulkMatId = bulk.id;

    const box = await p13.prisma.materialItem.create({
      data: {
        name: `nex_p13_gt_bottle_${randomUUID().slice(0, 8)}`,
        code: `BOT-P13-GT-${randomUUID().slice(0, 6)}`,
        type: 'PACKAGING' as any,
        unit: 'PCS',
        unitPrice: 4000,
        minLevel: 100,
        maxLevel: 10000,
        reorderPoint: 500,
        stockQty: 1200,
      },
    });
    boxMatId = box.id;

    // Inventory FEFO lots for rawMat
    const olderInv = await p13.prisma.materialInventory.create({
      data: {
        materialId: rawMatId,
        supplierId,
        batchNumber: `LOT-P13-OLD-${randomUUID().slice(0, 4)}`,
        internalQrCode: `QR-P13-OLD-${randomUUID().slice(0, 6)}`,
        currentStock: 20,
        receivingDate: new Date(),
        expDate: new Date(Date.now() + 30 * 86400000),
        qcStatus: 'GOOD',
      },
    });
    olderInvId = olderInv.id;

    const newerInv = await p13.prisma.materialInventory.create({
      data: {
        materialId: rawMatId,
        supplierId,
        batchNumber: `LOT-P13-NEW-${randomUUID().slice(0, 4)}`,
        internalQrCode: `QR-P13-NEW-${randomUUID().slice(0, 6)}`,
        currentStock: 30,
        receivingDate: new Date(),
        expDate: new Date(Date.now() + 90 * 86400000),
        qcStatus: 'GOOD',
      },
    });
    newerInvId = newerInv.id;

    // 3 Sequential Schedules: Mixing -> Filling -> Packaging
    const schMix = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-GT-MIX-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId: mixerMachineId,
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
        scheduleNumber: `SCH-P13-GT-FILL-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId: fillerMachineId,
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
        scheduleNumber: `SCH-P13-GT-PACK-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId: packerMachineId,
        stage: 'PACKING' as any,
        startTime: new Date(Date.now() + 8000000),
        endTime: new Date(Date.now() + 11600000),
        targetQty: 1000,
        status: 'SCHEDULED',
      },
    });
    packagingScheduleId = schPack.id;

    // Step Details
    const mixDet = await p13.prisma.productionStepDetail.create({
      data: {
        scheduleId: mixingScheduleId,
        materialId: rawMatId,
        qtyTheoretical: 10.0,
        category: 'RAW',
      },
    });
    mixingStepDetailId = mixDet.id;

    await p13.prisma.productionStepDetail.create({
      data: {
        scheduleId: fillingScheduleId,
        materialId: bulkMatId,
        qtyTheoretical: 100.0,
        qtyActual: 100.0,
        category: 'BULK',
      },
    });

    await p13.prisma.productionStepDetail.create({
      data: {
        scheduleId: packagingScheduleId,
        materialId: boxMatId,
        qtyTheoretical: 1000.0,
        qtyActual: 1000.0,
        category: 'KEMASAN_SEKUNDER',
      },
    });
  });

  afterAll(async () => {
    if (workOrderId) {
      await p13.prisma.materialReturn.deleteMany({ where: { workOrderId } });
      await p13.prisma.finishedGood.deleteMany({ where: { woId: workOrderId } });
      await p13.prisma.productionLog.deleteMany({ where: { workOrderId } });
    }
    await p13.prisma.qCAudit.deleteMany({ where: { qc: { email: { contains: 'nex-p13.test' } } } });
    const schedIds = [mixingScheduleId, fillingScheduleId, packagingScheduleId].filter(Boolean);
    if (schedIds.length > 0) {
      await p13.prisma.productionStepDetail.deleteMany({ where: { scheduleId: { in: schedIds } } });
      await p13.prisma.productionSchedule.deleteMany({ where: { id: { in: schedIds } } });
    }
    if (batchRecordId) {
      await p13.prisma.productionPlan.delete({ where: { id: batchRecordId } }).catch(() => {});
    }
    await p13.prisma.productionPlan.deleteMany({ where: { batchNo: { startsWith: 'nex_p13_' } } });
    if (workOrderId) {
      await p13.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    }
    if (salesOrderId) {
      await p13.prisma.salesOrder.deleteMany({ where: { id: salesOrderId } });
    }
    if (designTaskId) {
      await p13.prisma.designTask.deleteMany({ where: { id: designTaskId } });
    }
    const invIds = [olderInvId, newerInvId].filter(Boolean);
    if (invIds.length > 0) {
      await p13.prisma.materialInventory.deleteMany({ where: { id: { in: invIds } } });
    }
    const matIds = [rawMatId, bulkMatId, boxMatId].filter(Boolean);
    if (matIds.length > 0) {
      await p13.prisma.inventoryTransaction.deleteMany({ where: { materialId: { in: matIds } } });
      await p13.prisma.materialInventory.deleteMany({ where: { materialId: { in: matIds } } });
      await p13.prisma.materialItem.deleteMany({ where: { id: { in: matIds } } });
    }
    if (supplierId) {
      await p13.prisma.supplier.deleteMany({ where: { id: supplierId } });
    }
    if (formulaId) {
      await p13.prisma.formulaPhase.deleteMany({ where: { formulaId } });
      await p13.prisma.formula.deleteMany({ where: { id: formulaId } });
    }
    if (sampleId) {
      await p13.prisma.sampleRequest.deleteMany({ where: { id: sampleId } });
    }
    if (testLeadId) {
      await p13.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    }
    const machIds = [mixerMachineId, fillerMachineId, packerMachineId].filter(Boolean);
    if (machIds.length > 0) {
      await p13.prisma.machine.deleteMany({ where: { id: { in: machIds } } });
    }
    if (testStaffId) {
      await p13.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    }
    await p13.prisma.user.deleteMany({ where: { email: { contains: 'nex-p13.test' } } });
    await p13.app.close();
  });

  it('Step 1: Creates Batch Record (BMR) with SO bridge', async () => {
    const res = await request(p13.app.getHttpServer())
      .post('/production/batch-records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sales_order_id: salesOrderId,
        work_order_id: workOrderId,
        formulation_id: formulaId,
        note: 'nex_p13_gt Golden Thread BMR execution',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    batchRecordId = res.body.data.id;
  });

  it('Step 2: Transitions BMR DRAFT -> APPROVED -> LOCKED', async () => {
    // Approve
    const resApprove = await request(p13.app.getHttpServer())
      .post(`/production/batch-records/${batchRecordId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ to_status: 'APPROVED', notes: 'Formula locked & validated' });
    expect(resApprove.status).toBe(201);
    expect(resApprove.body.data.status).toBe('APPROVED');

    // Lock
    const resLock = await request(p13.app.getHttpServer())
      .post(`/production/batch-records/${batchRecordId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ to_status: 'LOCKED', notes: 'Schedules ready for execution' });
    expect(resLock.status).toBe(201);
    expect(resLock.body.data.status).toBe('LOCKED');
  });

  it('Step 3: Mixing Execution with FEFO Scan and Supervisor Weight Deviation Override', async () => {
    // Scan material with 0.8% deviation (requires supervisor PIN) and older FEFO lot
    const resActuals = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${mixingScheduleId}/actuals`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        actuals: [
          {
            detailId: mixingStepDetailId,
            qtyActual: 10.08,
            inventoryId: olderInvId,
          },
        ],
        supervisorId: supervisorUser.id,
        supervisorPin,
      });

    expect(resActuals.status).toBe(201);

    // Complete Mixing
    const resMixing = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${mixingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 1000,
        notes: 'Mixing successfully completed. Liquid bulk ready for QC',
        elapsedSeconds: 7200,
      });

    expect(resMixing.status).toBe(201);
    expect(resMixing.body.status).toBe('COMPLETED');
  });

  it('Step 4: QC Lab verifies Mixing bulk as GOOD', async () => {
    const latestMixLog = await p13.prisma.productionLog.findFirst({
      where: { workOrderId, stage: 'MIXING' as any },
      orderBy: { loggedAt: 'desc' },
    });
    expect(latestMixLog).toBeDefined();
    mixingLogId = latestMixLog!.id;

    const resQC = await request(p13.app.getHttpServer())
      .post('/production/qc/verify')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId: mixingLogId,
        status: 'GOOD',
        notes: 'GT Lab Test: pH 5.6, Viscosity 2800 cps - PASSED',
      });

    expect(resQC.status).toBe(201);
    expect(resQC.body.status).toBe('GOOD');
  });

  it('Step 5: Filling Execution completes within physical limits', async () => {
    const resFilling = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${fillingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 995,
        notes: 'Filling finished: 995 bottles filled, 5 reject',
        elapsedSeconds: 5400,
      });

    expect(resFilling.status).toBe(201);
    expect(resFilling.body.status).toBe('COMPLETED');
    expect(resFilling.body.resultQty).toBe(995);
  });

  it('Step 6: Packaging Execution completes, binds traceability QR, and creates QUARANTINE Finished Goods', async () => {
    const resPackaging = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${packagingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 990,
        notes: 'Packaging finished: 990 boxes packed, 5 reject labels',
        elapsedSeconds: 3600,
      });

    expect(resPackaging.status).toBe(201);
    expect(resPackaging.body.status).toBe('COMPLETED');
    expect(resPackaging.body.resultQty).toBe(990);
    expect(resPackaging.body.qrCodeData).toBeDefined();
    expect(resPackaging.body.qrCodeData.status).toBe('QUARANTINE');

    // Verify FinishedGood in DB
    const fg = await p13.prisma.finishedGood.findFirst({
      where: { woId: workOrderId },
    });
    expect(fg).toBeDefined();
    expect(Number(fg?.stockQty)).toBe(990);
  });

  it('Step 7: Reconciles Material Return for leftover raw material back to warehouse', async () => {
    const resReturn = await request(p13.app.getHttpServer())
      .post('/production/reconciliation/return')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        workOrderId,
        materialId: rawMatId,
        qtyReturned: 1.2,
        reason: 'Surplus raw material returned after batch production',
      });

    expect(resReturn.status).toBe(201);
    expect(resReturn.body.status).toBe('PENDING');
    expect(Number(resReturn.body.qtyReturned)).toBe(1.2);
  });

  it('Step 8: Transitions BMR LOCKED -> IN_PROGRESS -> COMPLETED', async () => {
    // IN_PROGRESS
    const resProgress = await request(p13.app.getHttpServer())
      .post(`/production/batch-records/${batchRecordId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ to_status: 'IN_PROGRESS', notes: 'Floor production executing' });
    expect(resProgress.status).toBe(201);
    expect(resProgress.body.data.status).toBe('IN_PROGRESS');

    // COMPLETED (all stages completed)
    const resComplete = await request(p13.app.getHttpServer())
      .post(`/production/batch-records/${batchRecordId}/process`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ to_status: 'COMPLETED', notes: 'Packaging completed, batch record signed off' });
    expect(resComplete.status).toBe(201);
    expect(resComplete.body.data.status).toBe('COMPLETED');
  });
});
