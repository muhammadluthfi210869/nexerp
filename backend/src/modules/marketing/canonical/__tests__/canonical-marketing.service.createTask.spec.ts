import { ForbiddenException } from '@nestjs/common';
import { CanonicalMarketingService } from '../canonical-marketing.service';

// ponytail: regression guard for the dual-write path. createTask is the only
// write that mutates BOTH `status` (legacy string) and `canonicalStatus`
// (canonical enum) — collapsing to single-write is deferred (see plan).
// This spec is intentionally minimal: proves the contract so any future
// refactor that drops one of the two writes trips here first.

function prismaMock() {
  const prisma: any = {
    marketingTask: {
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    marketingTeamMember: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    marketingProject: { findFirst: jest.fn(), create: jest.fn() },
    marketingTaskHistory: { create: jest.fn() },
    marketingTaskChecklistItem: { count: jest.fn() },
    marketingIdempotencyKey: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  };
  prisma.$transaction = jest.fn(async (value: any) =>
    typeof value === 'function' ? value(prisma) : Promise.all(value),
  );
  return prisma;
}

const manager = { id: 'mgr', email: 'mgr@nexerp.id', roles: ['MARKETING'] };
const member = { id: 'mem', email: 'mem@nexerp.id', roles: ['DIGIMAR'] };

describe('CanonicalMarketingService.createTask', () => {
  it('member creates task for self → dual-writes status=OPEN + canonicalStatus=NOT_STARTED + history row', async () => {
    const prisma = prismaMock();
    prisma.user.findFirst.mockResolvedValue({ id: 'mem', status: 'ACTIVE' });
    prisma.marketingTask.create.mockResolvedValue({
      id: 'new-id',
      taskCode: 'MKT-001',
      title: 'Sample task',
      taskType: 'DAILY',
      ownerId: 'mem',
      assigneeId: 'mem',
      picId: 'mem',
      reviewerId: null,
      assignedById: 'mem',
      status: 'OPEN',
      canonicalStatus: 'NOT_STARTED',
      priority: 'MEDIUM',
      channel: 'Instagram',
      category: 'content',
      brand: 'Dreamlab',
      brandId: null,
      projectId: null,
      project: null,
      brandRef: null,
      pic: null,
      reviewer: null,
      startDate: new Date('2026-09-15'),
      dueDate: new Date('2026-09-22'),
      completedAt: null,
      brief: null,
      outputUrl: null,
      referenceUrl: null,
      estimatedMinutes: 0,
      estimatedHours: 0,
      version: 1,
      checklist: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const service = new CanonicalMarketingService(prisma);

    const dto: any = {
      title: 'Sample task',
      type: 'DAILY',
      priority: 'MEDIUM',
      channel: 'Instagram',
      category: 'content',
      assigneeId: 'mem',
      startDate: '2026-09-15',
      dueDate: '2026-09-22',
    };
    const result = await service.createTask(member, dto);

    // API response collapses canonicalStatus → status (see taskResponse).
    expect(result.status).toBe('NOT_STARTED');
    // DB write dual-writes both columns (legacy + canonical).
    expect(prisma.marketingTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'OPEN',
          canonicalStatus: 'NOT_STARTED',
          ownerId: 'mem',
          assigneeId: 'mem',
          picId: 'mem',
          assignedById: 'mem',
          title: 'Sample task',
          version: 1,
          history: expect.objectContaining({
            create: expect.objectContaining({
              byId: 'mem',
              fromStatus: null,
              toStatus: 'NOT_STARTED',
            }),
          }),
        }),
      }),
    );
  });

  it('member trying to create task for someone else → 403 TASK_ASSIGN_FORBIDDEN', async () => {
    const prisma = prismaMock();
    prisma.user.findFirst.mockResolvedValue({ id: 'someone-else', status: 'ACTIVE' });
    const service = new CanonicalMarketingService(prisma);
    const dto: any = {
      title: 'For someone else',
      type: 'DAILY',
      priority: 'MEDIUM',
      channel: 'Instagram',
      category: 'content',
      assigneeId: 'someone-else',
      startDate: '2026-09-15',
      dueDate: '2026-09-22',
    };
    await expect(service.createTask(member, dto)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.marketingTask.create).not.toHaveBeenCalled();
  });

  it('manager can create task for any assignee (bypasses self-only check)', async () => {
    const prisma = prismaMock();
    prisma.user.findFirst.mockResolvedValue({ id: 'target', status: 'ACTIVE' });
    prisma.marketingTask.create.mockResolvedValue({
      id: 'new-id-2',
      taskCode: 'MKT-002',
      title: 'Assigned by manager',
      taskType: 'DAILY',
      ownerId: 'mgr',
      assigneeId: 'target',
      picId: 'target',
      reviewerId: null,
      assignedById: 'mgr',
      status: 'OPEN',
      canonicalStatus: 'NOT_STARTED',
      priority: 'HIGH',
      channel: 'Web',
      category: 'dev',
      brand: 'Dreamlab',
      brandId: null,
      projectId: null,
      project: null,
      brandRef: null,
      pic: null,
      reviewer: null,
      startDate: new Date('2026-09-15'),
      dueDate: new Date('2026-09-22'),
      completedAt: null,
      brief: null,
      outputUrl: null,
      referenceUrl: null,
      estimatedMinutes: 0,
      estimatedHours: 0,
      version: 1,
      checklist: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const service = new CanonicalMarketingService(prisma);
    const dto: any = {
      title: 'Assigned by manager',
      type: 'DAILY',
      priority: 'HIGH',
      channel: 'Web',
      category: 'dev',
      assigneeId: 'target',
      startDate: '2026-09-15',
      dueDate: '2026-09-22',
    };
    const result = await service.createTask(manager, dto);
    expect(result.status).toBe('NOT_STARTED');
    expect(prisma.marketingTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerId: 'mgr',
          assignedById: 'mgr',
          assigneeId: 'target',
        }),
      }),
    );
  });

  it('creates PROJECT task without projectId → auto-resolves/creates default marketing project', async () => {
    const prisma = prismaMock();
    prisma.user.findFirst.mockResolvedValue({ id: 'mem', status: 'ACTIVE' });
    prisma.marketingProject.findFirst.mockResolvedValue(null);
    prisma.marketingProject.create.mockResolvedValue({ id: 'auto-prj-id', projectCode: 'PRJ-MKT-GENERAL' });
    prisma.marketingTask.create.mockResolvedValue({
      id: 'task-prj-1',
      taskCode: 'MKT-003',
      title: 'Project milestone',
      taskType: 'PROJECT',
      ownerId: 'mem',
      assigneeId: 'mem',
      picId: 'mem',
      reviewerId: null,
      assignedById: 'mem',
      status: 'OPEN',
      canonicalStatus: 'NOT_STARTED',
      priority: 'HIGH',
      channel: 'Campaign',
      category: 'project_campaign',
      brand: 'Dreamlab',
      brandId: null,
      projectId: 'auto-prj-id',
      project: null,
      brandRef: null,
      pic: null,
      reviewer: null,
      startDate: new Date('2026-09-15'),
      dueDate: new Date('2026-09-25'),
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
    });
    const service = new CanonicalMarketingService(prisma);
    const dto: any = {
      title: 'Project milestone',
      type: 'PROJECT',
      priority: 'HIGH',
      channel: 'Campaign',
      category: 'project_campaign',
      assigneeId: 'mem',
      startDate: '2026-09-15',
      dueDate: '2026-09-25',
    };
    const result = await service.createTask(member, dto);
    expect(result.status).toBe('NOT_STARTED');
    expect(result.type).toBe('PROJECT');
    expect(prisma.marketingProject.create).toHaveBeenCalled();
    expect(prisma.marketingTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          taskType: 'PROJECT',
          projectId: 'auto-prj-id',
        }),
      }),
    );
  });
});
