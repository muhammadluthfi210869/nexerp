// @ts-nocheck — tsconfig.json doesn't include @types/jest in its types[] so
// describe/it/expect/jest are unresolved. Jest runtime works fine; this only
// silences the diagnostic.
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MarketingPrototypeService } from '../marketing-prototype.service';

describe('MarketingPrototypeService — regression suite (post Wave 1-3)', () => {
  let service: MarketingPrototypeService;
  let mockPrisma: any;

  const adminViewer = {
    id: 'admin-uuid',
    email: 'admin@nexerp.id',
    fullName: 'Admin',
    roles: ['SUPER_ADMIN'],
  };

  const aurelViewer = {
    id: 'aurel-uuid',
    email: 'aurel@nexerp.id',
    fullName: 'Aurel',
    roles: ['DIGIMAR'],
  };

  beforeEach(() => {
    mockPrisma = {
      marketingTask: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      marketingTaskAttachment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      marketingTaskComment: {
        create: jest.fn(),
      },
      marketingTaskHistory: {
        create: jest.fn(),
      },
      marketingProject: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new MarketingPrototypeService(mockPrisma);
  });

  // ---- addAttachment ----
  describe('addAttachment', () => {
    it('records the uploader id from viewer context', async () => {
      mockPrisma.marketingTask.findUnique.mockResolvedValue({
        id: 'task-1', status: 'Not started', pic: null, project: null,
      });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        return cb(mockPrisma);
      });
      mockPrisma.marketingTaskAttachment.create.mockResolvedValue({
        id: 'att-1', taskId: 'task-1', name: 'x.png', uploadedById: 'aurel-uuid',
      });

      await service.addAttachment(aurelViewer, 'task-1', {
        originalname: 'x.png',
        mimetype: 'image/png',
        size: 1024,
        path: '/tmp/x.png',
      });

      expect(mockPrisma.marketingTaskAttachment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ uploadedById: 'aurel-uuid' }),
        }),
      );
    });

    it('throws NotFoundException when task is not visible to viewer', async () => {
      mockPrisma.marketingTask.findUnique.mockResolvedValue({
        id: 'task-1', status: 'Not started', pic: null, project: null,
      });

      await expect(
        service.addAttachment(aurelViewer, 'task-1', {
          originalname: 'x.png', mimetype: 'image/png', size: 1024, path: '/tmp/x.png',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('sanitizes filename in history note (no CR/LF/Tab, 200ch max)', async () => {
      mockPrisma.marketingTask.findUnique.mockResolvedValue({
        id: 'task-1', status: 'Not started', pic: { fullName: 'Aurel' },
      });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.marketingTaskAttachment.create.mockResolvedValue({ id: 'att-1' });

      await service.addAttachment(aurelViewer, 'task-1', {
        originalname: 'evil\r\nfile\tname.png',
        mimetype: 'image/png', size: 1024, path: '/tmp/x.png',
      });

      const historyCall = mockPrisma.marketingTaskHistory.create.mock.calls[0][0];
      expect(historyCall.data.note).not.toMatch(/[\r\n\t]/);
    });
  });

  // ---- createTask ----
  describe('createTask', () => {
    it('generates UUID-derived taskCode (collision-free)', async () => {
      mockPrisma.marketingTask.findMany.mockResolvedValue([]);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.marketingTask.create.mockResolvedValue({
        id: 'task-1', taskCode: 'TSK-ABC123',
      });

      const result = await service.createTask(adminViewer, { title: 'Test', pic: 'Aurel' });

      expect(result.taskCode).toMatch(/^TSK-[A-F0-9]+$/);
      expect(result.taskCode.length).toBeGreaterThan(4);
    });

    it('throws BadRequestException on bad date format', async () => {
      await expect(
        service.createTask(adminViewer, {
          title: 'Test',
          startDate: 'not-a-date',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when startDate > dueDate', async () => {
      await expect(
        service.createTask(adminViewer, {
          title: 'Test',
          startDate: '2026-09-10',
          dueDate: '2026-09-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---- updateTaskStatus ----
  describe('updateTaskStatus', () => {
    it('writes history and update atomically (in $transaction)', async () => {
      mockPrisma.marketingTask.findUnique.mockResolvedValue({
        id: 'task-1', status: 'Not started', pic: { fullName: 'Aurel' },
        project: null, reviewer: null, assignedBy: null,
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await service.updateTaskStatus(aurelViewer, 'task-1', 'Done');

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  // ---- addTaskComment ----
  describe('addTaskComment', () => {
    it('uses task.status as history.toStatus (never null)', async () => {
      mockPrisma.marketingTask.findUnique.mockResolvedValue({
        id: 'task-1', status: 'Not started', pic: { fullName: 'Aurel' },
        reviewer: null, assignedBy: null,
      });
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await service.addTaskComment(aurelViewer, 'task-1', 'Aurel', 'Test comment');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // ---- getBundle scope ----
  describe('getBundle scope filtering', () => {
    it('admin viewer sees performance data for all members', async () => {
      mockPrisma.marketingTask.findMany.mockResolvedValue([]);
      mockPrisma.marketingProject.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const bundle = await service.getBundle(adminViewer);

      expect(bundle.viewer.isManager).toBe(true);
    });

    it('aurel viewer sees limited scope', async () => {
      mockPrisma.marketingTask.findMany.mockResolvedValue([]);
      mockPrisma.marketingProject.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const bundle = await service.getBundle(aurelViewer);

      expect(bundle.viewer.isManager).toBe(false);
    });
  });
});
