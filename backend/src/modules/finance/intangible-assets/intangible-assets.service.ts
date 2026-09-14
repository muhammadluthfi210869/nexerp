import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * IntangibleAsset = Non-physical assets (software, licenses, patents).
 * Tracks amortization schedule (similar to depreciation but no salvage).
 */
@Injectable()
export class IntangibleAssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { status?: string }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    return this.prisma.intangibleAsset.findMany({
      where,
      orderBy: { assetNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.intangibleAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`Intangible asset ${id} not found`);
    return asset;
  }

  /**
   * Register a new intangible asset (software license, patent, trademark).
   */
  async create(
    _userId: string,
    dto: {
      assetNumber?: string;
      assetName: string;
      acquisitionDate: string;
      acquisitionCost: number;
      amortizationPeriod: number;
      amortizationMethod?: string;
      notes?: string;
    },
  ) {
    if (dto.acquisitionCost <= 0) {
      throw new BadRequestException('acquisitionCost must be > 0');
    }
    if (dto.amortizationPeriod <= 0) {
      throw new BadRequestException('amortizationPeriod must be > 0 months');
    }

    let assetNumber = dto.assetNumber;
    if (!assetNumber) {
      const acq = new Date(dto.acquisitionDate);
      const yymm = `${String(acq.getFullYear()).slice(-2)}${String(acq.getMonth() + 1).padStart(2, '0')}`;
      const count = await this.prisma.intangibleAsset.count({
        where: { assetNumber: { startsWith: `IA-${yymm}-` } },
      });
      assetNumber = `IA-${yymm}-${String(count + 1).padStart(4, '0')}`;
    } else {
      const existing = await this.prisma.intangibleAsset.findUnique({
        where: { assetNumber },
      });
      if (existing) throw new BadRequestException(`assetNumber ${assetNumber} already exists`);
    }

    return this.prisma.intangibleAsset.create({
      data: {
        assetNumber,
        assetName: dto.assetName,
        acquisitionDate: new Date(dto.acquisitionDate),
        acquisitionCost: dto.acquisitionCost,
        amortizationPeriod: dto.amortizationPeriod,
        amortizationMethod: dto.amortizationMethod || 'STRAIGHT_LINE',
        notes: dto.notes,
      },
    });
  }

  /**
   * Calculate monthly amortization and remaining book value.
   */
  async getAmortizationSchedule(id: string) {
    const asset = await this.prisma.intangibleAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`Intangible asset ${id} not found`);

    const monthly = Number(asset.acquisitionCost) / asset.amortizationPeriod;
    const startDate = new Date(asset.acquisitionDate);
    startDate.setMonth(startDate.getMonth() + 1);
    startDate.setDate(1);

    const periods = [];
    let accumulated = 0;
    for (let i = 0; i < asset.amortizationPeriod; i++) {
      const period = new Date(startDate);
      period.setMonth(period.getMonth() + i);
      accumulated += monthly;
      periods.push({
        period: period.toISOString().slice(0, 7),
        monthlyAmount: Math.round(monthly * 100) / 100,
        accumulated: Math.round(accumulated * 100) / 100,
        bookValue: Math.round((Number(asset.acquisitionCost) - accumulated) * 100) / 100,
      });
    }

    return {
      assetId: id,
      assetNumber: asset.assetNumber,
      assetName: asset.assetName,
      acquisitionCost: Number(asset.acquisitionCost),
      monthlyAmount: Math.round(monthly * 100) / 100,
      totalPeriods: asset.amortizationPeriod,
      periods,
    };
  }

  /**
   * Mark intangible asset as fully amortized / retired.
   */
  async retire(_userId: string, id: string) {
    const asset = await this.prisma.intangibleAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`Intangible asset ${id} not found`);
    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot retire asset in status ${asset.status}`);
    }
    return this.prisma.intangibleAsset.update({
      where: { id },
      data: { status: 'RETIRED' },
    });
  }
}
