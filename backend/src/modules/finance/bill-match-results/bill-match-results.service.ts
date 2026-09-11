import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

type MatchStatus = 'MATCHED' | 'EXCEPTION' | 'PARTIAL';

/**
 * BillMatchResult = 4-way matching result (PO ↔ GR ↔ QC ↔ Invoice).
 * Captures variances for AP gate (Bill only payable if matched).
 */
@Injectable()
export class BillMatchResultsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { billId?: string; matchStatus?: MatchStatus }) {
    const where: any = {};
    if (filter?.billId) where.billId = filter.billId;
    if (filter?.matchStatus) where.matchStatus = filter.matchStatus;
    return this.prisma.billMatchResult.findMany({
      where,
      include: {
        bill: { select: { id: true, billNumber: true, grandTotal: true } },
      },
      orderBy: { matchedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const result = await this.prisma.billMatchResult.findUnique({
      where: { id },
      include: { bill: true },
    });
    if (!result) throw new NotFoundException(`Bill match result ${id} not found`);
    return result;
  }

  /**
   * Record a 4-way matching result for a bill.
   * Variances are computed server-side from qty/price diffs.
   * qtyVariance = (actualQty - orderedQty) / orderedQty * 100
   * priceVariance = (actualPrice - poPrice) / poPrice * 100
   */
  async create(
    _userId: string,
    dto: {
      billId: string;
      orderedQty: number;
      actualQty: number;
      poPrice: number;
      actualPrice: number;
      notes?: string;
    },
  ) {
    const bill = await this.prisma.bill.findUnique({ where: { id: dto.billId } });
    if (!bill) throw new NotFoundException(`Bill ${dto.billId} not found`);
    if (dto.orderedQty <= 0 || dto.poPrice <= 0) {
      throw new BadRequestException('orderedQty and poPrice must be > 0');
    }

    const qtyVariance = ((dto.actualQty - dto.orderedQty) / dto.orderedQty) * 100;
    const priceVariance = ((dto.actualPrice - dto.poPrice) / dto.poPrice) * 100;

    // Tolerance: ±2% on qty, ±1% on price
    let matchStatus: MatchStatus;
    if (Math.abs(qtyVariance) <= 2 && Math.abs(priceVariance) <= 1) {
      matchStatus = 'MATCHED';
    } else if (Math.abs(qtyVariance) > 10 || Math.abs(priceVariance) > 5) {
      matchStatus = 'EXCEPTION';
    } else {
      matchStatus = 'PARTIAL';
    }

    return this.prisma.billMatchResult.create({
      data: {
        billId: dto.billId,
        matchStatus,
        qtyVariance,
        priceVariance,
        notes: dto.notes,
      },
    });
  }

  /**
   * Summary: count by match status + variance stats.
   */
  async getSummary() {
    const results = await this.prisma.billMatchResult.findMany();
    const byStatus = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.matchStatus] = (acc[r.matchStatus] || 0) + 1;
      return acc;
    }, {});
    const totalQtyVariance = results.reduce((s, r) => s + Number(r.qtyVariance), 0);
    const totalPriceVariance = results.reduce((s, r) => s + Number(r.priceVariance), 0);
    return {
      total: results.length,
      byStatus: {
        MATCHED: byStatus.MATCHED ?? 0,
        PARTIAL: byStatus.PARTIAL ?? 0,
        EXCEPTION: byStatus.EXCEPTION ?? 0,
      },
      avgQtyVariance:
        results.length > 0 ? Math.round((totalQtyVariance / results.length) * 100) / 100 : 0,
      avgPriceVariance:
        results.length > 0 ? Math.round((totalPriceVariance / results.length) * 100) / 100 : 0,
    };
  }
}
