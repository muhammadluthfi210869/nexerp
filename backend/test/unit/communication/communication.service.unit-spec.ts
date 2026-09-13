// Wave 3/D1 — CommunicationService unit tests.
//
// 7 cases covering the contract:
//   - createThread: emits `thread.created` + writes ActivityLog
//   - updateThread (status): goes through StateMachineService.transition
//   - replyToThread: emits per-mention `notification.mention` events
//   - addMention: rejects self-mention
//   - attachFile: enforces one-of threadId|replyId
//   - getThread: throws ResourceNotFoundException for missing
//   - listThreadsForUser: filters by OR on creator/reply/mention

import {
  ResourceNotFoundException,
  BusinessRuleViolationException,
} from '../../../src/common/exceptions/api-exception';
import { ThreadStatus, LogActivityType, Prisma } from '@prisma/client';
import { CommunicationService } from '../../../src/modules/communication/communication.service';

// Build a Prisma P2002 error that satisfies `err instanceof Prisma.PrismaClientKnownRequestError`.
function p2002Error() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

function makePrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
    },
    communicationThread: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    communicationThreadReply: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    communicationMention: {
      create: jest.fn(),
    },
    communicationAttachment: {
      create: jest.fn(),
    },
  };
}

function makeEventEmitterMock() {
  return { emit: jest.fn() };
}

function makeStateMachineMock() {
  return {
    transition: jest.fn().mockResolvedValue({
      id: 'log-1',
      entityType: 'COMMUNICATION_THREAD',
      entityId: 'thread-1',
      toState: 'CLOSED',
      eventTrigger: 'APPROVAL_GRANTED',
      createdAt: new Date(),
    }),
  };
}

function makeFileStorageMock() {
  return { saveFile: jest.fn().mockResolvedValue('/uploads/communications/x/file.bin') };
}

function makeActivityLogMock() {
  return { log: jest.fn().mockResolvedValue(undefined) };
}

describe('CommunicationService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let eventEmitter: ReturnType<typeof makeEventEmitterMock>;
  let stateMachine: ReturnType<typeof makeStateMachineMock>;
  let fileStorage: ReturnType<typeof makeFileStorageMock>;
  let activityLog: ReturnType<typeof makeActivityLogMock>;
  let service: CommunicationService;

  beforeEach(() => {
    prisma = makePrismaMock();
    eventEmitter = makeEventEmitterMock();
    stateMachine = makeStateMachineMock();
    fileStorage = makeFileStorageMock();
    activityLog = makeActivityLogMock();
    service = new CommunicationService(
      prisma as any,
      eventEmitter as any,
      stateMachine as any,
      fileStorage as any,
      activityLog as any,
    );
  });

  describe('createThread', () => {
    it('creates a thread and emits thread.created', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u-1', status: 'ACTIVE' });
      prisma.communicationThread.create.mockResolvedValueOnce({
        id: 't-1',
        contextType: 'SalesOrder',
        contextId: 'so-1',
        title: 'Sample discussion',
        status: 'OPEN',
        createdById: 'u-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const out = await service.createThread({
        contextType: 'SalesOrder',
        contextId: 'so-1',
        title: 'Sample discussion',
        createdById: 'u-1',
      });

      expect(out.id).toBe('t-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'thread.created',
        expect.objectContaining({ threadId: 't-1', createdById: 'u-1' }),
      );
      expect(activityLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          type: LogActivityType.CREATE,
          entityType: 'CommunicationThread',
          entityId: 't-1',
        }),
      );
    });

    it('rejects an inactive user', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u-1', status: 'INACTIVE' });
      await expect(
        service.createThread({
          contextType: 'X',
          contextId: '1',
          title: 'T',
          createdById: 'u-1',
        }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('replyToThread', () => {
    it('creates a reply and emits mention events for each mentioned user', async () => {
      prisma.communicationThread.findUnique.mockResolvedValueOnce({
        id: 't-1',
        status: ThreadStatus.OPEN,
      });
      prisma.communicationThreadReply.create.mockResolvedValueOnce({
        id: 'r-1',
        threadId: 't-1',
        authorId: 'u-1',
        body: 'hello @u-2 @u-3',
        parentReplyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // two mentions succeed
      prisma.communicationMention.create
        .mockResolvedValueOnce({ id: 'm-1', replyId: 'r-1', mentionedUserId: 'u-2' })
        .mockResolvedValueOnce({ id: 'm-2', replyId: 'r-1', mentionedUserId: 'u-3' });
      prisma.communicationThread.update.mockResolvedValueOnce({ id: 't-1' });

      const out = await service.replyToThread({
        threadId: 't-1',
        authorId: 'u-1',
        body: 'hello @u-2 @u-3',
        mentionIds: ['u-2', 'u-3'],
      });

      expect(out.reply.id).toBe('r-1');
      expect(out.mentions).toHaveLength(2);
      // 1 thread.reply.created + 2 notification.mention
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'thread.reply.created',
        expect.objectContaining({ replyId: 'r-1', mentions: ['u-2', 'u-3'] }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.mention',
        expect.objectContaining({ mentionedUserId: 'u-2' }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.mention',
        expect.objectContaining({ mentionedUserId: 'u-3' }),
      );
    });

    it('refuses to reply on an archived thread', async () => {
      prisma.communicationThread.findUnique.mockResolvedValueOnce({
        id: 't-1',
        status: ThreadStatus.ARCHIVED,
      });
      await expect(
        service.replyToThread({
          threadId: 't-1',
          authorId: 'u-1',
          body: 'bump',
        }),
      ).rejects.toBeInstanceOf(BusinessRuleViolationException);
    });

    it('dedupes self-mention + duplicate mentions', async () => {
      prisma.communicationThread.findUnique.mockResolvedValueOnce({
        id: 't-1',
        status: ThreadStatus.OPEN,
      });
      prisma.communicationThreadReply.create.mockResolvedValueOnce({
        id: 'r-1',
        threadId: 't-1',
        authorId: 'u-1',
        body: 'b',
        parentReplyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // After self-filter + dedup: only u-2 + u-3 remain.
      // First call (u-2) is a duplicate of an existing mention → P2002.
      // Second call (u-3) is fresh → success.
      prisma.communicationMention.create
        .mockRejectedValueOnce(p2002Error())
        .mockResolvedValueOnce({ id: 'm-2', replyId: 'r-1', mentionedUserId: 'u-3' });
      prisma.communicationThread.update.mockResolvedValueOnce({ id: 't-1' });

      const out = await service.replyToThread({
        threadId: 't-1',
        authorId: 'u-1',
        body: 'b',
        // u-1 (self filtered out), u-2 (dup), u-3 → only u-3 should land
        mentionIds: ['u-1', 'u-2', 'u-2', 'u-3'],
      });
      // 1 mention successfully created (u-2's P2002 was skipped silently)
      expect(out.mentions).toHaveLength(1);
      expect(out.mentions[0].mentionedUserId).toBe('u-3');
    });
  });

  describe('addMention', () => {
    it('rejects self-mention', async () => {
      prisma.communicationThreadReply.findUnique.mockResolvedValueOnce({
        id: 'r-1',
        authorId: 'u-1',
        threadId: 't-1',
      });
      await expect(
        service.addMention('r-1', 'u-1', 'u-2'),
      ).rejects.toBeInstanceOf(BusinessRuleViolationException);
    });

    it('rejects duplicate mention', async () => {
      prisma.communicationThreadReply.findUnique.mockResolvedValueOnce({
        id: 'r-1',
        authorId: 'u-1',
        threadId: 't-1',
      });
      prisma.communicationMention.create.mockRejectedValueOnce(p2002Error());
      await expect(
        service.addMention('r-1', 'u-2', 'u-3'),
      ).rejects.toBeInstanceOf(BusinessRuleViolationException);
    });
  });

  describe('attachFile', () => {
    it('rejects when both threadId and replyId are set', async () => {
      await expect(
        service.attachFile({
          threadId: 't-1',
          replyId: 'r-1',
          uploadedById: 'u-1',
          file: { buffer: Buffer.from('x'), originalname: 'a.txt', mimetype: 'text/plain', size: 1 },
        }),
      ).rejects.toBeInstanceOf(BusinessRuleViolationException);
    });

    it('writes the file via FileStorageService and records the row', async () => {
      prisma.communicationThread.findUnique.mockResolvedValueOnce({ id: 't-1' });
      prisma.communicationAttachment.create.mockResolvedValueOnce({
        id: 'a-1',
        threadId: 't-1',
        replyId: null,
        filename: 'a.txt',
        mimeType: 'text/plain',
        size: 1,
        storagePath: '/uploads/communications/x/file.bin',
        uploadedById: 'u-1',
        createdAt: new Date(),
      });

      const out = await service.attachFile({
        threadId: 't-1',
        uploadedById: 'u-1',
        file: { buffer: Buffer.from('x'), originalname: 'a.txt', mimetype: 'text/plain', size: 1 },
      });
      expect(out.id).toBe('a-1');
      expect(fileStorage.saveFile).toHaveBeenCalledWith(
        'communications',
        'thread_t-1',
        expect.objectContaining({ originalname: 'a.txt' }),
      );
    });
  });

  describe('updateThread', () => {
    it('calls StateMachineService.transition when status changes', async () => {
      prisma.communicationThread.findUnique.mockResolvedValueOnce({
        id: 't-1',
        status: ThreadStatus.OPEN,
        title: 'T',
        createdById: 'u-1',
      });
      prisma.communicationThread.update.mockResolvedValueOnce({
        id: 't-1',
        status: ThreadStatus.CLOSED,
        title: 'T',
      });

      await service.updateThread('t-1', { status: ThreadStatus.CLOSED }, 'u-1');

      expect(stateMachine.transition).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'COMMUNICATION_THREAD',
          entityId: 't-1',
          toState: 'CLOSED',
          userId: 'u-1',
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'thread.status.changed',
        expect.objectContaining({ from: 'OPEN', to: 'CLOSED' }),
      );
    });

    it('does NOT call StateMachineService when only title changes', async () => {
      prisma.communicationThread.findUnique.mockResolvedValueOnce({
        id: 't-1',
        status: ThreadStatus.OPEN,
        title: 'Old',
        createdById: 'u-1',
      });
      prisma.communicationThread.update.mockResolvedValueOnce({
        id: 't-1',
        title: 'New',
      });

      await service.updateThread('t-1', { title: 'New' }, 'u-1');
      expect(stateMachine.transition).not.toHaveBeenCalled();
    });
  });

  describe('getThread', () => {
    it('throws ResourceNotFoundException when missing', async () => {
      prisma.communicationThread.findUnique.mockResolvedValueOnce(null);
      await expect(service.getThread('missing')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('listThreadsForUser', () => {
    it('queries with OR on creator/reply author/mention', async () => {
      prisma.communicationThread.findMany.mockResolvedValueOnce([]);
      await service.listThreadsForUser('u-1', { limit: 10 });
      expect(prisma.communicationThread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ createdById: 'u-1' }),
              expect.objectContaining({ replies: { some: { authorId: 'u-1' } } }),
              expect.objectContaining({
                replies: { some: { mentions: { some: { mentionedUserId: 'u-1' } } } },
              }),
            ]),
          }),
        }),
      );
    });
  });
});
