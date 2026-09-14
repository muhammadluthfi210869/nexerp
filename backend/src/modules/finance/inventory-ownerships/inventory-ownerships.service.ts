import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

type OwnerType = 'COMPANY' | 'CONSIGNMENT' | 'CUSTOMER_OWNED' | 'SUPPLIER_OWNED';

/**
 * InventoryOwnership = Tracks stock per (material, warehouse, owner).
 * Critical for consignment / customer-owned stock — ensures we don't
 * accidentally sell or transfer stock that doesn't belong to us.
 */
@Injectable()
export class InventoryOwnershipsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: {
    materialId?: string;
    warehouseId?: string;
    ownerType?: OwnerType;
  }) {
    const where: any = {};
    if (filter?.materialId) where.materialId = filter.materialId;
    if (filter?.warehouseId) where.warehouseId = filter.warehouseId;
    if (filter?.ownerType) where.ownerType = filter.ownerType;
    return this.prisma.inventoryOwnership.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const own = await this.prisma.inventoryOwnership.findUnique({ where: { id } });
    if (!own) throw new NotFoundException(`Inventory ownership ${id} not found`);
    return own;
  }

  /**
   * Register a new ownership record (e.g., receive consignment stock from supplier).
   */
  async create(
    _userId: string,
    dto: {
      materialId: string;
      warehouseId: string;
      ownerType: OwnerType;
      ownerId?: string;
      quantity: number;
      unitCost?: number;
    },
  ) {
    if (!['COMPANY', 'CONSIGNMENT', 'CUSTOMER_OWNED', 'SUPPLIER_OWNED'].includes(dto.ownerType)) {
      throw new BadRequestException(`Invalid ownerType: ${dto.ownerType}`);
    }
    if (dto.ownerType === 'COMPANY' && dto.ownerId) {
      throw new BadRequestException('COMPANY ownership must have ownerId=null');
    }
    if (dto.ownerType !== 'COMPANY' && !dto.ownerId) {
      throw new BadRequestException(`${dto.ownerType} must have ownerId`);
    }
    if (dto.quantity <= 0) {
      throw new BadRequestException('quantity must be > 0');
    }

    return this.prisma.inventoryOwnership.upsert({
      where: {
        materialId_warehouseId_ownerType_ownerId: {
          materialId: dto.materialId,
          warehouseId: dto.warehouseId,
          ownerType: dto.ownerType,
          ownerId: dto.ownerId ?? null as any,
        },
      },
      create: {
        materialId: dto.materialId,
        warehouseId: dto.warehouseId,
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
        quantity: dto.quantity,
        unitCost: dto.unitCost || 0,
      },
      update: {
        quantity: { increment: dto.quantity },
        unitCost: dto.unitCost || 0,
      },
    });
  }

  /**
   * Adjust quantity (e.g., stock correction, return, write-off).
   */
  async adjustQuantity(_userId: string, id: string, dto: {
    delta: number;
    reason?: string;
  }) {
    const own = await this.prisma.inventoryOwnership.findUnique({ where: { id } });
    if (!own) throw new NotFoundException(`Inventory ownership ${id} not found`);
    const newQty = Number(own.quantity) + dto.delta;
    if (newQty < 0) {
      throw new BadRequestException(
        `Resulting quantity would be negative (current ${own.quantity}, delta ${dto.delta})`,
      );
    }
    return this.prisma.inventoryOwnership.update({
      where: { id },
      data: {
        quantity: newQty,
        // append reason to a transient log? just bump updatedAt here.
      },
    });
  }

  /**
   * Transfer ownership to another owner (e.g., customer returns consign stock → COMPANY).
   */
  async transferOwnership(_userId: string, id: string, dto: {
    newOwnerType: OwnerType;
    newOwnerId?: string;
  }) {
    const own = await this.prisma.inventoryOwnership.findUnique({ where: { id } });
    if (!own) throw new NotFoundException(`Inventory ownership ${id} not found`);

    return this.prisma.inventoryOwnership.update({
      where: { id },
      data: {
        ownerType: dto.newOwnerType,
        ownerId: dto.newOwnerType === 'COMPANY' ? null : dto.newOwnerId ?? null,
      },
    });
  }
}
