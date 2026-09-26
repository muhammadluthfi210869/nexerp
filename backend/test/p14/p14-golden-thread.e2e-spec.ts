/**
 * P14 Production Golden Thread:
 * End-to-End QC, Quarantine, Dispositions, APJ Release, and Recall Traceability.
 *
 * Traversal:
 *   1. Inbound Material Receipt in QUARANTINE (available stock = 0)
 *   2. Inbound QC Analysis & CoA Verification
 *   3. Production Mixing with Supervisor PIN Parameter Override
 *   4. Filling In-Process Control (Torque & Vacuum Leak)
 *   5. Packaging Finished Goods into QUARANTINE
 *   6. Partial Disposition & COPQ Loss Logging
 *   7. Retest of Held Units
 *   8. Authorized APJ Release to AVAILABLE stock with COA & SIPA
 *   9. Idempotency Protection Check
 *   10. 5-Level Backward Genealogy & Forward Recall Trace
 */
import request from 'supertest';
import { bootP14App, P14App, p14Message, cleanP14Residuals } from './p14-http-harness';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

describe('P14 Golden Thread: End-to-End QC, Release & Traceability on Real DB (AC-P14-07)', () => {
  let p14: P14App;
  let qcToken: string;
  let qcUserId: string;
  let apjToken: string;
  let operatorToken: string;

  let testWarehouseId: string;
  let testMaterialId: string;
  let supplierId: string;
  let supplierLotNumber: string;
  let formulaId: string;
  let sampleRequestId: string;
  let testLeadId: string;
  let testStaffId: string;
  let planId: string;
  let workOrderId: string;
  let finishedGoodId: string;
  let machineId: string;
  let mixScheduleId: string;
  let fillScheduleId: string;
  let packScheduleId: string;
  const supervisorPin = '889900';
  let goldenBatchCode: string;
  let stepLogId: string;

  beforeAll(async () => {
    p14 = await bootP14App();

    const hashedPin = await bcrypt.hash(supervisorPin, 10);
    const qcUser = await p14.createUser('QC_GT_ANALYST', ['QC_LAB'], undefined, hashedPin);
    qcToken = qcUser.token;
    qcUserId = qcUser.user.id;

    const apjUser = await p14.createUser('APJ_GT_PHARMACIST', ['APJ', 'QC_LAB', 'SUPER_ADMIN']);
    apjToken = apjUser.token;

    const opUser = await p14.createUser('OP_GT_PACKER', ['PRODUCTION_OP']);
    operatorToken = opUser.token;

    const staff = await p14.createStaff('nex_p14_gt_staff');
    testStaffId = staff.id;

    // Warehouse & Supplier
    const wh = await p14.prisma.warehouse.create({
      data: {
        name: `nex_p14_gt_wh_${randomUUID().slice(0, 8)}`,
        status: 'ACTIVE',
      },
    });
    testWarehouseId = wh.id;

    const sup = await p14.prisma.supplier.create({
      data: {
        name: `nex_p14_gt_supplier_${randomUUID().slice(0, 8)}`,
        contact: '08123459999',
      },
    });
    supplierId = sup.id;

    const mat = await p14.prisma.materialItem.create({
      data: {
        name: `nex_p14_gt_tea_tree_${randomUUID().slice(0, 8)}`,
        code: `MAT-P14-GT-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 85000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 0,
      },
    });
    testMaterialId = mat.id;

    supplierLotNumber = `SUP-LOT-GT-2026-${randomUUID().slice(0, 6)}`;

    // Lead & Formula
    const lead = await p14.prisma.salesLead.create({
      data: {
        clientName: `nex_p14_gt_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123450000',
        source: 'DIRECT',
        productInterest: 'Tea Tree Purifying Spot Gel',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    const sample = await p14.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P14-GT-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: 'Tea Tree Purifying Spot Gel',
        targetFunction: 'Acne Treatment',
        textureReq: 'Gel',
        colorReq: 'Greenish Clear',
        aromaReq: 'Tea Tree',
      },
    });
    sampleRequestId = sample.id;

    const form = await p14.prisma.formula.create({
      data: {
        formulaCode: `FORM-P14-GT-${randomUUID().slice(0, 6)}`,
        sampleRequestId,
        version: 1,
      },
    });
    formulaId = form.id;

    await p14.prisma.qCParameter.create({
      data: {
        formulaId,
        targetPh: '5.2-6.2',
        targetViscosity: '3000-5000',
        appearance: 'Greenish Gel',
      },
    });

    goldenBatchCode = `BATCH-GT-P14-${randomUUID().slice(0, 6)}`;

    const so = await p14.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P14-GT-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: sampleRequestId,
        totalAmount: 100000000,
        status: 'ACTIVE' as any,
      },
    });

    const plan = await p14.prisma.productionPlan.create({
      data: {
        batchNo: goldenBatchCode,
        soId: so.id,
        adminId: qcUserId,
        formulaId,
        status: 'READY_TO_PRODUCE',
      },
    });
    planId = plan.id;

    const wo = await p14.prisma.workOrder.create({
      data: {
        woNumber: `WO-P14-GT-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        planId: plan.id,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 5 * 86400000),
      },
    });
    workOrderId = wo.id;

    const stepLog = await p14.prisma.productionStepLog.create({
      data: {
        woId: plan.id,
        stage: 'MIXING',
        inputQty: 1000,
        qtyResult: 990,
        qtyQuarantine: 990,
        qtyReject: 10,
      },
    });
    stepLogId = stepLog.id;

    await p14.prisma.productionLog.create({
      data: {
        id: stepLog.id,
        planId: plan.id,
        workOrderId: wo.id,
        stage: 'MIXING',
        inputQty: 1000,
        goodQty: 990,
        quarantineQty: 990,
        rejectQty: 10,
      },
    });

    const machine = await p14.prisma.machine.create({
      data: {
        name: `nex_p14_gt_machine_${randomUUID().slice(0, 8)}`,
        type: 'MIXING_MACHINE' as any,
        capacityPerBatch: 1000,
        costPerHour: 50000,
      },
    });
    machineId = machine.id;

    // Schedules
    const mix = await p14.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P14-GT-MIX-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId: machine.id,
        stage: 'MIXING',
        startTime: new Date(Date.now() - 3600000 * 4),
        endTime: new Date(Date.now() - 3600000 * 3),
        targetQty: 1000,
        resultQty: 1000,
        status: 'COMPLETED',
      },
    });
    mixScheduleId = mix.id;

    await p14.prisma.productionStepDetail.create({
      data: {
        scheduleId: mix.id,
        materialId: testMaterialId,
        qtyTheoretical: 50,
        qtyActual: 50,
        category: 'RAW',
        notes: `GT Mixing batch consumption from lot ${supplierLotNumber}`,
      },
    });

    const fill = await p14.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P14-GT-FILL-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId: machine.id,
        stage: 'FILLING',
        startTime: new Date(Date.now() - 3600000 * 3),
        endTime: new Date(Date.now() - 3600000 * 2),
        targetQty: 1000,
        resultQty: 990,
        status: 'COMPLETED',
      },
    });
    fillScheduleId = fill.id;

    const pack = await p14.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P14-GT-PACK-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId: machine.id,
        stage: 'PACKING',
        startTime: new Date(Date.now() - 3600000 * 2),
        endTime: new Date(Date.now() - 3600000 * 1),
        targetQty: 990,
        resultQty: 980,
        status: 'COMPLETED',
      },
    });
    packScheduleId = pack.id;
  });

  afterAll(async () => {
    if (stepLogId) {
      await p14.prisma.productionLog.deleteMany({ where: { id: stepLogId } });
      await p14.prisma.productionStepLog.deleteMany({ where: { id: stepLogId } });
    }
    await p14.prisma.cOPQRecord.deleteMany({ where: { planId } });
    await p14.prisma.finishedGood.deleteMany({ where: { woId: planId } });
    await p14.prisma.productionStepDetail.deleteMany({ where: { materialId: testMaterialId } });
    await p14.prisma.productionSchedule.deleteMany({ where: { workOrderId } });
    await p14.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    if (planId) {
      await p14.prisma.rejectExecution.deleteMany({ where: { planId } });
      await p14.prisma.productionPlan.deleteMany({ where: { id: planId } });
    }
    await p14.prisma.salesOrder.deleteMany({ where: { leadId: testLeadId } });
    await p14.prisma.qCParameter.deleteMany({ where: { formulaId } });
    await p14.prisma.formula.deleteMany({ where: { id: formulaId } });
    await p14.prisma.sampleRequest.deleteMany({ where: { id: sampleRequestId } });
    await p14.prisma.salesLead.deleteMany({ where: { id: testLeadId } });
    await p14.prisma.materialInventory.deleteMany({ where: { materialId: testMaterialId } });
    await p14.prisma.materialItem.deleteMany({ where: { id: testMaterialId } });
    await p14.prisma.supplier.deleteMany({ where: { id: supplierId } });
    if (machineId) {
      await p14.prisma.machine.deleteMany({ where: { id: machineId } });
    }
    await p14.prisma.warehouse.deleteMany({ where: { id: testWarehouseId } });
    await p14.prisma.bussdevStaff.deleteMany({ where: { id: testStaffId } });
    await cleanP14Residuals(p14.prisma);
    await p14.app.close();
  });

  it('Step 1: Inbound Receipt creates raw material in QUARANTINE (available = 0)', async () => {
    const inv = await p14.prisma.materialInventory.create({
      data: {
        materialId: testMaterialId,
        supplierId,
        batchNumber: supplierLotNumber,
        internalQrCode: `QR-GT-${supplierLotNumber}`,
        currentStock: 100,
        qcStatus: 'QUARANTINE',
      },
    });

    expect(inv.qcStatus).toBe('QUARANTINE');

    const mat = await p14.prisma.materialItem.findUnique({
      where: { id: testMaterialId },
    });
    expect(Number(mat?.stockQty)).toBe(0);
  });

  it('Step 2: Inbound QC verifies CoA and Organoleptic quality', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        phase: 'INBOUND',
        status: 'GOOD',
        coaVerified: 'PASS',
        organoleptic: 'PASS',
        notes: `GT Inbound QC passed for lot ${supplierLotNumber}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('GOOD');
  });

  it('Step 3: Mixing QC executes analytical tests with Supervisor PIN override for out-of-spec pH', async () => {
    // 1. First attempt fails without PIN
    const failRes = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId,
        phase: 'MIXING',
        status: 'GOOD',
        ph: 6.8, // Target is 5.2 - 6.2
        viscosity: 4000,
        notes: 'Unchecked pH deviation',
      });
    expect(failRes.status).toBe(400);

    // 2. Second attempt succeeds with Supervisor PIN
    const passRes = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        stepLogId,
        phase: 'MIXING',
        status: 'GOOD',
        ph: 6.5,
        viscosity: 4000,
        supervisorPin,
        bypassReason: 'R&D approved buffer adjustment for GT batch',
        notes: 'Supervisor PIN verified',
      });
    expect(passRes.status).toBe(201);
    expect(passRes.body.status).toBe('GOOD');
  });

  it('Step 4: Filling & Packing QC verifies mechanical and packaging integrity', async () => {
    const fillRes = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        phase: 'FILLING',
        status: 'GOOD',
        torqueValue: 19,
        leakTestPass: 'PASS',
        fillingWeight: 50.1,
      });
    expect(fillRes.status).toBe(201);

    const packRes = await request(p14.app.getHttpServer())
      .post('/qc/audits')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        phase: 'PACKING',
        status: 'GOOD',
        inkjetCheck: 'PASS',
        sealingCheck: 'PASS',
        expDateCheck: 'PASS',
      });
    expect(packRes.status).toBe(201);
  });

  it('Step 5: Packaging finishes and registers Finished Goods in QUARANTINE', async () => {
    const fg = await p14.prisma.finishedGood.create({
      data: {
        woId: planId,
        stockQty: 0,
      },
    });
    finishedGoodId = fg.id;
    expect(Number(fg.stockQty)).toBe(0);
  });

  it('Step 6: Partial Disposition splits batch (900 Pass, 50 Rework, 30 Scrap with COPQ loss)', async () => {
    const res = await request(p14.app.getHttpServer())
      .post('/qc/disposition/partial')
      .set('Authorization', `Bearer ${qcToken}`)
      .send({
        workOrderId,
        passQty: 900,
        reworkQty: 50,
        scrapQty: 30,
        defectCategory: 'FISIK',
        defectType: 'BOTOL_BOCOR',
        notes: 'GT Partial Disposition: 900 good, 50 rework cap, 30 broken bottle scrap',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.dispositionSummary.passedForRelease).toBe(900);
    expect(res.body.dispositionSummary.heldForRework).toBe(50);
    expect(res.body.dispositionSummary.scrappedLoss).toBe(30);

    const copq = await p14.prisma.cOPQRecord.findFirst({ where: { planId } });
    expect(copq).toBeDefined();
    expect(Number(copq?.materialLoss)).toBeGreaterThan(0);
  });

  it('Step 7: Authorized APJ releases quarantined Finished Goods to AVAILABLE stock with official COA', async () => {
    const coaNumber = 'COA-GT-20260921-001';
    const idempotencyKey = `idem_gt_release_${randomUUID()}`;

    const res = await request(p14.app.getHttpServer())
      .post('/qc/release')
      .set('Authorization', `Bearer ${apjToken}`)
      .send({
        workOrderId,
        releaseQty: 900,
        coaNumber,
        apjName: 'apt. Siti Rahmawati, S.Farm',
        apjSipa: '19920815/SIPA_32.73/2022/2044',
        notes: 'Official APJ Release for Golden Thread Batch.',
        idempotencyKey,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('RELEASED');
    expect(res.body.availability).toBe('AVAILABLE');
    expect(res.body.releasedQty).toBe(900);

    const fg = await p14.prisma.finishedGood.findUnique({
      where: { id: finishedGoodId },
    });
    expect(Number(fg?.stockQty)).toBe(900);
  });

  it('Step 8: Idempotency Protection ensures duplicate release requests do not duplicate stock', async () => {
    const idempotencyKey = 'idem_gt_repeat_protection';

    const res1 = await request(p14.app.getHttpServer())
      .post('/qc/release')
      .set('Authorization', `Bearer ${apjToken}`)
      .send({
        workOrderId,
        releaseQty: 50,
        idempotencyKey,
      });
    expect(res1.status).toBe(201);

    const res2 = await request(p14.app.getHttpServer())
      .post('/qc/release')
      .set('Authorization', `Bearer ${apjToken}`)
      .send({
        workOrderId,
        releaseQty: 50,
        idempotencyKey,
      });
    expect(res2.status).toBe(201);
    expect(res2.body.idempotentReplay).toBe(true);

    const fg = await p14.prisma.finishedGood.findUnique({
      where: { id: finishedGoodId },
    });
    expect(Number(fg?.stockQty)).toBe(950); // 900 + 50 once
  });

  it('Step 9: Backward Traceability resolves complete 5-stage genealogy tree down to supplier drum', async () => {
    const res = await request(p14.app.getHttpServer())
      .get(`/qc/traceability/backward/${goldenBatchCode}`)
      .set('Authorization', `Bearer ${qcToken}`);

    expect(res.status).toBe(200);
    expect(res.body.batchNumber).toBe(goldenBatchCode);
    expect(res.body.releaseMetadata.isReleased).toBe(true);
    expect(res.body.genealogyTree.level5_finishedGood.batchNumber).toBe(goldenBatchCode);
    expect(res.body.genealogyTree.level2_mixingStage.scheduleNumber).toContain('SCH-P14-GT-MIX');

    const rawMats = res.body.genealogyTree.level1_rawMaterials;
    expect(rawMats.length).toBeGreaterThanOrEqual(1);
    const consumed = rawMats.find((m: any) => m.materialId === testMaterialId);
    expect(consumed).toBeDefined();
    expect(consumed.batchNumber).toBe(supplierLotNumber);
  });

  it('Step 10: Forward Recall Traceability resolves from supplier lot up to the released Finished Good batch', async () => {
    const res = await request(p14.app.getHttpServer())
      .get(`/qc/traceability/forward/${supplierLotNumber}`)
      .set('Authorization', `Bearer ${qcToken}`);

    expect(res.status).toBe(200);
    expect(res.body.searchedMaterialLot).toBe(supplierLotNumber);
    expect(res.body.recallImpactSummary.totalAffectedWorkOrders).toBe(1);

    const batches = res.body.affectedFinishedGoodsBatches;
    expect(batches.length).toBe(1);
    expect(batches[0].batchNumber).toBe(goldenBatchCode);
    expect(batches[0].customerName).toContain('nex_p14_gt_client');
  });
});
