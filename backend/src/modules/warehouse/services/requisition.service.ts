import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { CreateRequisitionDto, UpdateRequisitionStatusDto } from '../dto/requisition.dto';

@Injectable()
export class RequisitionService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateRequisitionDto, userId: string) {
    const reqNumber = await this.idGenerator.generateId('REQ');

    return this.prisma.$transaction(async (tx) => {
      const header = await tx.materialRequisitionHeader.create({
        data: {
          reqNumber,
          requestDate: dto.requestDate ? new Date(dto.requestDate) : new Date(),
          fromWarehouse: dto.fromWarehouse,
          toWarehouse: dto.toWarehouse,
          notes: dto.notes,
          createdById: userId,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              qty: item.qty,
              notes: item.notes,
            })),
          },
        },
        include: { items: { include: { material: true } } },
      });
      return header;
    });
  }

  async findAll() {
    return this.prisma.materialRequisitionHeader.findMany({
      include: {
        items: { include: { material: true } },
        requester: { select: { fullName: true } },
        fromWh: true,
        toWh: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const header = await this.prisma.materialRequisitionHeader.findUnique({
      where: { id },
      include: {
        items: { include: { material: true } },
        requester: { select: { fullName: true } },
        fromWh: true,
        toWh: true,
      },
    });
    if (!header) throw new NotFoundException('Requisition not found');
    return header;
  }

  async updateStatus(id: string, dto: UpdateRequisitionStatusDto) {
    const header = await this.prisma.materialRequisitionHeader.findUnique({
      where: { id },
    });
    if (!header) throw new NotFoundException('Requisition not found');

    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'REJECTED'],
      APPROVED: ['FULFILLED'],
      REJECTED: [],
      FULFILLED: [],
    };

    const allowed = allowedTransitions[header.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${header.status} to ${dto.status}`,
      );
    }

    return this.prisma.materialRequisitionHeader.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
