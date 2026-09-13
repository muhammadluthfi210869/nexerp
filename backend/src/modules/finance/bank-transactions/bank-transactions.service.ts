import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { StateEventTrigger } from '@prisma/client';
import { StateMachineService } from '../../state-machine/state-machine.service';

type TxType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'ADJUSTMENT';

@Injectable()
export class BankTransactionsService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: StateMachineService,
  ) {}

  async findAll(filter?: {
    bankAccountId?: string;
    from?: Date;
    to?: Date;
    transactionType?: TxType;
    reconciled?: boolean;
  }) {
    const where: any = {};
    if (filter?.bankAccountId) where.bankAccountId = filter.bankAccountId;
    if (filter?.transactionType) where.transactionType = filter.transactionType;
    if (filter?.reconciled !== undefined) where.reconciled = filter.reconciled;
    if (filter?.from || filter?.to) {
      where.date = {};
      if (filter.from) where.date.gte = filter.from;
      if (filter.to) where.date.lte = filter.to;
    }

    return this.prisma.bankTransaction.findMany({
      where,
      include: {
        bankAccount: {
          select: { id: true, accountCode: true, bankName: true, accountNumber: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const tx = await this.prisma.bankTransaction.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        journalEntry: true,
      },
    });
    if (!tx) throw new NotFoundException(`Bank transaction ${id} not found`);
    return tx;
  }

  /**
   * Record manual bank transaction (e.g., bank fees, interest, manual adjustments).
   * Auto-updates BankAccount.currentBalance and creates a JournalEntry.
   */
  async create(
    userId: string,
    dto: {
      bankAccountId: string;
      date?: string;
      transactionType: TxType;
      amount: number;
      description: string;
      attachmentUrls?: string[];
    },
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    if (!['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ADJUSTMENT'].includes(dto.transactionType)) {
      throw new BadRequestException(`Invalid transaction type: ${dto.transactionType}`);
    }

    const account = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!account) {
      throw new NotFoundException(`Bank account ${dto.bankAccountId} not found`);
    }
    if (!account.glAccountId) {
      throw new BadRequestException(`Bank account ${account.accountCode} has no GL linkage`);
    }

    const txDate = new Date(dto.date || Date.now());
    const direction = dto.transactionType === 'DEPOSIT' || dto.transactionType === 'ADJUSTMENT'
      ? +dto.amount
      : -dto.amount;

    return this.prisma.$transaction(async (tx) => {
      const bankTx = await tx.bankTransaction.create({
        data: {
          bankAccountId: dto.bankAccountId,
          date: txDate,
          transactionType: dto.transactionType,
          amount: dto.amount,
          sourceType: 'MANUAL',
          description: `${dto.description} [posted by ${userId}]`,
          attachmentUrls: dto.attachmentUrls || [],
        },
      });

      // Wave 2/A5 — record direction-based state transition so downstream
      // listeners (reconciliation, AR/AP balance recalc) can react. Ponytail:
      // direction derived inline instead of a helper; trivial 1-branch.
      const trigger =
        direction > 0
          ? StateEventTrigger.PAYMENT_RECEIVED
          : StateEventTrigger.PAYMENT_SENT;
      // NOTE: orchestrator.transition() lives outside the $transaction
      // (same pattern as DP/AP/AR services). If rollback semantics are needed
      // later, pass `tx` to a stateMachine.transition() variant.
      await this.stateMachine.transition({
        entityType: 'BANK_TRANSACTION',
        entityId: bankTx.id,
        eventTrigger: trigger,
        fromState: null,
        toState: dto.transactionType,
        userId,
        reason: `Manual bank tx ${dto.transactionType} of ${dto.amount} on ${account.accountCode}`,
        metadata: {
          bankAccountId: dto.bankAccountId,
          amount: dto.amount,
          transactionType: dto.transactionType,
        },
      });

      // Update bank account balance
      const updatedBalance = Number(account.currentBalance) + direction;
      await tx.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: { currentBalance: updatedBalance },
      });

      return bankTx;
    });
  }

  /**
   * Mark transaction as reconciled (matched against bank statement).
   */
  async reconcile(
    userId: string,
    id: string,
    dto: { reconciliationId?: string; notes?: string },
  ) {
    const bankTx = await this.prisma.bankTransaction.findUnique({
      where: { id },
    });
    if (!bankTx) throw new NotFoundException(`Bank transaction ${id} not found`);
    if (bankTx.reconciled) {
      throw new BadRequestException('Already reconciled');
    }

    return this.prisma.bankTransaction.update({
      where: { id },
      data: {
        reconciled: true,
        reconciledAt: new Date(),
        reconciledBy: userId,
        description: dto.notes
          ? `${bankTx.description} | recon: ${dto.notes}`
          : bankTx.description,
      },
    });
  }

  /**
   * Unreconcile a transaction (admin correction).
   */
  async unreconcile(_userId: string, id: string) {
    const bankTx = await this.prisma.bankTransaction.findUnique({
      where: { id },
    });
    if (!bankTx) throw new NotFoundException(`Bank transaction ${id} not found`);
    if (!bankTx.reconciled) {
      throw new BadRequestException('Not reconciled');
    }
    return this.prisma.bankTransaction.update({
      where: { id },
      data: {
        reconciled: false,
        reconciledAt: null,
        reconciledBy: null,
      },
    });
  }

  /**
   * Get running balance for a bank account over a date range.
   */
  async getRunningBalance(bankAccountId: string, from?: Date, to?: Date) {
    const txs = await this.findAll({ bankAccountId, from, to });
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });
    if (!account) throw new NotFoundException(`Bank account ${bankAccountId} not found`);

    let running = Number(account.currentBalance);
    const reversed = [...txs].reverse();
    const ledger = reversed.map((t) => {
      const direction = t.transactionType === 'DEPOSIT' || t.transactionType === 'ADJUSTMENT'
        ? +Number(t.amount)
        : -Number(t.amount);
      running -= direction;
      return {
        date: t.date,
        type: t.transactionType,
        amount: Number(t.amount),
        direction,
        runningBalance: running,
        description: t.description,
        reconciled: t.reconciled,
      };
    });
    return ledger;
  }
}
