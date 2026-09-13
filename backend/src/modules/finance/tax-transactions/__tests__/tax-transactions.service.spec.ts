// Wave 2/A3 — TaxTransactionsService unit tests.
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaxTransactionsService } from '../tax-transactions.service';

describe('TaxTransactionsService', () => {
  let service: TaxTransactionsService;
  let prismaMock: any;

  const FAKE_RATE = { id: 'tt-1', name: 'PPN', rate: 11 };
  const FAKE_TAX = {
    id: 'tax-1',
    taxTypeId: 'tt-1',
    sourceType: 'BILL',
    sourceId: 'bill-1',
    baseAmount: 100000,
    taxRate: 11,
    taxAmount: 11000,
    status: 'ACCRUED',
    notes: null,
    taxRateRel: FAKE_RATE,
  };

  beforeEach(() => {
    prismaMock = {
      taxTransaction: {
        findMany: jest.fn().mockResolvedValue([FAKE_TAX]),
        findUnique: jest.fn().mockResolvedValue(FAKE_TAX),
        create: jest.fn().mockResolvedValue(FAKE_TAX),
        update: jest.fn().mockResolvedValue({ ...FAKE_TAX, status: 'REPORTED' }),
      },
      taxRate: { findUnique: jest.fn().mockResolvedValue(FAKE_RATE) },
    };
    service = new TaxTransactionsService(prismaMock);
  });

  describe('findAll', () => {
    it('returns transactions matching filter', async () => {
      const result = await service.findAll({ status: 'ACCRUED' });
      expect(result).toEqual([FAKE_TAX]);
      expect(prismaMock.taxTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'ACCRUED' } }),
      );
    });

    it('passes date range into where clause', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');
      await service.findAll({ from, to });
      expect(prismaMock.taxTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: { gte: from, lte: to } },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the tax transaction', async () => {
      const result = await service.findOne('tax-1');
      expect(result).toEqual(FAKE_TAX);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.taxTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('computes taxAmount when not provided', async () => {
      const dto = {
        taxTypeId: 'tt-1',
        sourceType: 'BILL' as const,
        sourceId: 'bill-1',
        baseAmount: 100000,
        taxRate: 11,
      };
      await service.create('user-1', dto);
      expect(prismaMock.taxTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ taxAmount: 11000, status: 'ACCRUED' }),
        }),
      );
    });

    it('throws BadRequestException for invalid sourceType', async () => {
      await expect(
        service.create('user-1', {
          taxTypeId: 'tt-1',
          sourceType: 'BAD' as any,
          sourceId: 'x',
          baseAmount: 100,
          taxRate: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for baseAmount <= 0', async () => {
      await expect(
        service.create('user-1', {
          taxTypeId: 'tt-1',
          sourceType: 'BILL',
          sourceId: 'x',
          baseAmount: 0,
          taxRate: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for taxRate out of range', async () => {
      await expect(
        service.create('user-1', {
          taxTypeId: 'tt-1',
          sourceType: 'BILL',
          sourceId: 'x',
          baseAmount: 100,
          taxRate: 150,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when taxTypeId is unknown', async () => {
      prismaMock.taxRate.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create('user-1', {
          taxTypeId: 'missing',
          sourceType: 'BILL',
          sourceId: 'x',
          baseAmount: 100,
          taxRate: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markReported', () => {
    it('moves ACCRUED -> REPORTED', async () => {
      const result = await service.markReported('tax-1', { reportPeriod: '2026-09' });
      expect(result.status).toBe('REPORTED');
      expect(prismaMock.taxTransaction.update).toHaveBeenCalled();
    });

    it('throws BadRequestException when status is not ACCRUED', async () => {
      prismaMock.taxTransaction.findUnique.mockResolvedValueOnce({ ...FAKE_TAX, status: 'PAID' });
      await expect(service.markReported('tax-1', { reportPeriod: '2026-09' })).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.taxTransaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.markReported('missing', { reportPeriod: '2026-09' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('markPaid', () => {
    it('moves REPORTED -> PAID', async () => {
      prismaMock.taxTransaction.findUnique.mockResolvedValueOnce({ ...FAKE_TAX, status: 'REPORTED' });
      prismaMock.taxTransaction.update.mockResolvedValueOnce({ ...FAKE_TAX, status: 'PAID' });
      const result = await service.markPaid('tax-1', { paymentRef: 'TRF-001' });
      expect(result.status).toBe('PAID');
    });

    it('throws BadRequestException when status is not REPORTED', async () => {
      prismaMock.taxTransaction.findUnique.mockResolvedValueOnce({ ...FAKE_TAX, status: 'ACCRUED' });
      await expect(service.markPaid('tax-1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSummary', () => {
    it('returns aggregated tax summary by taxTypeId', async () => {
      prismaMock.taxTransaction.findMany.mockResolvedValueOnce([
        { ...FAKE_TAX, status: 'ACCRUED', taxAmount: 11000 },
        { ...FAKE_TAX, status: 'REPORTED', taxAmount: 22000 },
        { ...FAKE_TAX, status: 'PAID', taxAmount: 5500 },
      ]);
      const result = await service.getSummary(new Date('2026-01-01'), new Date('2026-12-31'));
      expect(result.byTaxType).toHaveLength(1);
      expect(result.byTaxType[0]).toEqual(
        expect.objectContaining({ accrued: 11000, reported: 22000, paid: 5500, count: 3 }),
      );
    });
  });
});
