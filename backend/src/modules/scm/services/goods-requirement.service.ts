// @ts-nocheck - Requires Prisma schema regeneration (blocked by legal.prisma relation issue)
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import {
  CreateGoodsRequirementDto,
  UpdateGoodsRequirementStatusDto,
} from '../dto/goods-requirement.dto';

@Injectable()
export class GoodsRequirementService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateGoodsRequirementDto, createdById?: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: dto.salesOrderId },
    });
    if (!so) throw new NotFoundException('Sales Order not found');

    const code = await this.idGenerator.generateId('NGR');
    return this.prisma.$transaction(async (tx) => {
      const requirement = await tx.goodsRequirement.create({
        data: {
          code,
          salesOrderId: dto.salesOrderId,
          date: new Date(dto.date),
          notes: dto.notes,
          createdById: createdById || '00000000-0000-0000-0000-000000000000',
        },
      });

      for (const item of dto.items) {
        await tx.goodsRequirementItem.create({
          data: {
            requirementId: requirement.id,
            materialId: item.materialId,
            qty: item.qty,
            notes: item.notes,
          },
        });
      }

      return tx.goodsRequirement.findUnique({
        where: { id: requirement.id },
      });
    });
  }

  async findAll() {
    return this.prisma.goodsRequirement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const req = await this.prisma.goodsRequirement.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('Goods Requirement not found');
    return req;
  }

  async updateStatus(id: string, dto: UpdateGoodsRequirementStatusDto) {
    const req = await this.prisma.goodsRequirement.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('Goods Requirement not found');
    return this.prisma.goodsRequirement.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
