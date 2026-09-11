import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class DownPaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { vendorId?: string; status?: PaymentStatus }) {
    return this.prisma.downPayment.findMany({
      where: filter,
      include: {
        vendor: { select: { id: true, name: true } },
        appliedToBill: { select: { id: true, billNumber: true, grandTotal: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const dp = await this.prisma.downPayment.findUnique({
      where: { id },
      include: {
        vendor: true,
        appliedToBill: true,
      },
    });
    if (!dp) throw new NotFoundException(`Down payment ${id} not found`);
    return dp;
  }

  /**
   * Create a new down payment (PENDING — not yet paid by bank).
   */
  async create(
    userId: string,
    dto: {
      vendorId: string;
      amount: number;
      dpDate?: string;
      notes?: string;
    },
  ) {
    const vendor = await this.prisma.supplier.findUnique({
      where: { id: dto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    const now = new Date(dto.dpDate || Date.now());
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.downPayment.count({
      where: { dpNumber: { startsWith: `DPB-${yymm}-` } },
    });
    const dpNumber = `DPB-${yymm}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.downPayment.create({
      data: {
        dpNumber,
        vendorId: dto.vendorId,
        date: now,
        amount: dto.amount,
        remainingAmount: dto.amount,
        status: PaymentStatus.PENDING,
        notes: dto.notes ? `${dto.notes} [created by ${userId}]` : `[created by ${userId}]`,
      },
    });
  }

  /**
   * Post down payment — mark as PAID (bank transfer confirmed).
   * Creates journal entry: Dr. DP (asset) / Cr. Bank.
   */
  async post(
    userId: string,
    id: string,
    dto: { bankAccountId: string },
  ) {
    const dp = await this.prisma.downPayment.findUnique({ where: { id } });
    if (!dp) throw new NotFoundException(`Down payment ${id} not found`);
    if (dp.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Cannot post DP with status ${dp.status}. Only PENDING can be posted.`,
      );
    }

    const bankAcc = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!bankAcc) {
      throw new NotFoundException(`Bank account ${dto.bankAccountId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.downPayment.update({
        where: { id },
        data: {
          status: PaymentStatus.PAID,
          notes: dp.notes ? `${dp.notes} [posted by ${userId}]` : `[posted by ${userId}]`,
        },
      });

      // Journal: Dr. DP issued (asset) / Cr. Bank
      const dpAssetAcc = await tx.account.findFirst({ where: { code: '1301' } });
      if (dpAssetAcc) {
        await tx.journalEntry.create({
          data: {
            date: new Date(),
            reference: `DP-POST-${dp.dpNumber}`,
            description: `Down payment ${dp.dpNumber} posted to ${bankAcc.bankName}`,
            sourceDocumentType: 'PAYMENT' as any,
            lines: {
              create: [
                { accountId: dpAssetAcc.id, debit: Number(dp.amount), credit: 0 },
                { accountId: bankAcc.id, debit: 0, credit: Number(dp.amount) },
              ],
            },
          },
        });
      }

      // Update bank balance
      await tx.bankAccount.update({
        where: { id: bankAcc.id },
        data: { currentBalance: { decrement: Number(dp.amount) } },
      });

      return updated;
    });
  }

  /**
   * Apply DP to a bill — reduces bill paidAmount, updates DP remainingAmount.
   * Bill status changes based on paidAmount vs grandTotal.
   */
  async applyToBill(
    _userId: string,
    id: string,
    dto: { billId: string; applyAmount: number },
  ) {
    const dp = await this.prisma.downPayment.findUnique({ where: { id } });
    if (!dp) throw new NotFoundException(`Down payment ${id} not found`);
    if (dp.status !== PaymentStatus.PAID) {
      throw new BadRequestException(
        `Cannot apply DP with status ${dp.status}. Only PAID can be applied.`,
      );
    }
    if (dto.applyAmount > Number(dp.remainingAmount)) {
      throw new BadRequestException(
        `Apply amount ${dto.applyAmount} exceeds remaining ${dp.remainingAmount}`,
      );
    }

    const bill = await this.prisma.bill.findUnique({ where: { id: dto.billId } });
    if (!bill) throw new NotFoundException(`Bill ${dto.billId} not found`);
    if (bill.vendorId !== dp.vendorId) {
      throw new BadRequestException(
        `Bill vendor ${bill.vendorId} does not match DP vendor ${dp.vendorId}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const newRemaining = Number(dp.remainingAmount) - dto.applyAmount;
      // Bill status: PAID if fully covered, PARTIAL if partially
      const newPaidAmount = Number(bill.paidAmount) + dto.applyAmount;
      const newBillStatus =
        newPaidAmount >= Number(bill.grandTotal)
          ? PaymentStatus.PAID
          : PaymentStatus.PARTIAL;

      await tx.downPayment.update({
        where: { id },
        data: {
          remainingAmount: newRemaining,
          appliedAmount: { increment: dto.applyAmount },
          appliedToBillId: dto.billId,
          appliedAt: new Date(),
        },
      });

      await tx.bill.update({
        where: { id: dto.billId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newBillStatus,
        },
      });

      return { dpId: id, billId: dto.billId, appliedAmount: dto.applyAmount };
    });
  }

  /**
   * Cancel a PENDING down payment.
   */
  async cancel(userId: string, id: string, reason: string) {
    const dp = await this.prisma.downPayment.findUnique({ where: { id } });
    if (!dp) throw new NotFoundException(`Down payment ${id} not found`);
    if (dp.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        `Cannot cancel PAID DP via this method. Use a reversal journal.`,
      );
    }

    return this.prisma.downPayment.update({
      where: { id },
      data: {
        notes: `${dp.notes || ''}\n[CANCELLED by ${userId}] ${reason}`.trim(),
      },
    });
  }
}
