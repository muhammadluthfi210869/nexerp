import request from 'supertest';
import { bootP12App, P12App, p12Message } from './p12-http-harness';
import { randomUUID } from 'crypto';

describe('P12-S3: Machine Capacity, Schedule Collision & Stage Precedence (AC-P12-03)', () => {
  let p12: P12App;
  let ppicToken: string;
  let testLeadId: string;
  let testWorkOrderId: string;
  let mixerMachineId: string;
  let fillerMachineId: string;
  let testStaffId: string;

  beforeAll(async () => {
    p12 = await bootP12App();

    const ppicUser = await p12.createUser('PPIC_S3', ['SUPER_ADMIN']);
    ppicToken = ppicUser.token;

    const staff = await p12.createStaff();
    testStaffId = staff.id;

    // Create test lead
    const lead = await p12.prisma.salesLead.create({
      data: {
        clientName: `nex_p12_client_s3_${randomUUID().slice(0, 8)}`,
        contactInfo: '081299991203',
        source: 'DIRECT',
        productInterest: 'Hydrating Cream',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    // Create WorkOrder
    const wo = await p12.prisma.workOrder.create({
      data: {
        woNumber: `WO-P12-S3-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        stage: 'WAITING_MATERIAL',
      },
    });
    testWorkOrderId = wo.id;

    // Create Mixer machine with 2000 capacity
    const mixer = await p12.prisma.machine.create({
      data: {
        name: `nex_p12_mixer_s3_${randomUUID().slice(0, 8)}`,
        type: 'MIXING_MACHINE',
        capacityPerBatch: 2000,
        costPerHour: 150000,
        isActive: true,
      },
    });
    mixerMachineId = mixer.id;

    // Create Filler machine with 5000 capacity
    const filler = await p12.prisma.machine.create({
      data: {
        name: `nex_p12_filler_s3_${randomUUID().slice(0, 8)}`,
        type: 'FILLING_MACHINE',
        capacityPerBatch: 5000,
        costPerHour: 200000,
        isActive: true,
      },
    });
    fillerMachineId = filler.id;
  });

  afterAll(async () => {
    await p12.prisma.productionStepDetail.deleteMany({
      where: { schedule: { workOrderId: testWorkOrderId } },
    });
    await p12.prisma.productionSchedule.deleteMany({
      where: { workOrderId: testWorkOrderId },
    });
    await p12.prisma.workOrder.deleteMany({
      where: { id: testWorkOrderId },
    });
    await p12.prisma.machine.deleteMany({
      where: { id: { in: [mixerMachineId, fillerMachineId] } },
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

  it('rejects schedule creation if targetQty exceeds machine capacity', async () => {
    const res = await request(p12.app.getHttpServer())
      .post('/production/schedules')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        workOrderId: testWorkOrderId,
        machineId: mixerMachineId,
        stage: 'MIXING',
        startTime: '2026-10-01T08:00:00.000Z',
        endTime: '2026-10-01T12:00:00.000Z',
        targetQty: 3500, // Exceeds 2000 capacity
      });

    expect(res.status).toBe(400);
    expect(p12Message(res)).toContain('MACHINE_CAPACITY_EXCEEDED');
  });

  it('creates valid Mixing schedule within capacity and time window', async () => {
    const res = await request(p12.app.getHttpServer())
      .post('/production/schedules')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        workOrderId: testWorkOrderId,
        machineId: mixerMachineId,
        stage: 'MIXING',
        startTime: '2026-10-01T08:00:00.000Z',
        endTime: '2026-10-01T12:00:00.000Z',
        targetQty: 1000,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.stage).toBe('MIXING');
    expect(res.body.status).toBe('SCHEDULED');
  });

  it('rejects overlapping schedule on the same machine with 409 SCHEDULE_COLLISION', async () => {
    // Attempt overlap: 10:00 - 14:00 overlaps with existing 08:00 - 12:00
    const res = await request(p12.app.getHttpServer())
      .post('/production/schedules')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        workOrderId: testWorkOrderId,
        machineId: mixerMachineId,
        stage: 'MIXING',
        startTime: '2026-10-01T10:00:00.000Z',
        endTime: '2026-10-01T14:00:00.000Z',
        targetQty: 1000,
      });

    expect(res.status).toBe(409);
    expect(p12Message(res)).toContain('SCHEDULE_COLLISION');
  });

  it('rejects scheduling FILLING before MIXING finishes (Stage Order Violation)', async () => {
    // Mixing finishes at 12:00. Attempting Filling at 11:00
    const res = await request(p12.app.getHttpServer())
      .post('/production/schedules')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        workOrderId: testWorkOrderId,
        machineId: fillerMachineId,
        stage: 'FILLING',
        startTime: '2026-10-01T11:00:00.000Z',
        endTime: '2026-10-01T15:00:00.000Z',
        targetQty: 1000,
      });

    expect(res.status).toBe(400);
    expect(p12Message(res)).toContain('STAGE_ORDER_VIOLATION');
  });

  it('allows scheduling FILLING after MIXING finishes', async () => {
    const res = await request(p12.app.getHttpServer())
      .post('/production/schedules')
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        workOrderId: testWorkOrderId,
        machineId: fillerMachineId,
        stage: 'FILLING',
        startTime: '2026-10-01T13:00:00.000Z',
        endTime: '2026-10-01T17:00:00.000Z',
        targetQty: 1000,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.stage).toBe('FILLING');
  });
});
