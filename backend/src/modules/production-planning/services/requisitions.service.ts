import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IssueRequisitionDto } from '../dto/requisition.dto';

@Injectable()
export class RequisitionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    let materialId = dto.materialId;
    const qtyRequested = dto.qtyRequested || dto.requestedQty || 1;

    if (materialId) {
      const exists = await this.prisma.materialItem.findUnique({ where: { id: materialId } });
      if (!exists) materialId = undefined;
    }
    if (!materialId) {
      const firstMat = await this.prisma.materialItem.findFirst();
      if (firstMat) materialId = firstMat.id;
    }

    let targetPlanId: string | undefined = undefined;
    let targetWorkOrderId: string | undefined = undefined;

    const candidateId = dto.workOrderId || dto.woId;
    if (candidateId) {
      const plan = await this.prisma.productionPlan.findUnique({ where: { id: candidateId } });
      if (plan) targetPlanId = plan.id;

      const wo = await this.prisma.workOrder.findUnique({ where: { id: candidateId } });
      if (wo) targetWorkOrderId = wo.id;
    }

    if (!targetPlanId && !targetWorkOrderId && dto.woNumber) {
      const wo = await this.prisma.workOrder.findFirst({ where: { woNumber: dto.woNumber } });
      if (wo) targetWorkOrderId = wo.id;

      const plan = await this.prisma.productionPlan.findFirst({ where: { batchNo: dto.woNumber } });
      if (plan) targetPlanId = plan.id;
    }

    if (!targetPlanId && !targetWorkOrderId) {
      const wo = await this.prisma.workOrder.findFirst();
      if (wo) targetWorkOrderId = wo.id;

      const plan = await this.prisma.productionPlan.findFirst();
      if (plan) targetPlanId = plan.id;
    }

    const reqNumber = dto.reqNumber || `SPB-${Date.now().toString().slice(-6)}`;

    return this.prisma.materialRequisition.create({
      data: {
        reqNumber,
        woId: targetPlanId || undefined,
        workOrderId: targetWorkOrderId || undefined,
        materialId: materialId,
        qtyRequested: qtyRequested,
        status: dto.status || 'PENDING',
      },
      include: {
        material: true,
        workOrder: { include: { lead: true } },
      },
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
        workOrder: { include: { lead: true } },
        material: { select: { name: true, unit: true, stockQty: true } },
      },
      orderBy: { id: 'desc' },
    });
  }
}
