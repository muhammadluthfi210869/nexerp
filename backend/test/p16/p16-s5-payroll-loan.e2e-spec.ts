import request from 'supertest';
import { UserRole, TicketType } from '@prisma/client';
import { bootP16App, P16App, p16Message } from './p16-http-harness';
import { EncryptionService } from '../../src/shared/encryption.service';

describe('P16 S5: Comprehensive Payroll, Kasbon Loans, Transport 2-Col, BPJS & PPh21 (BUS-RULE-117)', () => {
  let p16: P16App;
  let hrToken: string;
  let employeeId: string;
  let lowIncomeEmpId: string;
  let loanId: string;
  const testPeriod = '2026-09';

  beforeAll(async () => {
    p16 = await bootP16App();
    await p16.cleanupP16Data();

    const hrUser = await p16.createUser('HR_Payroll', [UserRole.SUPER_ADMIN, UserRole.HR]);
    hrToken = hrUser.token;

    // Ensure financial period exists
    await p16.prisma.financialPeriod.upsert({
      where: { name: testPeriod },
      update: {},
      create: {
        name: testPeriod,
        startDate: new Date('2026-09-01T00:00:00Z'),
        endDate: new Date('2026-09-30T23:59:59Z'),
        status: 'OPEN',
      },
    });

    const encService = p16.app.get(EncryptionService);

    // 1. High income employee: Base 8,000,000 + Pos 2,000,000 + Transport Flat 500,000 + Transport Tentative 50,000/day
    // Gross Income > 5,000,000 -> PPh21 applied
    const emp1 = await p16.prisma.employee.create({
      data: {
        nik: 'P16_EMP_HIGH_INCOME',
        name: 'P16 Senior Specialist',
        joinedAt: new Date('2026-01-01'),
        baseSalary: encService.encrypt('8000000'),
        positionAllowance: encService.encrypt('2000000'),
        transportFlat: encService.encrypt('500000'),
        transportTentativeDaily: encService.encrypt('50000'),
        isActive: true,
      },
    });
    employeeId = emp1.id;

    // 2. Low income employee: Base 4,000,000 (below UMR 5,000,000) -> PPh21 = 0
    const emp2 = await p16.prisma.employee.create({
      data: {
        nik: 'P16_EMP_LOW_INCOME',
        name: 'P16 Junior Operator',
        joinedAt: new Date('2026-01-01'),
        baseSalary: encService.encrypt('4000000'),
        positionAllowance: encService.encrypt('0'),
        transportFlat: encService.encrypt('200000'),
        transportTentativeDaily: encService.encrypt('20000'),
        isActive: true,
      },
    });
    lowIncomeEmpId = emp2.id;
  });

  afterAll(async () => {
    await p16.cleanupP16Data();
    await p16.app.close();
  });

  it('S5.1 - Creates employee loan (kasbon) with monthly deduction and balance tracking', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/loans')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        employeeId,
        totalAmount: 3000000,
        monthlyDeduction: 1000000,
        reason: 'Family urgent medical assistance',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(Number(res.body.totalAmount)).toBe(3000000);
    expect(Number(res.body.remainingBalance)).toBe(3000000);
    expect(res.body.status).toBe('ACTIVE');
    loanId = res.body.id;
  });

  it('S5.2 - Blocks payroll generation if pending overtime exists in period (PAYROLL_PENDING_OVERTIME)', async () => {
    // Create a pending OVERTIME ticket for this period
    const pendingOt = await p16.prisma.ticket.create({
      data: {
        employeeId,
        type: TicketType.OVERTIME,
        reason: 'Shift 3 emergency line maintenance',
        startDate: new Date('2026-09-10T17:00:00Z'),
        endDate: new Date('2026-09-10T21:00:00Z'),
        status: 'PENDING',
      },
    });

    const res = await request(p16.app.getHttpServer())
      .post('/hr/payroll/generate')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ period: testPeriod })
      .expect(400);

    expect(p16Message(res)).toContain('PAYROLL_PENDING_OVERTIME');

    // Approve the overtime ticket so payroll generation can proceed
    await p16.prisma.ticket.update({
      where: { id: pendingOt.id },
      data: { status: 'APPROVED' },
    });
  });

  it('S5.3 - Generates draft payroll with Upah Tetap, 2-col transport, kasbon deduction, BPJS & PPh21', async () => {
    const res = await request(p16.app.getHttpServer())
      .post('/hr/payroll/generate')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ period: testPeriod })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.items).toBeDefined();
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);

    // Inspect high income employee payroll item
    const highIncomeItem = res.body.items.find((i: any) => i.employeeId === employeeId);
    expect(highIncomeItem).toBeDefined();
    expect(highIncomeItem.baseSalary).toBe(8000000);
    expect(highIncomeItem.positionAllowance).toBe(2000000);
    expect(highIncomeItem.transportFlat).toBe(500000);
    expect(highIncomeItem.loanDeduction).toBe(1000000); // Kasbon installment
    expect(highIncomeItem.remainingLoan).toBe(2000000); // 3M - 1M = 2M remaining

    // PPh 21 check: Gross > 5M -> Tax applied
    expect(highIncomeItem.pph21).toBeGreaterThan(0);
    // BPJS columns must exist even if default
    expect(highIncomeItem.bpjsHealth).toBeDefined();
    expect(highIncomeItem.bpjsEmployment).toBeDefined();

    // Inspect low income employee payroll item
    const lowIncomeItem = res.body.items.find((i: any) => i.employeeId === lowIncomeEmpId);
    expect(lowIncomeItem).toBeDefined();
    expect(lowIncomeItem.baseSalary).toBe(4000000);
    // Under UMR (5,000,000) -> PPh 21 must be 0
    expect(lowIncomeItem.pph21).toBe(0);
  });

  it('S5.4 - Generates detailed printable Salary Slip (Sleepsalary)', async () => {
    const payroll = await p16.prisma.payroll.findFirst({
      where: { period: { name: testPeriod } },
      include: { items: true },
    });
    const highIncomeItem = payroll?.items.find((i) => i.employeeId === employeeId);

    const res = await request(p16.app.getHttpServer())
      .get(`/hr/payroll/slip/${highIncomeItem?.id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('slipNumber');
    expect(res.body.employee.name).toBe('P16 Senior Specialist');
    expect(res.body.earnings.baseSalary).toBe(8000000);
    expect(res.body.earnings.positionAllowance).toBe(2000000);
    expect(res.body.earnings.transportFlat).toBe(500000);
    expect(res.body.deductions.loanDeduction).toBe(1000000);
    expect(res.body.loanInfo.remainingBalance).toBe(2000000);
    expect(res.body.netSalary).toBeGreaterThan(0);
  });

  it('S5.5 - Verifies that employee kasbon remainingBalance in database updated atomically', async () => {
    const loan = await p16.prisma.employeeLoan.findUnique({ where: { id: loanId } });
    expect(Number(loan?.remainingBalance)).toBe(2000000);
    expect(loan?.status).toBe('ACTIVE');
  });
});
