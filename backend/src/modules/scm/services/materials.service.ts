import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateMaterialDto, UpdateMaterialDto } from '../dto/material.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.materialItem.findMany({
      include: {
        category: true,
        inventoryAccount: true,
        salesAccount: true,
      },
    });
  }

  async findOne(id: string) {
    const material = await this.prisma.materialItem.findFirst({
      where: { id },
      include: {
        category: true,
        inventoryAccount: true,
        salesAccount: true,
        inventories: {
          include: { location: true, supplier: true },
          orderBy: { lastRestock: 'desc' },
        },
      },
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async create(dto: CreateMaterialDto) {
    return this.prisma.materialItem.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type,
        unit: dto.unit,
        unitPrice: dto.unitPrice,
        stockQty: dto.stockQty || 0,
        minLevel: dto.minStock || 0,
        maxLevel: 10000, // Default max level
        reorderPoint: dto.minStock || 0,
        categoryId: dto.categoryId,
        inventoryAccountId: dto.inventoryAccountId,
        salesAccountId: dto.salesAccountId,
      },
    });
  }

  async update(id: string, dto: UpdateMaterialDto) {
    return this.prisma.materialItem.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code && { code: dto.code }),
        ...(dto.type && { type: dto.type }),
        ...(dto.unit && { unit: dto.unit }),
        ...(dto.unitPrice && { unitPrice: dto.unitPrice }),
        ...(dto.stockQty !== undefined && { stockQty: dto.stockQty }),
        ...(dto.minStock !== undefined && {
          minLevel: dto.minStock,
          reorderPoint: dto.minStock,
        }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.inventoryAccountId && {
          inventoryAccountId: dto.inventoryAccountId,
        }),
        ...(dto.salesAccountId && { salesAccountId: dto.salesAccountId }),
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.materialItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
