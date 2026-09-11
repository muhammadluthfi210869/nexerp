import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class AssetTransfersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { assetId?: string }) {
    const where: any = {};
    if (filter?.assetId) where.assetId = filter.assetId;
    return this.prisma.assetTransfer.findMany({
      where,
      include: {
        asset: { select: { id: true, assetNumber: true, assetName: true } },
      },
      orderBy: { transferDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const transfer = await this.prisma.assetTransfer.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!transfer) throw new NotFoundException(`Asset transfer ${id} not found`);
    return transfer;
  }

  /**
   * Record an asset transfer (location / person / responsibility change).
   * Also updates the FixedAsset record's current location/person.
   */
  async create(
    _userId: string,
    dto: {
      assetId: string;
      transferDate: string;
      fromLocation: string;
      toLocation: string;
      fromPerson?: string;
      toPerson?: string;
      notes?: string;
    },
  ) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id: dto.assetId },
    });
    if (!asset) throw new NotFoundException(`Fixed asset ${dto.assetId} not found`);
    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot transfer asset in status ${asset.status}`);
    }
    if (dto.fromLocation === dto.toLocation && dto.fromPerson === dto.toPerson) {
      throw new BadRequestException('Transfer target must differ from source');
    }

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.assetTransfer.create({
        data: {
          assetId: dto.assetId,
          transferDate: new Date(dto.transferDate),
          fromLocation: dto.fromLocation,
          toLocation: dto.toLocation,
          fromPerson: dto.fromPerson,
          toPerson: dto.toPerson,
          notes: dto.notes,
        },
      });

      // Update asset's current location/person to the new ones
      await tx.fixedAsset.update({
        where: { id: dto.assetId },
        data: {
          location: dto.toLocation,
          responsiblePerson: dto.toPerson ?? asset.responsiblePerson,
        },
      });

      return transfer;
    });
  }

  /**
   * Get transfer history for an asset, including the last "from" state.
   */
  async getHistory(assetId: string) {
    const transfers = await this.prisma.assetTransfer.findMany({
      where: { assetId },
      orderBy: { transferDate: 'asc' },
    });
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id: assetId },
    });
    if (!asset) throw new NotFoundException(`Asset ${assetId} not found`);

    return {
      assetId,
      assetNumber: asset.assetNumber,
      assetName: asset.assetName,
      currentLocation: asset.location,
      currentPerson: asset.responsiblePerson,
      transferCount: transfers.length,
      transfers,
    };
  }
}
