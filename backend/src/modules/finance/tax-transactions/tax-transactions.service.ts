import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

type TaxStatus = 'ACCRUED' | 'REPORTED' | 'PAID';
type TaxSource = 'BILL' | 'SALES_INVOICE' | 'PAYMENT';

@Injectable()
export class TaxTransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: {
    taxTypeId?: string;
    status?: TaxStatus;
    sourceType?: TaxSource;
    from?: Date;
    to?: Date;
  }) {
    const where: any = {};
    if (filter?.taxTypeId) where.taxTypeId = filter.taxTypeId;
    if (filter?.status) where.status = filter.status;
    if (filter?.sourceType) where.sourceType = filter.sourceType;
    if (filter?.from || filter?.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = filter.from;
      if (filter.to) where.createdAt.lte = filter.to;
    }

    return this.prisma.taxTransaction.findMany({
      where,
      include: {
        taxRateRel: { select: { id: true, name: true, rate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tx = await this.prisma.taxTransaction.findUnique({
      where: { id },
      include: { taxRateRel: true },
    });
    if (!tx) throw new NotFoundException(`Tax transaction ${id} not found`);
    return tx;
  }

  /**
   * Record a new tax transaction (PPN/PPh withholding).
   * taxAmount is calculated from baseAmount * taxRate / 100 if not provided.
   */
  async create(
    _userId: string,
    dto: {
      taxTypeId: string;
      sourceType: TaxSource;
      sourceId: string;
      baseAmount: number;
      taxRate: number;
      taxAmount?: number;
      notes?: string;
    },
  ) {
    if (!['BILL', 'SALES_INVOICE', 'PAYMENT'].includes(dto.sourceType)) {
      throw new BadRequestException(`Invalid sourceType: ${dto.sourceType}`);
    }
    if (dto.baseAmount <= 0) {
      throw new BadRequestException('baseAmount must be > 0');
    }
    if (dto.taxRate < 0 || dto.taxRate > 100) {
      throw new BadRequestException('taxRate must be between 0 and 100');
    }

    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id: dto.taxTypeId },
    });
    if (!taxRate) throw new NotFoundException(`Tax rate ${dto.taxTypeId} not found`);

    const taxAmount = dto.taxAmount ?? Math.round((dto.baseAmount * dto.taxRate) / 100);

    return this.prisma.taxTransaction.create({
      data: {
        taxTypeId: dto.taxTypeId,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        baseAmount: dto.baseAmount,
        taxRate: dto.taxRate,
        taxAmount,
        status: 'ACCRUED',
        notes: dto.notes,
      },
    });
  }

  /**
   * Mark as REPORTED (submitted to tax authority).
   */
  async markReported(id: string, dto: { reportPeriod: string; notes?: string }) {
    const tx = await this.prisma.taxTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException(`Tax transaction ${id} not found`);
    if (tx.status !== 'ACCRUED') {
      throw new BadRequestException(`Cannot mark REPORTED from ${tx.status}`);
    }
    return this.prisma.taxTransaction.update({
      where: { id },
      data: {
        status: 'REPORTED',
        reportedAt: new Date(),
        notes: dto.notes ? `${tx.notes ?? ''} | report: ${dto.reportPeriod} ${dto.notes}` : tx.notes,
      },
    });
  }

  /**
   * Mark as PAID (tax settlement made).
   */
  async markPaid(id: string, dto: { paymentRef?: string; notes?: string }) {
    const tx = await this.prisma.taxTransaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException(`Tax transaction ${id} not found`);
    if (tx.status !== 'REPORTED') {
      throw new BadRequestException(`Cannot mark PAID from ${tx.status}. Must be REPORTED first.`);
    }
    return this.prisma.taxTransaction.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        notes: dto.paymentRef
          ? `${tx.notes ?? ''} | paid ref: ${dto.paymentRef}${dto.notes ? ' ' + dto.notes : ''}`
          : tx.notes,
      },
    });
  }

  /**
   * Get tax summary for a period (e.g., for tax filing reports).
   * Returns total accrued vs reported vs paid, per tax type.
   */
  async getSummary(from: Date, to: Date) {
    const txs = await this.prisma.taxTransaction.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
      include: { taxRateRel: true },
    });

    const byTaxType: Record<
      string,
      { name: string; accrued: number; reported: number; paid: number; count: number }
    > = {};

    for (const t of txs) {
      const key = t.taxTypeId;
      byTaxType[key] ??= {
        name: t.taxRateRel.name,
        accrued: 0,
        reported: 0,
        paid: 0,
        count: 0,
      };
      byTaxType[key].count++;
      const amt = Number(t.taxAmount);
      if (t.status === 'ACCRUED') byTaxType[key].accrued += amt;
      else if (t.status === 'REPORTED') byTaxType[key].reported += amt;
      else if (t.status === 'PAID') byTaxType[key].paid += amt;
    }

    return {
      from,
      to,
      byTaxType: Object.entries(byTaxType).map(([id, s]) => ({ taxTypeId: id, ...s })),
    };
  }
}
