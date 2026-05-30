import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../system/id-generator.service';
import {
  CashDisburseDto,
  CashReceiveDto,
  CashDisburseCategory,
  CashReceiveCategory,
} from './dto/cash.dto';
import { PeriodStatus } from '@prisma/client';

@Injectable()
export class CashService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  async disburse(dto: CashDisburseDto) {
    return this.prisma.$transaction(async (tx) => {
      const entryDate = new Date(dto.date);

      const lockedPeriod = await tx.financialPeriod.findFirst({
        where: {
          startDate: { lte: entryDate },
          endDate: { gte: entryDate },
          status: { in: [PeriodStatus.SOFT_LOCKED, PeriodStatus.CLOSED] },
        },
      });

      if (lockedPeriod) {
        throw new BadRequestException(
          `Transaksi ditolak: Periode ${lockedPeriod.name} sudah dikunci.`,
        );
      }

      const cashAccount = await tx.account.findUnique({
        where: { id: dto.cashAccountId },
      });

      if (!cashAccount) {
        throw new BadRequestException('Cash account not found');
      }

      const debitAccount = await tx.account.findUnique({
        where: { id: dto.debitAccountId },
      });

      if (!debitAccount) {
        throw new BadRequestException('Debit account not found');
      }

      const journal = await tx.journalEntry.create({
        data: {
          date: entryDate,
          reference: await this.idGenerator.generateId('KLR'),
          description: `Kas Keluar: ${dto.entityName} — ${dto.notes} [${dto.category}]`,
          attachmentUrls: dto.attachmentUrls || [],
          lines: {
            create: [
              { accountId: dto.debitAccountId, debit: dto.amount, credit: 0 },
              { accountId: dto.cashAccountId, debit: 0, credit: dto.amount },
            ],
          },
        },
        include: { lines: true },
      });

      if (
        dto.category === CashDisburseCategory.UANG_MUKA_PEMBELIAN &&
        dto.referenceId
      ) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: dto.referenceId },
        });

        if (po) {
          await tx.invoice.create({
            data: {
              invoiceNumber: await this.idGenerator.generateId('DPP'),
              category: 'PAYABLE',
              type: 'DP',
              status: 'PAID',
              amountDue: dto.amount,
              outstandingAmount: 0,
              paidAt: entryDate,
              dueDate: entryDate,
              poId: dto.referenceId,
              description: `DP Pembelian: ${dto.entityName}`,
            },
          });
        }
      }

      if (
        dto.category === CashDisburseCategory.BAYAR_UTANG &&
        dto.referenceId
      ) {
        const invoice = await tx.invoice.findUnique({
          where: { id: dto.referenceId },
        });

        if (invoice) {
          await tx.payment.create({
            data: {
              invoiceId: dto.referenceId,
              verifiedBy: dto.cashAccountId,
              amountPaid: dto.amount,
              paymentDate: entryDate,
              receivingAccountId: dto.cashAccountId,
            },
          });

          const newOutstanding = Number(invoice.outstandingAmount) - dto.amount;
          const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIAL';

          await tx.invoice.update({
            where: { id: dto.referenceId },
            data: {
              outstandingAmount: Math.max(0, newOutstanding),
              status: newStatus as any,
              ...(newOutstanding <= 0 ? { paidAt: entryDate } : {}),
            },
          });
        }
      }

      this.eventEmitter.emit('finance.cash.disbursed', {
        amount: dto.amount,
        category: dto.category,
        referenceId: dto.referenceId,
        journalId: journal.id,
      });

      return journal;
    });
  }

  async receive(dto: CashReceiveDto) {
    return this.prisma.$transaction(async (tx) => {
      const entryDate = new Date(dto.date);

      const lockedPeriod = await tx.financialPeriod.findFirst({
        where: {
          startDate: { lte: entryDate },
          endDate: { gte: entryDate },
          status: { in: [PeriodStatus.SOFT_LOCKED, PeriodStatus.CLOSED] },
        },
      });

      if (lockedPeriod) {
        throw new BadRequestException(
          `Transaksi ditolak: Periode ${lockedPeriod.name} sudah dikunci.`,
        );
      }

      const cashAccount = await tx.account.findUnique({
        where: { id: dto.cashAccountId },
      });

      if (!cashAccount) {
        throw new BadRequestException('Cash account not found');
      }

      const creditAccount = await tx.account.findUnique({
        where: { id: dto.creditAccountId },
      });

      if (!creditAccount) {
        throw new BadRequestException('Credit account not found');
      }

      const baseAmount =
        dto.amount + (dto.bankAdminFee || 0) - (dto.taxAmount || 0);

      const lines: { accountId: string; debit: number; credit: number }[] = [
        { accountId: dto.cashAccountId, debit: dto.amount, credit: 0 },
      ];

      if (dto.bankAdminFee && dto.bankAdminFee > 0) {
        lines.push({
          accountId: dto.cashAccountId,
          debit: dto.bankAdminFee,
          credit: 0,
        });
      }

      lines.push({
        accountId: dto.creditAccountId,
        debit: 0,
        credit: baseAmount,
      });

      if (dto.taxAmount && dto.taxAmount > 0 && dto.taxAccountId) {
        lines.push({
          accountId: dto.taxAccountId,
          debit: 0,
          credit: dto.taxAmount,
        });
      }

      const journal = await tx.journalEntry.create({
        data: {
          date: entryDate,
          reference: await this.idGenerator.generateId('MSK'),
          description: `Kas Masuk: ${dto.entityName} — ${dto.notes} [${dto.category}]`,
          attachmentUrls: dto.attachmentUrls || [],
          lines: { create: lines },
        },
        include: { lines: true },
      });

      if (
        dto.category === CashReceiveCategory.DP_PENJUALAN &&
        dto.referenceId
      ) {
        const so = await tx.salesOrder.findUnique({
          where: { id: dto.referenceId },
        });

        if (so) {
          await tx.invoice.create({
            data: {
              invoiceNumber: await this.idGenerator.generateId('DPS'),
              category: 'RECEIVABLE',
              type: 'DP',
              status: 'PAID',
              amountDue: dto.amount,
              outstandingAmount: 0,
              paidAt: entryDate,
              dueDate: entryDate,
              soId: dto.referenceId,
              description: `DP Penjualan: ${dto.entityName}`,
            },
          });
        }
      }

      if (
        dto.category === CashReceiveCategory.PENERIMAAN_PIUTANG &&
        dto.referenceId
      ) {
        const invoice = await tx.invoice.findUnique({
          where: { id: dto.referenceId },
        });

        if (invoice) {
          await tx.payment.create({
            data: {
              invoiceId: dto.referenceId,
              verifiedBy: dto.cashAccountId,
              amountPaid: dto.amount,
              paymentDate: entryDate,
              receivingAccountId: dto.cashAccountId,
            },
          });

          const newOutstanding = Number(invoice.outstandingAmount) - dto.amount;
          const newStatus = newOutstanding <= 0 ? 'PAID' : 'PARTIAL';

          await tx.invoice.update({
            where: { id: dto.referenceId },
            data: {
              outstandingAmount: Math.max(0, newOutstanding),
              status: newStatus as any,
              ...(newOutstanding <= 0 ? { paidAt: entryDate } : {}),
            },
          });
        }
      }

      this.eventEmitter.emit('finance.cash.received', {
        amount: dto.amount,
        category: dto.category,
        referenceId: dto.referenceId,
        journalId: journal.id,
      });

      return journal;
    });
  }
}
