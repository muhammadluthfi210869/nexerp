import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EncryptionService } from '../../../shared/encryption.service';
import { Division, Prisma } from '@prisma/client';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';

@Injectable()
export class HrEmployeeService {
  private readonly logger = new Logger(HrEmployeeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
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

  // --- MASTER DATA & EMPLOYEES ---

  async getAllEmployees() {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      include: {
        roles: true,
        user: { select: { id: true, email: true, fullName: true, status: true, roles: true } },
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
        user: { select: { id: true, email: true, fullName: true, status: true, roles: true } },
        manager: { select: { id: true, name: true } },
        subordinates: { select: { id: true, name: true, roles: true } },
      },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
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
}
