import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * ProductProfitability = per-product profit analysis (revenue - cost = profit; margin in %).
 */
@Injectable()
export class ProductProfitabilitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { period?: string; productId?: string }) {
    const where: any = {};
    if (filter?.productId) where.productId = filter.productId;
    if (filter?.period) {
      const periodStart = new Date(filter.period);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      where.period = { gte: periodStart, lt: periodEnd };
    }
    return this.prisma.productProfitability.findMany({
      where,
      orderBy: [{ period: 'desc' }, { profit: 'desc' }],
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.productProfitability.findUnique({ where: { id } });
    if (!p) throw new NotFoundException(`Product profitability ${id} not found`);
    return p;
  }

  /**
   * Record or update profitability for a product in a period.
   * If revenue + cost provided, computes profit + margin server-side.
   */
  async upsert(_userId: string, dto: {
    productId: string;
    productName: string;
    period: string;
    revenue: number;
    cost: number;
  }) {
    if (dto.revenue < 0 || dto.cost < 0) {
      throw new BadRequestException('Revenue and cost cannot be negative');
    }
    const profit = dto.revenue - dto.cost;
    const margin = dto.revenue > 0 ? Math.round((profit / dto.revenue) * 10000) / 100 : 0;

    const periodStart = new Date(dto.period);
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    return this.prisma.productProfitability.upsert({
      where: {
        productId_period: {
          productId: dto.productId,
          period: periodStart,
        },
      },
      create: {
        productId: dto.productId,
        productName: dto.productName,
        period: periodStart,
        revenue: dto.revenue,
        cost: dto.cost,
        profit,
        margin,
      },
      update: {
        revenue: dto.revenue,
        cost: dto.cost,
        profit,
        margin,
      },
    });
  }

  /**
   * Get top-N most profitable products for a period.
   */
  async getTopPerformers(period: string, limit: number = 10) {
    const periodStart = new Date(period);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return this.prisma.productProfitability.findMany({
      where: { period: { gte: periodStart, lt: periodEnd } },
      orderBy: { profit: 'desc' },
      take: limit,
    });
  }

  /**
   * Get bottom-N least profitable / loss-making products.
   */
  async getWorstPerformers(period: string, limit: number = 10) {
    const periodStart = new Date(period);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return this.prisma.productProfitability.findMany({
      where: { period: { gte: periodStart, lt: periodEnd } },
      orderBy: { profit: 'asc' },
      take: limit,
    });
  }
}
