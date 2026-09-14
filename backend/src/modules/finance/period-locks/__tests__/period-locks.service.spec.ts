// Wave 2/A3 — PeriodLocksService unit tests.
import {
  PeriodLockedException,
  ResourceNotFoundException,
  StateTransitionInvalidException,
} from '../../../../common/exceptions/api-exception';
import { PeriodLocksService } from '../period-locks.service';

describe('PeriodLocksService', () => {
  let service: PeriodLocksService;
  let prismaMock: any;
  let stateMachineMock: any;

  const FAKE_LOCK = {
    id: 'lock-1',
    period: new Date('2026-09-01'),
    isLocked: true,
    lockedBy: 'user-1',
    lockedAt: new Date('2026-09-30'),
    notes: 'monthly close',
  };

  beforeEach(() => {
    prismaMock = {
      periodLock: {
        findMany: jest.fn().mockResolvedValue([FAKE_LOCK]),
        findUnique: jest.fn().mockResolvedValue(FAKE_LOCK),
        upsert: jest.fn().mockResolvedValue(FAKE_LOCK),
        update: jest.fn().mockResolvedValue({ ...FAKE_LOCK, isLocked: false }),
      },
    };
    stateMachineMock = {
      transition: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };
    service = new PeriodLocksService(prismaMock, stateMachineMock);
  });

  describe('findAll', () => {
    it('returns all period locks ordered by period desc', async () => {
      const result = await service.findAll();
      expect(result).toEqual([FAKE_LOCK]);
      expect(prismaMock.periodLock.findMany).toHaveBeenCalledWith({
        orderBy: { period: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the period lock when found', async () => {
      const result = await service.findOne('lock-1');
      expect(result).toEqual(FAKE_LOCK);
    });

    it('throws ResourceNotFoundException when missing', async () => {
      prismaMock.periodLock.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('isPeriodLocked', () => {
    it('returns true when lock exists and isLocked=true', async () => {
      const result = await service.isPeriodLocked(new Date('2026-09-15'));
      expect(result).toBe(true);
      // Should lookup by first day of month
      expect(prismaMock.periodLock.findUnique).toHaveBeenCalledWith({
        where: { period: new Date(2026, 8, 1) },
      });
    });

    it('returns false when no lock exists', async () => {
      prismaMock.periodLock.findUnique.mockResolvedValueOnce(null);
      const result = await service.isPeriodLocked(new Date('2026-09-15'));
      expect(result).toBe(false);
    });

    it('returns false when lock exists but isLocked=false', async () => {
      prismaMock.periodLock.findUnique.mockResolvedValueOnce({ ...FAKE_LOCK, isLocked: false });
      const result = await service.isPeriodLocked(new Date('2026-09-15'));
      expect(result).toBe(false);
    });
  });

  describe('assertPeriodNotLocked', () => {
    it('does not throw when period is open', async () => {
      prismaMock.periodLock.findUnique.mockResolvedValueOnce(null);
      await expect(service.assertPeriodNotLocked(new Date('2026-09-15'))).resolves.toBeUndefined();
    });

    it('throws PeriodLockedException when period is locked', async () => {
      await expect(service.assertPeriodNotLocked(new Date('2026-09-15'))).rejects.toThrow(PeriodLockedException);
    });
  });

  describe('lock', () => {
    it('upserts a new period lock', async () => {
      prismaMock.periodLock.findUnique.mockResolvedValueOnce(null);
      await service.lock('user-1', new Date('2026-09-15'), 'monthly close');
      expect(prismaMock.periodLock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { period: new Date(2026, 8, 1) },
          create: expect.objectContaining({ isLocked: true, lockedBy: 'user-1' }),
        }),
      );
    });

    it('throws StateTransitionInvalidException when already locked', async () => {
      // findUnique returns existing locked
      await expect(
        service.lock('user-1', new Date('2026-09-15')),
      ).rejects.toThrow(StateTransitionInvalidException);
    });
  });

  describe('unlock', () => {
    it('unlocks the period and appends reason to notes', async () => {
      const result = await service.unlock('admin-1', 'lock-1', 'audit correction');
      expect(result.isLocked).toBe(false);
      expect(prismaMock.periodLock.update).toHaveBeenCalledWith({
        where: { id: 'lock-1' },
        data: expect.objectContaining({ isLocked: false }),
      });
    });

    it('throws StateTransitionInvalidException when period is not locked', async () => {
      prismaMock.periodLock.findUnique.mockResolvedValueOnce({ ...FAKE_LOCK, isLocked: false });
      await expect(service.unlock('admin-1', 'lock-1', 'x')).rejects.toThrow(StateTransitionInvalidException);
    });

    it('throws ResourceNotFoundException when lock missing', async () => {
      prismaMock.periodLock.findUnique.mockResolvedValueOnce(null);
      await expect(service.unlock('admin-1', 'missing', 'x')).rejects.toThrow(ResourceNotFoundException);
    });
  });
});
