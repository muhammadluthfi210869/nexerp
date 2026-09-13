// Wave 2/A3 — BankAccountsService unit tests.
// Constructor injection + jest.fn() PrismaService (per state-machine pattern).
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BankAccountsService } from '../bank-accounts.service';

describe('BankAccountsService', () => {
  let service: BankAccountsService;
  let prismaMock: any;

  const FAKE_ACCOUNT = {
    id: 'ba-1',
    accountCode: 'BCA-001',
    bankName: 'BCA',
    accountNumber: '1234567890',
    accountType: 'BANK',
    currencyCode: 'IDR',
    currentBalance: 1000000,
    isActive: true,
    notes: null,
    glAccountId: null,
  };

  beforeEach(() => {
    prismaMock = {
      bankAccount: {
        findMany: jest.fn().mockResolvedValue([FAKE_ACCOUNT]),
        // Default: not found — uniqueness / lookup tests override per-case
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(FAKE_ACCOUNT),
        update: jest.fn().mockResolvedValue(FAKE_ACCOUNT),
      },
      account: { findUnique: jest.fn().mockResolvedValue({ id: 'gl-1', code: '1201' }) },
      $transaction: jest.fn(),
    };
    service = new BankAccountsService(prismaMock);
  });

  describe('findAll', () => {
    it('returns active bank accounts ordered by bankName with counts', async () => {
      const result = await service.findAll();
      expect(result).toEqual([FAKE_ACCOUNT]);
      expect(prismaMock.bankAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          orderBy: { bankName: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the bank account with last 20 transactions', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(FAKE_ACCOUNT);
      const result = await service.findOne('ba-1');
      expect(result).toEqual(FAKE_ACCOUNT);
      expect(prismaMock.bankAccount.findUnique).toHaveBeenCalledWith({
        where: { id: 'ba-1' },
        include: { transactions: { orderBy: { date: 'desc' }, take: 20 } },
      });
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates the bank account after uniqueness + GL checks pass', async () => {
      const dto = {
        accountCode: 'BCA-NEW',
        bankName: 'BCA',
        accountNumber: '9999',
        accountType: 'BANK' as const,
        currencyCode: 'IDR',
        initialBalance: 500000,
      };
      const result = await service.create('user-1', dto);
      expect(result).toEqual(FAKE_ACCOUNT);
      expect(prismaMock.bankAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accountCode: 'BCA-NEW', bankName: 'BCA' }),
        }),
      );
    });

    it('throws BadRequestException on duplicate accountCode', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(FAKE_ACCOUNT);
      await expect(
        service.create('user-1', { ...FAKE_ACCOUNT, accountCode: 'BCA-001' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when glAccountId is invalid', async () => {
      prismaMock.account.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create('user-1', {
          accountCode: 'NEW',
          bankName: 'X',
          accountNumber: '1',
          accountType: 'BANK',
          glAccountId: 'gl-missing',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the bank account when found', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(FAKE_ACCOUNT);
      const result = await service.update('ba-1', { bankName: 'BCA Updated' });
      expect(result).toEqual(FAKE_ACCOUNT);
      expect(prismaMock.bankAccount.update).toHaveBeenCalledWith({
        where: { id: 'ba-1' },
        data: { bankName: 'BCA Updated' },
      });
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(null);
      await expect(service.update('missing', { bankName: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('reconcile', () => {
    it('returns already-balanced message when diff is zero', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(FAKE_ACCOUNT);
      const result = await service.reconcile('user-1', 'ba-1', {
        actualBalance: 1000000,
        notes: 'check',
      });
      expect((result as any).message).toBe('Already balanced');
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('records a deposit transaction when actual > current', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(FAKE_ACCOUNT);
      const updated = { ...FAKE_ACCOUNT, currentBalance: 1500000 };
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          bankTransaction: { create: jest.fn().mockResolvedValue({ id: 'bt-1' }) },
          bankAccount: { update: jest.fn().mockResolvedValue(updated) },
        };
        return cb(tx);
      });
      const result = await service.reconcile('user-1', 'ba-1', {
        actualBalance: 1500000,
        notes: 'topup',
      });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect((result as any).currentBalance).toBe(1500000);
    });

    it('records a withdrawal transaction when actual < current', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(FAKE_ACCOUNT);
      const updated = { ...FAKE_ACCOUNT, currentBalance: 800000 };
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          bankTransaction: { create: jest.fn().mockResolvedValue({ id: 'bt-2' }) },
          bankAccount: { update: jest.fn().mockResolvedValue(updated) },
        };
        return cb(tx);
      });
      await service.reconcile('user-1', 'ba-1', { actualBalance: 800000, notes: 'fee' });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when account is missing', async () => {
      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.reconcile('user-1', 'missing', { actualBalance: 0, notes: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
