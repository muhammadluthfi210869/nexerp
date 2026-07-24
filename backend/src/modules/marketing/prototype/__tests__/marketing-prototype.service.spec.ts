import { Test, TestingModule } from '@nestjs/testing';
import { MarketingPrototypeService } from '../marketing-prototype.service';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('MarketingPrototypeService', () => {
  let service: MarketingPrototypeService;
  let prisma: PrismaService;

  const mockCollection = {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
  };

  const mockPrisma: Record<string, any> = {
    mktProtoTask: { ...mockCollection },
    mktProtoProject: { ...mockCollection },
    mktProtoTaskHistory: { create: jest.fn(), deleteMany: jest.fn() },
    mktProtoTaskComment: { create: jest.fn(), deleteMany: jest.fn() },
    mktProtoProfile: { findMany: jest.fn(), findUnique: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    mktProtoNotification: { findMany: jest.fn(), create: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn(), count: jest.fn(), upsert: jest.fn() },
    mktProtoSetting: { findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketingPrototypeService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<MarketingPrototypeService>(MarketingPrototypeService);
    jest.clearAllMocks();

    // Seed not needed — count returns 1
    mockPrisma.mktProtoTask.count.mockResolvedValue(1);
    // Settings default
    mockPrisma.mktProtoSetting.findUnique.mockResolvedValue(null);
    mockPrisma.mktProtoSetting.create.mockResolvedValue({
      id: 'default', completionWeight: 40, disciplineWeight: 30,
      qualityWeight: 15, productivityWeight: 15,
      workStart: '08:00', workEnd: '17:00',
      workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    });
  });

  describe('Manager authorization', () => {
    it('should allow SUPER_ADMIN to create tasks', async () => {
      mockPrisma.mktProtoTask.findUnique.mockResolvedValue({
        id: 'TSK-test', title: 'Test', projectId: 'PRJ-1', project: 'Test',
        brand: 'DREAMLAB', assignedBy: 'System', pic: 'Aurel', reviewer: 'Revi',
        priority: 'MEDIUM', startDate: new Date(), dueDate: new Date(),
        status: 'NOT_STARTED', sla: 'HEALTHY', notes: '',
        histories: [], comments: [],
      });
      mockPrisma.mktProtoTask.create.mockResolvedValue({ id: 'TSK-test' });
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        await cb(mockPrisma);
      });

      const result = await service.createTask(
        { email: 'admin@dreamlab.com', roles: ['SUPER_ADMIN'] },
        { title: 'Test' },
      );
      expect(result).toBeDefined();
    });

    it('should block non-manager from creating tasks', async () => {
      // Use a role NOT in managerRoleSet (SUPER_ADMIN, HEAD_OPS, MARKETING, DIGIMAR)
      await expect(
        service.createTask({ email: 'aurel@nexerp.id', roles: ['WAREHOUSE'] }, { title: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should block non-manager from deleting tasks', async () => {
      await expect(
        service.deleteTask({ email: 'aurel@nexerp.id', roles: ['WAREHOUSE'] }, 'TSK-xxx'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Data integrity', () => {
    it('deleteProject should reject when last project has tasks', async () => {
      mockPrisma.mktProtoProject.findFirst.mockResolvedValue(null);
      mockPrisma.mktProtoTask.count.mockResolvedValue(5);

      await expect(
        service.deleteProject({ email: 'revita@nexerp.id', roles: ['MARKETING'] }, 'PRJ-001'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Notification isolation', () => {
    it('markAllNotificationsRead should scope to viewer', async () => {
      mockPrisma.mktProtoNotification.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.mktProtoNotification.findMany.mockResolvedValue([]);

      await service.markAllNotificationsRead({
        email: 'revita@nexerp.id', roles: ['MARKETING'], fullName: 'Revi',
      });

      expect(mockPrisma.mktProtoNotification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { recipient: 'Revi' }, data: { unread: false } }),
      );
    });
  });

  describe('Settings caching', () => {
    it('should cache settings and not re-query on second call', async () => {
      mockPrisma.mktProtoSetting.findUnique.mockResolvedValue({
        id: 'default', completionWeight: 40, disciplineWeight: 30,
        qualityWeight: 15, productivityWeight: 15,
        workStart: '08:00', workEnd: '17:00',
        workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      });
      mockPrisma.mktProtoTask.findMany.mockResolvedValue([]);
      mockPrisma.mktProtoProject.findMany.mockResolvedValue([]);
      mockPrisma.mktProtoNotification.findMany.mockResolvedValue([]);
      mockPrisma.mktProtoProfile.findMany.mockResolvedValue([]);
      mockPrisma.mktProtoSetting.findUnique.mockClear();

      await service.getBundle();
      await service.getBundle();

      expect(mockPrisma.mktProtoSetting.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('Viewer resolution', () => {
    it('should identify Revita as manager by email', async () => {
      mockPrisma.mktProtoTask.findMany.mockResolvedValue([]);
      mockPrisma.mktProtoProject.findMany.mockResolvedValue([]);
      mockPrisma.mktProtoNotification.findMany.mockResolvedValue([]);
      mockPrisma.mktProtoProfile.findMany.mockResolvedValue([]);

      const result = await service.getBundle({
        email: 'revita@nexerp.id', roles: ['MARKETING'], fullName: 'Revita',
      });

      expect(result.viewer.isManager).toBe(true);
      expect(result.viewer.name).toBe('Revi');
    });
  });
});
