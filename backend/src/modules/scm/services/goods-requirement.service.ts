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

  async getSummary() {
    const items = await this.prisma.goodsRequirementItem.findMany({
      include: {
        requirement: true,
      },
      orderBy: { id: 'asc' },
    });

    const materialIds = [...new Set(items.map((i) => i.materialId))];
    const materials = await this.prisma.materialItem.findMany({
      where: { id: { in: materialIds } },
    });
    const matMap = new Map(materials.map((m) => [m.id, m]));

    // Aggregate by material
    const summaryMap = new Map<string, any>();
    for (const item of items) {
      const mat = matMap.get(item.materialId);
      const existing = summaryMap.get(item.materialId) || {
        id: item.materialId,
        materialId: item.materialId,
        kode: mat?.code || 'MAT-GEN',
        nama: mat?.name || 'Material Bahan',
        kategori: mat?.type || 'RAW_MATERIAL',
        totalKebutuhan: 0,
        stokGudang: Number(mat?.stockQty || 0),
        satuan: mat?.unit || 'KG',
        hargaEstimasi: Number(mat?.unitPrice || 0),
        prioritas: 'MEDIUM',
        soList: [] as string[],
      };

      existing.totalKebutuhan += Number(item.qty);
      if (item.requirement?.salesOrderId && !existing.soList.includes(item.requirement.salesOrderId)) {
        existing.soList.push(item.requirement.salesOrderId);
      }
      summaryMap.set(item.materialId, existing);
    }

    return Array.from(summaryMap.values()).map((row) => ({
      ...row,
      selisih: Math.max(0, row.totalKebutuhan - row.stokGudang),
    }));
  }
}
