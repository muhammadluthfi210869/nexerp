// Wave 2/A3 — AdjustmentJournalsService unit tests.
// Workflow: PREPARED -> REVIEWED -> APPROVED (3-person SoD).
import {
  ResourceNotFoundException,
  SoDViolationException,
  StateTransitionInvalidException,
} from '../../../../common/exceptions/api-exception';
import { AdjustmentJournalsService } from '../adjustment-journals.service';

describe('AdjustmentJournalsService', () => {
  let service: AdjustmentJournalsService;
  let prismaMock: any;

  const FAKE_JOURNAL = {
    id: 'adj-1',
    journalNumber: 'ADJ-2609-0001',
    period: new Date('2026-09-01'),
    description: 'Accrual adjustment',
    totalAmount: 100000,
    attachmentUrls: [],
    preparedBy: 'user-prep',
    reviewedBy: null,
    approvedBy: null,
  };

  beforeEach(() => {
    prismaMock = {
      adjustmentJournal: {
        findMany: jest.fn().mockResolvedValue([FAKE_JOURNAL]),
        findUnique: jest.fn().mockResolvedValue(FAKE_JOURNAL),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(FAKE_JOURNAL),
        update: jest.fn().mockResolvedValue(FAKE_JOURNAL),
      },
    };
    service = new AdjustmentJournalsService(prismaMock);
  });

  describe('findAll', () => {
    it('returns journals without filter', async () => {
      await service.findAll();
      expect(prismaMock.adjustmentJournal.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { period: 'desc' },
      });
    });

    it('adds period range to where clause when filter.period provided', async () => {
      await service.findAll({ period: '2026-09-01' });
      const call = prismaMock.adjustmentJournal.findMany.mock.calls[0][0];
      const periodStart = new Date('2026-09-01');
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      expect(call.where.period).toEqual({ gte: periodStart, lt: periodEnd });
    });

    it('filters approvedBy when provided', async () => {
      await service.findAll({ approvedBy: 'user-1' });
      expect(prismaMock.adjustmentJournal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { approvedBy: { not: null } } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the journal when found', async () => {
      const result = await service.findOne('adj-1');
      expect(result).toEqual(FAKE_JOURNAL);
    });

    it('throws ResourceNotFoundException when missing', async () => {
      prismaMock.adjustmentJournal.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('create', () => {
    it('creates the journal with auto-generated journalNumber', async () => {
      const dto = {
        period: '2026-09-01',
        description: 'Accrual test adjustment',
        totalAmount: 100000,
      };
      await service.create('user-prep', dto);
      expect(prismaMock.adjustmentJournal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            journalNumber: 'ADJ-2609-0001',
            preparedBy: 'user-prep',
          }),
        }),
      );
    });

    it('throws StateTransitionInvalidException for totalAmount <= 0', async () => {
      await expect(
        service.create('user-1', {
          period: '2026-09-01',
          description: 'test',
          totalAmount: 0,
        }),
      ).rejects.toThrow(StateTransitionInvalidException);
    });

    it('throws StateTransitionInvalidException for short description', async () => {
      await expect(
        service.create('user-1', {
          period: '2026-09-01',
          description: 'ab',
          totalAmount: 100,
        }),
      ).rejects.toThrow(StateTransitionInvalidException);
    });

    it('throws StateTransitionInvalidException for invalid period', async () => {
      await expect(
        service.create('user-1', {
          period: 'not-a-date',
          description: 'test description',
          totalAmount: 100,
        }),
      ).rejects.toThrow(StateTransitionInvalidException);
    });
  });

  describe('review (SoD: different person from preparer)', () => {
    it('marks the journal reviewed by the second user', async () => {
      const result = await service.review('user-rev', 'adj-1');
      expect(result).toEqual(FAKE_JOURNAL);
      expect(prismaMock.adjustmentJournal.update).toHaveBeenCalledWith({
        where: { id: 'adj-1' },
        data: { reviewedBy: 'user-rev' },
      });
    });

    it('throws SoDViolationException when reviewer == preparer', async () => {
      await expect(service.review('user-prep', 'adj-1')).rejects.toThrow(SoDViolationException);
    });

    it('throws StateTransitionInvalidException when already reviewed', async () => {
      prismaMock.adjustmentJournal.findUnique.mockResolvedValueOnce({
        ...FAKE_JOURNAL,
        reviewedBy: 'user-rev',
      });
      await expect(service.review('user-other', 'adj-1')).rejects.toThrow(StateTransitionInvalidException);
    });

    it('throws ResourceNotFoundException when missing', async () => {
      prismaMock.adjustmentJournal.findUnique.mockResolvedValueOnce(null);
      await expect(service.review('user-1', 'missing')).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('approve (full SoD: must differ from both preparer AND reviewer)', () => {
    it('marks approved by the third user', async () => {
      prismaMock.adjustmentJournal.findUnique.mockResolvedValueOnce({
        ...FAKE_JOURNAL,
        reviewedBy: 'user-rev',
      });
      await service.approve('user-app', 'adj-1');
      expect(prismaMock.adjustmentJournal.update).toHaveBeenCalledWith({
        where: { id: 'adj-1' },
        data: { approvedBy: 'user-app' },
      });
    });

    it('throws SoDViolationException when approver is the reviewer', async () => {
      prismaMock.adjustmentJournal.findUnique.mockResolvedValueOnce({
        ...FAKE_JOURNAL,
        reviewedBy: 'user-rev',
      });
      await expect(service.approve('user-rev', 'adj-1')).rejects.toThrow(SoDViolationException);
    });

    it('throws SoDViolationException when approver is the preparer', async () => {
      prismaMock.adjustmentJournal.findUnique.mockResolvedValueOnce({
        ...FAKE_JOURNAL,
        reviewedBy: 'user-rev',
      });
      await expect(service.approve('user-prep', 'adj-1')).rejects.toThrow(SoDViolationException);
    });

    it('throws StateTransitionInvalidException when not yet reviewed', async () => {
      // reviewedBy is null
      await expect(service.approve('user-app', 'adj-1')).rejects.toThrow(StateTransitionInvalidException);
    });
  });

  describe('getProgress', () => {
    it('reports prepared+reviewed+approved flags', async () => {
      prismaMock.adjustmentJournal.findUnique.mockResolvedValueOnce({
        ...FAKE_JOURNAL,
        reviewedBy: 'user-rev',
        approvedBy: 'user-app',
      });
      const progress = await service.getProgress('adj-1');
      expect(progress).toEqual(
        expect.objectContaining({
          prepared: true,
          reviewed: true,
          approved: true,
          fullyApproved: true,
        }),
      );
    });
  });
});
