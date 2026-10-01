import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreateSalesTargetDto,
  UpdateSalesTargetDto,
  CreateSalesCategoryDto,
  UpdateSalesCategoryDto,
} from '../dto/sales-target.dto';

@Injectable()
export class SalesTargetsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // SALES TARGETS
  // ==========================================

  async findAllTargets(month?: number, year?: number) {
    const whereClause: any = {};
    if (month) whereClause.month = Number(month);
    if (year) whereClause.year = Number(year);

    const targets = await this.prisma.salesTarget.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            roles: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { nominalTarget: 'desc' }],
    });

    // Enriched with real achievement revenue calculated from invoices
    const enriched = await Promise.all(
      targets.map(async (target: any) => {
        const startDate = new Date(target.year, target.month - 1, 1);
        const endDate = new Date(target.year, target.month, 1);

        const invoices = await this.prisma.invoice.findMany({
          where: {
            issuedAt: { gte: startDate, lt: endDate },
            so: {
              lead: {
                picId: target.userId,
              },
            },
          },
          select: {
            amountDue: true,
            outstandingAmount: true,
            status: true,
          },
        });

        const realized = invoices.reduce((sum: number, inv: any) => {
          const due = Number(inv.amountDue || 0);
          const outstanding = Number(inv.outstandingAmount || 0);
          const paid = Math.max(0, due - outstanding);
          return sum + paid;
        }, 0);

        const nominal = Number(target.nominalTarget || 0);
        const achievementPercent = nominal > 0 ? Math.round((realized / nominal) * 100) : 0;

        return {
          id: target.id,
          userId: target.userId,
          marketingName: target.user.fullName || target.user.email,
          marketingEmail: target.user.email,
          marketingRole: target.user.roles?.[0] || 'Sales / Marketing',
          month: target.month,
          year: target.year,
          nominalTarget: nominal,
          realizedRevenue: realized,
          achievementPercent,
          notes: target.notes,
          createdAt: target.createdAt,
          updatedAt: target.updatedAt,
        };
      }),
    );

    return enriched;
  }

  async findTargetById(id: string) {
    const target = await this.prisma.salesTarget.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, roles: true },
        },
      },
    });
    if (!target) {
      throw new NotFoundException(`Sales target dengan ID '${id}' tidak ditemukan`);
    }
    return target;
  }

  async createTarget(dto: CreateSalesTargetDto) {
    return this.prisma.salesTarget.upsert({
      where: {
        userId_month_year: {
          userId: dto.userId,
          month: dto.month,
          year: dto.year,
        },
      },
      update: {
        nominalTarget: dto.nominalTarget,
        notes: dto.notes,
      },
      create: {
        userId: dto.userId,
        month: dto.month,
        year: dto.year,
        nominalTarget: dto.nominalTarget,
        notes: dto.notes,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, roles: true },
        },
      },
    });
  }

  async updateTarget(id: string, dto: UpdateSalesTargetDto) {
    return this.prisma.salesTarget.update({
      where: { id },
      data: {
        ...(dto.nominalTarget !== undefined && { nominalTarget: dto.nominalTarget }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.month !== undefined && { month: dto.month }),
        ...(dto.year !== undefined && { year: dto.year }),
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, roles: true },
        },
      },
    });
  }

  async deleteTarget(id: string) {
    return this.prisma.salesTarget.delete({
      where: { id },
    });
  }

  async getMarketingUsers() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        roles: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  // ==========================================
  // SALES CATEGORIES
  // ==========================================

  async findAllCategories() {
    const list = await this.prisma.salesCategory.findMany({
      orderBy: { name: 'asc' },
    });
    if (list.length === 0) {
      return this.seedDefaultCategories();
    }
    return list;
  }

  async createCategory(dto: CreateSalesCategoryDto) {
    return this.prisma.salesCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateSalesCategoryDto) {
    return this.prisma.salesCategory.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.salesCategory.delete({
      where: { id },
    });
  }

  async seedDefaultCategories() {
    const defaultCategories = [
      { name: 'Maklon Baru', description: 'Proyek Maklon Produk Baru / New Product Development (NPD)' },
      { name: 'Repeat Order', description: 'Produksi Ulang Formula / Produk Maklon Eksisting' },
      { name: 'Sample RnD', description: 'Pengembangan dan Pengujian Sampel RnD Skincare/Kosmetik' },
      { name: 'Jasa Maklon', description: 'Jasa Pengolahan, Filling, dan Packaging Bahan dari Client' },
      { name: 'Produk Ruahan', description: 'Penjualan Produk Bulk / Curah Siap Kemas' },
    ];

    const results = [];
    for (const cat of defaultCategories) {
      const item = await this.prisma.salesCategory.upsert({
        where: { name: cat.name },
        update: { description: cat.description },
        create: cat,
      });
      results.push(item);
    }
    return results;
  }
}
