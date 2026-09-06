import { Logger, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);
  constructor(private prisma: PrismaService) {}

  // Item 50: Find suppliers with optional bahanType filter
  async findAll(query?: { search?: string; categoryId?: string; bahanType?: string }) {
    const search = query?.search?.trim();
    const categoryId = query?.categoryId;
    const bahanType = query?.bahanType;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { contact: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    // Item 50: Filter by bahanType - suppliers who have supplied materials of this type
    if (bahanType && bahanType !== 'ALL') {
      where.pos = {
        some: {
          items: {
            some: {
              material: {
                bahanType: bahanType,
              },
            },
          },
        },
      };
    }

    return this.prisma.supplier.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findActive(search?: string) {
    const where: any = {
      deletedAt: null,
      isBlacklisted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { contact: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.supplier.findMany({
      where,
      select: {
        id: true,
        name: true,
        contact: true,
        phone: true,
        city: true,
        categoryId: true,
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(dto: any) {
    return this.prisma.supplier.create({
      data: {
        name: dto.name,
        contact: dto.contact || dto.pic || null,
        phone: dto.phone || null,
        email: dto.email || null,
        address: dto.address || null,
        city: dto.city || null,
        province: dto.province || null,
        termOfPayment: Number(dto.termOfPayment) || 0,
        categoryId: dto.categoryId || null,
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Supplier not found');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.contact !== undefined && { contact: dto.contact }),
        ...(dto.pic !== undefined && { contact: dto.pic }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.province !== undefined && { province: dto.province }),
        ...(dto.termOfPayment !== undefined && { termOfPayment: Number(dto.termOfPayment) }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId || null }),
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
