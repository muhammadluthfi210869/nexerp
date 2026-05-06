import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { StockLedgerService } from '../../warehouse/services/stock-ledger.service';

@Injectable()
export class CommunicationProtocolService {
  constructor(
    private prisma: PrismaService,
    private stockLedger: StockLedgerService,
  ) {}

  /**
   * Listener for Stage Finalization in Production.
   * Automatically deducts materials used during the stage.
   */
  @OnEvent('production.schedule.finished')
  async handleProductionFinished(payload: {
    scheduleId: string;
    resultQty: number;
  }) {
    console.log(
      `[COMM_PROT] Handling production finish for schedule: ${payload.scheduleId}`,
    );

    await this.prisma.$transaction(async (tx: any) => {
      const schedule = await tx.productionSchedule.findUnique({
        where: { id: payload.scheduleId },
        include: {
          stepDetails: { include: { material: true } },
          workOrder: true,
        },
      });

      if (!schedule) return;

      // 1. Deduct actual material usage logged in stepDetails
      for (const detail of schedule.stepDetails) {
        if (detail.qtyActual > 0) {
          // Find a batch to deduct from (FIFO)
          const inventories = await tx.materialInventory.findMany({
            where: { materialId: detail.materialId, currentStock: { gt: 0 } },
            orderBy: { createdAt: 'asc' },
            take: 1,
          });

          const targetBatch = inventories[0];

          await this.stockLedger.recordMovement(tx, {
            materialId: detail.materialId,
            type: 'OUTBOUND',
            quantity: detail.qtyActual,
            referenceNo: schedule.scheduleNumber,
            notes: `PRODUCTION_CONSUMPTION: ${schedule.stage} for WO ${schedule.workOrder.woNumber}`,
            inventoryId: targetBatch?.id,
            performedBy: 'SYSTEM_COMM_PROT',
          });
        }
      }

      // 2. If this is the LAST stage (PACKING), increase Finished Goods stock
      if (schedule.stage === 'PACKING') {
        // In a real system, we'd have a FinishedGood material item linked to the Lead/Product
        // For now, we log it as a virtual inbound
        console.log(
          `[COMM_PROT] Production Chain Complete. Increasing FG inventory by ${payload.resultQty}`,
        );
      }

      // 3. Log State Transition for Audit
      await tx.stateTransitionLog.create({
        data: {
          entityType: 'PRODUCTION_SCHEDULE',
          entityId: schedule.id,
          fromState: 'IN_PROGRESS',
          toState: 'COMPLETED',
          reason: 'COMM_PROT: AUTOMATED_FINALIZATION',
          metadata: { resultQty: payload.resultQty },
        },
      });
    });
  }

  /**
   * Listener for SCM Purchase Order completion.
   * Automatically triggers stock increase when goods are received.
   */
  @OnEvent('warehouse.inbound.approved')
  async handleInboundApproved(payload: {
    inboundId: string;
    poId: string;
    warehouseId: string;
    items: any[];
  }) {
    console.log(`[COMM_PROT] Handling inbound approval: ${payload.inboundId}`);

    await this.prisma.$transaction(async (tx: any) => {
      // 1. Record stock movement for each item
      for (const item of payload.items) {
        // Create a new batch for this inbound
        const inventory = await tx.materialInventory.create({
          data: {
            materialId: item.materialId,
            supplierId:
              (
                await tx.purchaseOrder.findUnique({
                  where: { id: payload.poId },
                })
              )?.supplierId || '',
            batchNumber: `AUTO-${payload.inboundId.slice(0, 8)}`,
            currentStock: item.qty,
            receivingDate: new Date(),
            locationId: (
              await tx.warehouseLocation.findFirst({
                where: { warehouseId: payload.warehouseId },
              })
            )?.id,
          },
        });

        await this.stockLedger.recordMovement(tx, {
          materialId: item.materialId,
          type: 'INBOUND',
          quantity: item.qty,
          referenceNo: payload.inboundId,
          notes: `AUTO_GR: Received from PO ${payload.poId}`,
          inventoryId: inventory.id,
          warehouseId: payload.warehouseId,
          performedBy: 'SYSTEM_COMM_PROT',
        });
      }

      // 2. Generate Automated Payable Invoice (3-Way Matching)
      if (payload.poId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: payload.poId },
        });
        await tx.invoice.create({
          data: {
            invoiceNumber: `INV-PURCH-${payload.poId.slice(0, 8)}`,
            category: 'PAYABLE',
            poId: payload.poId,
            amountDue: po?.totalValue || 0,
            outstandingAmount: po?.totalValue || 0,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // 3. Log Audit
      await tx.stateTransitionLog.create({
        data: {
          entityType: 'WAREHOUSE_INBOUND',
          entityId: payload.inboundId,
          fromState: 'PENDING',
          toState: 'APPROVED',
          reason: 'COMM_PROT: AUTOMATED_STOCK_INCREASE',
        },
      });
    });
  }

  @OnEvent('scm.po.received')
  async handlePOReceived(payload: { poId: string; warehouseId: string }) {
    // Legacy placeholder
  }
}
