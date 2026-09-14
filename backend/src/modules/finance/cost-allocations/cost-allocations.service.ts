import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

type Method = 'DIRECT' | 'STEP_DOWN' | 'RECIPROCAL';

/**
 * CostAllocation = Overhead cost allocation between cost centers.
 * Methods: DIRECT (single-step), STEP_DOWN (cascade), RECIPROCAL (iterative).
 */
@Injectable()
export class CostAllocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { fromCostCenter?: string; toCostCenter?: string }) {
    const where: any = {};
    if (filter?.fromCostCenter) where.fromCostCenter = filter.fromCostCenter;
    if (filter?.toCostCenter) where.toCostCenter = filter.toCostCenter;
    return this.prisma.costAllocation.findMany({
      where,
      orderBy: { allocationDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const allocation = await this.prisma.costAllocation.findUnique({ where: { id } });
    if (!allocation) throw new NotFoundException(`Cost allocation ${id} not found`);
    return allocation;
  }

  /**
   * Create one allocation entry.
   * For bulk operations, call createBulk() instead.
   */
  async create(_userId: string, dto: {
    allocationDate: string;
    amount: number;
    fromCostCenter: string;
    toCostCenter: string;
    allocationMethod?: Method;
    basis?: string;
    notes?: string;
  }) {
    if (dto.amount <= 0) throw new BadRequestException('amount must be > 0');
    if (dto.fromCostCenter === dto.toCostCenter) {
      throw new BadRequestException('fromCostCenter must differ from toCostCenter');
    }
    return this.prisma.costAllocation.create({
      data: {
        allocationDate: new Date(dto.allocationDate),
        amount: dto.amount,
        fromCostCenter: dto.fromCostCenter,
        toCostCenter: dto.toCostCenter,
        allocationMethod: dto.allocationMethod || 'DIRECT',
        basis: dto.basis,
        notes: dto.notes,
      },
    });
  }

  /**
   * Get summary: per cost center, total inflow and outflow.
   */
  async getSummary(from: Date, to: Date) {
    const allocations = await this.prisma.costAllocation.findMany({
      where: { allocationDate: { gte: from, lte: to } },
    });

    const flows: Record<string, { costCenter: string; inflow: number; outflow: number; net: number }> = {};
    for (const a of allocations) {
      flows[a.fromCostCenter] ??= { costCenter: a.fromCostCenter, inflow: 0, outflow: 0, net: 0 };
      flows[a.toCostCenter] ??= { costCenter: a.toCostCenter, inflow: 0, outflow: 0, net: 0 };
      flows[a.fromCostCenter].outflow += Number(a.amount);
      flows[a.toCostCenter].inflow += Number(a.amount);
    }
    for (const k of Object.keys(flows)) {
      flows[k].net = flows[k].inflow - flows[k].outflow;
    }

    return {
      from,
      to,
      totalAllocated: allocations.reduce((s, a) => s + Number(a.amount), 0),
      costCenters: Object.values(flows),
    };
  }
}
