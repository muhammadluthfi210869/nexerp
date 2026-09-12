import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { PaymentStatus, StateEventTrigger } from '@prisma/client';
import { FinanceGateHelper } from '../../../common/helpers/gate.helper';
import { StateMachineService } from '../../state-machine/state-machine.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ARReceiptsService {
  constructor(
    private prisma: PrismaService,
    private gate: FinanceGateHelper,
    private stateMachine: StateMachineService,
  ) {}

  async findAll(filter?: { customerId?: string; invoiceId?: string }) {
    return this.prisma.aRReceipt.findMany({
      where: filter,
      include: {
        customer: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, paidAmount: true } },
        bankAccount: { select: { id: true, bankName: true, accountNumber: true } },
      },
      orderBy: { receiptDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const receipt = await this.prisma.aRReceipt.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: true,
        bankAccount: true,
      },
    });
    if (!receipt) throw new NotFoundException(`AR receipt ${id} not found`);
    return receipt;
  }

  /**
   * Create a new AR receipt (customer payment received).
   * Generates receipt number RECV-YYMM-XXXX.
   */
  async create(
    userId: string,
    dto: {
      customerId: string;
      invoiceId?: string;
      amount: number;
      pph23Amount?: number;
      receiptDate?: string;
      bankAccountId?: string;
      notes?: string;
      attachmentUrls?: string[];
    },
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    // Gate: period open
    await this.gate.assertPeriodOpen(new Date(), 'AR-RECEIPT');

    // Validate invoice if provided
    if (dto.invoiceId) {
      const invoice = await this.prisma.salesInvoice.findUnique({
        where: { id: dto.invoiceId },
      });
      if (!invoice) {
        throw new NotFoundException(`Sales invoice ${dto.invoiceId} not found`);
      }
      if (invoice.customerId !== dto.customerId) {
        throw new BadRequestException(
          `Invoice customer ${invoice.customerId} does not match receipt customer ${dto.customerId}`,
        );
      }
    }

    const now = new Date(dto.receiptDate || Date.now());
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.aRReceipt.count({
      where: { receiptNumber: { startsWith: `RECV-${yymm}-` } },
    });
    const receiptNumber = `RECV-${yymm}-${String(count + 1).padStart(4, '0')}`;

    // Wave 1/A5 — generate receipt UUID up front so the state-machine
    // transition can use it as entityId BEFORE the receipt row exists.
    // NO_DUAL_WRITE: duplicate create() for the same receipt will fail
    // the (entityId, eventTrigger) unique index.
    const receiptId = randomUUID();
    await this.stateMachine.transition({
      entityType: 'AR_RECEIPT',
      entityId: receiptId,
      eventTrigger: StateEventTrigger.PAYMENT_RECEIVED,
      fromState: null,
      toState: 'RECEIVED',
      userId,
      reason: `AR receipt ${receiptNumber} from customer`,
      metadata: {
        customerId: dto.customerId,
        invoiceId: dto.invoiceId ?? null,
        amount: dto.amount,
        bankAccountId: dto.bankAccountId ?? null,
      },
    });

    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.aRReceipt.create({
        data: {
          id: receiptId,
          receiptNumber,
          customerId: dto.customerId,
          invoiceId: dto.invoiceId,
          receiptDate: now,
          amount: dto.amount,
          pph23Amount: dto.pph23Amount,
          bankAccountId: dto.bankAccountId,
          notes: dto.notes ? `${dto.notes} [created by ${userId}]` : `[created by ${userId}]`,
          attachmentUrls: dto.attachmentUrls || [],
        },
      });

      // Update invoice paidAmount if linked
      if (dto.invoiceId) {
        const invoice = await tx.salesInvoice.findUnique({
          where: { id: dto.invoiceId },
        });
        if (invoice) {
          const newPaid = Number(invoice.paidAmount) + dto.amount;
          const newStatus =
            newPaid >= Number(invoice.totalAmount)
              ? PaymentStatus.PAID
              : PaymentStatus.PARTIAL;
          await tx.salesInvoice.update({
            where: { id: dto.invoiceId },
            data: {
              paidAmount: newPaid,
              paymentStatus: newStatus,
            },
          });
        }
      }

      // Update bank balance (increment - cash coming in)
      if (dto.bankAccountId) {
        await tx.bankAccount.update({
          where: { id: dto.bankAccountId },
          data: { currentBalance: { increment: dto.amount } },
        });
      }

      // Journal entry: Dr. Bank / Cr. AR
      const arAcc = await tx.account.findFirst({ where: { code: '1201' } }); // AR Trade Receivables
      if (arAcc && dto.bankAccountId) {
        await tx.journalEntry.create({
          data: {
            date: now,
            reference: `AR-RECV-${receiptNumber}`,
            description: `AR receipt ${receiptNumber} from customer`,
            sourceDocumentType: 'PAYMENT' as any,
            lines: {
              create: [
                { accountId: dto.bankAccountId, debit: dto.amount, credit: 0 },
                { accountId: arAcc.id, debit: 0, credit: dto.amount },
              ],
            },
          },
        });
      }

      return receipt;
    });
  }

  /**
   * Allocate an existing receipt to a specific invoice.
   * Use this when receipt was created without invoice link.
   */
  async allocateToInvoice(
    _userId: string,
    receiptId: string,
    dto: { invoiceId: string },
  ) {
    const receipt = await this.prisma.aRReceipt.findUnique({
      where: { id: receiptId },
    });
    if (!receipt) throw new NotFoundException(`AR receipt ${receiptId} not found`);

    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) throw new NotFoundException(`Sales invoice ${dto.invoiceId} not found`);

    if (invoice.customerId !== receipt.customerId) {
      throw new BadRequestException(
        `Invoice customer ${invoice.customerId} does not match receipt customer ${receipt.customerId}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.aRReceipt.update({
        where: { id: receiptId },
        data: { invoiceId: dto.invoiceId },
      });

      const newPaid = Number(invoice.paidAmount) + Number(receipt.amount);
      const newStatus =
        newPaid >= Number(invoice.totalAmount)
          ? PaymentStatus.PAID
          : PaymentStatus.PARTIAL;
      await tx.salesInvoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: newPaid,
          paymentStatus: newStatus,
        },
      });

      return updated;
    });
  }
}
