import request from 'supertest';
import { bootP12App, P12App, p12Message } from './p12-http-harness';
import { randomUUID } from 'crypto';

describe('P12 Golden Thread: Full End-to-End Production Planning & Dispatch', () => {
  let p12: P12App;
  let ppicToken: string;
  let testLeadId: string;
  let testMaterialId: string;
  let testSampleId: string;
  let testFormulaId: string;
  let salesOrderId: string;
  let mixerMachineId: string;
  let fillerMachineId: string;
  let createdWorkOrderId: string;
  let createdMixingScheduleId: string;
  let testStaffId: string;

  beforeAll(async () => {
    p12 = await bootP12App();

    const ppicUser = await p12.createUser('PPIC_GOLDEN', ['SUPER_ADMIN']);
    ppicToken = ppicUser.token;

    const staff = await p12.createStaff();
    testStaffId = staff.id;

    // 1. Lead & Sample & Formula setup
    const lead = await p12.prisma.salesLead.create({
      data: {
        clientName: `nex_p12_client_gt_${randomUUID().slice(0, 8)}`,
        contactInfo: '081299991206',
        source: 'DIRECT',
        productInterest: 'Anti-Aging Serum',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    // Raw material
    const mat = await p12.prisma.materialItem.create({
      data: {
        name: `nex_p12_mat_gt_${randomUUID().slice(0, 8)}`,
        code: `MAT-P12-GT-${randomUUID().slice(0, 6)}`,
        type: 'RAW_MATERIAL',
        unit: 'KG',
        unitPrice: 75000,
        minLevel: 10,
        maxLevel: 1000,
        reorderPoint: 50,
        stockQty: 50, // Initially limited
      },
    });
    testMaterialId = mat.id;

    const sample = await p12.prisma.sampleRequest.create({
      data: {
        sampleCode: `SMP-P12-GT-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        productName: `nex_p12_sample_gt`,
        targetFunction: 'Moisturizing',
        textureReq: 'Cream',
        colorReq: 'White',
        aromaReq: 'Rose',
      },
    });
    testSampleId = sample.id;

    const formula = await p12.prisma.formula.create({
      data: {
        formulaCode: `FOR-P12-GT-${randomUUID().slice(0, 6)}`,
        sampleRequestId: testSampleId,
        version: 1,
        targetYieldGram: 100,
        status: 'PRODUCTION_LOCKED',
        phases: {
          create: [
            {
              prefix: 'A',
              customName: 'Phase A - Active',
              order: 1,
              items: {
                create: [
                  {
                    materialId: testMaterialId,
                    dosagePercentage: 10.0,
                  },
                ],
              },
            },
          ],
        },
      },
    });
    testFormulaId = formula.id;

    // SO with ACTIVE (1000 pcs)
    const so = await p12.prisma.salesOrder.create({
      data: {
        orderNumber: `SO-P12-GT-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        sampleId: testSampleId,
        quantity: 1000,
        totalAmount: 75000000,
        status: 'ACTIVE',
      },
    });
    salesOrderId = so.id;

    // Machines
    const mixer = await p12.prisma.machine.create({
      data: {
        name: `nex_p12_mixer_gt_${randomUUID().slice(0, 8)}`,
        type: 'MIXING_MACHINE',
        capacityPerBatch: 2500,
        costPerHour: 180000,
        isActive: true,
      },
    });
    mixerMachineId = mixer.id;

    const filler = await p12.prisma.machine.create({
      data: {
        name: `nex_p12_filler_gt_${randomUUID().slice(0, 8)}`,
        type: 'FILLING_MACHINE',
        capacityPerBatch: 5000,
        costPerHour: 220000,
        isActive: true,
      },
    });
    fillerMachineId = filler.id;
  });

  afterAll(async () => {
    if (createdWorkOrderId) {
      await p12.prisma.productionStepDetail.deleteMany({
        where: { schedule: { workOrderId: createdWorkOrderId } },
      });
      await p12.prisma.productionSchedule.deleteMany({
        where: { workOrderId: createdWorkOrderId },
      });
      await p12.prisma.materialRequisition.deleteMany({
        where: { workOrderId: createdWorkOrderId },
      });
      await p12.prisma.workOrder.deleteMany({
        where: { id: createdWorkOrderId },
      });
    }
    await p12.prisma.productionPlan.deleteMany({
      where: { soId: salesOrderId },
    });
    await p12.prisma.salesOrder.deleteMany({
      where: { id: salesOrderId },
    });
    await p12.prisma.formulaItem.deleteMany({
      where: { materialId: testMaterialId },
    });
    await p12.prisma.formulaPhase.deleteMany({
      where: { formulaId: testFormulaId },
    });
    await p12.prisma.formula.deleteMany({
      where: { id: testFormulaId },
    });
    await p12.prisma.sampleRequest.deleteMany({
      where: { id: testSampleId },
    });
    await p12.prisma.machine.deleteMany({
      where: { id: { in: [mixerMachineId, fillerMachineId] } },
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

  it('Step 1: Ingests demand from approved SO and generates Work Order with exploded BOM', async () => {
    const res = await request(p12.app.getHttpServer())
      .post('/production/work-orders/from-so')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({ salesOrderId });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.stage).toBe('WAITING_MATERIAL');
    createdWorkOrderId = res.body.id;

    // Requirement: (10% / 100) * 100g yield * 1000 = 10,000g
    expect(res.body.requisitions).toHaveLength(1);
    expect(Number(res.body.requisitions[0].qtyRequested)).toBe(10000);
  });

  it('Step 2: Performs material readiness check and verifies stock availability', async () => {
    // Stock is 50, but requirement is 10000. Shortage expected!
    const shortageRes = await request(p12.app.getHttpServer())
      .get(`/production/work-orders/${createdWorkOrderId}/readiness`)
      .set('Authorization', `Bearer ${ppicToken}`);

    expect(shortageRes.status).toBe(200);
    expect(shortageRes.body.isReady).toBe(false);
    expect(shortageRes.body.shortagesCount).toBe(1);

    // Warehouse receives shipment of materials -> stock increases to 15,000
    await p12.prisma.materialItem.update({
      where: { id: testMaterialId },
      data: { stockQty: 15000 },
    });

    // Re-check readiness: now ready!
    const readyRes = await request(p12.app.getHttpServer())
      .get(`/production/work-orders/${createdWorkOrderId}/readiness`)
      .set('Authorization', `Bearer ${ppicToken}`);

    expect(readyRes.status).toBe(200);
    expect(readyRes.body.isReady).toBe(true);
    expect(readyRes.body.readinessPercent).toBe(100);
  });

  it('Step 3: Creates Mixing schedule and enforces machine collision interlock', async () => {
    // Create Mixing schedule
    const mixRes = await request(p12.app.getHttpServer())
      .post('/production/schedule-mixing')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        workOrderId: createdWorkOrderId,
        machineId: mixerMachineId,
        startTime: '2026-10-10T08:00:00.000Z',
        endTime: '2026-10-10T12:00:00.000Z',
        target_pcs: 1000,
      });

    expect(mixRes.status).toBe(201);
    expect(mixRes.body.stage).toBe('MIXING');
    createdMixingScheduleId = mixRes.body.id;

    // Collision check: attempting overlapping schedule on mixer
    const collisionRes = await request(p12.app.getHttpServer())
      .post('/production/schedule-mixing')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        workOrderId: createdWorkOrderId,
        machineId: mixerMachineId,
        startTime: '2026-10-10T10:00:00.000Z',
        endTime: '2026-10-10T14:00:00.000Z',
        target_pcs: 1000,
      });

    expect(collisionRes.status).toBe(409);
    expect(p12Message(collisionRes)).toContain('SCHEDULE_COLLISION');
  });

  it('Step 4: Schedules downstream Filling stage respecting chronological stage precedence', async () => {
    const fillRes = await request(p12.app.getHttpServer())
      .post('/production/schedule-filling')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        workOrderId: createdWorkOrderId,
        machineId: fillerMachineId,
        startTime: '2026-10-10T13:00:00.000Z',
        endTime: '2026-10-10T17:00:00.000Z',
        target_pcs: 1000,
      });

    expect(fillRes.status).toBe(201);
    expect(fillRes.body.stage).toBe('FILLING');
  });

  it('Step 5: Reschedules stage with mandatory reason and logs audit record', async () => {
    const res = await request(p12.app.getHttpServer())
      .patch(`/production/schedules/${createdMixingScheduleId}/reschedule`)
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        startTime: '2026-10-10T07:00:00.000Z',
        endTime: '2026-10-10T11:00:00.000Z',
        reason: 'Shift alignment for Golden Thread batch',
      });

    expect(res.status).toBe(200);
    expect(res.body.notes).toContain('Rescheduled: Shift alignment for Golden Thread batch');
  });

  it('Step 6: Idempotently dispatches Work Order to the production floor', async () => {
    // 1st dispatch
    const res1 = await request(p12.app.getHttpServer())
      .post(`/production/work-orders/${createdWorkOrderId}/dispatch`)
      .set('Authorization', `Bearer ${ppicToken}`);

    expect(res1.status).toBe(201);
    expect(res1.body.dispatched).toBe(true);
    expect(res1.body.stage).toBe('READY_TO_PRODUCE');

    // 2nd dispatch (Idempotency assertion)
    const res2 = await request(p12.app.getHttpServer())
      .post(`/production/work-orders/${createdWorkOrderId}/dispatch`)
      .set('Authorization', `Bearer ${ppicToken}`);

    expect(res2.status).toBe(201);
    expect(res2.body.dispatched).toBe(true);
    expect(res2.body.message).toContain('idempotent');
  });
});
