import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.salesReturn.findMany({
      where: { deletedAt: null },
      include: {
        items: true,
        so: { select: { id: true, brandName: true } },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.salesReturn.findUnique({
      where: { id },
      include: {
        items: true,
        so: true,
        warehouse: true,
      },
    });
    if (!record) throw new NotFoundException(`Sales return ${id} not found`);
    return record;
  }

  async create(dto: CreateReturnDto) {
    const data: any = {
      soId: dto.soId,
      warehouseId: dto.warehouseId,
      notes: dto.notes ?? '',
      returnStatus: dto.returnStatus ?? 'POTONG_TAGIHAN',
    };
    if (dto.returnDate) data.returnDate = new Date(dto.returnDate);
    if (dto.items && dto.items.length > 0) {
      data.items = {
        create: dto.items.map((it) => ({
          materialId: it.materialId,
          qtyReturned: it.qtyReturned ?? it.qty ?? 0,
        })),
      };
    }
    return this.prisma.salesReturn.create({
      data,
      include: { items: true, so: true, warehouse: true },
    });
  }

  async updateStatus(
    id: string,
    dto: { returnStatus?: string; notes?: string },
  ) {
    await this.findOne(id);
    return this.prisma.salesReturn.update({
      where: { id },
      data: {
        ...(dto.returnStatus ? { returnStatus: dto.returnStatus } : {}),
        ...(dto.notes ? { notes: dto.notes } : {}),
      },
      include: { items: true },
    });
  }

  async softDelete(id: string) {
    await this.findOne(id);
    return this.prisma.salesReturn.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
