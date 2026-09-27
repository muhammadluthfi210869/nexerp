import { Test, TestingModule } from '@nestjs/testing';
import { CreativeService } from '../../src/modules/creative/creative.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BussdevService } from '../../src/modules/bussdev/bussdev.service';
import { AuditService } from '../../src/platform/audit/audit.service';
import { OutboxService } from '../../src/platform/outbox/outbox.service';
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
        // BUS-RULE-113: design decisions now commit with an audit row and an outbox
        // event. Stubbed here because this suite proves the state machine, not the
        // durability layer — P08-SF4 proves that against the real database.
        {
          provide: AuditService,
          useValue: {
            withAudit: jest.fn(async (tx: any, _audit: any, fn: any) => fn(tx)),
          },
        },
        {
          provide: OutboxService,
          useValue: { enqueue: jest.fn(async () => undefined) },
        },
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
      const result = await service.createTask({
        soId: 'SO-1',
        leadId: 'LEAD-1',
        brief: 'Test brief',
        createdBy: 'user-1',
      });
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
          mockTask({
            kanbanState: 'WAITING_APJ',
            versions: [{ id: 'V1', versionNumber: 1 }],
          }),
        );
      prisma.designTask.update = jest
        .fn()
        .mockResolvedValue({ id: taskId, kanbanState: 'WAITING_CLIENT' });
      prisma.designFeedback.create = jest.fn();
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
        versionId: 'V1',
      });
      expect(result).toBeDefined();
    });
  });

  describe('clientReview', () => {
    it('sends to revision, spends one unit of the allowance, and binds the decision to the version', async () => {
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
      prisma.designFeedback.create = jest.fn();

      const result = await service.clientReview(taskId, 'REVISION' as any, {
        versionId: 'V1',
        authorId: 'bd-1',
        reason: 'Fix',
      });
      expect(result.kanbanState).toBe('REVISION');

      // BUS-RULE-111: the request consumes the allowance (1 -> 2 of 3).
      expect(prisma.designTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revisionCount: 2, isLocked: false }),
        }),
      );
      // BUS-RULE-110: the decision names the version it decided on.
      expect(prisma.designFeedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ versionId: 'V1' }),
        }),
      );
    });

    it('refuses a decision that names no version', async () => {
      prisma.$transaction = jest.fn((fn: any) => fn(prisma));
      prisma.designTask.findUnique = jest.fn().mockResolvedValue(
        mockTask({
          kanbanState: 'WAITING_CLIENT',
          versions: [{ id: 'V1', versionNumber: 1 }],
        }),
      );

      await expect(
        service.clientReview(taskId, 'APPROVED' as any, { authorId: 'bd-1' }),
      ).rejects.toMatchObject({
        response: { reason_code: 'DESIGN_VERSION_REQUIRED' },
      });
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
