import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EncryptionService } from '../../../shared/encryption.service';
import { HrPerformanceService } from './hr-performance.service';
import {
  AttendanceStatus,
  PayrollStatus,
  TicketType,
  TicketStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class HrPayrollService {
  private readonly logger = new Logger(HrPayrollService.name);
  private readonly performanceService: HrPerformanceService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    @Optional() performanceService?: HrPerformanceService,
  ) {
    this.performanceService =
      performanceService ?? new HrPerformanceService(prisma, encryption);
  }

  // --- PAYROLL GENERATION & ARITHMETIC (BUS-RULE-073 & PPh 21) ---

  async generateDraftPayroll(periodName: string) {
    const period = await this.prisma.financialPeriod.findFirst({
      where: { name: periodName },
    });
    if (!period)
      throw new NotFoundException(`Financial Period '${periodName}' not found`);

    // Check existing draft to prevent duplicates
    const existingDraft = await this.prisma.payroll.findFirst({
      where: { periodId: period.id, status: PayrollStatus.DRAFT },
    });
    if (existingDraft) {
      throw new BadRequestException(
        `Draft payroll already exists for period '${periodName}'`,
      );
    }

    // BUS-RULE-073: Generate payroll gagal jika ada Form Lembur belum di-approve
    const pendingOvertime = await this.prisma.ticket.findFirst({
      where: {
        type: TicketType.OVERTIME,
        status: TicketStatus.PENDING,
        startDate: { gte: period.startDate, lte: period.endDate },
      },
    });
    if (pendingOvertime) {
      throw new BadRequestException(
        'Generate payroll gagal: ada Form Lembur belum di-approve. / PAYROLL_PENDING_OVERTIME',
      );
    }

    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      include: { roles: true },
    });

    const payroll = await this.prisma.payroll.create({
      data: {
        periodId: period.id,
        status: PayrollStatus.DRAFT,
      },
    });

    // Fetch KPI & payroll configs
    const config = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'KPI_RATE_PER_POINT',
            'BPJS_HEALTH_RATE',
            'BPJS_EMPLOYMENT_RATE',
            'PPH21_RATE',
          ],
        },
      },
    });
    const kpiRate = parseFloat(
      config.find((c) => c.key === 'KPI_RATE_PER_POINT')?.value || '1000',
    );
    const bpjsHealthRate = parseFloat(
      config.find((c) => c.key === 'BPJS_HEALTH_RATE')?.value || '0.01',
    );
    const bpjsEmploymentRate = parseFloat(
      config.find((c) => c.key === 'BPJS_EMPLOYMENT_RATE')?.value || '0.02',
    );
    const pph21Rate = parseFloat(
      config.find((c) => c.key === 'PPH21_RATE')?.value || '0.05',
    );

    const workingDaysPerMonth = 22;

    for (const emp of employees) {
      // 1. Calculate actual attendance days
      const attendances = await this.prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          clockIn: { gte: period.startDate, lte: period.endDate },
          status: { in: [AttendanceStatus.ON_TIME, AttendanceStatus.LATE] },
        },
      });
      const actualDays = attendances.length > 0 ? attendances.length : workingDaysPerMonth;

      // 2. Upah Tetap = Gaji Pokok + Tunjangan Jabatan
      const rawBaseSalary = parseFloat(this.encryption.decrypt(emp.baseSalary || '0') || '0');
      const rawPositionAllowance = parseFloat(this.encryption.decrypt(emp.positionAllowance || '') || '0');
      const dailyBaseRate = rawBaseSalary / workingDaysPerMonth;
      const proratedBase = Math.round(dailyBaseRate * Math.min(workingDaysPerMonth, actualDays));
      const positionAllowance = rawPositionAllowance;

      // 3. Tunjangan Transport: 2 Kolom (Flat & Tentatif berbasis kehadiran)
      const transportFlat = parseFloat(this.encryption.decrypt(emp.transportFlat || '') || '0');
      const transportDaily = parseFloat(this.encryption.decrypt(emp.transportTentativeDaily || '') || '0');
      const transportTentative = Math.round(transportDaily * actualDays);

      // 4. Overtime (Lembur disetujui)
      const approvedOvertimeTickets = await this.prisma.ticket.findMany({
        where: {
          employeeId: emp.id,
          type: TicketType.OVERTIME,
          status: TicketStatus.APPROVED,
          startDate: { gte: period.startDate, lte: period.endDate },
        },
      });
      let overtimePay = 0;
      for (const ot of approvedOvertimeTickets) {
        if (ot.amount) {
          overtimePay += parseFloat(this.encryption.decrypt(ot.amount) || '0');
        } else {
          const durationHours = ot.endDate
            ? (ot.endDate.getTime() - ot.startDate.getTime()) / (1000 * 60 * 60)
            : 2;
          const hourlyRate = rawBaseSalary / (workingDaysPerMonth * 8);
          overtimePay += Math.round(durationHours * hourlyRate * 1.5);
        }
      }

      // 5. KPI incentive (event-based)
      let incentive = 0;
      try {
        const kpiScore = await this.performanceService.calculateEmployeeKPI(emp.id, period.name);
        incentive = Math.round(kpiScore * 1000);
      } catch (err: any) {
        this.logger.warn(`Failed to calculate KPI incentive for employee ${emp.id}: ${err?.message ?? 'unknown'}`);
        incentive = 0;
      }

      // 6. Kasbon / Employee Loan Deduction
      const activeLoan = await this.prisma.employeeLoan.findFirst({
        where: { employeeId: emp.id, status: 'ACTIVE' },
      });
      let loanDeduction = 0;
      let remainingLoan = 0;
      if (activeLoan) {
        const remaining = Number(activeLoan.remainingBalance);
        const monthly = Number(activeLoan.monthlyDeduction);
        loanDeduction = Math.min(monthly, remaining);
        remainingLoan = Math.max(0, remaining - loanDeduction);

        await this.prisma.employeeLoan.update({
          where: { id: activeLoan.id },
          data: {
            remainingBalance: new Prisma.Decimal(remainingLoan),
            status: remainingLoan === 0 ? 'PAID_OFF' : 'ACTIVE',
          },
        });
      }

      // 7. Deductions: BPJS Kesehatan (1%) + BPJS Ketenagakerjaan (2%)
      const fixedWages = proratedBase + positionAllowance;
      const bpjsHealth = Math.round(fixedWages * 0.01);
      const bpjsEmployment = Math.round(fixedWages * 0.02);

      // 8. PPh 21: Di atas batas UMR (Rp 5.000.000) dipotong 5%; di bawah UMR = 0
      const grossIncome = fixedWages + transportFlat + transportTentative + overtimePay + incentive;
      const UMR_THRESHOLD = 5000000;
      let pph21 = 0;
      if (grossIncome > UMR_THRESHOLD) {
        pph21 = Math.round((grossIncome - UMR_THRESHOLD) * 0.05);
      }

      const totalDeductions = bpjsHealth + bpjsEmployment + loanDeduction + pph21;
      const netSalary = Math.max(0, grossIncome - totalDeductions);

      await this.prisma.payrollItem.create({
        data: {
          payrollId: payroll.id,
          employeeId: emp.id,
          baseSalary: this.encryption.encrypt(proratedBase.toString()),
          positionAllowance: this.encryption.encrypt(positionAllowance.toString()),
          transportFlat: this.encryption.encrypt(transportFlat.toString()),
          transportTentative: this.encryption.encrypt(transportTentative.toString()),
          overtimePay: this.encryption.encrypt(overtimePay.toString()),
          kpiIncentive: this.encryption.encrypt(incentive.toString()),
          loanDeduction: this.encryption.encrypt(loanDeduction.toString()),
          remainingLoan: this.encryption.encrypt(remainingLoan.toString()),
          bpjsHealth: this.encryption.encrypt(bpjsHealth.toString()),
          bpjsEmployment: this.encryption.encrypt(bpjsEmployment.toString()),
          pph21: this.encryption.encrypt(pph21.toString()),
          deductions: this.encryption.encrypt(totalDeductions.toString()),
          netSalary: this.encryption.encrypt(netSalary.toString()),
          notes: null,
        },
      });
    }

    return this.getPayrollById(payroll.id);
  }

  async getPayrollById(payrollId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        period: true,
        approver: true,
        items: { include: { employee: true } },
      },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');

    return {
      ...payroll,
      totalDisbursement: payroll.totalDisbursement
        ? this.encryption.decrypt(payroll.totalDisbursement)
        : null,
      items: payroll.items.map((it) => ({
        ...it,
        baseSalary: it.baseSalary ? parseFloat(this.encryption.decrypt(it.baseSalary) || '0') : 0,
        positionAllowance: it.positionAllowance ? parseFloat(this.encryption.decrypt(it.positionAllowance) || '0') : 0,
        transportFlat: it.transportFlat ? parseFloat(this.encryption.decrypt(it.transportFlat) || '0') : 0,
        transportTentative: it.transportTentative ? parseFloat(this.encryption.decrypt(it.transportTentative) || '0') : 0,
        overtimePay: it.overtimePay ? parseFloat(this.encryption.decrypt(it.overtimePay) || '0') : 0,
        kpiIncentive: it.kpiIncentive ? parseFloat(this.encryption.decrypt(it.kpiIncentive) || '0') : 0,
        loanDeduction: it.loanDeduction ? parseFloat(this.encryption.decrypt(it.loanDeduction) || '0') : 0,
        remainingLoan: it.remainingLoan ? parseFloat(this.encryption.decrypt(it.remainingLoan) || '0') : 0,
        bpjsHealth: it.bpjsHealth ? parseFloat(this.encryption.decrypt(it.bpjsHealth) || '0') : 0,
        bpjsEmployment: it.bpjsEmployment ? parseFloat(this.encryption.decrypt(it.bpjsEmployment) || '0') : 0,
        pph21: it.pph21 ? parseFloat(this.encryption.decrypt(it.pph21) || '0') : 0,
        deductions: it.deductions ? parseFloat(this.encryption.decrypt(it.deductions) || '0') : 0,
        netSalary: it.netSalary ? parseFloat(this.encryption.decrypt(it.netSalary) || '0') : 0,
      })),
    };
  }

  async getSalarySlip(payrollItemId: string) {
    const item = await this.prisma.payrollItem.findUnique({
      where: { id: payrollItemId },
      include: {
        employee: { include: { roles: true } },
        payroll: { include: { period: true } },
      },
    });
    if (!item) throw new NotFoundException('Slip gaji tidak ditemukan');

    const emp = item.employee;
    const primaryRole = emp.roles.find((r) => r.isPrimary) || emp.roles[0];

    const baseSalary = parseFloat(this.encryption.decrypt(item.baseSalary) || '0');
    const positionAllowance = parseFloat(this.encryption.decrypt(item.positionAllowance || '') || '0');
    const transportFlat = parseFloat(this.encryption.decrypt(item.transportFlat || '') || '0');
    const transportTentative = parseFloat(this.encryption.decrypt(item.transportTentative || '') || '0');
    const overtimePay = parseFloat(this.encryption.decrypt(item.overtimePay || '') || '0');
    const kpiIncentive = parseFloat(this.encryption.decrypt(item.kpiIncentive) || '0');
    const bpjsHealth = parseFloat(this.encryption.decrypt(item.bpjsHealth || '') || '0');
    const bpjsEmployment = parseFloat(this.encryption.decrypt(item.bpjsEmployment || '') || '0');
    const loanDeduction = parseFloat(this.encryption.decrypt(item.loanDeduction || '') || '0');
    const remainingLoan = parseFloat(this.encryption.decrypt(item.remainingLoan || '') || '0');
    const pph21 = parseFloat(this.encryption.decrypt(item.pph21 || '') || '0');
    const totalDeductions = parseFloat(this.encryption.decrypt(item.deductions) || '0');
    const netSalary = parseFloat(this.encryption.decrypt(item.netSalary) || '0');

    return {
      slipId: item.id,
      slipNumber: `SLIP/${item.payroll.period.name}/${emp.nik}`,
      period: item.payroll.period.name,
      employee: {
        id: emp.id,
        name: emp.name,
        nik: emp.nik,
        position: primaryRole?.roleName || 'STAFF',
        department: primaryRole?.division || 'GENERAL',
        bankName: emp.bankName,
        bankAccount: emp.bankAccount,
      },
      earnings: {
        baseSalary,
        positionAllowance,
        fixedWages: baseSalary + positionAllowance,
        transportFlat,
        transportTentative,
        overtimePay,
        kpiIncentive,
        grossSalary: baseSalary + positionAllowance + transportFlat + transportTentative + overtimePay + kpiIncentive,
      },
      deductions: {
        bpjsHealth,
        bpjsEmployment,
        loanDeduction,
        remainingLoan,
        pph21,
        totalDeductions,
      },
      loanInfo: {
        deduction: loanDeduction,
        remainingBalance: remainingLoan,
      },
      netSalary,
      notes: item.notes,
      printedAt: new Date().toISOString(),
    };
  }

  async authorizePayroll(payrollId: string, authorizedById: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) throw new NotFoundException('Payroll not found');
    if (payroll.status !== PayrollStatus.DRAFT)
      throw new BadRequestException('Payroll is not in DRAFT status');

    // Verify authorizer has HR or FINANCE role
    const authorizer = await this.prisma.user.findUnique({
      where: { id: authorizedById },
    });
    if (
      !authorizer ||
      !authorizer.roles.some((r) =>
        ['HR', 'FINANCE', 'SUPER_ADMIN', 'HEAD_OPS'].includes(r),
      )
    ) {
      throw new ForbiddenException(
        'User does not have authorization rights for payroll',
      );
    }

    // Calculate total disbursement
    const items = await this.prisma.payrollItem.findMany({
      where: { payrollId },
    });
    let totalDisbursement = 0;
    for (const item of items) {
      const net = parseFloat(this.encryption.decrypt(item.netSalary) || '0');
      totalDisbursement += net;
    }

    return this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: PayrollStatus.AUTHORIZED,
        authorizedById,
        authorizedAt: new Date(),
        totalDisbursement: this.encryption.encrypt(
          totalDisbursement.toString(),
        ),
      },
    });
  }

  // --- ALL PAYROLLS ---

  async getAllPayrolls() {
    return this.prisma.payroll.findMany({
      include: {
        period: true,
        approver: { select: { fullName: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
