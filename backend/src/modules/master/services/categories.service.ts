import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/category.dto';

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
    return this.prisma.masterCategory.create({
      data: dto,
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
