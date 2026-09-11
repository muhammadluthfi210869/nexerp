import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * JobOrderCosting = Harga Pokok Pesanan (HPP) tracking per job order.
 * Records total cost, revenue, and profit margin over the job lifecycle.
 */
@Injectable()
export class JobOrderCostingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { closed?: boolean }) {
    const where: any = {};
    if (filter?.closed !== undefined) {
      if (filter.closed) where.closedAt = { not: null };
      else where.closedAt = null;
    }
    return this.prisma.jobOrderCosting.findMany({
      orderBy: { recordedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.jobOrderCosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job order costing ${id} not found`);
    return job;
  }

  /**
   * Record HPP for a new job order.
   */
  async create(_userId: string, dto: {
    jobOrderNumber: string;
    description?: string;
    totalCost: number;
    totalRevenue?: number;
  }) {
    if (dto.totalCost <= 0) {
      throw new BadRequestException('totalCost must be > 0');
    }
    const existing = await this.prisma.jobOrderCosting.findUnique({
      where: { jobOrderNumber: dto.jobOrderNumber },
    });
    if (existing) {
      throw new BadRequestException(`Job order ${dto.jobOrderNumber} already exists`);
    }

    return this.prisma.jobOrderCosting.create({
      data: {
        jobOrderNumber: dto.jobOrderNumber,
        description: dto.description,
        totalCost: dto.totalCost,
        totalRevenue: dto.totalRevenue || 0,
      },
    });
  }

  /**
   * Add revenue to a job order (or correct costs).
   */
  async updateTotals(_userId: string, id: string, dto: {
    totalCost?: number;
    totalRevenue?: number;
  }) {
    const job = await this.prisma.jobOrderCosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job order costing ${id} not found`);
    if (job.closedAt) {
      throw new BadRequestException('Job order already closed. Reopen first.');
    }
    return this.prisma.jobOrderCosting.update({
      where: { id },
      data: {
        totalCost: dto.totalCost,
        totalRevenue: dto.totalRevenue,
      },
    });
  }

  /**
   * Close a job order — no more adjustments allowed.
   */
  async close(_userId: string, id: string) {
    const job = await this.prisma.jobOrderCosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job order costing ${id} not found`);
    if (job.closedAt) throw new BadRequestException('Already closed');
    return this.prisma.jobOrderCosting.update({
      where: { id },
      data: { closedAt: new Date() },
    });
  }

  /**
   * Reopen a closed job order.
   */
  async reopen(_userId: string, id: string) {
    const job = await this.prisma.jobOrderCosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job order costing ${id} not found`);
    if (!job.closedAt) throw new BadRequestException('Not closed');
    return this.prisma.jobOrderCosting.update({
      where: { id },
      data: { closedAt: null },
    });
  }

  /**
   * Get profitability summary for a single job order.
   */
  async getProfitability(id: string) {
    const job = await this.findOne(id);
    const cost = Number(job.totalCost);
    const revenue = Number(job.totalRevenue);
    const profit = revenue - cost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;
    return {
      jobOrderNumber: job.jobOrderNumber,
      description: job.description,
      totalCost: cost,
      totalRevenue: revenue,
      profit,
      marginPercent: margin,
      closed: Boolean(job.closedAt),
      recordedAt: job.recordedAt,
      closedAt: job.closedAt,
    };
  }
}
