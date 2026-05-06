import { Test, TestingModule } from '@nestjs/testing';
import { CreativeService } from '../../src/modules/creative/creative.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BussdevService } from '../../src/modules/bussdev/bussdev.service';
import { TestModule } from '../utilities/test-module';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
}));

describe('CreativeService — Unit', () => {
  let service: CreativeService;
  let prisma: any;

  const taskId = 'TASK-1';

  const mockTask = (overrides: Record<string, any> = {}) => ({
    id: taskId,
    leadId: 'LEAD-1',
    kanbanState: 'INBOX',
    revisionCount: 0,
    versions: [],
    ...overrides,
  });

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreativeService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: TestModule.mockEventEmitter() },
        { provide: BussdevService, useValue: {} },
      ],
    }).compile();

    service = module.get<CreativeService>(CreativeService);
  });

  describe('getAvailableSalesOrders', () => {
    it('returns ACTIVE/LOCKED_ACTIVE orders', async () => {
      prisma.salesOrder.findMany = jest
        .fn()
        .mockResolvedValue([
          { id: 'SO-1', status: 'ACTIVE', brandName: 'A', lead: {} },
        ]);
      const result = await service.getAvailableSalesOrders();
      expect(result).toHaveLength(1);
    });
  });

  describe('createTask', () => {
    it('creates with INBOX state', async () => {
      prisma.designTask.create = jest
        .fn()
        .mockResolvedValue({ id: taskId, kanbanState: 'INBOX' });
      prisma.salesOrder.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 'SO-1', leadId: 'LEAD-1' });
      const result = await service.createTask('SO-1', 'user-1');
      expect(result.kanbanState).toBe('INBOX');
    });
  });

  describe('uploadVersion', () => {
    it('creates version', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.designTask.findUnique = jest
        .fn()
        .mockResolvedValue(mockTask({ versions: [{ id: 'V1' }] }));
      prisma.designVersion.create = jest
        .fn()
        .mockResolvedValue({ id: 'VER-1', versionNumber: 2 });
      prisma.designTask.update = jest.fn();

      const result = await service.uploadVersion({
        taskId,
        artworkUrl: '/uploads/d.jpg',
        uploadedBy: 'u1',
      });
      expect(result).toBeDefined();
    });
  });

  describe('submitToApj', () => {
    it('submits IN_PROGRESS task', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.designTask.findUnique = jest
        .fn()
        .mockResolvedValue(
          mockTask({ kanbanState: 'IN_PROGRESS', versions: [{ id: 'V1' }] }),
        );
      prisma.designTask.update = jest
        .fn()
        .mockResolvedValue({ id: taskId, kanbanState: 'WAITING_APJ' });

      const result = await service.submitToApj(taskId);
      expect(result.kanbanState).toBe('WAITING_APJ');
    });
  });

  describe('apjReview', () => {
    it('advances on approval', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.designTask.findUnique = jest
        .fn()
        .mockResolvedValue(
          mockTask({ kanbanState: 'WAITING_APJ', versions: [] }),
        );
      prisma.designTask.update = jest
        .fn()
        .mockResolvedValue({ id: taskId, kanbanState: 'WAITING_CLIENT' });
      prisma.designVersion.findFirst = jest
        .fn()
        .mockResolvedValue({ id: 'V1', versionNumber: 1 });
      prisma.designVersion.update = jest.fn();
      prisma.user.findUnique = jest.fn().mockResolvedValue({
        id: 'apj-1',
        approvalPin: '123',
        fullName: 'APJ',
      });

      const result = await (service as any).apjReview({
        taskId,
        status: 'APPROVED',
        notes: 'OK',
        authorId: 'apj-1',
        pin: '123',
      });
      expect(result).toBeDefined();
    });
  });

  describe('clientReview', () => {
    it('sends to revision', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.designTask.findUnique = jest.fn().mockResolvedValue(
        mockTask({
          kanbanState: 'WAITING_CLIENT',
          revisionCount: 1,
          versions: [{ id: 'V1', versionNumber: 1, approvalStatus: 'PENDING' }],
        }),
      );
      prisma.designTask.update = jest
        .fn()
        .mockResolvedValue({ id: taskId, kanbanState: 'REVISION' });

      const result = await service.clientReview(
        taskId,
        'REVISION' as any,
        'Fix',
      );
      expect(result.kanbanState).toBe('REVISION');
    });
  });

  describe('getBoard', () => {
    it('returns tasks', async () => {
      prisma.designTask.findMany = jest
        .fn()
        .mockResolvedValue([
          { id: taskId, kanbanState: 'INBOX', so: { brandName: 'A' } },
        ]);
      const result = await service.getBoard();
      expect(result).toBeDefined();
    });
  });
});
