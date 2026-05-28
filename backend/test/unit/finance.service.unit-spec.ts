import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { ScmService } from '../../src/modules/scm/services/scm.service';
import { CreativeService } from '../../src/modules/creative/creative.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModuleRef } from '@nestjs/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockTx = {
  financialPeriod: { findFirst: jest.fn() },
  account: { findMany: jest.fn(), findFirst: jest.fn() },
  journalEntry: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  invoice: { findMany: jest.fn() },
  salesOrder: { findMany: jest.fn() },
  deliveryOrder: { findMany: jest.fn() },
};

const mockPrisma = {
  $transaction: jest.fn((cb: (tx: any) => any) => cb(mockTx)),
  financialPeriod: { findFirst: jest.fn() },
  account: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  invoice: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  journalEntry: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  salesOrder: { findMany: jest.fn() },
  deliveryOrder: { findMany: jest.fn() },
  salesLead: { findMany: jest.fn() },
};

const mockEventEmitter = { emit: jest.fn() };
const mockIdGenerator = { generateId: jest.fn().mockResolvedValue('JRN-001') };

describe('FinanceService — Unit', () => {
  let service: FinanceService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: IdGeneratorService, useValue: mockIdGenerator },
        { provide: ScmService, useValue: {} },
        { provide: CreativeService, useValue: {} },
        { provide: ModuleRef, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('returns totalReceivables, totalPayables, totalAccounts', async () => {
      mockPrisma.invoice.count
        .mockResolvedValueOnce(5) // receivables
        .mockResolvedValueOnce(3); // payables
      mockPrisma.account.count.mockResolvedValue(12);

      const result = await service.getDashboardMetrics();

      expect(result).toEqual({
        totalReceivables: 5,
        totalPayables: 3,
        totalAccounts: 12,
      });
    });
  });

  describe('getJournalEntries', () => {
    it('returns journal entries with lines', async () => {
      const mockJournals = [
        {
          id: 'j1',
          reference: 'JRN-001',
          description: 'Test Journal',
          lines: [{ accountId: 'a1', debit: 100, credit: 0, account: { code: '1100' } }],
        },
      ];
      mockPrisma.journalEntry.findMany.mockResolvedValue(mockJournals);

      const result = await service.getJournalEntries();

      expect(result).toHaveLength(1);
      expect(result[0].reference).toBe('JRN-001');
      expect(result[0].lines).toHaveLength(1);
    });
  });

  describe('getAccounts', () => {
    it('returns chart of accounts sorted by code', async () => {
      const mockAccounts = [
        { id: 'a1', code: '1100', name: 'Kas', type: 'ASSET' },
        { id: 'a2', code: '4100', name: 'Pendapatan', type: 'REVENUE' },
      ];
      mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

      const result = await service.getAccounts();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('1100');
    });
  });

  describe('createJournalEntry', () => {
    it('creates a balanced journal entry', async () => {
      mockPrisma.financialPeriod.findFirst.mockResolvedValue(null); // no locked period
      mockPrisma.account.findMany.mockResolvedValue([
        { id: 'a1', code: '1100', name: 'Kas', type: 'ASSET' },
        { id: 'a2', code: '4100', name: 'Pendapatan', type: 'REVENUE' },
      ]);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'j1',
        reference: 'JRN-001',
        lines: [],
      });

      const dto = {
        date: '2024-01-15',
        description: 'Test Journal',
        lines: [
          { accountId: 'a1', debit: 1000000, credit: 0 },
          { accountId: 'a2', debit: 0, credit: 1000000 },
        ],
      };

      const result = await service.createJournalEntry(dto);

      expect(result.id).toBe('j1');
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });

    it('throws BadRequestException when journal is not balanced', async () => {
      mockPrisma.financialPeriod.findFirst.mockResolvedValue(null);

      const dto = {
        date: '2024-01-15',
        description: 'Unbalanced',
        lines: [
          { accountId: 'a1', debit: 1000000, credit: 0 },
          { accountId: 'a2', debit: 0, credit: 500000 },
        ],
      };

      await expect(service.createJournalEntry(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when period is locked', async () => {
      mockPrisma.financialPeriod.findFirst.mockResolvedValue({
        id: 'p1',
        name: 'Jan 2024',
        status: 'CLOSED',
      });

      const dto = {
        date: '2024-01-15',
        description: 'Locked Period',
        lines: [
          { accountId: 'a1', debit: 1000000, credit: 0 },
          { accountId: 'a2', debit: 0, credit: 1000000 },
        ],
      };

      await expect(service.createJournalEntry(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
