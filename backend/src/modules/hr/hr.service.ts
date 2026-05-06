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

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private geofencing: GeofencingService,
  ) {}

  // --- ATTENDANCE & GEOFENCING ---

  async clockIn(employeeId: string, lat: number, lng: number) {
    const config = await this.prisma.systemConfig.findMany({
      where: { key: { in: ['FACTORY_LAT', 'FACTORY_LNG'] } },
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

    if (!geo.isWithin) {
      throw new ForbiddenException(
        `Outside geofence radius. Distance: ${geo.distance}m`,
      );
    }

    return this.prisma.attendance.create({
      data: {
        employeeId,
        clockIn: new Date(),
        lat,
        lng,
        distanceFromFactory: geo.distance,
        status: AttendanceStatus.ON_TIME,
      },
    });
  }

  // --- PASSIVE KPI CALCULATION ---

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
      return logs.reduce((sum, log) => sum + log.points, 0);
    }

    const pointsByDivision: Record<string, number> = {};

    for (const log of logs) {
      const def = await this.prisma.kpiMetricDefinition.findUnique({
        where: { eventCode: log.metricCode },
      });
      if (def) {
        pointsByDivision[def.division] =
          (pointsByDivision[def.division] || 0) + log.points;
      }
    }

    let totalWeightedScore = 0;
    for (const role of roles) {
      const divisionPoints = pointsByDivision[role.division] || 0;
      totalWeightedScore += divisionPoints * Number(role.weight);
    }

    return totalWeightedScore;
  }

  // --- PAYROLL TWO-TIER APPROVAL ---

  async generateDraftPayroll(periodName: string) {
    const period = await this.prisma.financialPeriod.findFirst({
      where: { name: periodName },
    });
    if (!period)
      throw new NotFoundException(`Financial Period '${periodName}' not found`);

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

    for (const emp of employees) {
      const kpiScore = await this.calculateEmployeeKPI(emp.id, period.name);

      const baseSalary = parseFloat(
        this.encryption.decrypt(emp.baseSalary || '0'),
      );
      const incentive = kpiScore * 1000;
      const deductions = 0;
      const netSalary = baseSalary + incentive - deductions;

      await this.prisma.payrollItem.create({
        data: {
          payrollId: payroll.id,
          employeeId: emp.id,
          baseSalary: this.encryption.encrypt(baseSalary.toString()),
          kpiIncentive: this.encryption.encrypt(incentive.toString()),
          deductions: this.encryption.encrypt(deductions.toString()),
          netSalary: this.encryption.encrypt(netSalary.toString()),
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

    return this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: PayrollStatus.AUTHORIZED,
        authorizedById,
        authorizedAt: new Date(),
      },
    });
  }

  // --- MASTER DATA & EMPLOYEES ---

  async getAllEmployees() {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      include: { roles: true, user: true },
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
      };
    });
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

  // --- NEW: EXECUTIVE SUMMARY ---

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

    // Calculate budget & savings from latest payroll
    let totalBudget = 0;
    const totalSavings = 0;
    if (payrolls.length > 0) {
      for (const item of payrolls[0].items) {
        const base = parseFloat(
          this.encryption.decrypt(item.baseSalary) || '0',
        );
        totalBudget += base;
      }
    }

    // Get latest KPI scores for average
    const latestScores = await this.prisma.kpiScore.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    const avgKpi =
      latestScores.length > 0
        ? latestScores.reduce((s, k) => s + k.finalScore, 0) /
          latestScores.length
        : 0;

    // Count active tickets (interviews/hiring as proxy)
    const activeTickets = await this.prisma.ticket.count({
      where: { status: 'PENDING' },
    });

    // Turnover rate (approximate: employees with isActive=false / total)
    const totalEver = await this.prisma.employee.count();
    const turnoverRate =
      totalEver > 0 ? ((totalEver - totalActive) / totalEver) * 100 : 0;

    return {
      budgetSavings: `Rp ${(totalBudget / 1000000).toFixed(0)} M`,
      savingsValue: `+ Rp ${Math.floor(totalSavings / 1000000)} JT SAVINGS`,
      hiringSpeed: '18 Days',
      hiringSub: 'AVG TIME TO FILL',
      stabilityIndex: `${turnoverRate.toFixed(1)}%`,
      stabilitySub: 'TURNOVER RATE',
      workload: activeTickets,
      workloadSub: 'ACTIVE TICKETS',
      avgKpi: `${(avgKpi / 10).toFixed(1)}/10`,
      avgKpiSub: 'DEPT PERFORMANCE',
    };
  }

  // --- NEW: DEPARTMENT SCORES ---

  async getDepartmentScores() {
    const divisions = Object.values(Division);
    const today = new Date();

    const result = [];

    for (const division of divisions) {
      const employees = await this.prisma.employee.findMany({
        where: {
          isActive: true,
          roles: { some: { division } },
        },
        include: {
          roles: { where: { division } },
          kpiScores: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          user: true,
        },
      });

      if (employees.length === 0) continue;

      const employeesWithKpi = employees.map((emp) => {
        const latestScore = emp.kpiScores[0];
        const primaryRole = emp.roles.find((r) => r.isPrimary) || emp.roles[0];
        let daysLeft: number | null = null;
        if (emp.contractEnd) {
          daysLeft = Math.ceil(
            (emp.contractEnd.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          );
        }

        const finalScore = latestScore?.finalScore || 0;
        const metricsData = latestScore?.metricsData || {};

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
          disiplin: (metricsData as any)?.discipline || 90,
          output: (metricsData as any)?.output || 'NORMAL',
          attitude: (metricsData as any)?.attitude || 4.0,
          type:
            emp.contractType === 'PERMANENT'
              ? 'TETAP'
              : emp.contractType === 'PROBATION'
                ? 'PROBATION'
                : `PKWT`,
          rev: 0,
        };
      });

      const avgKpi =
        employeesWithKpi.length > 0
          ? employeesWithKpi.reduce((s, e) => s + e.kpi, 0) /
            employeesWithKpi.length
          : 0;

      result.push({
        division,
        employeeCount: employeesWithKpi.length,
        avgKpi: Math.round(avgKpi * 10) / 10,
        employees: employeesWithKpi,
      });
    }

    return result;
  }

  // --- NEW: DEPARTMENT EMPLOYEES BY DIVISION ---

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
        disiplin: (metricsData as any)?.discipline || 90,
        output: (metricsData as any)?.output || 'NORMAL',
        attitude: (metricsData as any)?.attitude || 4.0,
        type:
          emp.contractType === 'PERMANENT'
            ? 'TETAP'
            : emp.contractType === 'PROBATION'
              ? 'PROBATION'
              : `PKWT`,
        rev: latestScore ? Math.floor(Math.random() * 3) : 0,
      };
    });
  }

  // --- NEW: CONTRACT AUDIT ---

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
        rev: 0,
      };
    });
  }

  // --- NEW: EMPLOYEE ATTENDANCE STATS ---

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
