import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { EncryptionService } from '../../shared/encryption.service';
import { GeofencingService } from '../../shared/geofencing.service';
import {
  AttendanceStatus,
  PayrollStatus,
  ContractType,
  Division,
  TicketType,
  TicketStatus,
  FundRequestStatus,
  Prisma,
} from '@prisma/client';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private geofencing: GeofencingService,
  ) {}

  // --- EMPLOYEE CRUD ---

  async createEmployee(dto: CreateEmployeeDto) {
    // BUS-RULE-074: Multi-role active weights must sum to 100% (or 1.0)
    if (dto.roles && dto.roles.length > 0) {
      const totalWeight = dto.roles.reduce((sum, r) => sum + Number(r.weight), 0);
      if (Math.abs(totalWeight - 1.0) > 0.01 && Math.abs(totalWeight - 100) > 0.01) {
        throw new BadRequestException(
          'Total bobot peran aktif harus 100%. / KPI_ROLE_WEIGHT_INVALID',
        );
      }
    }

    const data: any = { ...dto };
    if (dto.joinedAt) data.joinedAt = new Date(dto.joinedAt);
    if (dto.contractEnd) data.contractEnd = new Date(dto.contractEnd);
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    if (dto.baseSalary) {
      data.baseSalary = this.encryption.encrypt(dto.baseSalary);
    }
    if ((dto as any).positionAllowance) {
      data.positionAllowance = this.encryption.encrypt((dto as any).positionAllowance);
    }
    if ((dto as any).transportFlat) {
      data.transportFlat = this.encryption.encrypt((dto as any).transportFlat);
    }
    if ((dto as any).transportTentativeDaily) {
      data.transportTentativeDaily = this.encryption.encrypt((dto as any).transportTentativeDaily);
    }
    const joinedDate = dto.joinedAt ? new Date(dto.joinedAt) : new Date();
    const diffDays = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
    data.onboardingStatus = diffDays <= 3 ? 'IN_PROGRESS' : 'COMPLETED';

    delete data.userId;
    delete data.roles;
    if (dto.userId) {
      data.user = { connect: { id: dto.userId } };
    }
    if (dto.managerId) {
      data.manager = { connect: { id: dto.managerId } };
    }

    const employee = await this.prisma.employee.create({
      data,
      include: { roles: true, user: true, manager: true },
    });

    if (dto.roles && dto.roles.length > 0) {
      for (const r of dto.roles) {
        const normalizedWeight = Number(r.weight) > 1 ? Number(r.weight) / 100 : Number(r.weight);
        await this.prisma.employeeRoleMapping.create({
          data: {
            employeeId: employee.id,
            division: r.division,
            roleName: r.roleName,
            weight: normalizedWeight,
            isPrimary: !!r.isPrimary,
          },
        });
      }
    }

    return this.prisma.employee.findUnique({
      where: { id: employee.id },
      include: { roles: true, user: true, manager: true },
    });
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

    if (dto.roles && dto.roles.length > 0) {
      const totalWeight = dto.roles.reduce((sum, r) => sum + Number(r.weight), 0);
      if (Math.abs(totalWeight - 1.0) > 0.01 && Math.abs(totalWeight - 100) > 0.01) {
        throw new BadRequestException(
          'Total bobot peran aktif harus 100%. / KPI_ROLE_WEIGHT_INVALID',
        );
      }
    }

    const data: any = { ...dto };
    if (dto.joinedAt) data.joinedAt = new Date(dto.joinedAt);
    if (dto.contractEnd) data.contractEnd = new Date(dto.contractEnd);
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    if (dto.resignDate) data.resignDate = new Date(dto.resignDate);
    if (dto.baseSalary) {
      data.baseSalary = this.encryption.encrypt(dto.baseSalary);
    }
    if (dto.isActive === true && dto.resignDate) {
      data.isActive = false;
    }
    delete data.userId;
    delete data.managerId;
    delete data.roles;
    if (dto.userId) {
      data.user = { connect: { id: dto.userId } };
    }
    if (dto.managerId) {
      data.manager = { connect: { id: dto.managerId } };
    }

    if (dto.roles && dto.roles.length > 0) {
      await this.prisma.employeeRoleMapping.deleteMany({
        where: { employeeId: id },
      });
      for (const r of dto.roles) {
        const normalizedWeight = Number(r.weight) > 1 ? Number(r.weight) / 100 : Number(r.weight);
        await this.prisma.employeeRoleMapping.create({
          data: {
            employeeId: id,
            division: r.division,
            roleName: r.roleName,
            weight: normalizedWeight,
            isPrimary: !!r.isPrimary,
          },
        });
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data,
      include: { roles: true, user: true, manager: true },
    });
  }

  async deleteEmployee(id: string) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

    return this.prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
        resignDate: new Date(),
        resignReason: 'SYSTEM_DELETED',
      },
    });
  }

  // --- ATTENDANCE & GEOFENCING ---

  async clockIn(employeeId: string, lat: number, lng: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    if (!employee.isActive)
      throw new ForbiddenException('Employee is not active');

    // Duplicate check: already clocked in today without clock-out
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingToday = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        clockIn: { gte: today },
        clockOut: null,
      },
    });
    if (existingToday) {
      throw new BadRequestException(
        'Already clocked in today, clock out first',
      );
    }

    // Check if on leave
    const activeLeave = await this.prisma.ticket.findFirst({
      where: {
        employeeId,
        type: 'LEAVE',
        status: 'APPROVED',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });
    if (activeLeave) {
      throw new ForbiddenException('Employee is on approved leave');
    }

    // Geofence
    const config = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'FACTORY_LAT',
            'FACTORY_LNG',
            'WORK_START_HOUR',
            'WORK_START_MINUTE',
          ],
        },
      },
    });

    const factoryLat = parseFloat(
      config.find((c) => c.key === 'FACTORY_LAT')?.value || '0',
    );
    const factoryLng = parseFloat(
      config.find((c) => c.key === 'FACTORY_LNG')?.value || '0',
    );

    const geo = this.geofencing.isWithinRadius(
      lat,
      lng,
      factoryLat,
      factoryLng,
      50,
    );

    // Determine status: if outside geofence, record as OUTSIDE_GEOFENCE instead of rejecting
    const status = geo.isWithin
      ? AttendanceStatus.ON_TIME
      : AttendanceStatus.OUTSIDE_GEOFENCE;

    // Lateness detection
    const workStartHour = parseInt(
      config.find((c) => c.key === 'WORK_START_HOUR')?.value || '8',
    );
    const workStartMinute = parseInt(
      config.find((c) => c.key === 'WORK_START_MINUTE')?.value || '0',
    );
    const now = new Date();
    const startThreshold = new Date(now);
    startThreshold.setHours(workStartHour, workStartMinute, 0, 0);

    const finalStatus =
      status === AttendanceStatus.OUTSIDE_GEOFENCE
        ? AttendanceStatus.OUTSIDE_GEOFENCE
        : now > startThreshold
          ? AttendanceStatus.LATE
          : AttendanceStatus.ON_TIME;

    return this.prisma.attendance.create({
      data: {
        employeeId,
        clockIn: now,
        lat,
        lng,
        distanceFromFactory: geo.distance,
        status: finalStatus,
      },
    });
  }

  async clockOut(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeAttendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        clockIn: { gte: today },
        clockOut: null,
      },
    });
    if (!activeAttendance) {
      throw new BadRequestException('No active clock-in found for today');
    }

    return this.prisma.attendance.update({
      where: { id: activeAttendance.id },
      data: { clockOut: new Date() },
    });
  }

  // --- PASSIVE KPI CALCULATION (FIXED) ---

  async calculateEmployeeKPI(employeeId: string, period: string) {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await this.prisma.kpiPointLog.findMany({
      where: {
        employeeId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const roles = await this.prisma.employeeRoleMapping.findMany({
      where: { employeeId },
    });

    if (roles.length === 0) {
      const total = logs.reduce((sum, log) => sum + log.points, 0);
      await this.saveKpiScore(employeeId, period, total, 0, total, logs);
      return total;
    }

    // Batch-fetch all metric definitions to avoid N+1
    const metricCodes = [...new Set(logs.map((l) => l.metricCode))];
    const metricDefs = await this.prisma.kpiMetricDefinition.findMany({
      where: { eventCode: { in: metricCodes } },
    });
    const defMap = new Map(metricDefs.map((d) => [d.eventCode, d]));

    const pointsByDivision: Record<string, number> = {};
    for (const log of logs) {
      const def = defMap.get(log.metricCode);
      if (def) {
        pointsByDivision[def.division] =
          (pointsByDivision[def.division] || 0) + log.points;
      }
    }

    // Normalized weighted scoring
    const totalWeight = roles.reduce((sum, r) => sum + Number(r.weight), 0);
    let totalWeightedScore = 0;
    for (const role of roles) {
      const divisionPoints = pointsByDivision[role.division] || 0;
      totalWeightedScore +=
        (divisionPoints * Number(role.weight)) / totalWeight;
    }

    // Persist to KpiScore
    await this.saveKpiScore(
      employeeId,
      period,
      totalWeightedScore,
      totalWeightedScore,
      null,
      logs,
    );

    return totalWeightedScore;
  }

  private async saveKpiScore(
    employeeId: string,
    periodName: string,
    finalScore: number,
    objectiveScore: number,
    subjectiveScore: number | null,
    logs: any[],
  ) {
    const period = await this.prisma.financialPeriod.findFirst({
      where: { name: periodName },
    });
    if (!period) return;

    const metricsData = {
      discipline:
        logs.length > 0
          ? Math.round(
              (logs.filter((l) => l.points > 0).length / logs.length) * 100,
            )
          : 0,
      output: finalScore > 0 ? 'NORMAL' : 'LOW',
      attitude: subjectiveScore ? Math.round(subjectiveScore / 25) / 1 : 0,
      logCount: logs.length,
    };

    await this.prisma.kpiScore.upsert({
      where: {
        employeeId_periodId: {
          employeeId,
          periodId: period.id,
        },
      },
      update: {
        finalScore,
        objectiveScore,
        subjectiveScore,
        metricsData,
      },
      create: {
        employeeId,
        periodId: period.id,
        finalScore,
        objectiveScore,
        subjectiveScore,
        metricsData,
      },
    });
  }

  // --- SUBJECTIVE SCORE INPUT (BUS-RULE-072: BLOCKED) ---

  async recordSubjectiveScore(
    employeeId: string,
    period: string,
    score: number,
  ) {
    // BUS-RULE-072: Performance Scoring: Auto dari Event (TIDAK ADA INPUT MANUAL PERFORMA HR)
    throw new BadRequestException(
      'Performa dihitung otomatis. Tidak bisa input manual. / PERFORMANCE_MANUAL_BLOCKED',
    );
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
        const kpiScore = await this.calculateEmployeeKPI(emp.id, period.name);
        incentive = Math.round(kpiScore * 1000);
      } catch {
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

  // --- RECRUITMENT & CANDIDATES (BUS-RULE-115) ---

  async createCandidate(dto: {
    name: string;
    department: string;
    email: string;
    phone?: string;
    cvUrl?: string;
    cvReviewScore?: number;
    cvReviewNotes?: string;
  }) {
    return this.prisma.candidate.create({
      data: {
        ...dto,
        stage: 'SCREENING',
        status: 'IN_PROCESS',
        durationDays: 1,
      },
    });
  }

  async getCandidates(query?: { stage?: string; status?: string; department?: string }) {
    const where: any = {};
    if (query?.stage) where.stage = query.stage;
    if (query?.status) where.status = query.status;
    if (query?.department) where.department = query.department;

    return this.prisma.candidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCandidateById(id: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async updateCandidateStage(
    id: string,
    stage: string,
    rejectionReason?: string,
  ) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    const validStages = [
      'SCREENING',
      'HR_INTERVIEW',
      'USER_INTERVIEW',
      'OFFERING',
      'DONE',
      'REJECTED',
    ];
    if (!validStages.includes(stage)) {
      throw new BadRequestException('Tahap rekrutmen tidak valid. / INVALID_RECRUITMENT_STAGE');
    }

    let status = 'IN_PROCESS';
    if (stage === 'REJECTED') {
      status = 'REJECTED';
    } else if (stage === 'DONE') {
      status = 'PASSED';
    }

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        stage,
        status,
        rejectionReason: stage === 'REJECTED' ? rejectionReason : null,
      },
    });

    return {
      ...updated,
      notificationMessage:
        stage === 'REJECTED'
          ? `Kandidat ${candidate.name} tidak lolos tahap seleksi.`
          : `Kandidat ${candidate.name} berhasil lolos ke tahap ${stage}.`,
    };
  }

  // --- TRAINING MANAGEMENT (BUS-RULE-116) ---

  async addEmployeeTraining(
    employeeId: string,
    dto: {
      trainingType: string;
      hours: number;
      goal: string;
      trainingDate: string;
      certificateUrl?: string;
    },
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    if (dto.hours <= 0) {
      throw new BadRequestException('Durasi jam training harus lebih besar dari 0. / TRAINING_HOURS_INVALID');
    }

    const training = await this.prisma.employeeTraining.create({
      data: {
        employeeId,
        trainingType: dto.trainingType,
        hours: dto.hours,
        goal: dto.goal,
        trainingDate: new Date(dto.trainingDate),
        certificateUrl: dto.certificateUrl || null,
      },
    });

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        totalTrainingHours: { increment: dto.hours },
      },
    });

    return training;
  }

  async getEmployeeTrainings(employeeId: string) {
    return this.prisma.employeeTraining.findMany({
      where: { employeeId },
      orderBy: { trainingDate: 'desc' },
    });
  }

  // --- EMPLOYEE LOANS / KASBON (BUS-RULE-117) ---

  async createEmployeeLoan(dto: {
    employeeId: string;
    totalAmount: number;
    monthlyDeduction: number;
    reason?: string;
  }) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.employeeLoan.create({
      data: {
        employeeId: dto.employeeId,
        totalAmount: new Prisma.Decimal(dto.totalAmount),
        monthlyDeduction: new Prisma.Decimal(dto.monthlyDeduction),
        remainingBalance: new Prisma.Decimal(dto.totalAmount),
        reason: dto.reason || null,
        status: 'ACTIVE',
      },
    });
  }

  async getEmployeeLoans(employeeId?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const loans = await this.prisma.employeeLoan.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });

    return loans.map((l) => ({
      id: l.id,
      employeeId: l.employeeId,
      employeeName: l.employee.name,
      totalAmount: Number(l.totalAmount),
      monthlyDeduction: Number(l.monthlyDeduction),
      remainingBalance: Number(l.remainingBalance),
      reason: l.reason,
      status: l.status,
      reminderText:
        l.status === 'ACTIVE'
          ? `Sisa pinjaman: Rp ${Number(l.remainingBalance).toLocaleString('id-ID')} (Cicilan Rp ${Number(l.monthlyDeduction).toLocaleString('id-ID')}/bln)`
          : 'Pinjaman Lunas',
    }));
  }

  // --- TICKETS LIFECYCLE & REIMBURSEMENT AUTO-TRIGGER (BUS-RULE-075) ---

  async createTicket(dto: {
    employeeId: string;
    type: TicketType;
    reason: string;
    startDate: string;
    endDate?: string;
    amount?: string;
  }) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.ticket.create({
      data: {
        employeeId: dto.employeeId,
        type: dto.type,
        reason: dto.reason,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        amount: dto.amount ? this.encryption.encrypt(dto.amount) : null,
        status: TicketStatus.PENDING,
      },
      include: { employee: true },
    });
  }

  async approveTicket(id: string, authorizedById: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== TicketStatus.PENDING) {
      throw new BadRequestException('Ticket is not in PENDING status');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.APPROVED,
        authorizedById,
      },
      include: { employee: true, approver: true },
    });

    // BUS-RULE-075: Reimburse approved -> auto-trigger Kas Bank Keluar (FundRequest)
    if (ticket.type === TicketType.REIMBURSE && ticket.amount) {
      const rawAmount = this.encryption.decrypt(ticket.amount);
      const amountVal = parseFloat(rawAmount || '0');

      const requesterId = ticket.employee.userId || authorizedById;
      if (requesterId) {
        await this.prisma.fundRequest.create({
          data: {
            requesterId,
            departmentId: 'HR',
            amount: new Prisma.Decimal(amountVal),
            reason: `Reimbursement auto-trigger: ${ticket.reason} (Ticket ${ticket.id})`,
            status: FundRequestStatus.WAITING_FINANCE_DISBURSEMENT,
            approvedById: authorizedById,
          },
        });
      }
    }

    return updatedTicket;
  }

  async rejectTicket(id: string, authorizedById: string, reason?: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.REJECTED,
        authorizedById,
      },
    });
  }

  async getTickets(query?: {
    employeeId?: string;
    status?: TicketStatus;
    type?: TicketType;
  }) {
    const where: any = {};
    if (query?.employeeId) where.employeeId = query.employeeId;
    if (query?.status) where.status = query.status;
    if (query?.type) where.type = query.type;

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: { employee: { include: { roles: true } }, approver: true },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      ...t,
      amount: t.amount ? this.encryption.decrypt(t.amount) : null,
    }));
  }

  // --- CONTRACT EXPIRING ALERT (BUS-RULE-071) ---

  async getExpiringContracts(days: number = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryWindow = new Date(today);
    expiryWindow.setDate(today.getDate() + days);

    const employees = await this.prisma.employee.findMany({
      where: {
        isActive: true,
        contractEnd: {
          gte: today,
          lte: expiryWindow,
        },
      },
      include: {
        roles: true,
        user: true,
      },
      orderBy: { contractEnd: 'asc' },
    });

    return employees.map((emp) => {
      const diffTime = emp.contractEnd!.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const primaryRole = emp.roles.find((r) => r.isPrimary) || emp.roles[0];

      return {
        id: emp.id,
        nik: emp.nik,
        name: emp.name,
        contractType: emp.contractType,
        contractEnd: emp.contractEnd,
        daysLeft: Math.max(0, daysLeft),
        position: primaryRole?.roleName || 'UNASSIGNED',
        division: primaryRole?.division || 'GENERAL',
        isCritical: daysLeft <= 30,
      };
    });
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

  // --- MASTER DATA & EMPLOYEES ---

  async getAllEmployees() {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      include: {
        roles: true,
        user: true,
        manager: { select: { id: true, name: true } },
      },
    });

    const today = new Date();
    return employees.map((emp) => {
      let daysLeft: number | null = null;
      if (emp.contractEnd) {
        const diffTime = emp.contractEnd.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      let age: number | null = null;
      if (emp.birthDate) {
        age = Math.floor((today.getTime() - emp.birthDate.getTime()) / (365.25 * 24 * 3600 * 1000));
      }

      const primaryRole = emp.roles.find((r) => r.isPrimary) || emp.roles[0];

      return {
        id: emp.id,
        name: emp.name,
        email: emp.user?.email || null,
        position: primaryRole?.roleName || 'UNASSIGNED',
        department: primaryRole?.division || 'GENERAL',
        birthDate: emp.birthDate,
        gender: emp.gender,
        age,
        onboardingStatus: emp.onboardingStatus,
        totalTrainingHours: emp.totalTrainingHours,
        joinedAt: emp.joinedAt,
        contractEnd: emp.contractEnd,
        contractType: emp.contractType,
        daysLeft,
        isActive: emp.isActive,
        roles: emp.roles,
        manager: emp.manager,
      };
    });
  }

  async getEmployeeById(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        roles: true,
        user: true,
        manager: { select: { id: true, name: true } },
        subordinates: { select: { id: true, name: true, roles: true } },
      },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async getHrDashboard() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const [totalActive, criticalContracts, latestScores, allScores] =
      await Promise.all([
        this.prisma.employee.count({ where: { isActive: true } }),
        this.prisma.employee.findMany({
          where: {
            isActive: true,
            contractEnd: { lte: thirtyDaysFromNow, gte: today },
          },
        }),
        this.prisma.kpiScore.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { employee: true },
        }),
        this.prisma.kpiScore.findMany({
          take: 100,
        }),
      ]);

    const latestAvgKpi =
      allScores.length > 0
        ? allScores.reduce((sum, s) => sum + s.finalScore, 0) / allScores.length
        : 0;

    const divScores: Record<string, { sum: number; count: number }> = {};
    const employees = await this.prisma.employee.findMany({
      include: { roles: true },
    });

    for (const score of latestScores) {
      const emp = employees.find((e) => e.id === score.employeeId);
      const primaryDiv =
        emp?.roles.find((r) => r.isPrimary)?.division || 'GENERAL';

      if (!divScores[primaryDiv]) divScores[primaryDiv] = { sum: 0, count: 0 };
      divScores[primaryDiv].sum += score.finalScore;
      divScores[primaryDiv].count += 1;
    }

    const divisionStats = Object.entries(divScores).map(([div, data]) => ({
      division: div,
      avgScore: data.sum / data.count,
    }));

    return {
      totalActive,
      latestAvgKpi,
      criticalContractsCount: criticalContracts.length,
      criticalContracts,
      latestScores,
      divisionStats,
    };
  }

  // --- EXECUTIVE SUMMARY ---

  async getExecutiveSummary() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const [totalActive, criticalContracts, payrolls] = await Promise.all([
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.employee.findMany({
        where: {
          isActive: true,
          contractEnd: { lte: thirtyDaysFromNow, gte: today },
        },
      }),
      this.prisma.payroll.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
    ]);

    let totalBudget = 0;
    let totalSavings = 0;
    if (payrolls.length > 0) {
      for (const item of payrolls[0].items) {
        const base = parseFloat(
          this.encryption.decrypt(item.baseSalary) || '0',
        );
        totalBudget += base;
        const net = parseFloat(this.encryption.decrypt(item.netSalary) || '0');
        totalSavings += base - net;
      }
    }

    const latestScores = await this.prisma.kpiScore.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    const avgKpi =
      latestScores.length > 0
        ? latestScores.reduce((s, k) => s + k.finalScore, 0) /
          latestScores.length
        : 0;

    const activeTickets = await this.prisma.ticket.count({
      where: { status: 'PENDING' },
    });

    const totalEver = await this.prisma.employee.count();
    const turnoverRate =
      totalEver > 0 ? ((totalEver - totalActive) / totalEver) * 100 : 0;

    // Real hiring speed: average days between employee join dates
    const allEmployees = await this.prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { joinedAt: 'desc' },
      take: 10,
      select: { joinedAt: true },
    });
    let hiringSpeed = 'N/A';
    if (allEmployees.length >= 2) {
      let totalGap = 0;
      for (let i = 0; i < allEmployees.length - 1; i++) {
        const gap =
          allEmployees[i].joinedAt.getTime() -
          allEmployees[i + 1].joinedAt.getTime();
        totalGap += Math.abs(gap);
      }
      const avgGapDays = Math.round(
        totalGap / (1000 * 60 * 60 * 24) / (allEmployees.length - 1),
      );
      hiringSpeed = `${avgGapDays} Days`;
    }

    return {
      budgetSavings: `Rp ${(totalBudget / 1000000).toFixed(0)} M`,
      savingsValue: `+ Rp ${Math.floor(totalSavings / 1000000)} JT SAVINGS`,
      hiringSpeed,
      hiringSub: 'AVG TIME TO FILL',
      stabilityIndex: `${turnoverRate.toFixed(1)}%`,
      stabilitySub: 'TURNOVER RATE',
      workload: activeTickets,
      workloadSub: 'ACTIVE TICKETS',
      avgKpi: `${(avgKpi / 10).toFixed(1)}/10`,
      avgKpiSub: 'DEPT PERFORMANCE',
    };
  }

  // --- DEPARTMENT SCORES (FIXED N+1) ---

  async getDepartmentScores() {
    const divisions = Object.values(Division);
    const today = new Date();

    // Batch-fetch all active employees with roles, KPI scores, and users
    const allEmployees = await this.prisma.employee.findMany({
      where: { isActive: true },
      include: {
        roles: true,
        user: true,
        attendances: {
          take: 30,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Batch-fetch latest KPI score per employee
    const allKpiScores = await this.prisma.kpiScore.findMany({
      where: {
        employeeId: { in: allEmployees.map((e) => e.id) },
      },
      orderBy: { createdAt: 'desc' },
    });
    const latestKpiMap = new Map<string, (typeof allKpiScores)[0]>();
    for (const score of allKpiScores) {
      if (!latestKpiMap.has(score.employeeId)) {
        latestKpiMap.set(score.employeeId, score);
      }
    }

    const result = divisions
      .map((division) => {
        const deptEmployees = allEmployees.filter((emp) =>
          emp.roles.some((r) => r.division === division),
        );
        if (deptEmployees.length === 0) return null;

        const employeesWithKpi = deptEmployees.map((emp) => {
          const latestScore = latestKpiMap.get(emp.id);
          const primaryRole =
            emp.roles.find((r) => r.isPrimary) || emp.roles[0];
          let daysLeft: number | null = null;
          if (emp.contractEnd) {
            daysLeft = Math.ceil(
              (emp.contractEnd.getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24),
            );
          }

          const finalScore = latestScore?.finalScore || 0;
          const metricsData = latestScore?.metricsData || {};

          // Real attendance-based discipline rate
          const attendances = emp.attendances || [];
          const onTimeCount = attendances.filter(
            (a) => a.status === 'ON_TIME',
          ).length;
          const disciplineRate =
            attendances.length > 0
              ? Math.round((onTimeCount / attendances.length) * 100)
              : 0;

          return {
            id: emp.id,
            name: emp.name,
            email: emp.user?.email || null,
            position: primaryRole?.roleName || 'UNASSIGNED',
            division: primaryRole?.division || division,
            joinedAt: emp.joinedAt,
            contractEnd: emp.contractEnd,
            contractType: emp.contractType,
            daysLeft,
            kpi: Math.round(finalScore),
            disiplin: disciplineRate,
            output: (metricsData as any)?.output || 'NORMAL',
            attitude: (metricsData as any)?.attitude || 0,
            type:
              emp.contractType === 'PERMANENT'
                ? 'TETAP'
                : emp.contractType === 'PROBATION'
                  ? 'PROBATION'
                  : `PKWT`,
          };
        });

        const avgKpi =
          employeesWithKpi.length > 0
            ? employeesWithKpi.reduce((s, e) => s + e.kpi, 0) /
              employeesWithKpi.length
            : 0;

        return {
          division,
          employeeCount: employeesWithKpi.length,
          avgKpi: Math.round(avgKpi * 10) / 10,
          employees: employeesWithKpi,
        };
      })
      .filter(Boolean);

    return result;
  }

  // --- DEPARTMENT EMPLOYEES BY DIVISION ---

  async getDepartmentEmployees(division: string) {
    const div = division.toUpperCase() as Division;
    const today = new Date();

    const employees = await this.prisma.employee.findMany({
      where: {
        isActive: true,
        roles: { some: { division: div } },
      },
      include: {
        roles: { where: { division: div } },
        kpiScores: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        user: true,
      },
    });

    return employees.map((emp) => {
      const latestScore = emp.kpiScores[0];
      const primaryRole = emp.roles.find((r) => r.isPrimary) || emp.roles[0];
      let daysLeft: number | null = null;
      if (emp.contractEnd) {
        daysLeft = Math.ceil(
          (emp.contractEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      const finalScore = latestScore?.finalScore || 0;
      const metricsData = latestScore?.metricsData || {};

      return {
        id: emp.id,
        name: emp.name,
        email: emp.user?.email || null,
        position: primaryRole?.roleName || 'UNASSIGNED',
        joinedAt: emp.joinedAt,
        contractEnd: emp.contractEnd,
        contractType: emp.contractType,
        daysLeft,
        kpi: Math.round(finalScore),
        disiplin: (metricsData as any)?.discipline || 0,
        output: (metricsData as any)?.output || 'NORMAL',
        attitude: (metricsData as any)?.attitude || 0,
        type:
          emp.contractType === 'PERMANENT'
            ? 'TETAP'
            : emp.contractType === 'PROBATION'
              ? 'PROBATION'
              : `PKWT`,
      };
    });
  }

  // --- CONTRACT AUDIT (FIXED: NO RANDOM) ---

  async getContractAudit() {
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    const employees = await this.prisma.employee.findMany({
      where: {
        isActive: true,
        contractEnd: { not: null, lte: ninetyDaysFromNow },
      },
      include: {
        roles: { where: { isPrimary: true } },
        user: true,
      },
      orderBy: { contractEnd: 'asc' },
    });

    return employees.map((emp) => {
      const daysLeft = Math.ceil(
        (emp.contractEnd!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const primaryRole = emp.roles[0];

      return {
        id: emp.id,
        name: emp.name,
        position: primaryRole?.roleName || 'N/A',
        division: primaryRole?.division || 'GENERAL',
        contractEnd: emp.contractEnd,
        daysLeft: Math.max(0, daysLeft),
        type:
          emp.contractType === 'PERMANENT'
            ? 'TETAP'
            : emp.contractType === 'PROBATION'
              ? 'PROBATION'
              : `PKWT`,
        isExpired: daysLeft <= 0,
        isCritical: daysLeft > 0 && daysLeft < 30,
      };
    });
  }

  // --- EMPLOYEE ATTENDANCE STATS ---

  async getEmployeeAttendance(employeeId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = records.length;
    const onTime = records.filter((r) => r.status === 'ON_TIME').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const outside = records.filter(
      (r) => r.status === 'OUTSIDE_GEOFENCE',
    ).length;

    return {
      total,
      onTime,
      late,
      outside,
      disciplineRate: total > 0 ? Math.round((onTime / total) * 100) : 0,
      records,
    };
  }
}
