import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

export const ESCROW_STATUS = {
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  RETURNED: 'RETURNED',
  FORFEITED: 'FORFEITED',
} as const;

@Injectable()
export class ClientEscrowsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { customerId?: string; status?: string }) {
    return this.prisma.clientEscrow.findMany({
      where: filter,
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { depositDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const escrow = await this.prisma.clientEscrow.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!escrow) throw new NotFoundException(`Client escrow ${id} not found`);
    return escrow;
  }

  /**
   * Deposit customer escrow (advance payment held in trust).
   * Creates journal: Dr Bank / Cr Escrow Liability (HELD).
   */
  async deposit(
    _userId: string,
    dto: {
      customerId: string;
      amount: number;
      depositDate?: string;
      purpose?: string;
      notes?: string;
      bankAccountId?: string;
    },
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

    return this.prisma.$transaction(async (tx) => {
      const escrow = await tx.clientEscrow.create({
        data: {
          customerId: dto.customerId,
          amount: dto.amount,
          depositDate: new Date(dto.depositDate || Date.now()),
          status: ESCROW_STATUS.HELD,
          purpose: dto.purpose,
          notes: dto.notes,
        },
      });

      // Journal: Dr Bank / Cr Escrow Liability
      if (dto.bankAccountId) {
        const escrowLiabAcc = await tx.account.findFirst({ where: { code: '2301' } });
        if (escrowLiabAcc) {
          await tx.journalEntry.create({
            data: {
              date: new Date(),
              reference: `ESCROW-DEP-${escrow.id.slice(0, 8)}`,
              description: `Customer escrow deposit from ${customer.name}`,
              sourceDocumentType: 'PAYMENT' as any,
              lines: {
                create: [
                  { accountId: dto.bankAccountId, debit: dto.amount, credit: 0 },
                  { accountId: escrowLiabAcc.id, debit: 0, credit: dto.amount },
                ],
              },
            },
          });
        }
      }

      return escrow;
    });
  }

  /**
   * Release escrow to customer (return the funds or apply as revenue).
   * Forfeit: keep funds as revenue (e.g., penalty).
   * Return: give back to customer.
   */
  async release(
    userId: string,
    id: string,
    dto: {
      action: 'RELEASE' | 'RETURN' | 'FORFEIT';
      notes?: string;
    },
  ) {
    const escrow = await this.prisma.clientEscrow.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!escrow) throw new NotFoundException(`Client escrow ${id} not found`);
    if (escrow.status !== ESCROW_STATUS.HELD) {
      throw new BadRequestException(
        `Cannot release escrow with status ${escrow.status}. Only HELD can be released.`,
      );
    }

    const newStatus = {
      RELEASE: ESCROW_STATUS.RELEASED,
      RETURN: ESCROW_STATUS.RETURNED,
      FORFEIT: ESCROW_STATUS.FORFEITED,
    }[dto.action];

    return this.prisma.clientEscrow.update({
      where: { id },
      data: {
        status: newStatus,
        releaseDate: new Date(),
        notes: `${escrow.notes || ''}\n[${dto.action}D by ${userId}] ${dto.notes || ''}`.trim(),
      },
    });
  }
}
