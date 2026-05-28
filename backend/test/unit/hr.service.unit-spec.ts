import { Test, TestingModule } from '@nestjs/testing';
import { HrService } from '../../src/modules/hr/hr.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EncryptionService } from '../../src/shared/encryption.service';
import { GeofencingService } from '../../src/shared/geofencing.service';
import { NotFoundException } from '@nestjs/common';
import { TestModule } from '../utilities/test-module';

describe('HrService — Unit', () => {
  let service: HrService;
  let prisma: any;

  beforeEach(async () => {
    const hrCollections = [
      'employee', 'attendance', 'ticket', 'systemConfig', 'kpiScore',
      'kpiPointLog', 'employeeRoleMapping', 'payroll', 'payrollItem', 'financialPeriod',
    ];
    const hrOverrides: Record<string, any> = {};
    for (const col of hrCollections) {
      hrOverrides[col] = {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        upsert: jest.fn(),
      };
    }
    prisma = TestModule.mockPrisma(hrOverrides);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((v: string) => `enc:${v}`),
            decrypt: jest.fn((v: string) => v.replace('enc:', '')),
          },
        },
        {
          provide: GeofencingService,
          useValue: {
            isWithinRadius: jest.fn().mockReturnValue({ isWithin: true, distance: 10 }),
          },
        },
      ],
    }).compile();

    service = module.get<HrService>(HrService);
  });

  describe('getHrDashboard', () => {
    it('returns dashboard metrics with active employees and critical contracts', async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 15);

      prisma.employee.count.mockResolvedValue(25);
      prisma.employee.findMany
        .mockResolvedValueOnce([
          { id: 'EMP-1', name: 'Budi', contractEnd: futureDate },
        ])
        .mockResolvedValueOnce([
          { id: 'EMP-1', roles: [{ division: 'HR', isPrimary: true }] },
        ]);
      prisma.kpiScore.findMany
        .mockResolvedValueOnce([
          { employeeId: 'EMP-1', finalScore: 85, employee: { name: 'Budi' } },
        ])
        .mockResolvedValueOnce([
          { employeeId: 'EMP-1', finalScore: 85 },
          { employeeId: 'EMP-2', finalScore: 70 },
        ]);

      const result = await service.getHrDashboard();

      expect(result.totalActive).toBe(25);
      expect(result.criticalContractsCount).toBe(1);
      expect(result.latestScores).toHaveLength(1);
      expect(result.latestAvgKpi).toBe(77.5);
      expect(result.divisionStats).toBeDefined();
    });

    it('returns zero metrics when no data exists', async () => {
      prisma.employee.count.mockResolvedValue(0);
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.kpiScore.findMany.mockResolvedValue([]);

      const result = await service.getHrDashboard();

      expect(result.totalActive).toBe(0);
      expect(result.criticalContractsCount).toBe(0);
      expect(result.latestAvgKpi).toBe(0);
      expect(result.divisionStats).toEqual([]);
    });
  });

  describe('getAllEmployees', () => {
    it('returns mapped employees with computed daysLeft', async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 45);

      prisma.employee.findMany.mockResolvedValue([
        {
          id: 'EMP-1',
          name: 'Andi',
          joinedAt: new Date('2025-01-15'),
          contractEnd: futureDate,
          contractType: 'PERMANENT',
          isActive: true,
          roles: [{ roleName: 'Staff', division: 'HR', isPrimary: true }],
          user: { email: 'andi@test.com' },
          manager: { id: 'MGR-1', name: 'Manager A' },
        },
      ]);

      const result = await service.getAllEmployees();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('EMP-1');
      expect(result[0].name).toBe('Andi');
      expect(result[0].email).toBe('andi@test.com');
      expect(result[0].position).toBe('Staff');
      expect(result[0].department).toBe('HR');
      expect(result[0].daysLeft).toBe(45);
      expect(result[0].contractType).toBe('PERMANENT');
    });

    it('returns UNASSIGNED position when no roles exist', async () => {
      prisma.employee.findMany.mockResolvedValue([
        {
          id: 'EMP-2',
          name: 'Sari',
          joinedAt: new Date('2025-06-01'),
          contractEnd: null,
          contractType: 'CONTRACT',
          isActive: true,
          roles: [],
          user: null,
          manager: null,
        },
      ]);

      const result = await service.getAllEmployees();

      expect(result[0].position).toBe('UNASSIGNED');
      expect(result[0].department).toBe('GENERAL');
      expect(result[0].email).toBeNull();
      expect(result[0].daysLeft).toBeNull();
      expect(result[0].contractType).toBe('CONTRACT');
    });

    it('returns empty array when no active employees', async () => {
      prisma.employee.findMany.mockResolvedValue([]);

      const result = await service.getAllEmployees();

      expect(result).toEqual([]);
    });
  });

  describe('getEmployeeById', () => {
    it('returns employee with all includes when found', async () => {
      const mockEmployee = {
        id: 'EMP-1',
        name: 'Budi',
        roles: [{ roleName: 'Staff', division: 'HR' }],
        user: { email: 'budi@test.com' },
        manager: { id: 'MGR-1', name: 'Manager' },
        subordinates: [],
      };
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await service.getEmployeeById('EMP-1');

      expect(result).toEqual(mockEmployee);
      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'EMP-1' },
        include: {
          roles: true,
          user: true,
          manager: { select: { id: true, name: true } },
          subordinates: { select: { id: true, name: true, roles: true } },
        },
      });
    });

    it('throws NotFoundException when employee does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.getEmployeeById('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('clockIn', () => {
    it('creates attendance when employee is active and within geofence', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      prisma.employee.findUnique.mockResolvedValue({
        id: 'EMP-1',
        isActive: true,
      });
      prisma.attendance.findFirst.mockResolvedValue(null);
      prisma.ticket.findFirst.mockResolvedValue(null);
      prisma.systemConfig.findMany.mockResolvedValue([
        { key: 'FACTORY_LAT', value: '-6.2' },
        { key: 'FACTORY_LNG', value: '106.8' },
        { key: 'WORK_START_HOUR', value: '8' },
        { key: 'WORK_START_MINUTE', value: '0' },
      ]);
      prisma.attendance.create.mockResolvedValue({
        id: 'ATT-1',
        employeeId: 'EMP-1',
        status: 'ON_TIME',
      });

      const result = await service.clockIn('EMP-1', -6.2, 106.8);

      expect(result.status).toBe('ON_TIME');
      expect(prisma.attendance.create).toHaveBeenCalled();
    });

    it('throws when employee not found', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.clockIn('BAD', -6.2, 106.8)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when employee already clocked in today', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'EMP-1',
        isActive: true,
      });
      prisma.attendance.findFirst.mockResolvedValue({
        id: 'ATT-EXISTING',
        clockOut: null,
      });

      await expect(service.clockIn('EMP-1', -6.2, 106.8)).rejects.toThrow(
        'Already clocked in today',
      );
    });

    it('throws when employee is on approved leave', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'EMP-1',
        isActive: true,
      });
      prisma.attendance.findFirst.mockResolvedValue(null);
      prisma.ticket.findFirst.mockResolvedValue({
        id: 'TKT-1',
        type: 'LEAVE',
        status: 'APPROVED',
      });

      await expect(service.clockIn('EMP-1', -6.2, 106.8)).rejects.toThrow(
        'Employee is on approved leave',
      );
    });
  });

  describe('clockOut', () => {
    it('updates attendance with clockOut time', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'EMP-1',
        isActive: true,
      });
      prisma.attendance.findFirst.mockResolvedValue({
        id: 'ATT-1',
        clockIn: new Date(),
      });
      prisma.attendance.update.mockResolvedValue({
        id: 'ATT-1',
        clockOut: new Date(),
      });

      const result = await service.clockOut('EMP-1');

      expect(result).toBeDefined();
      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 'ATT-1' },
        data: { clockOut: expect.any(Date) },
      });
    });

    it('throws when no active clock-in found', async () => {
      prisma.employee.findUnique.mockResolvedValue({
        id: 'EMP-1',
        isActive: true,
      });
      prisma.attendance.findFirst.mockResolvedValue(null);

      await expect(service.clockOut('EMP-1')).rejects.toThrow(
        'No active clock-in found for today',
      );
    });

    it('throws when employee not found', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.clockOut('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateDraftPayroll', () => {
    it('throws when financial period not found', async () => {
      prisma.financialPeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.generateDraftPayroll('INVALID-PERIOD'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when draft payroll already exists', async () => {
      prisma.financialPeriod.findFirst.mockResolvedValue({
        id: 'FP-1',
        name: '2026-01',
      });
      prisma.payroll.findFirst.mockResolvedValue({
        id: 'PAY-1',
        status: 'DRAFT',
      });

      await expect(service.generateDraftPayroll('2026-01')).rejects.toThrow(
        'Draft payroll already exists',
      );
    });

    it('creates payroll with items for active employees', async () => {
      const periodObj = { id: 'FP-1', name: '2026-01' };
      prisma.financialPeriod.findFirst.mockResolvedValue(periodObj);
      prisma.payroll.findFirst.mockResolvedValue(null);
      prisma.employee.findMany.mockResolvedValue([
        {
          id: 'EMP-1',
          isActive: true,
          baseSalary: 'enc:5000000',
          roles: [{ division: 'HR' }],
        },
      ]);
      prisma.systemConfig.findMany.mockResolvedValue([
        { key: 'KPI_RATE_PER_POINT', value: '1000' },
        { key: 'BPJS_HEALTH_RATE', value: '0.01' },
        { key: 'BPJS_EMPLOYMENT_RATE', value: '0.02' },
      ]);
      prisma.kpiPointLog.findMany.mockResolvedValue([]);
      prisma.employeeRoleMapping.findMany.mockResolvedValue([]);
      prisma.kpiScore.upsert.mockResolvedValue({});
      prisma.payroll.create.mockResolvedValue({
        id: 'PAY-1',
        status: 'DRAFT',
      });
      prisma.payrollItem.create.mockResolvedValue({});

      const result = await service.generateDraftPayroll('2026-01');

      expect(result.status).toBe('DRAFT');
      expect(prisma.payroll.create).toHaveBeenCalled();
      expect(prisma.payrollItem.create).toHaveBeenCalled();
    });
  });
});
