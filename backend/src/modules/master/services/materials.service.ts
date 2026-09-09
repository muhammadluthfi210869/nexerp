import { Logger, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateMaterialDto, UpdateMaterialDto } from '../dto/material.dto';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; categoryId?: string; type?: string; limit?: number; page?: number }) {
    const search = query?.search?.trim();
    const categoryId = query?.categoryId;
    const type = query?.type;
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (type && type !== 'ALL') {
      where.type = type as any;
    }

    const [items, total] = await Promise.all([
      this.prisma.materialItem.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: [{ code: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.materialItem.count({ where }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActive(search?: string) {
    const where: any = {
      deletedAt: null,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.materialItem.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        unitPrice: true,
        type: true,
        stockQty: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.materialItem.findUnique({
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
    if (!item || item.deletedAt) {
      throw new NotFoundException('Material not found');
    }
    return item;
  }

  private sanitizeUuid(val?: string | null): string | null {
    if (!val || typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === 'ALL' || trimmed.toLowerCase() === 'null') return null;
    return trimmed;
  }

  async create(dto: CreateMaterialDto) {
    if (dto.code) {
      const existing = await this.prisma.materialItem.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException(`Material code '${dto.code}' already exists`);
      }
    }

    const categoryId = this.sanitizeUuid(dto.categoryId);
    const inventoryAccountId = this.sanitizeUuid(dto.inventoryAccountId);
    const salesAccountId = this.sanitizeUuid(dto.salesAccountId);

    return this.prisma.materialItem.create({
      data: {
        code: dto.code || undefined,
        name: dto.name,
        type: (dto.type as any) || 'RAW_MATERIAL',
        unit: dto.unit || 'pcs',
        usageUnit: dto.usageUnit || null,
        outMethod: (dto.outMethod as any) || 'FIFO',
        leadTime: dto.leadTime !== undefined ? Number(dto.leadTime) : 0,
        unitPrice: dto.unitPrice !== undefined ? Number(dto.unitPrice) : 0,
        stockQty: dto.stockQty !== undefined ? Number(dto.stockQty) : 0,
        minLevel: dto.minLevel !== undefined ? Number(dto.minLevel) : 0,
        maxLevel: dto.maxLevel !== undefined ? Number(dto.maxLevel) : 100000,
        reorderPoint: dto.reorderPoint !== undefined ? Number(dto.reorderPoint) : 10,
        categoryId,
        inventoryAccountId,
        salesAccountId,
        inciName: dto.inciName || null,
        status: (dto.status as any) || 'ACTIVE',
        physicalForm: dto.physicalForm || null,
        halalCertNo: dto.halalCertNo || null,
        halalExpDate: dto.halalExpDate ? new Date(dto.halalExpDate) : null,
        isHalalValidated: Boolean(dto.isHalalValidated),
      },
      include: {
        category: true,
        inventoryAccount: true,
        salesAccount: true,
      },
    });
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const existing = await this.prisma.materialItem.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Material not found');
    }

    if (dto.code && dto.code !== existing.code) {
      const codeTaken = await this.prisma.materialItem.findUnique({
        where: { code: dto.code },
      });
      if (codeTaken) {
        throw new BadRequestException(`Material code '${dto.code}' already exists`);
      }
    }

    return this.prisma.materialItem.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code || null }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.usageUnit !== undefined && { usageUnit: dto.usageUnit || null }),
        ...(dto.outMethod !== undefined && { outMethod: dto.outMethod as any }),
        ...(dto.leadTime !== undefined && { leadTime: Number(dto.leadTime) }),
        ...(dto.unitPrice !== undefined && { unitPrice: Number(dto.unitPrice) }),
        ...(dto.stockQty !== undefined && { stockQty: Number(dto.stockQty) }),
        ...(dto.minLevel !== undefined && { minLevel: Number(dto.minLevel) }),
        ...(dto.maxLevel !== undefined && { maxLevel: Number(dto.maxLevel) }),
        ...(dto.reorderPoint !== undefined && { reorderPoint: Number(dto.reorderPoint) }),
        ...(dto.categoryId !== undefined && { categoryId: this.sanitizeUuid(dto.categoryId) }),
        ...(dto.inventoryAccountId !== undefined && { inventoryAccountId: this.sanitizeUuid(dto.inventoryAccountId) }),
        ...(dto.salesAccountId !== undefined && { salesAccountId: this.sanitizeUuid(dto.salesAccountId) }),
        ...(dto.inciName !== undefined && { inciName: dto.inciName || null }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.physicalForm !== undefined && { physicalForm: dto.physicalForm || null }),
        ...(dto.halalCertNo !== undefined && { halalCertNo: dto.halalCertNo || null }),
        ...(dto.halalExpDate !== undefined && {
          halalExpDate: dto.halalExpDate ? new Date(dto.halalExpDate) : null,
        }),
        ...(dto.isHalalValidated !== undefined && { isHalalValidated: Boolean(dto.isHalalValidated) }),
      },
      include: {
        category: true,
        inventoryAccount: true,
        salesAccount: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.materialItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Material not found');

    return this.prisma.materialItem.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' as any },
    });
  }

  // Item 39: Get supplier history for a product
  async getSupplierHistory(materialId: string) {
    const history = await this.prisma.productSupplierHistory.findMany({
      where: { productId: materialId },
      include: { supplier: true },
      orderBy: { lastPurchaseAt: 'desc' },
    });
    return history;
  }

  // Item 72: Get HPP breakdown for a product
  async getHppBreakdown(materialId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const items = await this.prisma.purchaseOrderItem.findMany({
      where: {
        materialId,
        po: { status: 'APPROVED', updatedAt: { gte: ninetyDaysAgo } },
      },
      include: { po: { select: { poNumber: true, updatedAt: true, supplier: true } } },
      orderBy: { po: { updatedAt: 'desc' } },
    });

    const product = await this.prisma.materialItem.findUnique({
      where: { id: materialId },
      select: { autoCalculatedHpp: true, manualOverrideHpp: true },
    });

    let totalQty = 0;
    let totalValue = 0;
    const breakdown = items.map((item) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const value = qty * price;
      totalQty += qty;
      totalValue += value;
      return {
        poNumber: item.po.poNumber,
        date: item.po.updatedAt,
        supplier: item.po.supplier?.name,
        qty,
        unitPrice: price,
        value,
      };
    });

    return {
      materialId,
      autoCalculatedHpp: product?.autoCalculatedHpp,
      manualOverrideHpp: product?.manualOverrideHpp,
      effectiveHpp: product?.manualOverrideHpp ?? product?.autoCalculatedHpp,
      breakdown,
      summary: { totalQty, totalValue, averageHpp: totalQty > 0 ? totalValue / totalQty : null },
    };
  }}
