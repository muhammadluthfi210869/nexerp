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
    let code = dto.code;
    if (!code) {
      const prefix = dto.name.substring(0, 3).toUpperCase();
      const count = await this.prisma.masterCategory.count({
        where: { type: dto.type },
      });
      code = `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
    }
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
