import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from '../dto/unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.masterUnit.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.masterUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async create(dto: CreateUnitDto) {
    const existing = await this.prisma.masterUnit.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException(`Unit code "${dto.code}" already exists`);
    return this.prisma.masterUnit.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        symbol: dto.symbol ?? null,
        description: dto.description ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateUnitDto) {
    return this.prisma.masterUnit.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    // ponytail: soft-delete (preserve FK references from materials)
    return this.prisma.masterUnit.update({
      where: { id },
      data: { isActive: false },
    });
  }
}