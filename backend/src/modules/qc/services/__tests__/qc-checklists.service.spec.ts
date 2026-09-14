// Wave 2/A3 — QCChecklistsService unit tests.
import { NotFoundException } from '@nestjs/common';
import { QCChecklistsService } from '../qc-checklists.service';

describe('QCChecklistsService', () => {
  let service: QCChecklistsService;
  let prismaMock: any;

  const FAKE_CHECKLIST = {
    id: 'qc-1',
    title: 'Receiving QC',
    items: [
      { id: 'ITEM-1', label: 'Check seal', isRequired: true, checked: false },
      { id: 'ITEM-2', label: 'Check weight', isRequired: true, checked: false },
    ],
    completedItems: [],
    status: 'PENDING',
    createdById: 'user-1',
    creator: { id: 'user-1', fullName: 'Budi' },
  };

  beforeEach(() => {
    prismaMock = {
      qCChecklist: {
        findMany: jest.fn().mockResolvedValue([FAKE_CHECKLIST]),
        findUnique: jest.fn().mockResolvedValue(FAKE_CHECKLIST),
        create: jest.fn().mockResolvedValue(FAKE_CHECKLIST),
        update: jest.fn().mockResolvedValue({ ...FAKE_CHECKLIST, status: 'COMPLETED' }),
      },
    };
    service = new QCChecklistsService(prismaMock);
  });

  describe('findAll', () => {
    it('returns all checklists without status filter', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ progress: 0 }));
      expect(prismaMock.qCChecklist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('passes status filter', async () => {
      await service.findAll('COMPLETED');
      expect(prismaMock.qCChecklist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'COMPLETED' } }),
      );
    });

    it('computes progress as % of completedItems / items', async () => {
      prismaMock.qCChecklist.findMany.mockResolvedValueOnce([
        { ...FAKE_CHECKLIST, completedItems: ['ITEM-1'] },
      ]);
      const result = await service.findAll();
      expect(result[0]).toEqual(expect.objectContaining({ progress: 50 }));
    });
  });

  describe('findCompleted', () => {
    it('delegates to findAll("COMPLETED")', async () => {
      const result = await service.findCompleted();
      expect(prismaMock.qCChecklist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'COMPLETED' } }),
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('returns the checklist when found', async () => {
      const result = await service.findOne('qc-1');
      expect(result).toEqual(expect.objectContaining({ progress: 0 }));
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.qCChecklist.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates checklist with item IDs ITEM-1..N', async () => {
      const dto = {
        title: 'Receiving',
        items: [{ label: 'A', isRequired: true }, { label: 'B' }],
      };
      await service.create('user-1', dto);
      expect(prismaMock.qCChecklist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: [
              { id: 'ITEM-1', label: 'A', isRequired: true, checked: false },
              { id: 'ITEM-2', label: 'B', isRequired: false, checked: false },
            ],
            status: 'PENDING',
            completedItems: [],
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('marks COMPLETED when all required items checked', async () => {
      await service.update('qc-1', { completedItems: ['ITEM-1', 'ITEM-2'] });
      expect(prismaMock.qCChecklist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'qc-1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('stays PENDING when only some required items checked', async () => {
      await service.update('qc-1', { completedItems: ['ITEM-1'] });
      const call = prismaMock.qCChecklist.update.mock.calls[0][0];
      expect(call.data.status).toBeUndefined();
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.qCChecklist.findUnique.mockResolvedValueOnce(null);
      await expect(service.update('missing', { notes: 'x' })).rejects.toThrow(NotFoundException);
    });
  });
});
