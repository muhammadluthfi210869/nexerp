import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

type VarianceType = 'MATERIAL' | 'LABOR' | 'OVERHEAD';

/**
 * CostVariance = Standard vs actual cost variance per job order.
 * Captures MATERIAL / LABOR / OVERHEAD variances.
 */
@Injectable()
export class CostVariancesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { jobOrderId?: string; varianceType?: VarianceType }) {
    const where: any = {};
    if (filter?.jobOrderId) where.jobOrderId = filter.jobOrderId;
    if (filter?.varianceType) where.varianceType = filter.varianceType;
    return this.prisma.costVariance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const variance = await this.prisma.costVariance.findUnique({ where: { id } });
    if (!variance) throw new NotFoundException(`Cost variance ${id} not found`);
    return variance;
  }

  /**
   * Record a cost variance.
   * If actualCost is provided, variance = actualCost - standardCost.
   * Positive = unfavorable (over budget), negative = favorable.
   */
  async create(_userId: string, dto: {
    jobOrderId: string;
    varianceType: VarianceType;
    standardCost: number;
    actualCost: number;
    notes?: string;
  }) {
    if (!['MATERIAL', 'LABOR', 'OVERHEAD'].includes(dto.varianceType)) {
      throw new BadRequestException(`Invalid varianceType: ${dto.varianceType}`);
    }
    if (dto.standardCost < 0 || dto.actualCost < 0) {
      throw new BadRequestException('Costs cannot be negative');
    }
    const variance = dto.actualCost - dto.standardCost;

    return this.prisma.costVariance.create({
      data: {
        jobOrderId: dto.jobOrderId,
        varianceType: dto.varianceType,
        standardCost: dto.standardCost,
        actualCost: dto.actualCost,
        variance,
        notes: dto.notes,
      },
    });
  }

  /**
   * Summary per job order: total variance by type, favorable vs unfavorable.
   */
  async getSummaryByJob(jobOrderId: string) {
    const variances = await this.prisma.costVariance.findMany({
      where: { jobOrderId },
    });

    const byType: Record<string, { total: number; favorable: number; unfavorable: number }> = {};
    for (const v of variances) {
      byType[v.varianceType] ??= { total: 0, favorable: 0, unfavorable: 0 };
      byType[v.varianceType].total += Number(v.variance);
      if (Number(v.variance) > 0) {
        byType[v.varianceType].unfavorable += Number(v.variance);
      } else {
        byType[v.varianceType].favorable += Math.abs(Number(v.variance));
      }
    }

    return {
      jobOrderId,
      count: variances.length,
      netVariance: variances.reduce((s, v) => s + Number(v.variance), 0),
      byType,
    };
  }
}
