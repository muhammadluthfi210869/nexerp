import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from '../../src/modules/finance/finance.service';
import { PrismaService } from '../../src/prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../src/modules/system/id-generator.service';
import { ScmService } from '../../src/modules/scm/services/scm.service';
import { CreativeService } from '../../src/modules/creative/creative.service';
import { WarehouseService } from '../../src/modules/warehouse/warehouse.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TestModule } from '../utilities/test-module';

describe('FinanceService — Unit', () => {
  let service: FinanceService;
  let prisma: any;

  const invoiceId = 'INV-001';
  const soId = 'SO-001';

  beforeEach(async () => {
    prisma = TestModule.mockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: TestModule.mockEventEmitter() },
        {
          provide: IdGeneratorService,
          useValue: { generateId: jest.fn().mockResolvedValue('JRN-001') },
        },
        { provide: ScmService, useValue: {} },
        { provide: CreativeService, useValue: {} },
        { provide: WarehouseService, useValue: {} },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  describe('verifyPayment', () => {
    it('marks invoice as PAID', async () => {
      prisma.invoice.findUnique = jest.fn().mockResolvedValue({
        id: invoiceId,
        type: 'INVOICE',
        status: 'UNPAID',
        soId: null,
        so: null,
      });
      prisma.invoice.update = jest.fn().mockResolvedValue({
        id: invoiceId,
        status: 'PAID',
        paidAt: new Date(),
        outstandingAmount: 0,
      });

      const result = await service.verifyPayment(invoiceId, 'finance-user');
      expect(result.status).toBe('PAID');
    });

    it('advances SO to ACTIVE when DP invoice paid', async () => {
      prisma.invoice.findUnique = jest.fn().mockResolvedValue({
        id: invoiceId,
        type: 'DP',
        soId,
        so: { leadId: 'LEAD-1' },
      });
      prisma.invoice.update = jest
        .fn()
        .mockResolvedValue({ id: invoiceId, status: 'PAID' });
      prisma.salesOrder = { update: jest.fn() };

      await service.verifyPayment(invoiceId, 'finance-user');
      expect(prisma.salesOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACTIVE' } }),
      );
    });

    it('throws when invoice not found', async () => {
      prisma.invoice.findUnique = jest.fn().mockResolvedValue(null);
      await expect(
        service.verifyPayment('NONEXISTENT', 'user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInvoices', () => {
    it('returns invoices filtered by category', async () => {
      prisma.invoice.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 'INV-1', status: 'UNPAID' }]);
      const result = await service.getInvoices('RECEIVABLE');
      expect(result).toHaveLength(1);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'RECEIVABLE' }),
        }),
      );
    });
  });

  describe('getActiveInvoices', () => {
    it('returns limited active invoices', async () => {
      prisma.invoice.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 'INV-1' }, { id: 'INV-2' }]);
      const result = await service.getActiveInvoices(5);
      expect(result).toHaveLength(2);
    });
  });

  describe('getDashboardMetrics', () => {
    it('returns counts', async () => {
      prisma.invoice.count = jest.fn();
      prisma.invoice.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
      prisma.account = { count: jest.fn().mockResolvedValue(20) };

      const result = await service.getDashboardMetrics();
      expect(result.totalReceivables).toBe(10);
      expect(result.totalPayables).toBe(5);
      expect(result.totalAccounts).toBe(20);
    });
  });

  describe('getProjectBudgetingReport', () => {
    it('calculates budget vs spend', async () => {
      prisma.salesLead.findMany = jest.fn().mockResolvedValue([
        {
          id: 'LEAD-1',
          clientName: 'Client A',
          brandName: 'Brand A',
          productInterest: 'Product',
          status: 'NEGOTIATION',
          estimatedValue: 100000000,
          salesOrders: [],
          purchaseOrders: [],
          workOrders: [],
        },
      ]);

      const result = await service.getProjectBudgetingReport();
      expect(result).toHaveLength(1);
      expect(result[0].budget).toBe(100000000);
      expect(result[0].margin).toBe(100000000);
    });
  });

  describe('FundRequest', () => {
    it('creates fund request with PENDING status', async () => {
      prisma.fundRequest = {
        create: jest.fn().mockResolvedValue({ id: 'FR-1', status: 'PENDING' }),
      };
      prisma.account = {
        findMany: jest.fn().mockResolvedValue([{ id: 'ACC-1', code: '1101' }]),
      };

      const result = await (service as any).createFundRequest('USER-1', {
        title: 'Test Fund',
        amount: 5000000,
        reason: 'Ops',
        urgency: 'NORMAL',
        accountCode: '1101',
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('validatePayment', () => {
    it('validates payment with correct amount', async () => {
      prisma.invoice = {
        findUnique: jest.fn().mockResolvedValue({
          id: invoiceId,
          outstandingAmount: 100000,
          status: 'UNPAID',
        }),
        update: jest.fn().mockResolvedValue({}),
      };

      const result = await service.validatePayment(invoiceId);
      expect(result).toBeDefined();
    });
  });
});
