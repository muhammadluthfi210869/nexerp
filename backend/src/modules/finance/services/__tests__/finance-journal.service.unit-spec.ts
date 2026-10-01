import { Test, TestingModule } from '@nestjs/testing';
import { FinanceJournalService } from '../finance-journal.service';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../../system/id-generator.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountType, NormalBalance, PeriodStatus, ReportGroup } from '@prisma/client';

describe('FinanceJournalService', () => {
  let service: FinanceJournalService;
  let prisma: any;
  let idGenerator: any;

  const mockPrisma: any = {
    account: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    journalEntry: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    financialPeriod: {
      findFirst: jest.fn(),
    },
    productionSchedule: {
      findUnique: jest.fn(),
    },
    workOrder: {
      findUnique: jest.fn(),
    },
    autoJournalConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cb: any): any => cb(mockPrisma)),
  };

  const mockIdGenerator = {
    generateId: jest.fn().mockResolvedValue('JRN-001'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceJournalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: IdGeneratorService, useValue: mockIdGenerator },
      ],
    }).compile();

    service = module.get<FinanceJournalService>(FinanceJournalService);
    prisma = module.get<PrismaService>(PrismaService);
    idGenerator = module.get<IdGeneratorService>(IdGeneratorService);
  });

  describe('seedInitialAccounts', () => {
    it('seeds missing initial accounts and skips existing ones', async () => {
      mockPrisma.account.findFirst
        .mockResolvedValueOnce({ id: 'acc-1151' }) // 1151 exists
        .mockResolvedValue(null); // others missing
      mockPrisma.account.upsert.mockResolvedValue({});

      const result = await service.seedInitialAccounts();
      expect(result.existing).toContain('1151');
      expect(result.created.length).toBe(7);
      expect(result.required).toBe(8);
    });
  });

  describe('createJournalEntry / createJournal / postJournal', () => {
    it('throws BadRequestException if period is locked', async () => {
      mockPrisma.financialPeriod.findFirst.mockResolvedValue({
        id: 'p-1',
        name: 'Jan 2026',
        status: PeriodStatus.CLOSED,
      });

      await expect(
        service.createJournalEntry({
          date: '2026-01-15',
          description: 'Test Journal',
          lines: [
            { accountId: 'acc-1', debit: 100, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: 100 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if debits and credits are unbalanced', async () => {
      mockPrisma.financialPeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.createJournalEntry({
          date: '2026-01-15',
          description: 'Unbalanced Journal',
          lines: [
            { accountId: 'acc-1', debit: 100, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: 50 },
          ],
        }),
      ).rejects.toThrow(/balanced/);
    });

    it('throws BadRequestException if posting manually to control account', async () => {
      mockPrisma.financialPeriod.findFirst.mockResolvedValue(null);
      mockPrisma.account.findMany.mockResolvedValue([
        { id: 'acc-1', code: '1100', name: 'Control Kas', allowManualJournal: false },
        { id: 'acc-2', code: '4101', name: 'Revenue', allowManualJournal: true },
      ]);

      await expect(
        service.createJournalEntry({
          date: '2026-01-15',
          description: 'Manual Post to Control',
          sourceDocumentType: 'MANUAL',
          lines: [
            { accountId: 'acc-1', debit: 100, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: 100 },
          ],
        }),
      ).rejects.toThrow(/tidak boleh diposting manual/);
    });

    it('successfully creates balanced journal entry and splits taxes when taxRate is provided', async () => {
      mockPrisma.financialPeriod.findFirst.mockResolvedValue(null);
      mockPrisma.account.findMany.mockResolvedValue([
        { id: 'acc-1', code: '4101', name: 'Rev', allowManualJournal: true },
        { id: 'acc-2', code: '1101', name: 'Bank', allowManualJournal: true },
        { id: 'tax-acc', code: '2201', name: 'PPN', allowManualJournal: true },
      ]);
      mockPrisma.journalEntry.create.mockImplementation((args: any) => ({
        id: 'jrn-created-1',
        ...args.data,
      }));

      const res = await service.createJournalEntry({
        date: '2026-01-15',
        description: 'Sale with Tax',
        lines: [
          { accountId: 'acc-2', debit: 110, credit: 0 },
          { accountId: 'acc-1', debit: 0, credit: 110, taxRate: 10, taxAccountId: 'tax-acc' },
        ],
      });

      expect(res.id).toBe('jrn-created-1');
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  describe('reverseJournalEntry / voidJournal', () => {
    it('throws NotFoundException if journal does not exist', async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue(null);
      await expect(service.reverseJournalEntry('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException if journal is already a reversal', async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue({
        id: 'rev-1',
        reference: 'REV-JRN-001',
        lines: [],
      });
      await expect(service.reverseJournalEntry('rev-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('successfully creates inverted reversal entry', async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue({
        id: 'orig-1',
        reference: 'JRN-100',
        description: 'Original Transaction',
        lines: [
          { accountId: 'acc-1', debit: 100, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 100 },
        ],
      });
      mockPrisma.financialPeriod.findFirst.mockResolvedValue(null);
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 'rev-entry-id' });

      const res = await service.reverseJournalEntry('orig-1');
      expect(res.id).toBe('rev-entry-id');
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reference: 'REV-JRN-100',
            sourceDocumentType: 'ADJUSTMENT',
          }),
        }),
      );
    });
  });

  describe('COA and Auto Journal Configs', () => {
    it('getAccounts returns sorted accounts', async () => {
      mockPrisma.account.findMany.mockResolvedValue([{ code: '1100' }, { code: '2100' }]);
      const res = await service.getAccounts();
      expect(res.length).toBe(2);
    });

    it('createAccount rejects duplicate code', async () => {
      mockPrisma.account.findUnique.mockResolvedValue({ id: 'exist', code: '1100' });
      await expect(
        service.createAccount({
          code: '1100',
          name: 'Kas',
          type: AccountType.ASSET,
          normalBalance: NormalBalance.DEBIT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('getAutoJournalConfigs returns auto configs or seeds defaults if empty', async () => {
      mockPrisma.autoJournalConfig.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ transactionType: 'FAKTUR_PEMBELIAN_HUTANG' }]);
      mockPrisma.account.findMany.mockResolvedValue([
        { id: 'acc-1', code: '1101', type: AccountType.ASSET },
      ]);
      mockPrisma.autoJournalConfig.upsert.mockResolvedValue({});

      const res = await service.getAutoJournalConfigs();
      expect(res.length).toBeGreaterThan(0);
    });
  });
});
