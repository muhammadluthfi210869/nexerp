import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supplier.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
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
      data: dto,
    });
  }

  async update(id: string, dto: any) {
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
