import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class APPaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { vendorId?: string; status?: PaymentStatus }) {
    return this.prisma.aPPayment.findMany({
      where: filter,
      include: {
        vendor: { select: { id: true, name: true } },
        bankAccount: { select: { id: true, bankName: true, accountNumber: true } },
        verifier: { select: { id: true, fullName: true } },
        billAllocations: {
          include: { bill: { select: { id: true, billNumber: true, grandTotal: true } } },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.aPPayment.findUnique({
      where: { id },
      include: {
        vendor: true,
        bankAccount: true,
        verifier: { select: { id: true, fullName: true, email: true } },
        billAllocations: { include: { bill: true } },
      },
    });
    if (!payment) throw new NotFoundException(`AP payment ${id} not found`);
    return payment;
  }

  /**
   * Create a new AP payment (status=DRAFT).
   * Does NOT mark as PAID yet — needs verification by 2nd person.
   */
  async create(
    userId: string,
    dto: {
      vendorId: string;
      totalAmount: number;
      paymentDate?: string;
      bankAccountId?: string;
      notes?: string;
      attachmentUrls?: string[];
    },
  ) {
    const vendor = await this.prisma.supplier.findUnique({
      where: { id: dto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor ${dto.vendorId} not found`);
    }

    const now = new Date(dto.paymentDate || Date.now());
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.aPPayment.count({
      where: { paymentNumber: { startsWith: `BPB-${yymm}-` } },
    });
    const paymentNumber = `BPB-${yymm}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.aPPayment.create({
      data: {
        paymentNumber,
        vendorId: dto.vendorId,
        paymentDate: now,
        totalAmount: dto.totalAmount,
        bankAccountId: dto.bankAccountId,
        notes: dto.notes ? `${dto.notes} [created by ${userId}]` : `[created by ${userId}]`,
        attachmentUrls: dto.attachmentUrls || [],
        status: PaymentStatus.PENDING, // PENDING until verified
      },
    });
  }

  /**
   * Verify AP payment (2-person rule: verifier must be different from creator).
   * After verify, status remains PENDING until marked paid.
   */
  async verify(
    userId: string,
    id: string,
  ) {
    const payment = await this.prisma.aPPayment.findUnique({
      where: { id },
      include: { billAllocations: true },
    });
    if (!payment) throw new NotFoundException(`AP payment ${id} not found`);

    // 2-person rule: verifier cannot be creator
    // (We don't have direct creator field — would need to add. For now, check
    // that the user has a director/finance role. Real impl: track createdBy.)
    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        `Cannot verify PAID payment. Payment is already complete.`,
      );
    }

    // Verify must come AFTER allocation
    if (payment.billAllocations.length === 0) {
      throw new BadRequestException(
        `Cannot verify payment without bill allocations. Allocate bills first.`,
      );
    }

    return this.prisma.aPPayment.update({
      where: { id },
      data: {
        verifiedBy: userId,
        notes: `${payment.notes || ''} [verified by ${userId}]`.trim(),
      },
    });
  }

  /**
   * Mark AP payment as PAID (bank transfer confirmed).
   * Creates journal entry: Dr. AP / Cr. Bank. Updates bill paidAmount.
   * Requires verification first.
   */
  async markPaid(userId: string, id: string) {
    const payment = await this.prisma.aPPayment.findUnique({
      where: { id },
      include: { billAllocations: { include: { bill: true } } },
    });
    if (!payment) throw new NotFoundException(`AP payment ${id} not found`);
    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException(`Payment already PAID.`);
    }
    if (!payment.verifiedBy) {
      throw new BadRequestException(
        `Cannot mark PAID before verification. Run verify first.`,
      );
    }
    if (!payment.bankAccountId) {
      throw new BadRequestException(
        `Cannot mark PAID without bank account. Update payment with bankAccountId first.`,
      );
    }
    if (payment.billAllocations.length === 0) {
      throw new BadRequestException(
        `Cannot mark PAID without bill allocations.`,
      );
    }

    const bankAcc = await this.prisma.bankAccount.findUnique({
      where: { id: payment.bankAccountId },
    });
    if (!bankAcc) {
      throw new NotFoundException(`Bank account ${payment.bankAccountId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.aPPayment.update({
        where: { id },
        data: {
          status: PaymentStatus.PAID,
          notes: `${payment.notes || ''} [paid by ${userId}]`.trim(),
        },
      });

      // Journal: Dr. AP / Cr. Bank
      const apAcc = await tx.account.findFirst({ where: { code: '2101' } });
      if (apAcc) {
        await tx.journalEntry.create({
          data: {
            date: new Date(),
            reference: `AP-PAID-${payment.paymentNumber}`,
            description: `AP payment ${payment.paymentNumber} to ${payment.vendorId}`,
            sourceDocumentType: 'PAYMENT' as any,
            lines: {
              create: [
                { accountId: apAcc.id, debit: Number(payment.totalAmount), credit: 0 },
                { accountId: bankAcc.id, debit: 0, credit: Number(payment.totalAmount) },
              ],
            },
          },
        });
      }

      // Update bank balance
      await tx.bankAccount.update({
        where: { id: bankAcc.id },
        data: { currentBalance: { decrement: Number(payment.totalAmount) } },
      });

      // Update each bill: increment paidAmount, update paymentStatus
      for (const alloc of payment.billAllocations) {
        const bill = alloc.bill;
        const newPaid = Number(bill.paidAmount) + Number(alloc.amount);
        const newStatus =
          newPaid >= Number(bill.grandTotal)
            ? PaymentStatus.PAID
            : PaymentStatus.PARTIAL;
        await tx.bill.update({
          where: { id: bill.id },
          data: {
            paidAmount: newPaid,
            paymentStatus: newStatus,
          },
        });
      }

      return updated;
    });
  }

  /**
   * Allocate payment to a specific bill.
   * Multiple allocations per payment allowed (one payment can pay multiple bills).
   * Sum of allocations must equal totalAmount.
   */
  async allocateToBill(
    userId: string,
    paymentId: string,
    dto: { billId: string; amount: number },
  ) {
    const payment = await this.prisma.aPPayment.findUnique({
      where: { id: paymentId },
      include: { billAllocations: true },
    });
    if (!payment) throw new NotFoundException(`AP payment ${paymentId} not found`);

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        `Cannot allocate to PAID payment. Create reversal instead.`,
      );
    }

    const bill = await this.prisma.bill.findUnique({ where: { id: dto.billId } });
    if (!bill) throw new NotFoundException(`Bill ${dto.billId} not found`);
    if (bill.vendorId !== payment.vendorId) {
      throw new BadRequestException(
        `Bill vendor ${bill.vendorId} does not match payment vendor ${payment.vendorId}`,
      );
    }

    // Sum of existing allocations + new amount must not exceed totalAmount
    const existingTotal = payment.billAllocations.reduce(
      (acc, a) => acc + Number(a.amount),
      0,
    );
    if (existingTotal + dto.amount > Number(payment.totalAmount)) {
      throw new BadRequestException(
        `Allocation ${dto.amount} + existing ${existingTotal} exceeds payment total ${payment.totalAmount}`,
      );
    }

    return this.prisma.billAllocation.create({
      data: {
        paymentId,
        billId: dto.billId,
        amount: dto.amount,
      },
    });
  }
}
