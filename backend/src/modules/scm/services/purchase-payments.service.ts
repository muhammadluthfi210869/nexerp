import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { logBestEffort } from '../../../common/helpers/best-effort';
import {
  CreatePurchasePaymentDto,
  CreateDownPaymentDto,
} from '../dto/purchase-payment.dto';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PurchasePaymentsService {
  private readonly logger = new Logger(PurchasePaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async pay(dto: CreatePurchasePaymentDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Determine target bill allocations
      let targetBillId = dto.billId;
      if (!targetBillId && dto.invoiceId) {
        // Find bill by ID or fallback invoice
        const b = await tx.bill.findUnique({ where: { id: dto.invoiceId } });
        if (b) {
          targetBillId = b.id;
        }
      }

      let allocations = dto.allocations;
      if (!allocations && targetBillId) {
        allocations = [{ billId: targetBillId, amount: dto.amount }];
      }

      if (!allocations || allocations.length === 0) {
        // Check if invoice table exists for legacy fallback
        if (dto.invoiceId) {
          const invoice = await tx.invoice.findUnique({ where: { id: dto.invoiceId } });
          if (invoice) {
            const outstanding = Number(invoice.outstandingAmount);
            if (outstanding <= 0) throw new BadRequestException('Invoice already fully paid');
            if (dto.amount > outstanding) throw new BadRequestException('Payment exceeds outstanding balance');

            const payment = await tx.payment.create({
              data: {
                invoiceId: dto.invoiceId,
                verifiedBy: userId,
                amountPaid: dto.amount,
                paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
                receivingAccountId: dto.receivingAccountId,
              },
            });

            const newOutstanding = outstanding - dto.amount;
            const newStatus = newOutstanding <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
            await tx.invoice.update({
              where: { id: dto.invoiceId },
              data: {
                outstandingAmount: newOutstanding,
                status: newStatus,
                ...(newStatus === InvoiceStatus.PAID ? { paidAt: new Date() } : {}),
              },
            });
            return payment;
          }
        }
        throw new BadRequestException('Wajib menentukan faktur/bill untuk alokasi pembayaran');
      }

      // Verify vendor
      const firstBill = await tx.bill.findUnique({ where: { id: allocations[0].billId } });
      if (!firstBill) throw new NotFoundException('Faktur tidak ditemukan');
      const vendorId = dto.vendorId || firstBill.vendorId;

      const paymentNumber = await this.idGenerator.generateId('BPB');
      const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

      // Create AP Payment
      const apPayment = await tx.aPPayment.create({
        data: {
          paymentNumber,
          vendorId,
          paymentDate,
          totalAmount: dto.amount,
          bankAccountId: dto.bankAccountId,
          notes: dto.notes,
          status: PaymentStatus.PAID,
          verifiedBy: userId,
          organizationId: dto.organizationId,
        },
      });

      // Apply allocations
      for (const alloc of allocations) {
        const bill = await tx.bill.findUnique({ where: { id: alloc.billId } });
        if (!bill) throw new NotFoundException(`Faktur ${alloc.billId} tidak ditemukan`);

        const grandTotal = Number(bill.grandTotal);
        const currentPaid = Number(bill.paidAmount);
        const remaining = grandTotal - currentPaid;

        if (alloc.amount > remaining + 0.01) {
          throw new BadRequestException(
            `Alokasi Rp ${alloc.amount} melebihi sisa tagihan faktur ${bill.billNumber} (sisa: Rp ${remaining})`,
          );
        }

        const newPaidAmount = currentPaid + alloc.amount;
        const newPaymentStatus =
          newPaidAmount >= grandTotal - 0.01 ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

        await tx.billAllocation.create({
          data: {
            paymentId: apPayment.id,
            billId: bill.id,
            amount: alloc.amount,
          },
        });

        await tx.bill.update({
          where: { id: bill.id },
          data: {
            paidAmount: newPaidAmount,
            paymentStatus: newPaymentStatus,
          },
        });

        // Also sync Invoice table if matching invoiceNumber exists
        try {
          const inv = await tx.invoice.findFirst({ where: { invoiceNumber: bill.billNumber } });
          if (inv) {
            const invOut = Math.max(0, Number(inv.outstandingAmount) - alloc.amount);
            await tx.invoice.update({
              where: { id: inv.id },
              data: {
                outstandingAmount: invOut,
                status: invOut <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
              },
            });
          }
        } catch (err) {
          logBestEffort(this.logger, 'invoice-mirror:bill-paid-sync', err);
        }
      }

      try {
        await tx.auditLog.create({
          data: {
            entityType: 'APPayment',
            entityId: apPayment.id,
            action: 'CREATE',
            source: 'SCM_PROCUREMENT',
            correlationId: apPayment.id,
            actorPermissionSnapshot: { paymentNumber, totalAmount: dto.amount, allocationsCount: allocations.length },
            actorUserId: userId,
            txId: randomUUID(),
          },
        });
      } catch (err) {
        logBestEffort(this.logger, 'audit:APPayment:CREATE', err);
      }

      const result = await tx.aPPayment.findUnique({
        where: { id: apPayment.id },
        include: {
          billAllocations: { include: { bill: true } },
          vendor: true,
          verifier: true,
        },
      });

      return {
        ...result,
        allocations: result?.billAllocations,
      };
    });
  }

  async reversePayment(id: string, userId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.aPPayment.findUnique({
        where: { id },
        include: { billAllocations: true },
      });

      if (!payment) throw new NotFoundException(`Pembayaran AP ${id} tidak ditemukan`);
      if (payment.notes?.includes('[REVERSED]')) {
        throw new BadRequestException('Pembayaran ini sudah pernah dibatalkan (Reversed).');
      }

      // Revert each allocation
      for (const alloc of payment.billAllocations) {
        const bill = await tx.bill.findUnique({ where: { id: alloc.billId } });
        if (bill) {
          const newPaid = Math.max(0, Number(bill.paidAmount) - Number(alloc.amount));
          const newStatus =
            newPaid <= 0 ? PaymentStatus.PENDING : PaymentStatus.PARTIAL;

          await tx.bill.update({
            where: { id: bill.id },
            data: {
              paidAmount: newPaid,
              paymentStatus: newStatus,
            },
          });

          // Sync unified invoice
          try {
            const inv = await tx.invoice.findFirst({ where: { invoiceNumber: bill.billNumber } });
            if (inv) {
              await tx.invoice.update({
                where: { id: inv.id },
                data: {
                  outstandingAmount: { increment: Number(alloc.amount) },
                  status: newStatus === PaymentStatus.PENDING ? InvoiceStatus.UNPAID : InvoiceStatus.PARTIAL,
                },
              });
            }
          } catch (err) {
            logBestEffort(this.logger, 'invoice-mirror:bill-reverse-sync', err);
          }
        }
      }

      // Mark payment cancelled in notes
      const updated = await tx.aPPayment.update({
        where: { id },
        data: {
          notes: `${payment.notes || ''} [REVERSED: ${reason || 'Pembatalan pembayaran'}]`.trim(),
        },
      });

      try {
        await tx.auditLog.create({
          data: {
            entityType: 'APPayment',
            entityId: id,
            action: 'REVERSE',
            source: 'SCM_PROCUREMENT',
            correlationId: id,
            actorPermissionSnapshot: { reason },
            actorUserId: userId,
            txId: randomUUID(),
          },
        });
      } catch (err) {
        logBestEffort(this.logger, 'audit:APPayment:REVERSE', err);
      }

      return updated;
    });
  }

  async createDownPayment(dto: CreateDownPaymentDto, userId: string) {
    const dpNumber = await this.idGenerator.generateId('DPB');
    const date = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const dp = await tx.downPayment.create({
        data: {
          dpNumber,
          vendorId: dto.vendorId,
          date,
          amount: dto.amount,
          remainingAmount: dto.amount,
          status: PaymentStatus.PAID, // Verified paid to vendor
          notes: dto.notes,
          organizationId: dto.organizationId,
        },
        include: { vendor: true },
      });

      try {
        await tx.auditLog.create({
          data: {
            entityType: 'DownPayment',
            entityId: dp.id,
            action: 'CREATE',
            source: 'SCM_PROCUREMENT',
            correlationId: dp.id,
            actorPermissionSnapshot: { dpNumber, amount: dto.amount },
            actorUserId: userId,
            txId: randomUUID(),
          },
        });
      } catch (err) {
        logBestEffort(this.logger, 'audit:DownPayment:CREATE', err);
      }

      return dp;
    });
  }

  async findAll(filter?: { vendorId?: string; search?: string }) {
    const where: any = {};
    if (filter?.vendorId) where.vendorId = filter.vendorId;
    if (filter?.search) {
      where.OR = [
        { paymentNumber: { contains: filter.search, mode: 'insensitive' } },
        { vendor: { name: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.aPPayment.findMany({
      where,
      include: {
        vendor: true,
        billAllocations: { include: { bill: true } },
        verifier: { select: { fullName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findAllDownPayments(filter?: { vendorId?: string; status?: PaymentStatus }) {
    const where: any = {};
    if (filter?.vendorId) where.vendorId = filter.vendorId;
    if (filter?.status) where.status = filter.status;

    return this.prisma.downPayment.findMany({
      where,
      include: { vendor: true, appliedToBill: true },
      orderBy: { date: 'desc' },
    });
  }
}
