import { Test, TestingModule } from '@nestjs/testing';
import { PurchasePaymentsService } from './purchase-payments.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PurchasePaymentsService', () => {
  let service: PurchasePaymentsService;
  let prisma: Record<string, any>;

  beforeEach(async () => {
    prisma = {
      invoice: { findUnique: jest.fn(), update: jest.fn() },
      payment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((fn: (...args: any[]) => any) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasePaymentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PurchasePaymentsService>(PurchasePaymentsService);
  });

  describe('pay', () => {
    const userId = 'user-1';

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw NotFoundException when invoice not found', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);
      await expect(
        service.pay({ invoiceId: 'bad-id', amount: 100000 }, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when invoice is fully paid', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        outstandingAmount: 0,
      });
      await expect(
        service.pay({ invoiceId: 'inv-1', amount: 100000 }, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment exceeds outstanding balance', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        outstandingAmount: 50000,
      });
      await expect(
        service.pay({ invoiceId: 'inv-1', amount: 100000 }, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process full payment and mark as PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        outstandingAmount: 100000,
      });
      prisma.payment.create.mockResolvedValue({ id: 'pay-1' });
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        invoice: { supplier: { id: 's-1' } },
        verifier: { fullName: 'Admin' },
      });

      const result = await service.pay(
        { invoiceId: 'inv-1', amount: 100000 },
        userId,
      );

      expect(result).toBeDefined();
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({
            status: 'PAID',
            outstandingAmount: 0,
          }),
        }),
      );
    });

    it('should process partial payment and mark as PARTIAL', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        outstandingAmount: 200000,
      });
      prisma.payment.create.mockResolvedValue({ id: 'pay-1' });
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        invoice: { supplier: { id: 's-1' } },
        verifier: { fullName: 'Admin' },
      });

      const result = await service.pay(
        { invoiceId: 'inv-1', amount: 80000 },
        userId,
      );

      expect(result).toBeDefined();
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({
            status: 'PARTIAL',
            outstandingAmount: 120000,
          }),
        }),
      );
    });

    it('should set paidAt when fully paid', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        outstandingAmount: 50000,
      });
      prisma.payment.create.mockResolvedValue({ id: 'pay-1' });
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        invoice: { supplier: {} },
        verifier: { fullName: 'Admin' },
      });

      await service.pay({ invoiceId: 'inv-1', amount: 50000 }, userId);

      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paidAt: expect.any(Date) }),
        }),
      );
    });

    it('should propagate transaction failure without completing payment', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        outstandingAmount: 100000,
      });
      prisma.payment.create.mockResolvedValue({ id: 'pay-1' });
      prisma.invoice.update.mockRejectedValue(new Error('DB write failed'));

      await expect(
        service.pay({ invoiceId: 'inv-1', amount: 100000 }, userId),
      ).rejects.toThrow('DB write failed');

      expect(prisma.payment.create).toHaveBeenCalledTimes(1);
      expect(prisma.invoice.update).toHaveBeenCalledTimes(1);
    });

    it('should reject duplicate full payment after invoice becomes PAID', async () => {
      prisma.invoice.findUnique
        .mockResolvedValueOnce({ id: 'inv-1', outstandingAmount: 50000 })
        .mockResolvedValueOnce({ id: 'inv-1', outstandingAmount: 0 });
      prisma.payment.create.mockResolvedValue({ id: 'pay-1' });
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        invoice: { supplier: {} },
        verifier: { fullName: 'Admin' },
      });

      await service.pay({ invoiceId: 'inv-1', amount: 50000 }, userId);
      await expect(
        service.pay({ invoiceId: 'inv-1', amount: 50000 }, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all payments ordered by paymentDate desc', async () => {
      prisma.payment.findMany.mockResolvedValue([
        { id: 'pay-1', paymentDate: new Date() },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { paymentDate: 'desc' } }),
      );
    });

    it('should include invoice and verifier relations', async () => {
      const mockPayments = [
        {
          id: 'pay-1',
          invoice: { include: { supplier: true } },
          verifier: { select: { fullName: true } },
        },
      ];
      prisma.payment.findMany.mockResolvedValue(mockPayments);

      await service.findAll();
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            invoice: expect.any(Object),
            verifier: expect.any(Object),
          }),
        }),
      );
    });

    it('should return empty array when no payments', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
