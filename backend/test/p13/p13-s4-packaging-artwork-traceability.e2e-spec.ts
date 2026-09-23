import request from 'supertest';
import { bootP13App, P13App, p13Message } from './p13-http-harness';
import { randomUUID } from 'crypto';

describe('P13-S4: Packaging Execution (Artwork Interlock & Quarantined FG Handover)', () => {
  let p13: P13App;
  let operatorToken: string;

  let testLeadId: string;
  let testStaffId: string;
  let workOrderId: string;
  let machineId: string;
  let packagingScheduleId: string;
  let packagingMaterialId: string;
  let fillingScheduleId: string;
  let designTaskId: string;

  beforeAll(async () => {
    p13 = await bootP13App();

    const operator = await p13.createUser('PACKAGING_OP_S4', ['SUPER_ADMIN', 'PRODUCTION_OPERATOR']);
    operatorToken = operator.token;

    const staff = await p13.createStaff('nex_p13_s4_staff');
    testStaffId = staff.id;

    // Machine
    const machine = await p13.prisma.machine.create({
      data: {
        name: `nex_p13_s4_packer_${randomUUID().slice(0, 8)}`,
        type: 'PACKING_MACHINE' as any,
        capacityPerBatch: 1000,
        costPerHour: 40000,
      },
    });
    machineId = machine.id;

    // Lead & Work Order
    const lead = await p13.prisma.salesLead.create({
      data: {
        clientName: `nex_p13_s4_client_${randomUUID().slice(0, 8)}`,
        contactInfo: '08123456786',
        source: 'DIRECT',
        productInterest: 'Luxury Face Oil',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    // Design task in PENDING / not approved state initially
    const dt = await p13.prisma.designTask.create({
      data: {
        leadId: testLeadId,
        brief: 'nex_p13_s4_label_design',
        isFinal: false,
        kanbanState: 'IN_PROGRESS',
      },
    });
    designTaskId = dt.id;

    const wo = await p13.prisma.workOrder.create({
      data: {
        woNumber: `WO-P13-S4-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 500,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
    workOrderId = wo.id;

    // Packaging material (boxes/labels)
    const pMat = await p13.prisma.materialItem.create({
      data: {
        name: `nex_p13_s4_box_${randomUUID().slice(0, 8)}`,
        code: `BOX-P13-S4-${randomUUID().slice(0, 6)}`,
        type: 'PACKAGING' as any,
        unit: 'PCS',
        unitPrice: 3500,
        minLevel: 100,
        maxLevel: 10000,
        reorderPoint: 500,
        stockQty: 1000,
      },
    });
    packagingMaterialId = pMat.id;

    // Filling schedule COMPLETED (predecessor stage)
    const fillSch = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-FILL-S4-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'FILLING' as any,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
        targetQty: 500,
        resultQty: 500,
        status: 'COMPLETED',
      },
    });
    fillingScheduleId = fillSch.id;

    // Packaging schedule
    const packSch = await p13.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P13-PACK-S4-${randomUUID().slice(0, 6)}`,
        workOrderId,
        machineId,
        stage: 'PACKING' as any,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        targetQty: 500,
        status: 'SCHEDULED',
      },
    });
    packagingScheduleId = packSch.id;

    // Step detail for packaging box
    await p13.prisma.productionStepDetail.create({
      data: {
        scheduleId: packagingScheduleId,
        materialId: packagingMaterialId,
        category: 'KEMASAN_SEKUNDER',
        qtyTheoretical: 500,
        qtyActual: 500,
      },
    });
  });

  afterAll(async () => {
    if (workOrderId) {
      await p13.prisma.finishedGood.deleteMany({ where: { woId: workOrderId } });
      await p13.prisma.productionLog.deleteMany({ where: { workOrderId } });
    }
    if (packagingScheduleId) {
      await p13.prisma.productionStepDetail.deleteMany({ where: { scheduleId: packagingScheduleId } });
    }
    const schedIds = [fillingScheduleId, packagingScheduleId].filter(Boolean);
    if (schedIds.length > 0) {
      await p13.prisma.productionSchedule.deleteMany({ where: { id: { in: schedIds } } });
    }
    if (workOrderId) {
      await p13.prisma.workOrder.deleteMany({ where: { id: workOrderId } });
    }
    if (packagingMaterialId) {
      await p13.prisma.inventoryTransaction.deleteMany({ where: { materialId: packagingMaterialId } });
      await p13.prisma.materialInventory.deleteMany({ where: { materialId: packagingMaterialId } });
      await p13.prisma.materialItem.deleteMany({ where: { id: packagingMaterialId } });
    }
    if (designTaskId) {
      await p13.prisma.designTask.deleteMany({ where: { id: designTaskId } });
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

  it('BUS-RULE-034: Packaging blocked when Artwork has not been APPROVED by Legal', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${packagingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 500,
        notes: 'Attempting packaging with unapproved artwork',
      });

    expect(res.status).toBe(400);
    expect(p13Message(res)).toMatch(/ARTWORK_NOT_APPROVED|Artwork belum APPROVED/i);
  });

  it('Legal/Regulatory approves packaging artwork', async () => {
    // Approve design task
    await p13.prisma.designTask.update({
      where: { id: designTaskId },
      data: {
        isFinal: true,
        isLocked: true,
        kanbanState: 'LOCKED',
      },
    });

    const updated = await p13.prisma.designTask.findUnique({ where: { id: designTaskId } });
    expect(updated?.isFinal).toBe(true);
  });

  it('BUS-RULE-035 & BUS-RULE-037: Packaging completes, creates Finished Goods in QUARANTINE and returns traceability data', async () => {
    const res = await request(p13.app.getHttpServer())
      .post(`/production/schedules/${packagingScheduleId}/result`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        resultQty: 495,
        notes: 'Packaging finished: 495 pcs FG packed, 5 pcs reject cartons',
        elapsedSeconds: 3600,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.resultQty).toBe(495);

    // BUS-RULE-035: Traceability composite data
    expect(res.body.qrCodeData).toBeDefined();
    expect(res.body.qrCodeData.status).toBe('QUARANTINE');
    expect(res.body.qrCodeData.availableQty).toBe(0);
    expect(res.body.qrCodeData.traceability.stage).toBe('PACKAGING');

    // BUS-RULE-037: Finished Goods record exists in QUARANTINE with stockQty = 495
    const fg = await p13.prisma.finishedGood.findFirst({
      where: { woId: workOrderId },
    });
    expect(fg).toBeDefined();
    expect(Number(fg?.stockQty)).toBe(495);
  });
});
