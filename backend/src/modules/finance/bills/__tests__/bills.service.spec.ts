// Wave 2/A3 — BillsService unit tests.
// Constructor injection: prisma + FinanceGateHelper + StateMachineService.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillsService } from '../bills.service';

describe('BillsService', () => {
  let service: BillsService;
  let prismaMock: any;
  let gateMock: any;
  let stateMachineMock: any;

  const FAKE_VENDOR = { id: 'sup-1', name: 'PT Vendor' };
  const FAKE_BILL = {
    id: 'bill-1',
    billNumber: 'FP-2609-000001',
    vendorId: 'sup-1',
    vendor: FAKE_VENDOR,
    subtotal: 100000,
    taxAmount: 11000,
    grandTotal: 111000,
    paidAmount: 0,
    postedAt: null,
    cancelledAt: null,
    paymentStatus: 'PENDING',
    procurementCategory: '5100',
    items: [],
    allocations: [],
  };

  beforeEach(() => {
    prismaMock = {
      bill: {
        findMany: jest.fn().mockResolvedValue([FAKE_BILL]),
        findUnique: jest.fn().mockResolvedValue(FAKE_BILL),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(FAKE_BILL),
        update: jest.fn().mockResolvedValue(FAKE_BILL),
      },
      supplier: { findUnique: jest.fn().mockResolvedValue(FAKE_VENDOR) },
      account: { findFirst: jest.fn().mockResolvedValue({ id: 'gl-1' }) },
      journalEntry: { create: jest.fn().mockResolvedValue({ id: 'je-1' }) },
      $transaction: jest.fn(),
    };
    gateMock = { assertPeriodOpen: jest.fn().mockResolvedValue(undefined) };
    stateMachineMock = { transition: jest.fn().mockResolvedValue({ id: 'log-1' }) };
    service = new BillsService(prismaMock, gateMock, stateMachineMock);
  });

  describe('findAll', () => {
    it('returns all bills with vendor + items + allocations', async () => {
      await service.findAll();
      expect(prismaMock.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { invoiceDate: 'desc' } }),
      );
    });

    it('passes filter to where clause', async () => {
      await service.findAll({ vendorId: 'sup-1', status: 'PENDING' });
      expect(prismaMock.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { vendorId: 'sup-1', status: 'PENDING' } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the bill when found', async () => {
      const result = await service.findOne('bill-1');
      expect(result).toEqual(FAKE_BILL);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.bill.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates the bill with auto-generated billNumber FP-YYMM-XXXXXX', async () => {
      const dto = {
        vendorId: 'sup-1',
        procurementCategory: '5100',
        dueDate: '2026-10-15',
        pic: 'Budi',
        lineItems: [{ itemCode: 'X', itemName: 'Y', qty: 1, unit: 'pcs', price: 100000 }],
      };
      await service.create('user-1', dto);
      expect(prismaMock.bill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            billNumber: expect.stringMatching(/^FP-\d{4}-\d{6}$/),
            subtotal: 100000,
            taxAmount: 11000,
            grandTotal: 111000,
          }),
        }),
      );
    });

    it('throws NotFoundException when vendor is missing', async () => {
      prismaMock.supplier.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create('user-1', {
          vendorId: 'missing',
          procurementCategory: '5100',
          dueDate: '2026-10-15',
          pic: 'Budi',
          lineItems: [{ itemCode: 'X', itemName: 'Y', qty: 1, unit: 'pcs', price: 100 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when lineItems empty', async () => {
      await expect(
        service.create('user-1', {
          vendorId: 'sup-1',
          procurementCategory: '5100',
          dueDate: '2026-10-15',
          pic: 'Budi',
          lineItems: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('post', () => {
    it('asserts period open + state-machine transition + tx', async () => {
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          bill: { update: jest.fn().mockResolvedValue({ ...FAKE_BILL, postedAt: new Date() }) },
          account: { findFirst: jest.fn().mockResolvedValue({ id: 'gl-1' }) },
          supplier: { findUnique: jest.fn().mockResolvedValue(FAKE_VENDOR) },
          journalEntry: { create: jest.fn().mockResolvedValue({ id: 'je-1' }) },
        };
        return cb(tx);
      });
      await service.post('user-1', 'bill-1');
      expect(gateMock.assertPeriodOpen).toHaveBeenCalled();
      expect(stateMachineMock.transition).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'BILL',
          eventTrigger: 'JOURNAL_POSTED',
          fromState: 'DRAFT',
          toState: 'POSTED',
        }),
      );
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when already posted', async () => {
      prismaMock.bill.findUnique.mockResolvedValueOnce({
        ...FAKE_BILL,
        postedAt: new Date('2026-09-01'),
      });
      await expect(service.post('user-1', 'bill-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.bill.findUnique.mockResolvedValueOnce(null);
      await expect(service.post('user-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancels when paidAmount = 0', async () => {
      const result = await service.cancel('user-1', 'bill-1', 'duplicate');
      expect(result).toEqual(FAKE_BILL);
    });

    it('throws BadRequestException when paidAmount > 0', async () => {
      prismaMock.bill.findUnique.mockResolvedValueOnce({
        ...FAKE_BILL,
        paidAmount: 50000,
      });
      await expect(service.cancel('user-1', 'bill-1', 'x')).rejects.toThrow(BadRequestException);
    });
  });
});
