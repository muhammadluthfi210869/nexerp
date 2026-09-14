import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string) {
    return this.prisma.masterCategory.findMany({
      where: type ? { type } : {},
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.masterCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const code =
      dto.code ||
      dto.name.substring(0, 3).toUpperCase() +
        Math.floor(100 + Math.random() * 900);
    return this.prisma.masterCategory.create({
      data: {
        code,
        name: dto.name,
        description: dto.description || null,
        type: dto.type,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.masterCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.masterCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
