import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bankAccount.findMany({
      where: { isActive: true },
      include: {
        glAccount: { select: { id: true, code: true, name: true } },
        _count: {
          select: {
            transactions: true,
            apPayments: true,
            arReceipts: true,
          },
        },
      },
      orderBy: { bankName: 'asc' },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
      include: {
        glAccount: true,
        transactions: { orderBy: { date: 'desc' }, take: 20 },
      },
    });
    if (!account) throw new NotFoundException(`Bank account ${id} not found`);
    return account;
  }

  /**
   * Create a new bank account.
   * Validates accountCode uniqueness and links to GL account if provided.
   */
  async create(
    _userId: string,
    dto: {
      accountCode: string;
      bankName: string;
      accountNumber: string;
      accountType: 'BANK' | 'CASH' | 'PETTY_CASH';
      currencyCode?: string;
      glAccountId?: string;
      initialBalance?: number;
      notes?: string;
    },
  ) {
    // Validate uniqueness
    const existing = await this.prisma.bankAccount.findUnique({
      where: { accountCode: dto.accountCode },
    });
    if (existing) {
      throw new BadRequestException(
        `Account code ${dto.accountCode} already exists`,
      );
    }

    // Validate GL account if provided
    if (dto.glAccountId) {
      const gl = await this.prisma.account.findUnique({
        where: { id: dto.glAccountId },
      });
      if (!gl) {
        throw new NotFoundException(`GL account ${dto.glAccountId} not found`);
      }
    }

    return this.prisma.bankAccount.create({
      data: {
        accountCode: dto.accountCode,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        currencyCode: dto.currencyCode || 'IDR',
        currentBalance: dto.initialBalance || 0,
        glAccountId: dto.glAccountId,
        notes: dto.notes,
      },
    });
  }

  /**
   * Update bank account details (not balance — balance changes via transactions).
   */
  async update(
    id: string,
    dto: {
      bankName?: string;
      accountNumber?: string;
      glAccountId?: string;
      isActive?: boolean;
      notes?: string;
    },
  ) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`Bank account ${id} not found`);

    return this.prisma.bankAccount.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Reconcile bank account — set balance to actual amount (e.g., from bank statement).
   * Creates an adjustment transaction for the difference.
   */
  async reconcile(
    userId: string,
    id: string,
    dto: { actualBalance: number; notes: string },
  ) {
    const account = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`Bank account ${id} not found`);

    const diff = dto.actualBalance - Number(account.currentBalance);
    if (diff === 0) {
      return { account, message: 'Already balanced' };
    }

    return this.prisma.$transaction(async (tx) => {
      // Record the reconciliation adjustment
      await tx.bankTransaction.create({
        data: {
          bankAccountId: id,
          date: new Date(),
          amount: Math.abs(diff),
          transactionType: diff > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
          description: `Reconcile adjustment: ${dto.notes} [by ${userId}]`,
        },
      });

      // Update balance
      const updated = await tx.bankAccount.update({
        where: { id },
        data: { currentBalance: dto.actualBalance },
      });

      return updated;
    });
  }
}
