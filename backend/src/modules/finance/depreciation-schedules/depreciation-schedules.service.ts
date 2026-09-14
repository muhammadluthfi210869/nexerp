import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * DepreciationSchedule = monthly depreciation entries per fixed asset.
 * Straight-line method only for now (most common).
 */
@Injectable()
export class DepreciationSchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { assetId?: string; from?: Date; to?: Date }) {
    const where: any = {};
    if (filter?.assetId) where.assetId = filter.assetId;
    if (filter?.from || filter?.to) {
      where.period = {};
      if (filter.from) where.period.gte = filter.from;
      if (filter.to) where.period.lte = filter.to;
    }
    return this.prisma.depreciationSchedule.findMany({
      where,
      include: {
        asset: { select: { id: true, assetNumber: true, assetName: true } },
      },
      orderBy: [{ assetId: 'asc' }, { period: 'asc' }],
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.depreciationSchedule.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!entry) throw new NotFoundException(`Depreciation entry ${id} not found`);
    return entry;
  }

  /**
   * Calculate the monthly depreciation amount using straight-line method.
   * amount = (acquisitionCost - salvageValue) / usefulLife (months)
   */
  async calculateMonthly(assetId: string) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id: assetId },
    });
    if (!asset) throw new NotFoundException(`Asset ${assetId} not found`);

    const depreciable = Number(asset.acquisitionCost) - Number(asset.salvageValue);
    const monthly = depreciable / asset.usefulLife;
    return {
      assetId,
      monthlyAmount: Math.round(monthly * 100) / 100,
      depreciableBase: depreciable,
      usefulLifeMonths: asset.usefulLife,
    };
  }

  /**
   * Generate depreciation schedule for an asset.
   * From acquisitionDate + 1 month, for `usefulLife` months.
   * Idempotent per (assetId, period).
   */
  async generate(assetId: string) {
    const asset = await this.prisma.fixedAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException(`Asset ${assetId} not found`);
    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot generate for asset in status ${asset.status}`);
    }

    const startDate = new Date(asset.acquisitionDate);
    startDate.setMonth(startDate.getMonth() + 1);
    startDate.setDate(1); // First day of month

    const monthlyInfo = await this.calculateMonthly(assetId);
    const monthly = monthlyInfo.monthlyAmount;
    let accumulated = 0;

    const entries = [];
    for (let i = 0; i < asset.usefulLife; i++) {
      const period = new Date(startDate);
      period.setMonth(period.getMonth() + i);
      accumulated += monthly;
      // Cap accumulated so we don't exceed depreciable base on the last month
      if (i === asset.usefulLife - 1) {
        accumulated = monthlyInfo.depreciableBase;
      }
      entries.push({ assetId, period, amount: monthly, accumulated });
    }

    // Idempotent: skip createMany with skipDuplicates
    const result = await this.prisma.depreciationSchedule.createMany({
      data: entries,
      skipDuplicates: true,
    });

    return {
      assetId,
      entriesCreated: result.count,
      totalPeriods: asset.usefulLife,
      monthlyAmount: monthly,
    };
  }

  /**
   * Post one depreciation entry to GL.
   * Creates journal: Dr. Depreciation Expense / Cr. Accumulated Depreciation.
   */
  async postJournal(_userId: string, id: string) {
    const entry = await this.prisma.depreciationSchedule.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!entry) throw new NotFoundException(`Depreciation entry ${id} not found`);

    const depExp = await this.prisma.account.findFirst({ where: { code: '5210' } });
    const accDep = await this.prisma.account.findFirst({ where: { code: '1310' } });
    if (!depExp || !accDep) {
      throw new BadRequestException('COA accounts 5210 (Depreciation Expense) or 1310 (Accumulated Depreciation) missing');
    }

    return this.prisma.journalEntry.create({
      data: {
        date: entry.period,
        reference: `DEP-${entry.asset.assetNumber}-${entry.period.toISOString().slice(0, 7)}`,
        description: `Depreciation ${entry.asset.assetName} ${entry.period.toISOString().slice(0, 7)}`,
        sourceDocumentType: 'ADJUSTMENT_JOURNAL' as any,
        lines: {
          create: [
            { accountId: depExp.id, debit: Number(entry.amount), credit: 0 },
            { accountId: accDep.id, debit: 0, credit: Number(entry.amount) },
          ],
        },
      },
    });
  }
}
