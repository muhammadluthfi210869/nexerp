// Wave 2/A3 — BankTransactionsService unit tests.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BankTransactionsService } from '../bank-transactions.service';

describe('BankTransactionsService', () => {
  let service: BankTransactionsService;
  let prismaMock: any;
  let stateMachineMock: any;

  const FAKE_TX = {
    id: 'bt-1',
    bankAccountId: 'ba-1',
    date: new Date('2026-09-01'),
    amount: 100000,
    transactionType: 'DEPOSIT',
    description: 'Test',
    reconciled: false,
  };

  const FAKE_ACCOUNT = {
    id: 'ba-1',
    currentBalance: 1000000,
    accountCode: 'BCA-001',
    glAccountId: 'gl-1',
  };

  beforeEach(() => {
    prismaMock = {
      bankTransaction: {
        findMany: jest.fn().mockResolvedValue([FAKE_TX]),
        findUnique: jest.fn().mockResolvedValue(FAKE_TX),
        create: jest.fn().mockResolvedValue(FAKE_TX),
        update: jest.fn().mockResolvedValue({ ...FAKE_TX, reconciled: true }),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 500000 } }),
      },
      bankAccount: {
        findUnique: jest.fn().mockResolvedValue(FAKE_ACCOUNT),
        update: jest.fn().mockResolvedValue({ ...FAKE_ACCOUNT, currentBalance: 1100000 }),
      },
      $transaction: jest.fn(),
      account: { findUnique: jest.fn().mockResolvedValue({ id: 'gl-1', code: '1201' }) },
    };
    // Default $transaction: run callback with a tx namespace
    prismaMock.$transaction.mockImplementation(async (cb: any) =>
      cb({
        bankTransaction: { create: jest.fn().mockResolvedValue(FAKE_TX) },
        bankAccount: { update: jest.fn() },
        account: { findFirst: jest.fn().mockResolvedValue({ id: 'gl-1' }) },
        journalEntry: { create: jest.fn() },
      }),
    );
    stateMachineMock = {
      transition: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };
    service = new BankTransactionsService(prismaMock, stateMachineMock);
  });

  describe('findAll', () => {
    it('returns transactions with default filter', async () => {
      const result = await service.findAll({});
      expect(result).toEqual([FAKE_TX]);
      expect(prismaMock.bankTransaction.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the transaction when found', async () => {
      const result = await service.findOne('bt-1');
      expect(result).toEqual(FAKE_TX);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.bankTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a DEPOSIT transaction + updates balance via $transaction', async () => {
      const dto = {
        bankAccountId: 'ba-1',
        date: '2026-09-01',
        amount: 100000,
        transactionType: 'DEPOSIT' as const,
        description: 'Topup',
      };
      await service.create('user-1', dto);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when amount <= 0', async () => {
      await expect(
        service.create('user-1', {
          bankAccountId: 'ba-1',
          date: '2026-09-01',
          amount: 0,
          transactionType: 'DEPOSIT',
          description: 'x',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid transaction type', async () => {
      await expect(
        service.create('user-1', {
          bankAccountId: 'ba-1',
          date: '2026-09-01',
          amount: 100,
          transactionType: 'BAD' as any,
          description: 'x',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when bank account is missing', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create('user-1', {
          bankAccountId: 'missing',
          date: '2026-09-01',
          amount: 100,
          transactionType: 'DEPOSIT',
          description: 'x',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when account has no GL linkage', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce({
        ...FAKE_ACCOUNT,
        glAccountId: null,
      });
      await expect(
        service.create('user-1', {
          bankAccountId: 'ba-1',
          date: '2026-09-01',
          amount: 100,
          transactionType: 'DEPOSIT',
          description: 'x',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reconcile', () => {
    it('marks transaction as reconciled', async () => {
      await service.reconcile('user-1', 'bt-1', { notes: 'matched' });
      expect(prismaMock.bankTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bt-1' },
          data: expect.objectContaining({ reconciled: true }),
        }),
      );
    });

    it('throws BadRequestException when already reconciled', async () => {
      prismaMock.bankTransaction.findUnique.mockResolvedValueOnce({ ...FAKE_TX, reconciled: true });
      await expect(service.reconcile('user-1', 'bt-1', { notes: 'x' })).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when transaction missing', async () => {
      prismaMock.bankTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.reconcile('user-1', 'missing', { notes: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRunningBalance', () => {
    it('returns a running-balance array sorted by date', async () => {
      prismaMock.bankTransaction.findMany.mockResolvedValueOnce([
        { ...FAKE_TX, amount: 100000, transactionType: 'DEPOSIT', date: new Date('2026-09-01') },
        { ...FAKE_TX, id: 'bt-2', amount: 50000, transactionType: 'WITHDRAWAL', date: new Date('2026-09-02') },
      ]);
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce({ ...FAKE_ACCOUNT, currentBalance: 150000 });
      const result = await service.getRunningBalance('ba-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('throws NotFoundException when bank account missing', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(null);
      await expect(service.getRunningBalance('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
