import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { ScmService } from '../../scm/services/scm.service';
import { LifecycleStatus } from '@prisma/client';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { logBestEffort } from '../../../common/helpers/best-effort';

@Injectable()
export class WarehouseReleaseService {
  private readonly logger = new Logger(WarehouseReleaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scmService: ScmService,
    private readonly moduleRef: ModuleRef,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getFinanceService() {
    const { FinanceService } = await import('../../finance/finance.service');
    return this.moduleRef.get(FinanceService, { strict: false });
  }

  // NOTE: handleProductionConsumption listener removed to prevent duplicate finished goods credit.
  // The authoritative listener is registered in WarehouseService.handleProductionConsumption.

  async validateHandover(data: {
    materialId: string;
    batchNumber: string;
    quantity: number;
  }) {
    const inventory = await this.prisma.materialInventory.findFirst({
      where: {
        materialId: data.materialId,
        batchNumber: data.batchNumber,
      },
      include: { material: true },
    });

    if (!inventory) throw new NotFoundException('Batch not found');

    if (inventory.qcStatus !== 'GOOD') {
      throw new BadRequestException(
        `QUARANTINE GATE: Batch ${data.batchNumber} is currently in ${inventory.qcStatus} status and cannot be released.`,
      );
    }

    // FEFO Enforcement Check
    if (inventory.material.outMethod === 'FEFO') {
      const earlierBatch = await this.prisma.materialInventory.findFirst({
        where: {
          materialId: data.materialId,
          currentStock: { gt: 0 },
          qcStatus: 'GOOD',
          expDate: { lt: inventory.expDate || new Date('9999-12-31') },
        },
      });

      if (earlierBatch) {
        throw new BadRequestException(
          `FEFO VIOLATION: Batch ${earlierBatch.batchNumber} expires earlier (${earlierBatch.expDate?.toLocaleDateString()}). Please use it first.`,
        );
      }
    }

    if (Number(inventory.currentStock) < data.quantity) {
      throw new BadRequestException(
        'Insufficient stock in this specific batch.',
      );
    }

    return { valid: true, inventory };
  }

  async releaseMaterial(workOrderId: string) {
    // 1. Validate Readiness
    const readiness = await this.scmService.checkMaterialReadiness(workOrderId);
    if (readiness.status === 'SHORTAGE') {
      throw new BadRequestException(
        'Material is not fully ready (Gap Engine Block)',
      );
    }

    if (readiness.status === 'NO_APPROVED_SAMPLE') {
      throw new BadRequestException(
        'No approved sample/formula found for this Work Order. Please approve the sample in R&D first.',
      );
    }

    // 2. ACID Transaction for Stock Reduction and Audit
    return await this.prisma.$transaction(async (tx: any) => {
      // Get Work Order & BOM Details
      const wo = await tx.workOrder.findUnique({
        where: { id: workOrderId },
        include: {
          lead: {
            include: {
              sampleRequests: {
                where: { stage: 'APPROVED' }, // Match SampleStage.APPROVED
                include: {
                  billOfMaterials: {
                    include: { material: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!wo) throw new BadRequestException('Work Order not found');

      const bom = wo.lead.sampleRequests[0]?.billOfMaterials;
      if (!bom)
        throw new BadRequestException('BOM not found for this Work Order');

      // Loop BOM and Deduct Stock using FIFO (Multi-Batch)
      for (const item of bom) {
        let remainingQty = Number(item.quantityPerUnit) * wo.targetQty;

        // Fetch all available batches for this material, ordered by expiration date (FEFO/FIFO)
        const inventories = await tx.materialInventory.findMany({
          where: {
            materialId: item.materialId,
            currentStock: { gt: 0 },
            qcStatus: 'GOOD', // Quarantine Gate
          },
          include: { material: true },
          orderBy: [{ expDate: 'asc' }, { lastRestock: 'asc' }],
        });

        for (const inventory of inventories) {
          const currentStockNum = Number(inventory.currentStock);
          const deductAmount = Math.min(remainingQty, currentStockNum);

          await tx.materialInventory.update({
            where: { id: inventory.id },
            data: {
              currentStock: {
                decrement: deductAmount,
              },
            },
          });

          // Phase 2: Create Detailed Transaction for Batch-Level Tracking
          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              inventoryId: inventory.id,
              type: 'OUTBOUND',
              quantity: deductAmount,
              referenceNo: wo.woNumber,
              unitValueAtTransaction: inventory.material.unitPrice, // Capture value at transaction
              performedBy: 'SYSTEM_PRODUCTION',
              notes: `PROD_CONSUMPTION: WO ${wo.woNumber} Stage ${wo.stage}`,
            },
          });

          remainingQty -= deductAmount;
          if (remainingQty <= 0) break;
        }

        // Phase 2: Update MaterialItem cache
        const totalDeducted = Number(item.quantityPerUnit) * wo.targetQty;
        await tx.materialItem.update({
          where: { id: item.materialId },
          data: { stockQty: { decrement: totalDeducted } },
        });

        // Safety check to ensure all required quantity was fulfilled
        if (remainingQty > 0) {
          throw new BadRequestException(
            `Data anomaly: Stock ran out before fulfillment for material ${item.materialId} despite SCM readiness check.`,
          );
        }
      }

      // 3. Automated Journaling: Move Asset to WIP (Phase 4)
      // Note: Value calculation here is simplified; normally uses batch-specific valuation
      const totalValue = bom.reduce((sum: number, item: any) => {
        return (
          sum +
          Number(item.quantityPerUnit) *
            wo.targetQty *
            Number(item.material?.unitPrice || 0)
        );
      }, 0);

      if (totalValue > 0) {
        const finSvc = await this.getFinanceService();
        await finSvc.createMaterialHandoverJournal({
          workOrderId: wo.id,
          totalValue,
          description: `SYSTEM: Material transition to WIP for WO ${wo.woNumber}`,
        });
      }

      // 4. Document Handover in Production Log
      await tx.productionLog.create({
        data: {
          workOrderId: wo.id,
          stage: LifecycleStatus.WAITING_MATERIAL,
          inputQty: 0,
          goodQty: 0,
          quarantineQty: 0,
          rejectQty: 0,
          notes: 'SYSTEM: MATERIAL_RELEASED_BY_WAREHOUSE',
        },
      });

      const result = {
        message: 'Materials released and handover documented.',
        workOrderId: wo.id,
      };

      this.eventEmitter.emit('activity.logged', {
        action: 'MATERIAL_RELEASED',
        entityType: 'WorkOrder',
        entityId: wo.id,
        detail: `Materials released for WO ${wo.woNumber} (${bom.length} items)`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.material.released', {
        workOrderId: wo.id,
        woNumber: wo.woNumber,
        itemsCount: bom.length,
        totalValue,
      });

      // Non-blocking shortage check
      this.checkAndEmitShortages();

      return result;
    });
  }

  /**
   * BUS-RULE-052 & BUS-RULE-031: FEFO/FIFO Validation & Picking
   * Validates whether picked batch is earliest expiring batch (FEFO for raw material)
   * or earliest received batch (FIFO for packaging).
   */
  async validateFefoPick(data: {
    materialId: string;
    batchId: string;
    quantity: number;
  }) {
    const material = await this.prisma.materialItem.findUnique({
      where: { id: data.materialId },
    });
    if (!material) throw new NotFoundException('Material not found');

    const targetBatch = await this.prisma.materialInventory.findUnique({
      where: { id: data.batchId },
    });
    if (!targetBatch) throw new NotFoundException('Batch not found');
    if (targetBatch.materialId !== data.materialId) {
      throw new BadRequestException(
        'Batch does not belong to specified material',
      );
    }
    if (Number(targetBatch.currentStock) < data.quantity) {
      throw new BadRequestException(
        `Insufficient stock in batch. Available: ${targetBatch.currentStock}, Requested: ${data.quantity}`,
      );
    }

    const isRawMaterial = material.type === 'RAW_MATERIAL';

    if (isRawMaterial && targetBatch.expDate) {
      const earlierBatch = await this.prisma.materialInventory.findFirst({
        where: {
          materialId: data.materialId,
          currentStock: { gt: 0 },
          qcStatus: 'GOOD',
          id: { not: targetBatch.id },
          expDate: { lt: targetBatch.expDate, not: null },
        },
        orderBy: { expDate: 'asc' },
      });

      if (earlierBatch) {
        throw new BadRequestException(
          `FEFO VIOLATION: Batch ${earlierBatch.batchNumber} expires earlier than selected batch. Earliest batch must be picked first.`,
        );
      }
    } else if (targetBatch.receivingDate) {
      const earlierBatch = await this.prisma.materialInventory.findFirst({
        where: {
          materialId: data.materialId,
          currentStock: { gt: 0 },
          qcStatus: 'GOOD',
          id: { not: targetBatch.id },
          receivingDate: { lt: targetBatch.receivingDate, not: null },
        },
        orderBy: { receivingDate: 'asc' },
      });

      if (earlierBatch) {
        throw new BadRequestException(
          `FIFO VIOLATION: Batch ${earlierBatch.batchNumber} was received earlier than selected batch. Earliest batch must be picked first.`,
        );
      }
    }

    return {
      valid: true,
      materialId: data.materialId,
      batchId: data.batchId,
      strategy: isRawMaterial ? 'FEFO' : 'FIFO',
    };
  }

  /**
   * Execute picking with no-negative-stock guarantee
   */
  async pickBatch(data: {
    materialId: string;
    batchId: string;
    quantity: number;
    referenceNo: string;
    performedBy?: string;
  }) {
    await this.validateFefoPick({
      materialId: data.materialId,
      batchId: data.batchId,
      quantity: data.quantity,
    });

    return this.prisma.$transaction(async (tx) => {
      // Row-level lock to prevent concurrent double-allocation and ensure zero inventory variance
      await tx.$executeRaw`SELECT id FROM material_inventories WHERE id = ${data.batchId}::uuid FOR UPDATE`;

      const batch = await tx.materialInventory.findUnique({
        where: { id: data.batchId },
        include: { material: true },
      });
      if (!batch || Number(batch.currentStock) < data.quantity) {
        throw new BadRequestException(
          `INSUFFICIENT_STOCK: Batch current stock is less than requested quantity.`,
        );
      }

      await tx.materialInventory.update({
        where: { id: data.batchId },
        data: { currentStock: { decrement: data.quantity } },
      });

      await tx.materialItem.update({
        where: { id: data.materialId },
        data: { stockQty: { decrement: data.quantity } },
      });

      const movement = await tx.inventoryTransaction.create({
        data: {
          materialId: data.materialId,
          inventoryId: data.batchId,
          type: 'OUTBOUND',
          quantity: data.quantity,
          referenceNo: data.referenceNo,
          performedBy: data.performedBy || 'WAREHOUSE_STAFF',
          unitValueAtTransaction: batch.material.unitPrice,
          notes: `PICKED: Batch ${batch.batchNumber}`,
        },
      });

      return {
        success: true,
        movementId: movement.id,
        deductedQty: data.quantity,
        remainingBatchStock: Number(batch.currentStock) - data.quantity,
      };
    });
  }

  @OnEvent('production.material.returned')
  async handleProductionMaterialReturn(payload: {
    workOrderId: string;
    materialId: string;
    qtyReturned: number;
  }) {
    await this.prisma.$transaction(async (tx) => {
      // Restore to oldest active batch or create new inventory record
      const oldestBatch = await tx.materialInventory.findFirst({
        where: { materialId: payload.materialId, qcStatus: 'GOOD' },
        orderBy: { receivingDate: 'asc' },
      });

      if (oldestBatch) {
        await tx.materialInventory.update({
          where: { id: oldestBatch.id },
          data: { currentStock: { increment: payload.qtyReturned } },
        });
        await tx.inventoryTransaction.create({
          data: {
            materialId: payload.materialId,
            inventoryId: oldestBatch.id,
            type: 'RETURN',
            quantity: payload.qtyReturned,
            referenceNo: `RET-PROD-${payload.workOrderId.slice(0, 8)}`,
            performedBy: 'SYSTEM_PRODUCTION',
            notes: `Material returned from production to batch ${oldestBatch.batchNumber}`,
          },
        });
      } else {
        await tx.inventoryTransaction.create({
          data: {
            materialId: payload.materialId,
            type: 'RETURN',
            quantity: payload.qtyReturned,
            referenceNo: `RET-PROD-${payload.workOrderId.slice(0, 8)}`,
            performedBy: 'SYSTEM_PRODUCTION',
            notes: 'Material returned from production (no existing batch)',
          },
        });
      }

      await tx.materialItem.update({
        where: { id: payload.materialId },
        data: { stockQty: { increment: payload.qtyReturned } },
      });
    });

    this.eventEmitter.emit('activity.logged', {
      action: 'MATERIAL_RETURNED_FROM_PRODUCTION',
      entityType: 'InventoryTransaction',
      entityId: payload.materialId,
      detail: `${payload.qtyReturned} units returned from WO ${payload.workOrderId}`,
      senderDivision: 'WAREHOUSE',
    });
  }

  private async checkAndEmitShortages() {
    try {
      const allActive = await this.prisma.materialItem.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          stockQty: true,
          minLevel: true,
          isCritical: true,
        },
      });
      for (const item of allActive) {
        if (Number(item.stockQty) <= Number(item.minLevel)) {
          this.eventEmitter.emit('warehouse.stock.shortage', {
            materialId: item.id,
            materialName: item.name,
            currentStock: Number(item.stockQty),
            minLevel: Number(item.minLevel),
            isCritical: item.isCritical,
          });
        }
      }
    } catch (err) {
      logBestEffort(this.logger, 'warehouse:stock-shortage-alert', err);
    }
  }
}
