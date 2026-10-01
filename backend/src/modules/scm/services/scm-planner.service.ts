import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';
import {
  Division,
  StreamEventType,
  PRPriority,
  PRStatus,
} from '@prisma/client';

export interface CreatePurchaseRequestItemDto {
  materialId: string;
  qtyRequired: number;
  estimatedPrice?: number;
}

export interface CreatePurchaseRequestDto {
  warehouseId: string;
  priority?: PRPriority;
  requiredDate?: string;
  notes?: string;
  createdById?: string;
  items: CreatePurchaseRequestItemDto[];
}

@Injectable()
export class ScmPlannerService {
  private readonly logger = new Logger(ScmPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async initializePurchaseFromSuggestion(materialId: string, userId: string) {
    const material = await this.prisma.materialItem.findUnique({
      where: { id: materialId },
      include: {
        inventories: {
          include: { supplier: true },
          orderBy: { receivingDate: 'desc' },
        },
      },
    });

    if (!material) throw new NotFoundException('Material not found');

    const supplierRecord = (material as any).inventories[0];
    if (!supplierRecord) {
      throw new BadRequestException(
        'No supplier history found for this material',
      );
    }

    const supplier = supplierRecord.supplier;

    // Calculate suggestion
    const materialInventories = (material as any).inventories;
    const stock = materialInventories.reduce(
      (s: number, i: any) => s + Number(i.currentStock),
      0,
    );
    const safety = Number(material.reorderPoint);

    // Fetch active WOs to get commitment
    const workOrders = await this.prisma.workOrder.findMany({
      where: { stage: { not: 'FINISHED_GOODS' } },
      include: {
        lead: {
          include: {
            sampleRequests: {
              where: { stage: 'APPROVED' },
              include: { billOfMaterials: true },
            },
          },
        },
      },
    });

    let commitment = 0;
    workOrders.forEach((wo) => {
      const bom = wo.lead.sampleRequests[0]?.billOfMaterials || [];
      const item = bom.find((b: any) => b.materialId === materialId);
      if (item) {
        commitment += Number(wo.targetQty) * Number(item.quantityPerUnit);
      }
    });

    const netNeeded = commitment + safety - stock;
    const finalQty = netNeeded > 0 ? netNeeded : safety;

    const poNumber = `PO-AUTO-${Date.now().toString().slice(-6)}`;

    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplier.id,
        scmId: userId,
        totalValue: finalQty * Number(material.unitPrice),
        status: 'ORDERED',
        items: {
          create: [
            {
              materialId,
              quantity: finalQty,
              unitPrice: material.unitPrice,
              totalPrice: finalQty * Number(material.unitPrice),
            },
          ],
        },
      },
      include: { items: true, supplier: true },
    });
  }

  /**
   * PHASE 3: Automated Purchase Request (PR) Trigger
   * Triggered when a Lead passes Financial Gate 2 (DP Paid)
   */
  async autoCreatePurchaseRequestFromLead(leadId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get BOM requirements from Approved Sample
      const sample = await tx.sampleRequest.findFirst({
        where: { leadId, stage: 'APPROVED' },
        include: {
          billOfMaterials: { include: { material: true } },
          lead: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!sample) {
        return { status: 'SKIPPED', reason: 'No approved sample found' };
      }

      // Get SO quantity instead of lead MOQ
      const so = await tx.salesOrder.findFirst({
        where: { leadId, status: { in: ['LOCKED_ACTIVE', 'PENDING_DP'] } },
        orderBy: { createdAt: 'desc' },
      });
      const requiredQty = so?.quantity || Number(sample.lead.moq || 0);
      const warehouse = await tx.warehouse.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (!warehouse) {
        throw new NotFoundException(
          'No active warehouse found for PR auto-gen',
        );
      }

      const prItems = [];

      for (const bom of sample.billOfMaterials) {
        const totalRequired = requiredQty * Number(bom.quantityPerUnit);

        // Check current global stock
        const inventories = await tx.materialInventory.findMany({
          where: { materialId: bom.materialId },
        });
        const currentStock = inventories.reduce(
          (sum, inv) => sum + Number(inv.currentStock),
          0,
        );

        if (currentStock < totalRequired) {
          const shortage = totalRequired - currentStock;
          prItems.push({
            materialId: bom.materialId,
            qtyRequired: shortage,
            estimatedPrice: bom.material.unitPrice,
          });
        }
      }

      if (prItems.length === 0) {
        return {
          status: 'STOCK_READY',
          message: 'All materials available in stock',
        };
      }

      // 2. Create Purchase Request (PR)
      const pr = await tx.purchaseRequest.create({
        data: {
          warehouseId: warehouse.id,
          priority: PRPriority.HIGH,
          status: PRStatus.SUBMITTED,
          notes: `AUTO-PR: Financial Gate 2 Passed for Lead ${sample.lead.clientName}. Stock shortage detected.`,
          items: {
            create: prItems.map((item) => ({
              materialId: item.materialId,
              qtyRequired: item.qtyRequired,
              estimatedPrice: item.estimatedPrice,
            })),
          },
        },
        include: { items: true },
      });

      return { status: 'PR_CREATED', prId: pr.id, itemCount: prItems.length };
    });
  }

  async approvePurchaseRequest(prId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseRequest.findUnique({
        where: { id: prId },
        include: { items: true, warehouse: true, supplier: true },
      });

      if (!pr) throw new NotFoundException('Purchase Request not found');
      if (pr.status !== PRStatus.SUBMITTED) {
        throw new BadRequestException(
          `PR status ${pr.status} — hanya SUBMITTED yang bisa di-approve`,
        );
      }

      const poNumber = await this.idGenerator.generateId('PO');

      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: pr.supplierId,
          scmId: userId,
          status: 'ORDERED',
          totalValue: pr.items.reduce(
            (sum, item) =>
              sum + Number(item.qtyRequired) * Number(item.estimatedPrice || 0),
            0,
          ),
          notes: `AUTO-PO FROM PR: ${pr.notes || ''}`.trim(),
          leadId: pr.notes?.includes('Lead') ? undefined : undefined,
          items: {
            create: pr.items.map((item) => ({
              materialId: item.materialId,
              quantity: item.qtyRequired,
              unitPrice: item.estimatedPrice || 0,
              totalPrice:
                Number(item.qtyRequired) * Number(item.estimatedPrice || 0),
            })),
          },
        },
        include: { items: true },
      });

      await tx.purchaseRequest.update({
        where: { id: prId },
        data: { status: PRStatus.APPROVED },
      });

      return po;
    });
  }

  async rejectPurchaseRequest(prId: string, reason?: string) {
    const pr = await this.prisma.purchaseRequest.findUnique({
      where: { id: prId },
    });
    if (!pr) throw new NotFoundException('Purchase Request not found');
    if (pr.status !== PRStatus.SUBMITTED) {
      throw new BadRequestException(
        `PR status ${pr.status} — hanya SUBMITTED yang bisa di-reject`,
      );
    }
    return this.prisma.purchaseRequest.update({
      where: { id: prId },
      data: {
        status: PRStatus.REJECTED,
        notes: reason
          ? `${pr.notes || ''}\n[REJECTED] ${reason}`.trim()
          : pr.notes,
      },
    });
  }

  async getPurchaseRequests() {
    return this.prisma.purchaseRequest.findMany({
      include: {
        items: { include: { material: true } },
        warehouse: true,
        supplier: true,
        creator: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseRequest(dto: CreatePurchaseRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseRequest.create({
        data: {
          warehouseId: dto.warehouseId,
          priority: dto.priority || PRPriority.MEDIUM,
          notes: dto.notes,
          createdById: dto.createdById,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              qtyRequired: item.qtyRequired,
              estimatedPrice: item.estimatedPrice || 0,
            })),
          },
        },
        include: { items: { include: { material: true } }, warehouse: true },
      });

      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: '',
        senderDivision: Division.SCM,
        eventType: StreamEventType.STATE_CHANGE,
        notes: `Purchase Request created - ${pr.items.length} items, priority ${dto.priority || 'MEDIUM'}`,
        payload: { prId: pr.id },
      });

      this.eventEmitter.emit('scm.purchase_request.created', {
        prId: pr.id,
        warehouseId: dto.warehouseId,
        itemCount: pr.items.length,
        priority: dto.priority || 'MEDIUM',
      });

      return pr;
    });
  }
}
