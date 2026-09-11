import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class FixedAssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { status?: string; category?: string }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.category) where.assetCategory = filter.category;

    return this.prisma.fixedAsset.findMany({
      where,
      include: {
        _count: {
          select: {
            schedules: true,
            transfers: true,
            disposals: true,
          },
        },
      },
      orderBy: { assetNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id },
      include: {
        schedules: { orderBy: { period: 'desc' }, take: 12 },
        transfers: { orderBy: { transferDate: 'desc' } },
        disposals: { orderBy: { disposalDate: 'desc' } },
      },
    });
    if (!asset) throw new NotFoundException(`Fixed asset ${id} not found`);
    return asset;
  }

  /**
   * Register a new fixed asset.
   * assetNumber format: FA-YYMM-XXXX.
   */
  async create(
    _userId: string,
    dto: {
      assetNumber?: string;
      assetName: string;
      assetCategory: string;
      acquisitionDate: string;
      acquisitionCost: number;
      usefulLife: number;
      salvageValue?: number;
      location?: string;
      responsiblePerson?: string;
      notes?: string;
    },
  ) {
    if (dto.acquisitionCost <= 0) {
      throw new BadRequestException('acquisitionCost must be > 0');
    }
    if (dto.usefulLife <= 0) {
      throw new BadRequestException('usefulLife must be > 0 months');
    }

    let assetNumber = dto.assetNumber;
    if (!assetNumber) {
      const acqDate = new Date(dto.acquisitionDate);
      const yymm = `${String(acqDate.getFullYear()).slice(-2)}${String(acqDate.getMonth() + 1).padStart(2, '0')}`;
      const count = await this.prisma.fixedAsset.count({
        where: { assetNumber: { startsWith: `FA-${yymm}-` } },
      });
      assetNumber = `FA-${yymm}-${String(count + 1).padStart(4, '0')}`;
    } else {
      const existing = await this.prisma.fixedAsset.findUnique({
        where: { assetNumber },
      });
      if (existing) throw new BadRequestException(`assetNumber ${assetNumber} already exists`);
    }

    return this.prisma.fixedAsset.create({
      data: {
        assetNumber,
        assetName: dto.assetName,
        assetCategory: dto.assetCategory,
        acquisitionDate: new Date(dto.acquisitionDate),
        acquisitionCost: dto.acquisitionCost,
        usefulLife: dto.usefulLife,
        salvageValue: dto.salvageValue || 0,
        location: dto.location,
        responsiblePerson: dto.responsiblePerson,
        notes: dto.notes,
      },
    });
  }

  /**
   * Update asset metadata (not acquisition cost — that needs reversal).
   */
  async update(
    id: string,
    dto: {
      assetName?: string;
      assetCategory?: string;
      location?: string;
      responsiblePerson?: string;
      salvageValue?: number;
      notes?: string;
    },
  ) {
    const asset = await this.prisma.fixedAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`Fixed asset ${id} not found`);
    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot update asset in status ${asset.status}`);
    }
    return this.prisma.fixedAsset.update({ where: { id }, data: dto });
  }

  /**
   * Get the latest accumulated depreciation + book value.
   */
  async getBookValue(id: string) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id },
      include: {
        schedules: { orderBy: { period: 'desc' }, take: 1 },
      },
    });
    if (!asset) throw new NotFoundException(`Fixed asset ${id} not found`);

    const accumulated = asset.schedules.length > 0
      ? Number(asset.schedules[0].accumulated)
      : 0;
    const bookValue = Number(asset.acquisitionCost) - accumulated;

    return {
      assetId: id,
      assetNumber: asset.assetNumber,
      assetName: asset.assetName,
      acquisitionCost: Number(asset.acquisitionCost),
      salvageValue: Number(asset.salvageValue),
      accumulatedDepreciation: accumulated,
      bookValue,
      usefulLifeMonths: asset.usefulLife,
      status: asset.status,
    };
  }
}
