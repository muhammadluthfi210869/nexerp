import { Test, TestingModule } from '@nestjs/testing';
import { FinanceFundRequestService } from '../finance-fund-request.service';
import { PrismaService } from '../../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FundRequestStatus } from '@prisma/client';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('FinanceFundRequestService', () => {
  let service: FinanceFundRequestService;
  let prisma: any;
  let eventEmitter: any;

  const mockPrisma: any = {
    fundRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    journalEntry: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: any): any => cb(mockPrisma)),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceFundRequestService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<FinanceFundRequestService>(FinanceFundRequestService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFundRequest', () => {
    it('creates a fund request and emits fund_request.created event', async () => {
      const mockResult = {
        id: 'fr-123',
        requesterId: 'user-1',
        departmentId: 'MARKETING',
        amount: 500000,
        reason: 'Event booth rental',
        attachmentUrls: ['http://example.com/receipt.pdf'],
        status: FundRequestStatus.PENDING_APPROVAL_MGR,
      };
      mockPrisma.fundRequest.create.mockResolvedValue(mockResult);

      const res = await service.createFundRequest('user-1', {
        departmentId: 'MARKETING',
        amount: 500000,
        reason: 'Event booth rental',
        attachmentUrls: ['http://example.com/receipt.pdf'],
      });

      expect(res).toEqual(mockResult);
      expect(mockPrisma.fundRequest.create).toHaveBeenCalledWith({
        data: {
          requesterId: 'user-1',
          departmentId: 'MARKETING',
          amount: 500000,
          reason: 'Event booth rental',
          attachmentUrls: ['http://example.com/receipt.pdf'],
          status: FundRequestStatus.PENDING_APPROVAL_MGR,
        },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'fund_request.created',
        expect.objectContaining({
          fundRequestId: 'fr-123',
          requesterId: 'user-1',
          amount: 500000,
        }),
      );
    });
  });

  describe('approveFundRequest (Manager)', () => {
    it('throws NotFoundException if fund request does not exist', async () => {
      mockPrisma.fundRequest.findUnique.mockResolvedValue(null);
      await expect(
        service.approveFundRequest('fr-999', { approvedById: 'mgr-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for SoD / Maker-checker violation', async () => {
      mockPrisma.fundRequest.findUnique.mockResolvedValue({
        id: 'fr-1',
        requesterId: 'user-1',
        status: FundRequestStatus.PENDING_APPROVAL_MGR,
      });

      await expect(
        service.approveFundRequest('fr-1', { approvedById: 'user-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if already disbursed or rejected', async () => {
      mockPrisma.fundRequest.findUnique.mockResolvedValue({
        id: 'fr-1',
        requesterId: 'user-1',
        status: FundRequestStatus.PAID,
      });

      await expect(
        service.approveFundRequest('fr-1', { approvedById: 'mgr-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('successfully approves and updates status to APPROVED_BY_MGR', async () => {
      mockPrisma.fundRequest.findUnique.mockResolvedValue({
        id: 'fr-1',
        requesterId: 'user-1',
        status: FundRequestStatus.PENDING_APPROVAL_MGR,
      });
      const updated = {
        id: 'fr-1',
        status: FundRequestStatus.APPROVED_BY_MGR,
        approvedById: 'mgr-1',
      };
      mockPrisma.fundRequest.update.mockResolvedValue(updated);

      const res = await service.approveFundRequest('fr-1', { approvedById: 'mgr-1' });
      expect(res).toEqual(updated);
      expect(mockPrisma.fundRequest.update).toHaveBeenCalledWith({
        where: { id: 'fr-1' },
        data: {
          status: FundRequestStatus.APPROVED_BY_MGR,
          approvedById: 'mgr-1',
        },
      });
    });
  });

  describe('disburseFundRequest', () => {
    it('disburses fund request and posts journal entry', async () => {
      mockPrisma.fundRequest.findUnique.mockResolvedValue({
        id: 'fr-1',
        requesterId: 'user-1',
        departmentId: 'MARKETING',
        amount: 250000,
        reason: 'Office supplies',
        status: FundRequestStatus.APPROVED_BY_MGR,
      });

      mockPrisma.account.findUnique.mockResolvedValue({ id: 'cash-acc-id', code: '1110' });
      mockPrisma.account.findFirst.mockResolvedValue({ id: 'exp-acc-id', code: '6101' });
      mockPrisma.fundRequest.update.mockResolvedValue({
        id: 'fr-1',
        status: FundRequestStatus.PAID,
        disbursedById: 'fin-1',
      });
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 'jrn-1' });

      const res = await service.disburseFundRequest('fr-1', {
        disbursedById: 'fin-1',
        accountId: 'cash-acc-id',
      });

      expect(res.status).toBe(FundRequestStatus.PAID);
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lines: {
              create: [
                { accountId: 'exp-acc-id', debit: 250000, credit: 0 },
                { accountId: 'cash-acc-id', debit: 0, credit: 250000 },
              ],
            },
          }),
        }),
      );
    });
  });
});
