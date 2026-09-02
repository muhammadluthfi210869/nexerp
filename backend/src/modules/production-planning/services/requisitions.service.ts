import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreateRequisitionDto,
  IssueRequisitionDto,
} from '../dto/requisition.dto';

@Injectable()
export class RequisitionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRequisitionDto) {
    return this.prisma.materialRequisition.create({
      data: dto,
    });
  }

  async issue(id: string, dto: IssueRequisitionDto) {
    return this.prisma.$transaction(async (tx) => {
      const requisition = await tx.materialRequisition.findUnique({
        where: { id },
        include: { material: true },
      });

      if (!requisition) throw new NotFoundException('Requisition not found');
      if (Number(requisition.qtyIssued) > 0)
        throw new BadRequestException('Requisition already issued.');

      // [INVENTORY TRIGGER: DECREASE]
      // Validate stock
      const currentStock = Number(requisition.material.stockQty);
      const requestedIssue = Number(dto.qtyIssued);

      if (currentStock < requestedIssue) {
        throw new BadRequestException(
          `Insufficient stock for ${requisition.material.name}. Attempted: ${requestedIssue}, Available: ${currentStock}`,
        );
      }

      // 1. Update stock
      await tx.materialItem.update({
        where: { id: requisition.materialId },
        data: {
          stockQty: { decrement: requestedIssue },
        },
      });

      // 2. Update requisition
      return tx.materialRequisition.update({
        where: { id },
        data: {
          qtyIssued: dto.qtyIssued,
        },
      });
    });
  }

  async getAggregatedRequisitions() {
    const pendingRequisitions = await this.prisma.materialRequisition.findMany({
      where: { status: 'PENDING' },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            unitPrice: true,
            stockQty: true,
          },
        },
      },
    });

    const aggregated: Record<string, any> = {};

    pendingRequisitions.forEach((req) => {
      const matId = req.materialId;
      if (!aggregated[matId]) {
        aggregated[matId] = {
          materialId: matId,
          name: req.material.name,
          unit: req.material.unit,
          totalRequested: 0,
          currentStock: Number(req.material.stockQty),
          price: Number(req.material.unitPrice),
          projects: [],
        };
      }
      aggregated[matId].totalRequested += Number(req.qtyRequested);
      aggregated[matId].projects.push({
        woId: req.woId || req.workOrderId,
        qty: Number(req.qtyRequested),
      });
    });

    return Object.values(aggregated).map((item) => ({
      ...item,
      shortage: Math.max(0, item.totalRequested - item.currentStock),
    }));
  }

  async findAll() {
    return this.prisma.materialRequisition.findMany({
      include: {
        wo: { select: { batchNo: true } },
        material: { select: { name: true, unit: true, stockQty: true } },
      },
    });
  }
}
