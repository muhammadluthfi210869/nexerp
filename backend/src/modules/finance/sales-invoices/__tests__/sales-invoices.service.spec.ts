// Wave 2/A3 — SalesInvoicesService unit tests.
// Constructor injection: prisma + FinanceGateHelper.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesInvoicesService } from '../sales-invoices.service';

describe('SalesInvoicesService', () => {
  let service: SalesInvoicesService;
  let prismaMock: any;
  let gateMock: any;
  let stateMachineMock: any;

  const FAKE_CUSTOMER = { id: 'cust-1', name: 'PT Maju' };
  const FAKE_INVOICE = {
    id: 'si-1',
    invoiceNumber: 'SI-2609-000001',
    customerId: 'cust-1',
    invoiceDate: new Date('2026-09-15'),
    dueDate: new Date('2026-10-15'),
    subtotal: 100000,
    taxAmount: 11000,
    totalAmount: 111000,
    paidAmount: 0,
    postedAt: null,
    cancelledAt: null,
    paymentStatus: 'PENDING',
    customer: FAKE_CUSTOMER,
    lineItems: [],
    receipts: [],
  };

  beforeEach(() => {
    prismaMock = {
      salesInvoice: {
        findMany: jest.fn().mockResolvedValue([FAKE_INVOICE]),
        findUnique: jest.fn().mockResolvedValue(FAKE_INVOICE),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(FAKE_INVOICE),
        update: jest.fn().mockResolvedValue(FAKE_INVOICE),
      },
      customer: { findUnique: jest.fn().mockResolvedValue(FAKE_CUSTOMER) },
      account: { findFirst: jest.fn().mockResolvedValue({ id: 'gl-1', code: '1201' }) },
      journalEntry: { create: jest.fn().mockResolvedValue({ id: 'je-1' }) },
      $transaction: jest.fn(),
    };
    gateMock = { assertPeriodOpen: jest.fn().mockResolvedValue(undefined) };
    stateMachineMock = { transition: jest.fn().mockResolvedValue({ id: 'log-1' }) };
    service = new SalesInvoicesService(prismaMock, gateMock, stateMachineMock);
  });

  describe('findAll', () => {
    it('returns all invoices ordered by invoiceDate desc', async () => {
      const result = await service.findAll();
      expect(result).toEqual([FAKE_INVOICE]);
      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { invoiceDate: 'desc' } }),
      );
    });

    it('passes filter into where clause', async () => {
      await service.findAll({ customerId: 'cust-1', status: 'PENDING' });
      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'cust-1', status: 'PENDING' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the invoice when found', async () => {
      const result = await service.findOne('si-1');
      expect(result).toEqual(FAKE_INVOICE);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.salesInvoice.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates the invoice with auto-generated invoiceNumber + 11% PPN', async () => {
      const dto = {
        customerId: 'cust-1',
        dueDate: '2026-10-15',
        lineItems: [{ itemCode: 'X', itemName: 'Y', qty: 1, unit: 'pcs', price: 100000 }],
      };
      await service.create('user-1', dto);
      expect(prismaMock.salesInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceNumber: expect.stringMatching(/^SI-\d{4}-\d{6}$/),
            subtotal: 100000,
            taxAmount: 11000,
            totalAmount: 111000,
          }),
        }),
      );
    });

    it('throws NotFoundException when customer is missing', async () => {
      prismaMock.customer.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create('user-1', {
          customerId: 'missing',
          dueDate: '2026-10-15',
          lineItems: [{ itemCode: 'X', itemName: 'Y', qty: 1, unit: 'pcs', price: 100 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when lineItems empty', async () => {
      await expect(
        service.create('user-1', {
          customerId: 'cust-1',
          dueDate: '2026-10-15',
          lineItems: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('post', () => {
    it('asserts period open + posts the invoice', async () => {
      // make the tx callback flow runnable
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          salesInvoice: { update: jest.fn().mockResolvedValue({ ...FAKE_INVOICE, postedAt: new Date() }) },
          account: { findFirst: jest.fn().mockResolvedValue({ id: 'gl-1' }) },
          journalEntry: { create: jest.fn().mockResolvedValue({ id: 'je-1' }) },
        };
        return cb(tx);
      });
      await service.post('user-1', 'si-1');
      expect(gateMock.assertPeriodOpen).toHaveBeenCalled();
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when already posted', async () => {
      prismaMock.salesInvoice.findUnique.mockResolvedValueOnce({
        ...FAKE_INVOICE,
        postedAt: new Date('2026-09-01'),
      });
      await expect(service.post('user-1', 'si-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.salesInvoice.findUnique.mockResolvedValueOnce(null);
      await expect(service.post('user-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancels the invoice when paidAmount = 0', async () => {
      const result = await service.cancel('user-1', 'si-1', 'customer request');
      expect(result).toEqual(FAKE_INVOICE);
      expect(prismaMock.salesInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'si-1' },
          data: expect.objectContaining({ cancelledAt: expect.any(Date) }),
        }),
      );
    });

    it('throws BadRequestException when paidAmount > 0', async () => {
      prismaMock.salesInvoice.findUnique.mockResolvedValueOnce({
        ...FAKE_INVOICE,
        paidAmount: 50000,
      });
      await expect(service.cancel('user-1', 'si-1', 'x')).rejects.toThrow(BadRequestException);
    });
  });
});
