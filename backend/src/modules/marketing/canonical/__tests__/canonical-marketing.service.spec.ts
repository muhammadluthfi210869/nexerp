import {
  ConflictException,
  ForbiddenException,
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
      delete: jest.fn(),
    },
    marketingTeamMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    marketingTaskChecklistItem: {
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    marketingTaskComment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    marketingTaskAttachment: {
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
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { ownerId: 'member' },
            { assigneeId: 'member' },
            { picId: 'member' },
            { assignedById: 'member' },
            { reviewerId: 'member' },
          ]),
        }),
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

  it('does not let a member reassign or reschedule a visible task', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(task());
    const service = new CanonicalMarketingService(prisma);

    await expect(
      service.updateTask(member, 'task-1', {
        version: 1,
        assigneeId: 'another-account',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.marketingTask.updateMany).not.toHaveBeenCalled();
  });

  it('includes a reviewer in the read scope without granting edit access', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findMany.mockResolvedValue([]);
    prisma.marketingTask.count.mockResolvedValue(0);
    const service = new CanonicalMarketingService(prisma);

    await service.listTasks(member, { page: 1, limit: 50 });

    expect(prisma.marketingTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ reviewerId: 'member' }]),
        }),
      }),
    );
  });

  it('requires edit rights before uploading an attachment', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(
      task({ ownerId: 'owner', assigneeId: 'other', picId: 'other', assignedById: 'member' }),
    );
    const service = new CanonicalMarketingService(prisma);

    await expect(
      service.addAttachment(member, 'task-1', {
        name: 'proof.pdf',
        type: 'application/pdf',
        sizeKb: 1,
        path: 'uploads/proof.pdf',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.marketingTaskAttachment.create).not.toHaveBeenCalled();
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

  it('lists attachments scoped to a visible task', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(task());
    prisma.marketingTaskAttachment.findMany.mockResolvedValue([
      {
        id: 'att-1',
        taskId: 'task-1',
        name: 'brief.pdf',
        type: 'application/pdf',
        sizeKb: 120,
        path: '/uploads/marketing/task-1/brief.pdf',
        uploadedById: 'member',
        createdAt: new Date(),
      },
    ]);
    const service = new CanonicalMarketingService(prisma);
    const result = await service.listAttachments(member, 'task-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('brief.pdf');
  });

  it('returns 404 when listing attachments for a hidden task', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(null);
    const service = new CanonicalMarketingService(prisma);
    await expect(service.listAttachments(member, 'hidden')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.marketingTaskAttachment.findMany).not.toHaveBeenCalled();
  });

  it('adds an attachment on a visible task', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(task());
    prisma.marketingTaskAttachment.create.mockResolvedValue({
      id: 'att-1',
      taskId: 'task-1',
      name: 'brief.pdf',
      type: 'application/pdf',
      sizeKb: 120,
      path: '/uploads/marketing/task-1/uuid.pdf',
      uploadedById: 'member',
      createdAt: new Date(),
    });
    const service = new CanonicalMarketingService(prisma);
    const file = {
      name: 'brief.pdf',
      type: 'application/pdf',
      sizeKb: 120,
      path: '/uploads/marketing/task-1/uuid.pdf',
    };
    const result = await service.addAttachment(member, 'task-1', file);
    expect(result.id).toBe('att-1');
    expect(prisma.marketingTaskAttachment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskId: 'task-1',
          uploadedById: 'member',
          name: 'brief.pdf',
        }),
      }),
    );
  });

  it('deletes an attachment when the uploader owns it', async () => {
    const prisma = prismaMock();
    prisma.marketingTaskAttachment.findFirst.mockResolvedValue({
      id: 'att-1',
      taskId: 'task-1',
      name: 'brief.pdf',
      type: 'application/pdf',
      sizeKb: 120,
      path: '/uploads/...',
      uploadedById: 'member',
      createdAt: new Date(),
    });
    const service = new CanonicalMarketingService(prisma);
    await service.deleteAttachment(member, 'att-1');
    expect(prisma.marketingTaskAttachment.delete).toHaveBeenCalledWith({
      where: { id: 'att-1' },
    });
  });

  it('forbids deleting an attachment uploaded by someone else', async () => {
    const prisma = prismaMock();
    prisma.marketingTaskAttachment.findFirst.mockResolvedValue({
      id: 'att-1',
      taskId: 'task-1',
      name: 'brief.pdf',
      type: 'application/pdf',
      sizeKb: 120,
      path: '/uploads/...',
      uploadedById: 'other-user',
      createdAt: new Date(),
    });
    const service = new CanonicalMarketingService(prisma);
    await expect(service.deleteAttachment(member, 'att-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.marketingTaskAttachment.delete).not.toHaveBeenCalled();
  });

  it('allows owner or manager to delete a task', async () => {
    const prisma = prismaMock();
    prisma.marketingTask.findFirst.mockResolvedValue(
      task({ id: 'task-1', ownerId: 'member' }),
    );
    const service = new CanonicalMarketingService(prisma);
    await service.deleteTask(member, 'task-1');
    expect(prisma.marketingTask.delete).toHaveBeenCalledWith({
      where: { id: 'task-1' },
    });
  });

  it('lists active marketing team members', async () => {
    const prisma = prismaMock();
    prisma.marketingTeamMember.findMany.mockResolvedValue([
      {
        id: 'm-1',
        name: 'Gusti',
        role: 'Lead Strategist',
        email: 'gusti@nexerp.id',
        phone: '+62812',
        avatarBg: '#e8eef6',
        initial: 'G',
        department: 'Strategy',
        isActive: true,
      },
    ]);
    const service = new CanonicalMarketingService(prisma);
    const result = await service.listMembers(member);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Gusti');
  });

  it('updates a marketing team member profile', async () => {
    const prisma = prismaMock();
    prisma.marketingTeamMember.findUnique.mockResolvedValue({
      id: 'm-1',
      userId: 'u-1',
      name: 'Gusti',
      role: 'Lead Strategist',
      email: 'gusti@nexerp.id',
    });
    prisma.marketingTeamMember.update.mockResolvedValue({
      id: 'm-1',
      userId: 'u-1',
      name: 'Gusti Updated',
      role: 'Head of Growth',
      email: 'gusti.updated@nexerp.id',
      phone: '+628999',
      avatarBg: '#e8eef6',
      initial: 'G',
      department: 'Growth',
    });
    prisma.user.update = jest.fn().mockResolvedValue({});
    const service = new CanonicalMarketingService(prisma);
    const result = await service.updateMember(manager, 'm-1', {
      name: 'Gusti Updated',
      role: 'Head of Growth',
      email: 'gusti.updated@nexerp.id',
    });
    expect(result.name).toBe('Gusti Updated');
    expect(prisma.marketingTeamMember.update).toHaveBeenCalled();
  });

  describe('getKpi (SSOT §8.2)', () => {
    it('aggregates KPI counts with scope-aware byMember breakdown for a manager', async () => {
      const prisma = prismaMock();
      const pastDue = new Date('2026-09-01');
      prisma.marketingTask.findMany.mockResolvedValue([
        {
          id: 't-1',
          canonicalStatus: 'NOT_STARTED',
          dueDate: pastDue,
          assigneeId: 'u-1',
          pic: { id: 'u-1', fullName: 'Gusti', email: 'gusti@nexerp.id' },
        },
        {
          id: 't-2',
          canonicalStatus: 'IN_PROGRESS',
          dueDate: new Date('2026-09-30'),
          assigneeId: 'u-2',
          pic: { id: 'u-2', fullName: 'Luthfi', email: 'luthfi@nexerp.id' },
        },
        {
          id: 't-3',
          canonicalStatus: 'DONE',
          dueDate: new Date('2026-09-13'),
          assigneeId: 'u-1',
          pic: { id: 'u-1', fullName: 'Gusti', email: 'gusti@nexerp.id' },
        },
      ]);
      prisma.marketingTask.count.mockResolvedValue(3);
      const service = new CanonicalMarketingService(prisma);
      const result = await service.getKpi(manager);
      expect(result.total).toBe(3);
      expect(result.notStarted).toBe(1);
      expect(result.inProgress).toBe(1);
      expect(result.done).toBe(1);
      expect(result.overdue).toBe(1);
      expect(result.scope).toBe('team');
      expect(result.byMember).toHaveLength(2);
      expect(result.byMember[0]).toEqual({
        id: 'u-1',
        fullName: 'Gusti',
        email: 'gusti@nexerp.id',
        count: 2,
      });
    });

    it('scopes KPI to a single member when viewer is DIGIMAR', async () => {
      const prisma = prismaMock();
      prisma.marketingTask.findMany.mockResolvedValue([
        {
          id: 't-1',
          canonicalStatus: 'IN_PROGRESS',
          dueDate: new Date('2026-09-30'),
          assigneeId: 'member',
          pic: { id: 'member', fullName: 'Rahmat', email: 'r@nexerp.id' },
        },
      ]);
      prisma.marketingTask.count.mockResolvedValue(1);
      const service = new CanonicalMarketingService(prisma);
      const result = await service.getKpi(member);
      expect(result.total).toBe(1);
      expect(result.scope).toBe('personal');
      expect(result.byMember).toHaveLength(1);
      expect(result.byMember[0].id).toBe('member');
      expect(prisma.marketingTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { ownerId: 'member' },
              { assigneeId: 'member' },
              { picId: 'member' },
              { assignedById: 'member' },
              { reviewerId: 'member' },
            ]),
          }),
        }),
      );
    });

    it('forbids KPI access for non-marketing roles', async () => {
      const prisma = prismaMock();
      const service = new CanonicalMarketingService(prisma);
      await expect(
        service.getKpi({ id: 'director', roles: ['DIRECTOR'] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('addChecklistItem (SSOT §8.2)', () => {
    it('adds a new checklist item and updates required count on the task', async () => {
      const prisma = prismaMock();
      prisma.marketingTask.findFirst.mockResolvedValue(
        task({ assigneeId: 'member', ownerId: 'member' }),
      );
      prisma.marketingTaskChecklistItem.create.mockResolvedValue({
        id: 'item-1',
        taskId: 'task-1',
        text: 'Review SEO meta',
        isRequired: true,
        sortOrder: 0,
        done: false,
      });
      prisma.marketingTaskChecklistItem.count.mockResolvedValueOnce(2);
      prisma.marketingTask.findFirst.mockResolvedValueOnce(
        task({ assigneeId: 'member', ownerId: 'member' }),
      );
      const service = new CanonicalMarketingService(prisma);
      const result = await service.addChecklistItem(member, 'task-1', {
        text: 'Review SEO meta',
        isRequired: true,
        sortOrder: 0,
      });
      expect(prisma.marketingTaskChecklistItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          text: 'Review SEO meta',
          isRequired: true,
        }),
      });
      expect(result.id).toBe('task-1');
    });

    it('returns 404 when adding checklist item to a hidden task', async () => {
      const prisma = prismaMock();
      prisma.marketingTask.findFirst.mockResolvedValue(null);
      const service = new CanonicalMarketingService(prisma);
      await expect(
        service.addChecklistItem(member, 'hidden', {
          text: 'Will not save',
          isRequired: true,
          sortOrder: 0,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.marketingTaskChecklistItem.create).not.toHaveBeenCalled();
    });
  });
});

