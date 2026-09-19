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
    if (dto.code) {
      return this.prisma.masterCategory.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description || null,
          type: dto.type,
        },
      });
    }

    const prefix = dto.name.substring(0, 3).toUpperCase();
    const docType = `CATEGORY_${dto.type || 'GENERAL'}`;

    return this.prisma.$transaction(async (tx) => {
      const seqRow = await tx.masterKode.upsert({
        where: { documentType: docType },
        create: {
          documentType: docType,
          format: `${prefix}-{SEQ:4}`,
          currentSequence: 1,
        },
        update: {
          currentSequence: { increment: 1 },
        },
      });
      const generatedCode = `${prefix}-${seqRow.currentSequence.toString().padStart(4, '0')}`;
      return tx.masterCategory.create({
        data: {
          code: generatedCode,
          name: dto.name,
          description: dto.description || null,
          type: dto.type,
        },
      });
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
