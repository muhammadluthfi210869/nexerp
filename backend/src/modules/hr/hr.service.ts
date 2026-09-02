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
    const data: any = { ...dto };
    if (dto.joinedAt) data.joinedAt = new Date(dto.joinedAt);
    if (dto.contractEnd) data.contractEnd = new Date(dto.contractEnd);
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    if (dto.baseSalary) {
      data.baseSalary = this.encryption.encrypt(dto.baseSalary);
    }
    delete data.userId;
    if (dto.userId) {
      data.user = { connect: { id: dto.userId } };
    }
    if (dto.managerId) {
      data.manager = { connect: { id: dto.managerId } };
    }

    return this.prisma.employee.create({
      data,
      include: { roles: true, user: true, manager: true },
    });
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee not found');

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
    if (dto.userId) {
      data.user = { connect: { id: dto.userId } };
    }
    if (dto.managerId) {
      data.manager = { connect: { id: dto.managerId } };
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

  // --- SUBJECTIVE SCORE INPUT ---

  async recordSubjectiveScore(
    employeeId: string,
    period: string,
    score: number,
  ) {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await this.prisma.kpiPointLog.findMany({
      where: {
        employeeId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const objectiveScore =
      logs.length > 0 ? logs.reduce((sum, l) => sum + l.points, 0) : 0;
    const objectiveScoreCapped = Math.max(0, Math.min(100, objectiveScore));
    const finalScore = objectiveScoreCapped * 0.7 + score * 0.3;

    await this.saveKpiScore(
      employeeId,
      period,
      Math.round(finalScore * 100) / 100,
      objectiveScoreCapped,
      score,
      logs,
    );

    return {
      finalScore: Math.round(finalScore * 100) / 100,
      objectiveScore: objectiveScoreCapped,
      subjectiveScore: score,
    };
  }

  // --- PAYROLL (FIXED) ---

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

    // Fetch KPI config
    const config = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'KPI_RATE_PER_POINT',
            'BPJS_HEALTH_RATE',
            'BPJS_EMPLOYMENT_RATE',
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

    for (const emp of employees) {
      const kpiScore = await this.calculateEmployeeKPI(emp.id, period.name);
      const baseSalary = parseFloat(
        this.encryption.decrypt(emp.baseSalary || '0'),
      );
      const incentive = kpiScore * kpiRate;

      // Deductions: BPJS placeholder (configurable percentages)
      const bpjsHealth = baseSalary * bpjsHealthRate;
      const bpjsEmployment = baseSalary * bpjsEmploymentRate;
      const totalDeductions = bpjsHealth + bpjsEmployment;
      const netSalary = baseSalary + incentive - totalDeductions;

      await this.prisma.payrollItem.create({
        data: {
          payrollId: payroll.id,
          employeeId: emp.id,
          baseSalary: this.encryption.encrypt(baseSalary.toString()),
          kpiIncentive: this.encryption.encrypt(incentive.toString()),
          deductions: this.encryption.encrypt(totalDeductions.toString()),
          netSalary: this.encryption.encrypt(Math.max(0, netSalary).toString()),
        },
      });
    }

    return payroll;
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

      const primaryRole = emp.roles.find((r) => r.isPrimary) || emp.roles[0];

      return {
        id: emp.id,
        name: emp.name,
        email: emp.user?.email || null,
        position: primaryRole?.roleName || 'UNASSIGNED',
        department: primaryRole?.division || 'GENERAL',
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
