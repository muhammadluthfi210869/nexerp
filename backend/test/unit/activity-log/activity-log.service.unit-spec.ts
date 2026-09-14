import { LogActivityType } from '@prisma/client';
import { ActivityLogService } from '../../../src/modules/activity-log/activity-log.service';

describe('ActivityLogService', () => {
  let service: ActivityLogService;
  let prismaMock: {
    activityLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      activityLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
    };
    service = new ActivityLogService(prismaMock as never);
  });

  it('logs CREATE with mapped fields', async () => {
    await service.log({
      userId: 'user-1',
      type: LogActivityType.CREATE,
      method: 'POST',
      entityType: 'sales_leads',
      entityId: 'lead-uuid',
      path: '/api/sales-leads/lead-uuid',
    });

    expect(prismaMock.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        type: 'CREATE',
        method: 'POST',
        entityType: 'sales_leads',
        entityId: 'lead-uuid',
        path: '/api/sales-leads/lead-uuid',
      }),
    });
  });

  it('findForUser applies filters and limit', async () => {
    await service.findForUser('user-1', {
      type: LogActivityType.UPDATE,
      limit: 10,
    });

    expect(prismaMock.activityLog.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-1',
        type: 'UPDATE',
      }),
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  });

  it('purgeOlderThan defaults to 90 days', async () => {
    const deleted = await service.purgeOlderThan();
    expect(deleted).toBe(5);
    expect(prismaMock.activityLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
  });
});