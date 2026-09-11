import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { FinanceGateHelper } from '../../../common/helpers/gate.helper';
import { SoDViolationException } from '../../../common/exceptions/api-exception';

@Injectable()
export class BankReconciliationsService {
  constructor(
    private prisma: PrismaService,
    private gate: FinanceGateHelper,
  ) {}

  async findAll(filter?: {
    bankAccountId?: string;
    status?: 'OPEN' | 'RECONCILED';
  }) {
    const where: any = {};
    if (filter?.bankAccountId) where.bankAccountId = filter.bankAccountId;
    if (filter?.status) where.status = filter.status;

    return this.prisma.bankReconciliation.findMany({
      where,
      include: {
        bankAccount: {
          select: { id: true, accountCode: true, bankName: true, accountNumber: true },
        },
      },
      orderBy: { periodEnd: 'desc' },
    });
  }

  async findOne(id: string) {
    const recon = await this.prisma.bankReconciliation.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        reconciler: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!recon) throw new NotFoundException(`Bank reconciliation ${id} not found`);
    return recon;
  }

  /**
   * Open a reconciliation session for a period.
   * Captures statement balance + computes book balance from transactions.
   */
  async create(
    _userId: string,
    dto: {
      bankAccountId: string;
      periodStart: string;
      periodEnd: string;
      statementBalance: number;
      attachmentUrls?: string[];
      notes?: string;
    },
  ) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!account) {
      throw new NotFoundException(`Bank account ${dto.bankAccountId} not found`);
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd < periodStart) {
      throw new BadRequestException('periodEnd must be >= periodStart');
    }

    // Calculate book balance from transactions in period
    const txs = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccountId: dto.bankAccountId,
        date: { gte: periodStart, lte: periodEnd },
      },
    });
    const deposit = txs
      .filter((t) => t.transactionType === 'DEPOSIT' || t.transactionType === 'ADJUSTMENT')
      .reduce((s, t) => s + Number(t.amount), 0);
    const withdrawal = txs
      .filter((t) => t.transactionType === 'WITHDRAWAL' || t.transactionType === 'TRANSFER')
      .reduce((s, t) => s + Number(t.amount), 0);
    const bookBalance = deposit - withdrawal;
    const difference = dto.statementBalance - bookBalance;

    return this.prisma.bankReconciliation.create({
      data: {
        bankAccountId: dto.bankAccountId,
        periodStart,
        periodEnd,
        statementBalance: dto.statementBalance,
        bookBalance,
        difference,
        attachmentUrls: dto.attachmentUrls || [],
        notes: dto.notes,
      },
    });
  }

  /**
   * Finalize reconciliation — close the session, mark all in-period transactions as reconciled.
   */
  async finalize(userId: string, id: string, dto: { notes?: string }) {
    const recon = await this.prisma.bankReconciliation.findUnique({
      where: { id },
    });
    if (!recon) throw new NotFoundException(`Bank reconciliation ${id} not found`);
    if (recon.status === 'RECONCILED') {
      throw new BadRequestException('Already finalized');
    }

    // SoD: period-end reconciler should ideally be different from the one who opened it.
    // We use the notes prefix as a lightweight audit marker for who opened.
    const openerMatch = recon.notes?.match(/\[opened by ([^\]]+)\]/);
    const openedBy = openerMatch?.[1] ?? null;
    if (openedBy && openedBy === userId) {
      throw new SoDViolationException(
        'Bank reconciliation finalizer must differ from opener (SoD)',
      );
    }

    // Gate: ensure period not closed — bank recon would contradict final close
    await this.gate.assertPeriodOpen(recon.periodEnd, 'BANK-RECON-FINALIZE');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.bankReconciliation.update({
        where: { id },
        data: {
          status: 'RECONCILED',
          reconciledBy: userId,
          reconciledAt: new Date(),
          notes: dto.notes ? `${recon.notes ?? ''} | finalize: ${dto.notes}` : recon.notes,
        },
      });

      // Mark all in-period, not-yet-reconciled transactions as reconciled
      await tx.bankTransaction.updateMany({
        where: {
          bankAccountId: recon.bankAccountId,
          date: { gte: recon.periodStart, lte: recon.periodEnd },
          reconciled: false,
        },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
          reconciledBy: userId,
        },
      });

      return updated;
    });
  }

  /**
   * Re-open (revert) a finalized reconciliation. Useful if user wants to correct.
   */
  async reopen(_userId: string, id: string) {
    const recon = await this.prisma.bankReconciliation.findUnique({
      where: { id },
    });
    if (!recon) throw new NotFoundException(`Bank reconciliation ${id} not found`);
    if (recon.status !== 'RECONCILED') {
      throw new BadRequestException('Not yet finalized');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.bankReconciliation.update({
        where: { id },
        data: {
          status: 'OPEN',
          reconciledBy: null,
          reconciledAt: null,
        },
      });

      // Un-reconcile transactions belonging to this period
      await tx.bankTransaction.updateMany({
        where: {
          bankAccountId: recon.bankAccountId,
          date: { gte: recon.periodStart, lte: recon.periodEnd },
        },
        data: {
          reconciled: false,
          reconciledAt: null,
          reconciledBy: null,
        },
      });

      return updated;
    });
  }

  /**
   * Get summary view: per-account last reconciliation status + unreconciled count.
   */
  async getSummary(bankAccountId: string) {
    const last = await this.prisma.bankReconciliation.findFirst({
      where: { bankAccountId },
      orderBy: { periodEnd: 'desc' },
    });
    const unreconciled = await this.prisma.bankTransaction.count({
      where: { bankAccountId, reconciled: false },
    });
    return {
      lastReconciliation: last,
      unreconciledCount: unreconciled,
    };
  }
}
