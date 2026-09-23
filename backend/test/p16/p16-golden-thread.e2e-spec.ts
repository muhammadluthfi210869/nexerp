import request from 'supertest';
import { UserRole, LogActivityType, Division } from '@prisma/client';
import { bootP16App, P16App } from './p16-http-harness';

describe('P16 Golden Thread: Candidate ATS -> Hire -> Onboarding/Training -> Attendance -> Kasbon -> KPI -> Comprehensive Payroll & Slip Gaji', () => {
  let p16: P16App;
  let hrToken: string;
  let hrUserId: string;
  const goldenPeriod = '2026-10';

  beforeAll(async () => {
    p16 = await bootP16App();
    await p16.cleanupP16Data();

    const hrUser = await p16.createUser('HR_Director', [UserRole.SUPER_ADMIN, UserRole.HR]);
    hrToken = hrUser.token;
    hrUserId = hrUser.user.id;

    // Set factory coordinates
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

    // Ensure financial period exists
    await p16.prisma.financialPeriod.upsert({
      where: { name: goldenPeriod },
      update: {},
      create: {
        name: goldenPeriod,
        startDate: new Date('2026-10-01T00:00:00Z'),
        endDate: new Date('2026-10-31T23:59:59Z'),
        status: 'OPEN',
      },
    });
  });

  afterAll(async () => {
    await p16.cleanupP16Data();
    await p16.app.close();
  });

  it('Executes the full HR & People Operations golden lifecycle', async () => {
    // 1. Candidate applies
    const candRes = await request(p16.app.getHttpServer())
      .post('/hr/candidates')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'P16 Golden Candidate',
        department: 'OPERATIONS',
        email: 'p16_golden_applicant@nex-p16.test',
        phone: '081987654321',
        cvUrl: 'https://storage.nexerp.internal/cv/golden.pdf',
        cvReviewScore: 92,
        cvReviewNotes: 'Exceptional candidate with deep enterprise experience',
      })
      .expect(201);

    const candidateId = candRes.body.id;
    expect(candRes.body.stage).toBe('SCREENING');

    // 2. Candidate passes stages to DONE (Accepted)
    for (const stage of ['HR_INTERVIEW', 'USER_INTERVIEW', 'OFFERING', 'DONE']) {
      await request(p16.app.getHttpServer())
        .patch(`/hr/candidates/${candidateId}/stage`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ stage })
        .expect(200);
    }

    // 3. Hire candidate as Employee with encrypted base salary and balanced 100% role weights
    const userAccount = await p16.createUser('GoldenEmployee', [UserRole.PRODUCTION_OP]);
    const empRes = await request(p16.app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        nik: 'P16_GOLDEN_EMP_01',
        name: 'P16 Golden Employee',
        baseSalary: '9000000',
        positionAllowance: '2000000',
        transportFlat: '600000',
        transportTentativeDaily: '40000',
        birthDate: '1995-05-15',
        gender: 'MALE',
        joinedAt: '2026-10-01',
        roles: [
          { division: Division.PRODUCTION, roleName: 'OPERATOR', weight: 0.6 },
          { division: Division.QC, roleName: 'QC_INSPECTOR', weight: 0.4 }, // Sum = 1.0 (100%)
        ],
      })
      .expect(201);

    const employeeId = empRes.body.id;
    expect(empRes.body.name).toBe('P16 Golden Employee');
    expect(empRes.body.roles).toHaveLength(2);

    // Link employee to userAccount for ActivityLog KPI attribution
    await p16.prisma.employee.update({
      where: { id: employeeId },
      data: { userId: userAccount.user.id },
    });

    // 4. Record 3-day onboarding completion & specialized training session
    const trainRes = await request(p16.app.getHttpServer())
      .post(`/hr/employees/${employeeId}/training`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        trainingType: 'Advanced GMP Operations',
        hours: 24,
        goal: 'Comply with international manufacturing cleanroom standards',
        trainingDate: '2026-10-02',
        certificateUrl: 'https://storage.nexerp.internal/certs/golden_gmp.pdf',
      })
      .expect(201);

    expect(trainRes.body.hours).toBe(24);

    // 5. Clock-in attendance
    const clockInRes = await request(p16.app.getHttpServer())
      .post('/hr/attendance/clock-in')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
        lat: -6.2088,
        lng: 106.8456,
      })
      .expect(201);

    expect(clockInRes.body.status).toBe('ON_TIME');

    // 6. Employee requests a Kasbon (Loan)
    const loanRes = await request(p16.app.getHttpServer())
      .post('/hr/loans')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
        totalAmount: 5000000,
        monthlyDeduction: 1250000,
        reason: 'Down payment for work motorcycle',
      })
      .expect(201);

    expect(Number(loanRes.body.totalAmount)).toBe(5000000);
    expect(Number(loanRes.body.remainingBalance)).toBe(5000000);

    // 7. Passive KPI activities created in background
    for (let i = 0; i < 10; i++) {
      await p16.prisma.activityLog.create({
        data: {
          user: { connect: { id: userAccount.user.id } },
          type: LogActivityType.STATE_TRANSITION,
          division: Division.PRODUCTION,
        },
      });
    }

    const kpiMe = await request(p16.app.getHttpServer())
      .get('/kpi/me')
      .set('Authorization', `Bearer ${userAccount.token}`)
      .expect(200);

    expect(kpiMe.body.total).toBe(10);

    // 8. Generate comprehensive monthly payroll
    const payrollRes = await request(p16.app.getHttpServer())
      .post('/hr/payroll/generate')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ period: goldenPeriod })
      .expect(201);

    const payrollPeriodId = payrollRes.body.id;
    const payrollItem = payrollRes.body.items.find((i: any) => i.employeeId === employeeId);

    expect(payrollItem).toBeDefined();
    // Upah tetap
    expect(payrollItem.baseSalary).toBe(9000000);
    expect(payrollItem.positionAllowance).toBe(2000000);
    // Transport
    expect(payrollItem.transportFlat).toBe(600000);
    // Kasbon deduction
    expect(payrollItem.loanDeduction).toBe(1250000);
    expect(payrollItem.remainingLoan).toBe(3750000); // 5,000,000 - 1,250,000 = 3,750,000
    // PPh 21 calculated above UMR
    expect(payrollItem.pph21).toBeGreaterThan(0);

    // 9. Fetch printable Salary Slip (Sleepsalary)
    const slipRes = await request(p16.app.getHttpServer())
      .get(`/hr/payroll/slip/${payrollItem.id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(slipRes.body.employee.name).toBe('P16 Golden Employee');
    expect(slipRes.body.earnings.baseSalary).toBe(9000000);
    expect(slipRes.body.deductions.loanDeduction).toBe(1250000);
    expect(slipRes.body.loanInfo.remainingBalance).toBe(3750000);

    // 10. Final Authorize Payroll Period
    const authRes = await request(p16.app.getHttpServer())
      .post(`/hr/payroll/authorize/${payrollPeriodId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ authorizedById: hrUserId })
      .expect(201);

    expect(authRes.body.status).toBe('AUTHORIZED');
    expect(authRes.body.authorizedById).toBe(hrUserId);
  });
});
