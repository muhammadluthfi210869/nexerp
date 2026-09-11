import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

type DisposalType = 'SALE' | 'WRITE_OFF' | 'SCRAP';

/**
 * AssetDisposal = Asset sale / write-off / scrap.
 * Computes gain/loss = proceeds - (acquisitionCost - accumulatedDepreciation).
 * Flips asset status to DISPOSED.
 */
@Injectable()
export class AssetDisposalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { assetId?: string; disposalType?: DisposalType }) {
    const where: any = {};
    if (filter?.assetId) where.assetId = filter.assetId;
    if (filter?.disposalType) where.disposalType = filter.disposalType;
    return this.prisma.assetDisposal.findMany({
      where,
      include: {
        asset: { select: { id: true, assetNumber: true, assetName: true } },
      },
      orderBy: { disposalDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const disposal = await this.prisma.assetDisposal.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!disposal) throw new NotFoundException(`Asset disposal ${id} not found`);
    return disposal;
  }

  /**
   * Dispose an asset.
   * Auto-compute bookValue = acquisitionCost - accumulatedDepreciation (from latest schedule).
   * gainLoss = proceeds - bookValue (positive = gain, negative = loss).
   * Flips asset.status to DISPOSED.
   */
  async create(
    userId: string,
    dto: {
      assetId: string;
      disposalDate: string;
      disposalType: DisposalType;
      proceeds: number;
      buyer?: string;
      notes?: string;
    },
  ) {
    if (!['SALE', 'WRITE_OFF', 'SCRAP'].includes(dto.disposalType)) {
      throw new BadRequestException(`Invalid disposalType: ${dto.disposalType}`);
    }
    if (dto.proceeds < 0) {
      throw new BadRequestException('proceeds cannot be negative');
    }

    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id: dto.assetId },
      include: {
        schedules: { orderBy: { period: 'desc' }, take: 1 },
      },
    });
    if (!asset) throw new NotFoundException(`Fixed asset ${dto.assetId} not found`);
    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(`Asset already in status ${asset.status}`);
    }

    const accumulated = asset.schedules.length > 0
      ? Number(asset.schedules[0].accumulated)
      : 0;
    const bookValue = Number(asset.acquisitionCost) - accumulated;
    const gainLoss = dto.proceeds - bookValue;

    return this.prisma.$transaction(async (tx) => {
      const disposal = await tx.assetDisposal.create({
        data: {
          assetId: dto.assetId,
          disposalDate: new Date(dto.disposalDate),
          disposalType: dto.disposalType,
          proceeds: dto.proceeds,
          gainLoss,
          buyer: dto.buyer,
          notes: dto.notes ? `${dto.notes} [disposed by ${userId}]` : `[disposed by ${userId}]`,
        },
      });

      // Flip asset status to DISPOSED
      await tx.fixedAsset.update({
        where: { id: dto.assetId },
        data: { status: 'DISPOSED' },
      });

      return disposal;
    });
  }

  /**
   * Reverse a disposal — return asset to ACTIVE (admin correction).
   */
  async reverse(_userId: string, id: string) {
    const disposal = await this.prisma.assetDisposal.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!disposal) throw new NotFoundException(`Asset disposal ${id} not found`);
    if (disposal.asset.status !== 'DISPOSED') {
      throw new BadRequestException('Asset not in DISPOSED status');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.fixedAsset.update({
        where: { id: disposal.assetId },
        data: { status: 'ACTIVE' },
      });
      return tx.assetDisposal.delete({ where: { id } });
    });
  }

  /**
   * Get disposal summary for a date range.
   */
  async getSummary(from: Date, to: Date) {
    const disposals = await this.prisma.assetDisposal.findMany({
      where: {
        disposalDate: { gte: from, lte: to },
      },
      include: {
        asset: { select: { assetNumber: true, assetName: true } },
      },
    });

    const totalProceeds = disposals.reduce((s, d) => s + Number(d.proceeds), 0);
    const totalGainLoss = disposals.reduce((s, d) => s + Number(d.gainLoss), 0);

    return {
      from,
      to,
      count: disposals.length,
      totalProceeds,
      totalGainLoss,
      disposals,
    };
  }
}
