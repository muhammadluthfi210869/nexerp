import request from 'supertest';
import { bootP14App, P14App, p14Message, cleanP14Residuals } from './p14-http-harness';
import { randomUUID } from 'crypto';

describe('P14-S5: Bidirectional Batch Recall Traceability Engine (AC-P14-05)', () => {
  let p14: P14App;
  let qcToken: string;
  let qcUserId: string;

  let testLeadId: string;
  let testStaffId: string;
  let sampleRequestId: string;
  let workOrderId: string;
  let planId: string;
  let machineId: string;
  let rawMaterialId: string;
  let supplierId: string;
  let supplierLotNumber: string;
  let finishedBatchCode: string;

  beforeAll(async () => {
    p14 = await bootP14App();

    const qcUser = await p14.createUser('QC_TRACEABILITY_S5', ['QC_LAB', 'SUPER_ADMIN']);
    qcToken = qcUser.token;
    qcUserId = qcUser.user.id;

    const staff = await p14.createStaff('nex_p14_s5_staff');
    testStaffId = staff.id;

    // Supplier & Material Lot
    const sup = await p14.prisma.supplier.create({
      data: {
        name: `nex_p14_s5_chem_supplier_${randomUUID().slice(0, 8)}`,
        contact: '08111223344',
      },
    });
    supplierId = sup.id;

    const mat = await p14.prisma.materialItem.create({
      data: {
        name: `nex_p14_s5_active_ingredient_${randomUUID().slice(0, 8)}`,
        code: `ACT-P14-S5-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 350000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 100,
      },
    });
    rawMaterialId = mat.id;

    supplierLotNumber = `DRUM-SUP-2026-X99_${randomUUID().slice(0, 6)}`;

    await p14.prisma.materialInventory.create({
      data: {
        materialId: rawMaterialId,
        supplierId,
        batchNumber: supplierLotNumber,
        internalQrCode: `QR-${supplierLotNumber}`,
        currentStock: 100,
        qcStatus: 'GOOD',
      },
    });

    // Machine
    const machine = await p14.prisma.machine.create({
      data: {
        name: `nex_p14_s5_mixer_${randomUUID().slice(0, 8)}`,
        type: 'MIXING_MACHINE' as any,
        capacityPerBatch: 2000,
        costPerHour: 55000,
      },
    });
    machineId = machine.id;

    // Lead, Work Order & Plan
    const lead = await p14.prisma.salesLead.create({
      data: {
        clientName: `nex_p14_s5_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08129876543',
        source: 'DIRECT',
        productInterest: 'Retinol Rejuvenating Serum',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const sample = await p14.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P14-S5-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: 'Retinol Rejuvenating Serum',
        targetFunction: 'Rejuvenating',
        textureReq: 'Serum',
        colorReq: 'Yellow',
        aromaReq: 'Neutral',
      },
    });
    sampleRequestId = sample.id;

    finishedBatchCode = `BATCH-RETINOL-P14-${randomUUID().slice(0, 6)}`;

    const so = await p14.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P14-S5-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: sampleRequestId,
        totalAmount: 75000000,
        status: 'ACTIVE' as any,
      },
    });

    const plan = await p14.prisma.productionPlan.create({
      data: {
        batchNo: finishedBatchCode,
        soId: so.id,
        adminId: qcUserId,
        status: 'READY_TO_PRODUCE',
      },
    });
    planId = plan.id;

    const wo = await p14.prisma.workOrder.create({
      data: {
        woNumber: `WO-P14-S5-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        planId: plan.id,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 4 * 86400000),
      },
    });
    workOrderId = wo.id;

    // FinishedGood
    await p14.prisma.finishedGood.create({
      data: {
        woId: plan.id,
        stockQty: 990,
      },
    });

    // Production Schedules: Mixing, Filling, Packing
    const mixSched = await p14.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P14-MIX-S5-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'MIXING',
        startTime: new Date(Date.now() - 3600000 * 5),
        endTime: new Date(Date.now() - 3600000 * 4),
        targetQty: 1000,
        resultQty: 1000,
        status: 'COMPLETED',
      },
    });

    // Bind step detail to consumed raw material lot
    await p14.prisma.productionStepDetail.create({
      data: {
        scheduleId: mixSched.id,
        materialId: rawMaterialId,
        qtyTheoretical: 25,
        qtyActual: 25,
        category: 'RAW',
        notes: `Consumed 25kg from drum ${supplierLotNumber}`,
      },
    });

    const fillSched = await p14.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P14-FILL-S5-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'FILLING',
        startTime: new Date(Date.now() - 3600000 * 3),
        endTime: new Date(Date.now() - 3600000 * 2),
        targetQty: 1000,
        resultQty: 995,
        status: 'COMPLETED',
      },
    });

    const packSched = await p14.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P14-PACK-S5-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'PACKING',
        startTime: new Date(Date.now() - 3600000 * 2),
        endTime: new Date(Date.now() - 3600000 * 1),
        targetQty: 995,
        resultQty: 990,
        status: 'COMPLETED',
      },
    });

    // Delivery Order representing dispatched product
    await p14.prisma.deliveryOrder.create({
      data: {
        workOrderId,
        trackingNumber: `DO-TRACK-P14-9988`,
        status: 'DELIVERED',
        courierName: 'Internal Logistics Express',
      },
    });

    // QC Audit release record
    await p14.prisma.qCAudit.create({
      data: {
        qcId: qcUserId,
        status: 'GOOD',
        phase: 'FINAL',
        notes: `[APJ_RELEASE] Batch ${finishedBatchCode} officially released to AVAILABLE stock. COA: COA-20260921-999. APJ: apt. Siti Rahmawati, S.Farm (SIPA: 19920815/SIPA_32.73/2022/2044).`,
      },
    });
  });

  afterAll(async () => {
    await p14.prisma.deliveryOrder.deleteMany({ where: { workOrderId } });
    await p14.prisma.productionStepDetail.deleteMany({ where: { materialId: rawMaterialId } });
    await p14.prisma.productionSchedule.deleteMany({ where: { workOrderId } });
    await p14.prisma.finishedGood.deleteMany({ where: { woId: planId } });
    await p14.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    if (planId) {
      await p14.prisma.rejectExecution.deleteMany({ where: { planId } });
      await p14.prisma.productionPlan.deleteMany({ where: { id: planId } });
    }
    await p14.prisma.salesOrder.deleteMany({ where: { leadId: testLeadId } });
    if (sampleRequestId) {
      await p14.prisma.sampleRequest.deleteMany({ where: { id: sampleRequestId } });
    }
    await p14.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    await p14.prisma.materialInventory.deleteMany({ where: { materialId: rawMaterialId } });
    await p14.prisma.materialItem.deleteMany({ where: { id: rawMaterialId } });
    await p14.prisma.supplier.deleteMany({ where: { id: supplierId } });
    await p14.prisma.machine.deleteMany({ where: { id: machineId } });
    await p14.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    await cleanP14Residuals(p14.prisma);
    await p14.app.close();
  });

  it('1. Backward Traceability: Reconstructs 5-level genealogy tree from Finished Goods batch', async () => {
    const res = await request(p14.app.getHttpServer())
      .get(`/qc/traceability/backward/${finishedBatchCode}`)
      .set('Authorization', `Bearer ${qcToken}`);

    expect(res.status).toBe(200);
    expect(res.body.batchNumber).toBe(finishedBatchCode);
    expect(res.body.workOrderNumber).toBeDefined();
    expect(res.body.customer.clientName).toContain('nex_p14_s5_client');

    // Release metadata
    expect(res.body.releaseMetadata.isReleased).toBe(true);
    expect(res.body.releaseMetadata.coaNumber).toContain('COA-20260921-999');
    expect(res.body.releaseMetadata.apjName).toContain('Siti Rahmawati');

    // 5-Level Genealogy Tree Verification
    const tree = res.body.genealogyTree;
    expect(tree).toBeDefined();
    expect(tree.level5_finishedGood.batchNumber).toBe(finishedBatchCode);
    expect(tree.level4_packagingStage.scheduleNumber).toContain('SCH-P14-PACK');
    expect(tree.level3_fillingStage.scheduleNumber).toContain('SCH-P14-FILL');
    expect(tree.level2_mixingStage.scheduleNumber).toContain('SCH-P14-MIX');

    // Level 1: Raw materials & supplier lots
    expect(tree.level1_rawMaterials.length).toBeGreaterThanOrEqual(1);
    const consumedMat = tree.level1_rawMaterials.find((m: any) => m.materialId === rawMaterialId);
    expect(consumedMat).toBeDefined();
    expect(consumedMat.batchNumber).toBe(supplierLotNumber);
    expect(consumedMat.supplierName).toContain('chem_supplier');
  });

  it('2. Forward Recall Traceability: Given contaminated raw material lot, identifies all affected batches and deliveries', async () => {
    const res = await request(p14.app.getHttpServer())
      .get(`/qc/traceability/forward/${supplierLotNumber}`)
      .set('Authorization', `Bearer ${qcToken}`);

    expect(res.status).toBe(200);
    expect(res.body.searchedMaterialLot).toBe(supplierLotNumber);

    // Recall Impact Summary
    const summary = res.body.recallImpactSummary;
    expect(summary.totalAffectedWorkOrders).toBe(1);
    expect(summary.totalExposedUnits).toBe(1000);
    expect(summary.totalDispatchedUnits).toBe(1000);
    expect(summary.recallSeverity).toBe('CRITICAL_CUSTOMER_NOTIFICATION');

    // Affected Finished Goods Batches
    const batches = res.body.affectedFinishedGoodsBatches;
    expect(batches.length).toBe(1);
    expect(batches[0].batchNumber).toBe(finishedBatchCode);
    expect(batches[0].customerName).toContain('nex_p14_s5_client');
    expect(batches[0].deliveryStatus).toBe('DELIVERED');
    expect(batches[0].trackingNumber).toBe('DO-TRACK-P14-9988');
  });
});
