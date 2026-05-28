import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../../src/modules/notification/notification.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { TestModule } from '../utilities/test-module';

describe('NotificationService — Unit', () => {
  let service: NotificationService;
  let prisma: any;

  const userId = 'USER-001';

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    prisma.notification = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('getAllNotifications', () => {
    it('returns notifications for user', async () => {
      prisma.notification.findMany = jest.fn().mockResolvedValue([
        { id: 'N-1', title: 'Test', body: 'Body', isRead: false },
        { id: 'N-2', title: 'Test 2', body: 'Body 2', isRead: true },
      ]);

      const result = await service.getAllNotifications(userId);
      expect(result).toHaveLength(2);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
    });

    it('respects limit parameter', async () => {
      prisma.notification.findMany = jest.fn().mockResolvedValue([]);

      await service.getAllNotifications(userId, 10);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('getUnreadNotifications', () => {
    it('returns only unread notifications', async () => {
      prisma.notification.findMany = jest.fn().mockResolvedValue([
        { id: 'N-1', title: 'Unread', isRead: false },
      ]);

      const result = await service.getUnreadNotifications(userId);
      expect(result).toHaveLength(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, isRead: false },
        }),
      );
    });

    it('returns empty array when all read', async () => {
      prisma.notification.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getUnreadNotifications(userId);
      expect(result).toHaveLength(0);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      prisma.notification.update = jest.fn().mockResolvedValue({
        id: 'N-1',
        isRead: true,
      });

      const result = await service.markAsRead('N-1');
      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'N-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('marks all user notifications as read', async () => {
      prisma.notification.updateMany = jest.fn().mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(userId);
      expect(result.count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('sendInApp', () => {
    it('creates notification record', async () => {
      prisma.notification.create = jest.fn().mockResolvedValue({ id: 'N-1' });

      await service.sendInApp(userId, {
        title: 'Test Title',
        body: 'Test Body',
        type: 'GATE_OPENED',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            title: 'Test Title',
            body: 'Test Body',
            type: 'GATE_OPENED',
            isRead: false,
          }),
        }),
      );
    });
  });
});
