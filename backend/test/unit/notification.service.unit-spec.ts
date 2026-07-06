import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../../src/modules/notification/notification.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';

describe('NotificationService â€” Unit', () => {
  let service: NotificationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  it('sendInApp persists a read-state false notification', async () => {
    await service.sendInApp('user-1', {
      title: 'Gate opened',
      body: 'Finance verified',
      type: 'GATE_OPENED',
      link: '/finance/dashboard',
    });

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Gate opened',
          body: 'Finance verified',
          type: 'GATE_OPENED',
          isRead: false,
        }),
      }),
    );
  });

  it('sendToRole fans out to all active users with the role', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', roles: ['FINANCE'], status: 'ACTIVE' },
      { id: 'u2', roles: ['FINANCE'], status: 'ACTIVE' },
    ]);

    await service.sendToRole('FINANCE', {
      title: 'Payable pending',
      body: 'Check invoice',
      type: 'HANDOVER',
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { roles: { has: 'FINANCE' }, status: 'ACTIVE' },
    });
    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
  });

  it('sendToDivision maps BD to COMMERCIAL and PRODUCTION to multiple roles', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await service.sendToDivision('BD', {
      title: 'Lead',
      body: 'New lead',
      type: 'GATE_OPENED',
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { roles: { has: 'COMMERCIAL' }, status: 'ACTIVE' },
    });

    jest.clearAllMocks();
    prisma.user.findMany.mockResolvedValue([]);

    await service.sendToDivision('PRODUCTION', {
      title: 'WO ready',
      body: 'Start batching',
      type: 'HANDOVER',
    });

    expect(prisma.user.findMany).toHaveBeenCalledTimes(3);
  });

  it('getUnreadNotifications returns only unread rows ordered by recency', async () => {
    prisma.notification.findMany.mockResolvedValue([
      { id: 'n1', isRead: false },
    ]);

    const result = await service.getUnreadNotifications('u1');

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    expect(result).toEqual([{ id: 'n1', isRead: false }]);
  });

  it('markAllAsRead updates the unread set for the user', async () => {
    await service.markAllAsRead('u1');

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', isRead: false },
      data: { isRead: true },
    });
  });
});
