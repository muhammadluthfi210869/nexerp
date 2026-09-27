import request from 'supertest';
import { bootP12App, P12App, p12Message } from './p12-http-harness';
import { randomUUID } from 'crypto';

describe('P12-S4: Rescheduling Lifecycle & Audit Trail (AC-P12-04)', () => {
  let p12: P12App;
  let ppicToken: string;
  let testLeadId: string;
  let testWorkOrderId: string;
  let testMachineId: string;
  let schedule1Id: string;
  let schedule2Id: string;
  let testStaffId: string;

  beforeAll(async () => {
    p12 = await bootP12App();

    const ppicUser = await p12.createUser('PPIC_S4', ['SUPER_ADMIN']);
    ppicToken = ppicUser.token;

    const staff = await p12.createStaff();
    testStaffId = staff.id;

    // Create test lead
    const lead = await p12.prisma.salesLead.create({
      data: {
        clientName: `nex_p12_client_s4_${randomUUID().slice(0, 8)}`,
        contactInfo: '081299991204',
        source: 'DIRECT',
        productInterest: 'Sunscreen Gel',
        picId: testStaffId,
      },
    });
    testLeadId = lead.id;

    // Create WorkOrder
    const wo = await p12.prisma.workOrder.create({
      data: {
        woNumber: `WO-P12-S4-${randomUUID().slice(0, 6)}`,
        leadId: testLeadId,
        targetQty: 1000,
        targetCompletion: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        stage: 'WAITING_MATERIAL',
      },
    });
    testWorkOrderId = wo.id;

    // Create Machine
    const machine = await p12.prisma.machine.create({
      data: {
        name: `nex_p12_machine_s4_${randomUUID().slice(0, 8)}`,
        type: 'MIXING_MACHINE',
        capacityPerBatch: 5000,
        costPerHour: 150000,
        isActive: true,
      },
    });
    testMachineId = machine.id;

    // Create Schedule 1: 08:00 - 12:00
    const s1 = await p12.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P12-S4-1-${randomUUID().slice(0, 6)}`,
        workOrderId: testWorkOrderId,
        machineId: testMachineId,
        stage: 'MIXING',
        startTime: new Date('2026-10-05T08:00:00.000Z'),
        endTime: new Date('2026-10-05T12:00:00.000Z'),
        targetQty: 1000,
        status: 'SCHEDULED',
      },
    });
    schedule1Id = s1.id;

    // Create Schedule 2: 14:00 - 18:00
    const s2 = await p12.prisma.productionSchedule.create({
      data: {
        scheduleNumber: `SCH-P12-S4-2-${randomUUID().slice(0, 6)}`,
        workOrderId: testWorkOrderId,
        machineId: testMachineId,
        stage: 'MIXING',
        startTime: new Date('2026-10-05T14:00:00.000Z'),
        endTime: new Date('2026-10-05T18:00:00.000Z'),
        targetQty: 1000,
        status: 'SCHEDULED',
      },
    });
    schedule2Id = s2.id;
  });

  afterAll(async () => {
    await p12.prisma.productionSchedule.deleteMany({
      where: { id: { in: [schedule1Id, schedule2Id] } },
    });
    await p12.prisma.workOrder.deleteMany({
      where: { id: testWorkOrderId },
    });
    await p12.prisma.machine.deleteMany({
      where: { id: testMachineId },
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

  it('rejects reschedule if change reason is missing or empty', async () => {
    const res = await request(p12.app.getHttpServer())
      .patch(`/production/schedules/${schedule1Id}/reschedule`)
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        startTime: '2026-10-05T09:00:00.000Z',
        endTime: '2026-10-05T13:00:00.000Z',
        reason: '', // Empty reason
      });

    expect(res.status).toBe(400);
    expect(p12Message(res)).toContain('reason is mandatory');
  });

  it('rejects reschedule that collides with another schedule on the machine', async () => {
    // Try to reschedule Schedule 1 to 15:00 - 19:00, which overlaps with Schedule 2 (14:00 - 18:00)
    const res = await request(p12.app.getHttpServer())
      .patch(`/production/schedules/${schedule1Id}/reschedule`)
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        startTime: '2026-10-05T15:00:00.000Z',
        endTime: '2026-10-05T19:00:00.000Z',
        reason: 'Shift adjustment',
      });

    expect(res.status).toBe(409);
    expect(p12Message(res)).toContain('SCHEDULE_COLLISION');
  });

  it('successfully reschedules when window is clear and updates audit trail notes', async () => {
    const res = await request(p12.app.getHttpServer())
      .patch(`/production/schedules/${schedule1Id}/reschedule`)
      .set('Authorization', `Bearer ${ppicToken}`)
      .send({
        startTime: '2026-10-05T07:00:00.000Z',
        endTime: '2026-10-05T11:00:00.000Z',
        reason: 'Early morning batch allocation by PPIC',
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(schedule1Id);
    expect(new Date(res.body.startTime).toISOString()).toBe('2026-10-05T07:00:00.000Z');
    expect(new Date(res.body.endTime).toISOString()).toBe('2026-10-05T11:00:00.000Z');
    expect(res.body.notes).toContain('Rescheduled: Early morning batch allocation by PPIC');
  });
});
