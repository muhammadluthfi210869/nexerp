import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestStatusDto,
} from '../dto/purchase-request.dto';
import { PRStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(userId: string, dto: CreatePurchaseRequestDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('PR must contain at least one item');
    }

    const requestNumber = await this.idGenerator.generateId('PR');

    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseRequest.create({
        data: {
          requestNumber,
          warehouseId: dto.warehouseId,
          supplierId: dto.supplierId,
          priority: dto.priority || 'MEDIUM',
          status: PRStatus.PENDING, // Direct create moves to PENDING as per state machine trigger any_module.create_pr
          budgetCode: dto.budgetCode || 'OPEX-GEN',
          urgency: dto.urgency || 'NORMAL',
          notes: dto.notes,
          createdById: userId,
          organizationId: dto.organizationId,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              qtyRequired: item.qtyRequired ?? item.quantity ?? 1,
              estimatedPrice: item.estimatedPrice || 0,
            })),
          },
        },
        include: {
          items: {
            include: { material: true },
          },
          warehouse: true,
          supplier: true,
          creator: true,
        },
      });

      try {
        await tx.auditLog.create({
          data: {
            entityType: 'PurchaseRequest',
            entityId: pr.id,
            action: 'CREATE',
            source: 'SCM_PROCUREMENT',
            correlationId: pr.id,
            actorPermissionSnapshot: { requestNumber, itemCount: dto.items.length },
            actorUserId: userId,
            txId: randomUUID(),
          },
        });
      } catch {}

      return pr;
    });
  }

  async findAll(filter?: { status?: PRStatus; search?: string; organizationId?: string }) {
    const where: any = {};
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.organizationId) {
      where.organizationId = filter.organizationId;
    }
    if (filter?.search) {
      where.OR = [
        { requestNumber: { contains: filter.search, mode: 'insensitive' } },
        { notes: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.purchaseRequest.findMany({
      where,
      include: {
        items: {
          include: { material: true },
        },
        warehouse: true,
        supplier: true,
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: { material: true },
        },
        warehouse: true,
        supplier: true,
        creator: true,
        purchaseOrders: true,
      },
    });

    if (!pr) throw new NotFoundException(`Purchase Request ${id} not found`);
    return pr;
  }

  async approve(id: string, userId: string) {
    const pr = await this.findOne(id);

    // Enforce 03_WORKFLOW_STATE_MACHINE.yaml
    // Forbidden: DRAFT -> APPROVED (must traverse PENDING), REJECTED -> APPROVED
    if (pr.status === PRStatus.DRAFT) {
      throw new BadRequestException('Cannot approve DRAFT PR directly. It must be submitted to PENDING first.');
    }
    if (pr.status === PRStatus.REJECTED) {
      throw new BadRequestException('Cannot approve a REJECTED PR. A new PR must be created.');
    }
    if (pr.status === PRStatus.APPROVED || pr.status === PRStatus.CONVERTED) {
      return pr; // Idempotent
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseRequest.update({
        where: { id },
        data: { status: PRStatus.APPROVED },
        include: {
          items: { include: { material: true } },
          warehouse: true,
          supplier: true,
        },
      });

      try {
        await tx.auditLog.create({
          data: {
            entityType: 'PurchaseRequest',
            entityId: id,
            action: 'APPROVE',
            source: 'SCM_PROCUREMENT',
            correlationId: id,
            actorPermissionSnapshot: { previousStatus: pr.status, newStatus: 'APPROVED' },
            actorUserId: userId,
            txId: randomUUID(),
          },
        });
      } catch {}

      return updated;
    });
  }

  async reject(id: string, userId: string, reason?: string) {
    const pr = await this.findOne(id);

    if (pr.status === PRStatus.CONVERTED) {
      throw new BadRequestException('Cannot reject an already CONVERTED PR');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseRequest.update({
        where: { id },
        data: {
          status: PRStatus.REJECTED,
          notes: reason ? `${pr.notes || ''} [REJECTED: ${reason}]` : pr.notes,
        },
        include: { items: true },
      });

      try {
        await tx.auditLog.create({
          data: {
            entityType: 'PurchaseRequest',
            entityId: id,
            action: 'REJECT',
            source: 'SCM_PROCUREMENT',
            correlationId: id,
            actorPermissionSnapshot: { reason },
            actorUserId: userId,
            txId: randomUUID(),
          },
        });
      } catch {}

      return updated;
    });
  }

  async convertToPo(id: string, poId: string) {
    const pr = await this.findOne(id);
    if (pr.status !== PRStatus.APPROVED) {
      throw new BadRequestException(`Cannot convert PR with status ${pr.status}. Must be APPROVED.`);
    }

    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status: PRStatus.CONVERTED },
    });
  }

  async calculateMrpShortage(params: {
    salesOrderId?: string;
    items?: Array<{ materialId: string; requiredQty: number }>;
  }) {
    let materialNeeds: Array<{ materialId: string; requiredQty: number }> = [];

    if (params.salesOrderId) {
      // Find goods requirements or BOM from sales order
      const reqs = await this.prisma.goodsRequirement.findMany({
        where: { salesOrderId: params.salesOrderId },
        include: { items: true },
      });

      if (reqs.length > 0) {
        for (const req of reqs) {
          for (const item of req.items) {
            materialNeeds.push({
              materialId: item.materialId,
              requiredQty: Number(item.qty),
            });
          }
        }
      }
    }

    if (params.items && params.items.length > 0) {
      materialNeeds.push(...params.items);
    }

    // Aggregate required quantities by materialId
    const aggregatedMap = new Map<string, number>();
    for (const need of materialNeeds) {
      const current = aggregatedMap.get(need.materialId) || 0;
      aggregatedMap.set(need.materialId, current + need.requiredQty);
    }

    const materialIds = Array.from(aggregatedMap.keys());
    if (materialIds.length === 0) {
      return [];
    }

    const materials = await this.prisma.materialItem.findMany({
      where: { id: { in: materialIds } },
    });

    const shortageReport = materials.map((m) => {
      const required = aggregatedMap.get(m.id) || 0;
      const currentStock = Number(m.stockQty || 0);
      const shortage = Math.max(0, required - currentStock);

      return {
        materialId: m.id,
        materialCode: m.code || 'MAT-001',
        materialName: m.name,
        unit: m.unit,
        currentStock,
        requiredQty: required,
        shortageQty: shortage,
        suggestedPrQty: shortage,
        hasShortage: shortage > 0,
        supplierId: null,
        supplierName: 'Belum ditentukan',
        lastPrice: Number(m.unitPrice || 0),
        estimatedCost: shortage * Number(m.unitPrice || 0),
      };
    });

    const hasAnyShortage = shortageReport.some((s) => s.hasShortage);
    return {
      hasShortage: hasAnyShortage,
      shortages: shortageReport.filter((s) => s.hasShortage),
      items: shortageReport,
    };
  }
}
