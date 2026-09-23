import request from 'supertest';
import { UserRole, TicketType, FundRequestStatus } from '@prisma/client';
import { bootP16App, P16App, p16Message } from './p16-http-harness';

describe('P16 S3: Attendance, Geofencing, Tickets & Reimbursement Auto-Disbursement (BUS-RULE-075)', () => {
  let p16: P16App;
  let hrToken: string;
  let hrUserId: string;
  let employeeId: string;

  beforeAll(async () => {
    p16 = await bootP16App();
    await p16.cleanupP16Data();

    const hrUser = await p16.createUser('HR_Attendance', [UserRole.SUPER_ADMIN, UserRole.HR]);
    hrToken = hrUser.token;
    hrUserId = hrUser.user.id;

    // Ensure factory coordinates in systemConfig
    await p16.prisma.systemConfig.upsert({
      where: { key: 'FACTORY_LAT' },
      update: { value: '-6.2088' },
      create: { key: 'FACTORY_LAT', value: '-6.2088', group: 'SYSTEM' },
    });
    await p16.prisma.systemConfig.upsert({
      where: { key: 'FACTORY_LNG' },
      update: { value: '106.8456' },
      create: { key: 'FACTORY_LNG', value: '106.8456', group: 'SYSTEM' },
    });
    await p16.prisma.systemConfig.upsert({
      where: { key: 'WORK_START_HOUR' },
      update: { value: '23' },
      create: { key: 'WORK_START_HOUR', value: '23', group: 'SYSTEM' },
    });

    const emp = await p16.prisma.employee.create({
      data: {
        nik: 'P16_EMP_ATTENDANCE',
        name: 'P16 Attendance Worker',
        joinedAt: new Date(),
        baseSalary: 'vault_enc_dummy',
        userId: hrUserId,
      },
    });
    employeeId = emp.id;
  });

  afterAll(async () => {
    await p16.cleanupP16Data();
    await p16.app.close();
  });

  it('S3.1 - Records attendance with GPS coordinates inside factory radius', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/attendance/clock-in')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
        lat: -6.2088,
        lng: 106.8456,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.employeeId).toBe(employeeId);
    expect(res.body.status).toBe('ON_TIME');
  });

  it('S3.2 - Blocks duplicate clock-in if already clocked in today', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/attendance/clock-in')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
        lat: -6.2088,
        lng: 106.8456,
      })
      .expect(400);

    expect(p16Message(res)).toContain('Already clocked in today');
  });

  it('S3.3 - Clocks out successfully and completes attendance record', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/attendance/clock-out')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.clockOut).toBeDefined();
  });

  it('S3.4 - Prevents clock-in when employee is on approved LEAVE', async () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Create and approve a leave ticket
    const leaveTicket = await p16.prisma.ticket.create({
      data: {
        employeeId,
        type: 'LEAVE',
        reason: 'Family Emergency Leave',
        startDate: today,
        endDate: tomorrow,
        status: 'APPROVED',
        authorizedById: hrUserId,
      },
    });

    const res = await request(p16.app.getHttpServer())
      .post('/hr/attendance/clock-in')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
        lat: -6.2088,
        lng: 106.8456,
      })
      .expect(403);

    expect(p16Message(res)).toContain('Employee is on approved leave');

    // Clean up leave ticket so subsequent tests are clean
    await p16.prisma.ticket.delete({ where: { id: leaveTicket.id } });
  });

  it('S3.5 - Approves REIMBURSE ticket and automatically triggers Finance FundRequest (BUS-RULE-075)', async () => {
    // 1. Create a REIMBURSE ticket
    const createRes = await request(p16.app.getHttpServer())
      .post('/hr/tickets')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
        type: TicketType.REIMBURSE,
        reason: 'Client site transport taxi expense',
        startDate: new Date().toISOString(),
        amount: '175000',
      })
      .expect(201);

    const ticketId = createRes.body.id;
    expect(createRes.body.status).toBe('PENDING');

    // 2. Approve ticket
    const approveRes = await request(p16.app.getHttpServer())
      .patch(`/hr/tickets/${ticketId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        authorizedById: hrUserId,
      })
      .expect(200);

    expect(approveRes.body.status).toBe('APPROVED');

    // 3. Verify that Finance FundRequest was automatically created with status WAITING_FINANCE_DISBURSEMENT
    const fundReq = await p16.prisma.fundRequest.findFirst({
      where: {
        reason: { contains: ticketId },
      },
    });

    expect(fundReq).toBeDefined();
    expect(fundReq?.status).toBe(FundRequestStatus.WAITING_FINANCE_DISBURSEMENT);
    expect(Number(fundReq?.amount)).toBe(175000);

    // Teardown fund request
    if (fundReq) {
      await p16.prisma.fundRequest.delete({ where: { id: fundReq.id } });
    }
  });
});
