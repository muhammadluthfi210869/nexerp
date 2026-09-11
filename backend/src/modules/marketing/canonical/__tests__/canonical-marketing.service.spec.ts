import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CanonicalMarketingService } from '../canonical-marketing.service';

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    taskCode: 'MKT-1',
    taskType: 'DAILY',
    title: 'Daily post',
    projectId: null,
    project: null,
    brandId: null,
    brandRef: null,
    channel: 'Instagram',
    category: 'content',
    ownerId: 'owner',
    assigneeId: 'member',
    picId: 'member',
    pic: null,
    reviewerId: null,
    reviewer: null,
    priority: 'MEDIUM',
    canonicalStatus: 'NOT_STARTED',
    startDate: new Date('2026-09-10'),
    dueDate: new Date('2026-09-11'),
    completedAt: null,
    brief: null,
    outputUrl: null,
    referenceUrl: null,
    estimatedMinutes: 0,
    actualMinutes: 0,
    version: 1,
    checklist: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function prismaMock() {
  const prisma: any = {
    marketingTask: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    marketingTaskChecklistItem: {
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    marketingTaskComment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    marketingTaskHistory: { create: jest.fn() },
    marketingProject: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    marketingBrand: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    marketingReportingPeriod: {
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
    },
    brandChannelMetric: { upsert: jest.fn() },
    marketingIntegrationConnection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    marketingIntegrationSyncJob: { create: jest.fn() },
    marketingIdempotencyKey: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    user: { findFirst: jest.fn() },
  };
  prisma.$transaction = jest.fn(async (value: any) =>
    typeof value === 'function' ? value(prisma) : Promise.all(value),
  );
  return prisma;
}

describe('CanonicalMarketingService', () => {
  const manager = {
    id: 'manager',
    email: 'manager@nexerp.id',
    roles: ['MARKETING'],
  };
  const member = {
    id: 'member',
    email: 'member@nexerp.id',
    roles: ['DIGIMAR'],
  };

  afterEach(() => delete process.env.MARKETING_INTEGRATION_KEY);

  it('scopes a DIGIMAR task list to related identities', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findMany.mockResolvedValue([task()]);
    prisma.marketingTask.count.mockResolvedValue(1);
    const service = new CanonicalMarketingService(prisma);

    const result = await service.listTasks(member, { page: 1, limit: 50 });

    expect(result.total).toBe(1);
    expect(prisma.marketingTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { ownerId: 'member' },
            { assigneeId: 'member' },
            { picId: 'member' },
            { assignedById: 'member' },
          ],
        },
      }),
    );
  });

  it('returns 404 for an object outside member scope', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(null);
    const service = new CanonicalMarketingService(prisma);
    await expect(service.getTask(member, 'hidden')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.marketingTask.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'hidden', OR: expect.any(Array) }),
      }),
    );
  });

  it('returns 409 when optimistic task version is stale', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(task());
    prisma.marketingTask.updateMany.mockResolvedValue({ count: 0 });
    const service = new CanonicalMarketingService(prisma);
    await expect(
      service.updateTask(member, 'task-1', { version: 1, title: 'Changed' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('replays a persistent idempotency result without a second create', async () => {
    const prisma = prismaMock();
    prisma.marketingIdempotencyKey.findUnique.mockResolvedValue({
      requestHash: 'unused',
      responseBody: { id: 'brand-1' },
      expiresAt: new Date(Date.now() + 60_000),
    });
    const service = new CanonicalMarketingService(prisma);
    const dto = { code: 'BRAND_X', name: 'Brand X' };
    const crypto = await import('node:crypto');
    prisma.marketingIdempotencyKey.findUnique.mockResolvedValue({
      requestHash: crypto
        .createHash('sha256')
        .update(JSON.stringify(dto))
        .digest('hex'),
      responseBody: { id: 'brand-1' },
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(
      service.createBrand(manager, dto, 'request-12345'),
    ).resolves.toEqual({ id: 'brand-1' });
    expect(prisma.marketingBrand.create).not.toHaveBeenCalled();
  });

  it('never selects encrypted integration secret fields for browser output', async () => {
    const prisma = prismaMock();
    prisma.marketingIntegrationConnection.findMany.mockResolvedValue([]);
    const service = new CanonicalMarketingService(prisma);
    await service.listIntegrations(manager);
    const select =
      prisma.marketingIntegrationConnection.findMany.mock.calls[0][0].select;
    expect(select.secretCiphertext).toBeUndefined();
    expect(select.secretIv).toBeUndefined();
    expect(select.secretTag).toBeUndefined();
  });

  it('refuses secret persistence without a configured encryption key', async () => {
    const prisma = prismaMock();
    prisma.marketingBrand.findFirst.mockResolvedValue({
      id: 'brand-1',
      name: 'Brand',
    });
    prisma.marketingIntegrationConnection.upsert.mockResolvedValue({});
    const service = new CanonicalMarketingService(prisma);
    await expect(
      service.configureIntegration(manager, {
        brandId: 'brand-1',
        provider: 'META',
        secret: 'top-secret',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.marketingIntegrationConnection.upsert).not.toHaveBeenCalled();
  });

  it('creates a comment on a visible task', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(task());
    prisma.marketingTaskComment.create.mockResolvedValue({
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'member',
      body: 'Looks good',
      createdAt: new Date('2026-09-11T10:00:00Z'),
    });
    const service = new CanonicalMarketingService(prisma);
    const result = await service.createComment(member, 'task-1', {
      body: 'Looks good',
    });
    expect(result.id).toBe('comment-1');
    expect(prisma.marketingTaskComment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: 'task-1',
          authorId: 'member',
          body: 'Looks good',
        }),
      }),
    );
  });

  it('returns 404 when creating a comment on a hidden task', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(null);
    const service = new CanonicalMarketingService(prisma);
    await expect(
      service.createComment(member, 'hidden', { body: 'Hi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.marketingTaskComment.create).not.toHaveBeenCalled();
  });

  it('deletes a comment when the author owns it', async () => {
    const prisma = prismaMock();
    prisma.marketingTaskComment.findFirst.mockResolvedValue({
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'member',
      body: 'Hi',
      createdAt: new Date(),
    });
    const service = new CanonicalMarketingService(prisma);
    await service.deleteComment(member, 'comment-1');
    expect(prisma.marketingTaskComment.delete).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
    });
  });

  it('forbids deleting a comment authored by someone else', async () => {
    const prisma = prismaMock();
    prisma.marketingTaskComment.findFirst.mockResolvedValue({
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'other-user',
      body: 'Hi',
      createdAt: new Date(),
    });
    const service = new CanonicalMarketingService(prisma);
    await expect(service.deleteComment(member, 'comment-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.marketingTaskComment.delete).not.toHaveBeenCalled();
  });
});
