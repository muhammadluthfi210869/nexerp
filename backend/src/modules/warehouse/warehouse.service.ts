import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { ScmService } from '../scm/services/scm.service';
import { LifecycleStatus } from '@prisma/client';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { StockLedgerService } from './services/stock-ledger.service';
import { FinanceService } from '../finance/finance.service';

// LifecycleStatus replaced by LifecycleStatus

import { IdGeneratorService } from '../system/id-generator.service';

@Injectable()
export class WarehouseService {
  private statsCache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ScmService))
    private scmService: ScmService,
    @Inject(forwardRef(() => FinanceService))
    private financeService: FinanceService,
    private stockLedger: StockLedgerService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {
    // Phase 2: Start Watchdog on init or rely on cron
  }

  @OnEvent('production.schedule_completed')
  async handleProductionConsumption(payload: {
    scheduleId: string;
    materialsConsumed: { materialId: string; qty: number }[];
  }) {
    console.log(
      `[COMM_PROT] Warehouse RECEIVED event for Schedule ${payload.scheduleId}`,
    );
    console.log(`[COMM_PROT] Payload: ${JSON.stringify(payload)}`);

    const schedule = await this.prisma.productionSchedule.findUnique({
      where: { id: payload.scheduleId },
    });
    if (!schedule) return;

    await this.prisma.$transaction(async (tx) => {
      for (const item of payload.materialsConsumed) {
        // Find suitable batch (FIFO)
        const batch = await tx.materialInventory.findFirst({
          where: {
            materialId: item.materialId,
            currentStock: { gt: 0 },
            qcStatus: 'GOOD',
          },
          orderBy: { receivingDate: 'asc' },
        });

        /* 
        // Phase 4: Removed double-deduction. Handover already handled this.
        // If back-flushing is needed, ensure releaseMaterial is not called.
        if (batch) {
          await this.stockLedger.recordMovement(tx, {
            materialId: item.materialId,
            inventoryId: batch.id,
            type: 'OUTBOUND',
            quantity: item.qty,
            referenceNo: schedule.scheduleNumber,
            notes: `Auto-deduction for Schedule ${schedule.scheduleNumber} (COMM_PROT)`,
          });
        }
        */
      }

      // Update Audit Ledger with state transition
      await tx.stateTransitionLog.create({
        data: {
          entityType: 'PRODUCTION_SCHEDULE',
          entityId: schedule.id,
          fromState: 'IN_PROGRESS',
          toState: 'COMPLETED',
          reason:
            'COMM_PROT: Automated Stock Deduction Success (SYSTEM_PROTOCOL)',
        },
      });
    });
  }

  async getDashboardStats() {
    // World-Class Solution: In-Memory Caching for Macro Stats
    if (
      this.statsCache &&
      Date.now() - this.statsCache.timestamp < this.CACHE_TTL
    ) {
      return this.statsCache.data;
    }

    console.time('WarehouseDashboardStats');
    // Parallelize and use lean select/aggregations
    const [locations, inventoryStats, criticalLevels] = await Promise.all([
      this.prisma.warehouseLocation.findMany({
        select: { capacity: true, currentUsage: true },
      }),
      this.prisma.materialInventory.aggregate({
        _avg: { auditAccuracy: true },
      }),
      this.prisma.materialItem.count({
        where: { isCritical: true, minLevel: { gt: 0 } },
      }),
    ]);

    const totalCap = locations.reduce((sum, l) => sum + Number(l.capacity), 0);
    const usedCap = locations.reduce(
      (sum, l) => sum + Number(l.currentUsage),
      0,
    );
    const capacityUtility = totalCap > 0 ? (usedCap / totalCap) * 100 : 0;

    const result = {
      capacity: {
        utility: capacityUtility.toFixed(1),
        accuracy: inventoryStats._avg.auditAccuracy || 98.5,
        fifoScore: 9.8,
      },
      valuation: {
        total: '12.50',
        raw: '8.50',
        pack: '2.50',
        box: '1.00',
        label: '0.50',
      },
      turnover: {
        ratio: 14.2,
        health: 95,
      },
      risk: {
        deadStock: 142000000,
        criticalItems: criticalLevels,
        agingKarantina: 4.2,
      },
    };

    // Update cache
    this.statsCache = { data: result, timestamp: Date.now() };

    console.timeEnd('WarehouseDashboardStats');
    return result;
  }

  async getAuditGranular() {
    console.time('WarehouseAuditGranular');
    const [sensitiveMats, packMats, transactions] = await Promise.all([
      this.prisma.materialInventory.findMany({
        where: { material: { type: 'RAW_MATERIAL' } },
        include: {
          material: { select: { name: true, unit: true, unitPrice: true } },
        },
        take: 5,
        orderBy: { expDate: 'asc' },
      }),
      this.prisma.materialItem.findMany({
        where: { type: 'PACKAGING' },
        include: { inventories: { select: { currentStock: true } } },
        take: 5,
      }),
      this.prisma.inventoryTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { material: { select: { name: true } } },
      }),
    ]);

    const productivity = [
      { name: 'Budi Santoso', points: 420, batch: '14 Batch', rank: 1 },
      { name: 'Siti Aminah', points: 380, batch: '12 Batch', rank: 2 },
      { name: 'Agus Setiawan', points: 310, batch: '10 Batch', rank: 3 },
    ];

    const topRaw = sensitiveMats.map((m) => ({
      name: m.material.name,
      usage: '1,200 Kg',
      value: ((Number(m.material.unitPrice) * 1.2) / 1000000).toFixed(1) + 'M',
    }));

    const topPack = packMats.map((p) => ({
      name: p.name,
      usage: '45,000 Pcs',
      value: '25.5M',
    }));

    const result = {
      jalurA: { inbound: 2, karantina: 0, velocity: 8.4 },
      jalurB: { reqProd: 0, picking: 4, handover: 0, velocity: 4.2 },
      jalurC: { orderProc: 10, shipping: 0, delivered: 0, velocity: 9.1 },
      sensitiveMaterials: sensitiveMats.map((inv) => ({
        name: inv.material.name,
        date: inv.expDate?.toLocaleDateString() || 'N/A',
        status: inv.qcStatus === 'GOOD' ? 'FEFO_OK' : 'NEEDS_QC',
        qty: `${inv.currentStock} ${inv.material.unit}`,
      })),
      packagingStocks: packMats.map((item) => {
        const total = item.inventories.reduce(
          (s, i) => s + Number(i.currentStock),
          0,
        );
        return {
          name: item.name,
          qty: `${total} Pcs`,
          status: total < 1000 ? 'LOW_STOCK' : 'STABLE',
        };
      }),
      soFulfillment: [
        {
          client: 'PT. GlowUp',
          so: 'SO-2026-001',
          qty: '5,000 / 6,000 Pcs',
          status: 'PARSIAL',
          progress: 83,
          var: -1000,
        },
        {
          client: 'CLIENT_B',
          so: 'SO-2026-002',
          qty: '2000 / 2000 Pcs',
          status: 'FULL',
          progress: 100,
          var: 0,
        },
      ],
      riskLoss: [
        {
          item: 'Serum Vitamin C',
          source: 'Batch #202',
          detail: 'Degradasi Suhu',
          impact: 'Rp 45M',
          loss: '250 Unit',
          action: 'DISPOSAL',
        },
        {
          item: 'Botol PET 100ml',
          source: 'Vendor X',
          detail: 'Defect Cetak',
          impact: 'Rp 12M',
          loss: '5,000 Pcs',
          action: 'RETURN',
        },
      ],
      topRaw,
      topPack,
      productivity,
      recentLogs: transactions.map((t) => ({
        id: t.id,
        item: t.material.name,
        type: t.type,
        qty: t.quantity,
        time: t.createdAt,
      })),
    };
    console.timeEnd('WarehouseAuditGranular');
    return result;
  }

  async getCatalog() {
    return this.prisma.materialItem.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        inventories: {
          select: {
            currentStock: true,
            qcStatus: true,
          },
        },
        valuations: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getTransactionHistory(materialId: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: { materialId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async receiveGoods(data: {
    materialId: string;
    supplierId: string;
    batchNumber: string;
    quantity: number;
    expDate?: Date;
    locationId?: string;
    notes?: string;
    performedBy?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the inventory record
      const inventory = await tx.materialInventory.create({
        data: {
          materialId: data.materialId,
          supplierId: data.supplierId,
          batchNumber: data.batchNumber,
          currentStock: data.quantity,
          expDate: data.expDate ? new Date(data.expDate) : null,
          locationId: data.locationId,
          notes: data.notes,
          receivingDate: new Date(),
        },
      });

      // Phase 2: Capture Snapshot Value for HPP
      const valuation = await tx.materialValuation.findFirst({
        where: { materialId: data.materialId },
        orderBy: { date: 'desc' },
      });
      const mat = await tx.materialItem.findUnique({
        where: { id: data.materialId },
      });
      const snapshotValue =
        valuation?.movingAveragePrice || mat?.unitPrice || 0;

      // 2. Log the transaction with Snapshot Value and Batch Link
      await tx.inventoryTransaction.create({
        data: {
          materialId: data.materialId,
          inventoryId: inventory.id,
          type: 'INBOUND',
          quantity: data.quantity,
          notes: data.notes,
          destLocId: data.locationId,
          performedBy: data.performedBy,
          unitValueAtTransaction: snapshotValue,
        },
      });

      // 3. Update MaterialItem cache
      await tx.materialItem.update({
        where: { id: data.materialId },
        data: { stockQty: { increment: data.quantity } },
      });

      return inventory;
    });
  }

  async getSuggestedBatch(materialId: string) {
    const material = await this.prisma.materialItem.findUnique({
      where: { id: materialId },
      select: { outMethod: true, name: true },
    });

    if (!material) throw new NotFoundException('Material not found');

    const orderBy: any[] = [];
    if (material.outMethod === 'FEFO') {
      orderBy.push({ expDate: 'asc' });
    } else {
      orderBy.push({ lastRestock: 'asc' });
    }

    const batch = await this.prisma.materialInventory.findFirst({
      where: {
        materialId,
        currentStock: { gt: 0 },
        qcStatus: 'GOOD', // Quarantine Gate: Only suggest GOOD stock
      },
      orderBy,
      include: { location: true, supplier: true },
    });

    return {
      materialName: material.name,
      outMethod: material.outMethod,
      suggestedBatch: batch,
    };
  }

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

  async approveOpname(opnameId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.findUnique({
        where: { id: opnameId },
        include: { items: { include: { material: true } } },
      });

      if (!opname) throw new NotFoundException('Stock Opname not found');
      if (opname.status !== 'DRAFT')
        throw new BadRequestException('Opname already processed');

      let totalLossValue = 0;
      const items = (opname as any).items || [];
      for (const item of items) {
        const diff = Number(item.actualQty) - Number(item.systemQty);
        if (diff < 0) {
          totalLossValue += Math.abs(diff) * Number(item.material.unitPrice);
        }
      }

      // Threshold Approval: Rp 500.000
      const THRESHOLD = 500000;
      if (totalLossValue > THRESHOLD && opname.approvalStatus !== 'APPROVED') {
        await tx.stockOpname.update({
          where: { id: opnameId },
          data: {
            approvalStatus: 'WAITING',
            totalLossValue,
            notes: `${opname.notes || ''} [SYSTEM: High loss value detected. Requires management approval.]`,
          },
        });
        return { status: 'PENDING_APPROVAL', lossValue: totalLossValue };
      }

      // Execute adjustment
      for (const item of items) {
        const diff = Number(item.actualQty) - Number(item.systemQty);
        if (diff !== 0) {
          // Find first available batch for adjustment or a specific one if added to schema
          // For simplicity, adjust MaterialItem stock and create transaction
          await tx.materialItem.update({
            where: { id: item.materialId },
            data: { stockQty: { increment: diff } },
          });

          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              type: 'ADJUSTMENT',
              quantity: Math.abs(diff),
              notes: `Stock Opname ${opnameId}`,
              performedBy: userId,
            },
          });
        }
      }

      const updated = await tx.stockOpname.update({
        where: { id: opnameId },
        data: {
          status: 'COMPLETED',
          approvalStatus: 'APPROVED',
          totalLossValue,
        },
      });

      // Automated Journaling for Finance Integration (Phase 4)
      if (totalLossValue > 0) {
        await this.financeService.createInventoryAdjustmentJournal({
          opnameId: opname.id,
          totalLossValue,
          notes: opname.notes || 'Routine Audit',
        });
      }

      this.eventEmitter.emit('activity.logged', {
        action: 'OPNAME_APPROVED',
        entityType: 'StockOpname',
        entityId: opnameId,
        detail: `Opname ${opname.opnameNumber} approved. Loss: Rp ${totalLossValue.toLocaleString()}`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.opname.approved', {
        opnameId,
        opnameNumber: opname.opnameNumber,
        totalLossValue,
      });

      return updated;
    });
  }

  async releaseMaterial(workOrderId: string) {
    // [Existing releaseMaterial logic remains same]
    // ...
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
        await this.financeService.createMaterialHandoverJournal({
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

      return result;
    });
  }

  async getLocations() {
    return this.prisma.warehouseLocation.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateBatchStatus(id: string, status: any, userId: string) {
    const batch = await this.prisma.materialInventory.findUnique({
      where: { id },
    });
    if (!batch) throw new BadRequestException('Batch not found');

    const updated = await this.prisma.materialInventory.update({
      where: { id },
      data: {
        qcStatus: status,
        notes: `${batch.notes || ''}\n[QC_RELEASE] Status changed to ${status} by ${userId} at ${new Date().toISOString()}`,
      },
    });

    this.eventEmitter.emit('activity.logged', {
      action: 'BATCH_STATUS_CHANGED',
      entityType: 'MaterialInventory',
      entityId: id,
      detail: `Batch ${batch.batchNumber} status changed to ${status}`,
      senderDivision: 'WAREHOUSE',
    });
    this.eventEmitter.emit('warehouse.batch.status_changed', {
      inventoryId: id,
      batchNumber: batch.batchNumber,
      newStatus: status,
      materialId: batch.materialId,
    });

    return updated;
  }

  async checkHoldThresholds() {
    const now = new Date();
    // 1. Fetch all active batches in non-GOOD status or just all batches to be safe
    const batches = await this.prisma.materialInventory.findMany({
      where: { currentStock: { gt: 0 } },
      include: { material: true },
    });

    const anomalies = [];

    for (const batch of batches) {
      const maxHours = batch.material.maxHoldHours || 72;
      if (!batch.receivingDate) continue;
      const holdTimeMs = now.getTime() - batch.receivingDate.getTime();
      const holdHours = holdTimeMs / (1000 * 60 * 60);

      if (holdHours > maxHours) {
        anomalies.push({
          batchNumber: batch.batchNumber,
          material: batch.material.name,
          holdHours: Math.round(holdHours),
          limit: maxHours,
          risk:
            holdHours > maxHours * 1.5 ? 'CRITICAL_SPOILAGE' : 'WARNING_SLA',
        });

        // Auto-tag in notes for audit
        if (
          holdHours > maxHours * 1.2 &&
          !batch.notes?.includes('CRITICAL_HOLD')
        ) {
          await this.prisma.materialInventory.update({
            where: { id: batch.id },
            data: {
              notes: `${batch.notes || ''} [SYSTEM_ALERT: CRITICAL_HOLD_SLA_BREACH]`,
            },
          });
        }
      }
    }

    return {
      timestamp: now,
      anomaliesCount: anomalies.length,
      anomalies,
    };
  }

  /**
   * Phase 2: Stock Watchdog - Synchronizes the stockQty cache with Transaction reality.
   * Ensures "Denormalization Integrity".
   */
  async syncStockCache(materialId: string) {
    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: { materialId },
    });

    const calculatedStock = transactions.reduce((acc, t) => {
      if (['INBOUND', 'ADJUSTMENT', 'RETURN'].includes(t.type)) {
        return acc + Number(t.quantity);
      } else if (['OUTBOUND', 'DISPOSAL'].includes(t.type)) {
        return acc - Number(t.quantity);
      }
      return acc;
    }, 0);

    await this.prisma.materialItem.update({
      where: { id: materialId },
      data: { stockQty: calculatedStock },
    });

    return calculatedStock;
  }

  // === PHASE 2: Transfer Order Execution ===

  async createTransferOrder(data: {
    sourceWarehouseId: string;
    destWarehouseId: string;
    items: { materialId: string; qty: number }[];
    notes?: string;
    createdById?: string;
  }) {
    if (data.sourceWarehouseId === data.destWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouse cannot be the same.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Validate stock availability at source
      for (const item of data.items) {
        const material = await tx.materialItem.findUnique({
          where: { id: item.materialId },
          select: { stockQty: true, name: true },
        });
        if (!material)
          throw new NotFoundException(`Material ${item.materialId} not found`);
        if (Number(material.stockQty) < item.qty) {
          throw new BadRequestException(
            `Insufficient stock for ${material.name} at source warehouse. Available: ${material.stockQty}, Requested: ${item.qty}`,
          );
        }
      }

      // Generate transfer number
      const transferNumber = await this.idGenerator.generateId('TRF');

      const transfer = await tx.transferOrder.create({
        data: {
          transferNumber,
          sourceWarehouseId: data.sourceWarehouseId,
          destWarehouseId: data.destWarehouseId,
          notes: data.notes,
          createdById: data.createdById,
          status: 'PENDING',
          items: {
            create: data.items.map((i) => ({
              materialId: i.materialId,
              qty: i.qty,
            })),
          },
        },
        include: { items: { include: { material: true } } },
      });

      this.eventEmitter.emit('activity.logged', {
        action: 'TRANSFER_ORDER_CREATED',
        entityType: 'TransferOrder',
        entityId: transfer.id,
        detail: `Transfer ${transferNumber} from warehouse ${data.sourceWarehouseId} to ${data.destWarehouseId}`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.transfer.created', {
        transferId: transfer.id,
        transferNumber,
        itemsCount: data.items.length,
      });

      return transfer;
    });
  }

  async executeTransferOrder(transferId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.transferOrder.findUnique({
        where: { id: transferId },
        include: { items: { include: { material: true } } },
      });

      if (!transfer) throw new NotFoundException('Transfer Order not found');
      if (transfer.status !== 'PENDING')
        throw new BadRequestException('Transfer already processed');

      // Execute stock movement
      for (const item of transfer.items) {
        // Decrement at source
        await tx.materialItem.update({
          where: { id: item.materialId },
          data: { stockQty: { decrement: item.qty } },
        });

        // Log outbound from source
        await tx.inventoryTransaction.create({
          data: {
            materialId: item.materialId,
            type: 'OUTBOUND',
            quantity: item.qty,
            referenceNo: transfer.transferNumber,
            warehouseId: transfer.sourceWarehouseId,
            performedBy: userId,
            notes: `TRANSFER_OUT to ${transfer.destWarehouseId}`,
          },
        });

        // Increment at destination
        await tx.materialItem.update({
          where: { id: item.materialId },
          data: { stockQty: { increment: item.qty } },
        });

        // Log inbound at destination
        await tx.inventoryTransaction.create({
          data: {
            materialId: item.materialId,
            type: 'INBOUND',
            quantity: item.qty,
            referenceNo: transfer.transferNumber,
            warehouseId: transfer.destWarehouseId,
            performedBy: userId,
            notes: `TRANSFER_IN from ${transfer.sourceWarehouseId}`,
          },
        });
      }

      const updated = await tx.transferOrder.update({
        where: { id: transferId },
        data: { status: 'COMPLETED' },
      });

      this.eventEmitter.emit('activity.logged', {
        action: 'TRANSFER_ORDER_EXECUTED',
        entityType: 'TransferOrder',
        entityId: transferId,
        detail: `Transfer ${transfer.transferNumber} executed by ${userId}`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.transfer.executed', {
        transferId,
        transferNumber: transfer.transferNumber,
      });

      return updated;
    });
  }

  async getTransferOrders() {
    return this.prisma.transferOrder.findMany({
      include: {
        items: { include: { material: true } },
        sourceWarehouse: true,
        destWarehouse: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  // === PHASE 2: Stock Opname with PIN Approval ===

  async createOpname(data: {
    warehouseId: string;
    picId: string;
    notes?: string;
    items: { materialId: string; systemQty: number; actualQty: number }[];
  }) {
    const opnameNumber = await this.idGenerator.generateId('OPN');

    const opname = await this.prisma.stockOpname.create({
      data: {
        opnameNumber,
        warehouseId: data.warehouseId,
        picId: data.picId,
        notes: data.notes,
        items: {
          create: data.items.map((i) => ({
            materialId: i.materialId,
            systemQty: i.systemQty,
            actualQty: i.actualQty,
            difference: i.actualQty - i.systemQty,
          })),
        },
      },
      include: { items: { include: { material: true } } },
    });

    this.eventEmitter.emit('activity.logged', {
      action: 'OPNAME_CREATED',
      entityType: 'StockOpname',
      entityId: opname.id,
      detail: `Opname ${opnameNumber} created with ${data.items.length} items`,
      senderDivision: 'WAREHOUSE',
    });
    this.eventEmitter.emit('warehouse.opname.created', {
      opnameId: opname.id,
      opnameNumber,
      warehouseId: data.warehouseId,
    });

    return opname;
  }

  async approveOpnameWithPin(opnameId: string, userId: string, pin: string) {
    // Validate Manager PIN
    const manager = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { managerPin: true, roles: true },
    });

    if (!manager || !manager.managerPin) {
      throw new BadRequestException('User has no escalation PIN configured.');
    }

    if (manager.managerPin !== pin) {
      throw new BadRequestException('Invalid escalation PIN.');
    }

    // Update opname with approval metadata
    await this.prisma.stockOpname.update({
      where: { id: opnameId },
      data: {
        approvalStatus: 'APPROVED',
        approvedById: userId,
        approvalPin: '***VERIFIED***', // Do not store plain PIN
      },
    });

    // Delegate to existing approval logic
    return this.approveOpname(opnameId, userId);
  }

  async getOpnames() {
    return this.prisma.stockOpname.findMany({
      include: {
        items: { include: { material: true } },
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // === PHASE 1: Warehouse Inbounds ===

  async getInbounds() {
    return this.prisma.warehouseInbound.findMany({
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true } },
          },
        },
        po: {
          select: {
            id: true,
            poNumber: true,
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async createInbound(data: {
    poId?: string;
    warehouseId?: string;
    receivedAt?: string;
    items: {
      materialId: string;
      quantity: number;
      batchNumber: string;
      expiryDate?: string;
    }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      let warehouseId = data.warehouseId;
      if (!warehouseId) {
        const firstWh = await tx.warehouse.findFirst({
          select: { id: true },
          where: { status: 'ACTIVE' },
        });
        warehouseId = firstWh?.id || '00000000-0000-0000-0000-000000000000';
      }
      const inboundNumber = await this.idGenerator.generateId('GRN');
      const inbound = await tx.warehouseInbound.create({
        data: {
          inboundNumber,
          poId: data.poId,
          status: 'APPROVED',
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
          warehouseId,
          items: {
            create: data.items.map((item) => ({
              materialId: item.materialId,
              qtyActual: item.quantity,
              isQuarantine: true,
            })),
          },
        },
        include: {
          items: {
            include: { material: { select: { name: true, unit: true } } },
          },
          po: { select: { poNumber: true } },
        },
      });

      for (const item of data.items) {
        await this.receiveGoods({
          materialId: item.materialId,
          supplierId: '00000000-0000-0000-0000-000000000000',
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          expDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
          notes: `Inbound via GRN ${inboundNumber}`,
          performedBy: 'WAREHOUSE_SYSTEM',
        });
      }

      this.eventEmitter.emit('activity.logged', {
        action: 'WAREHOUSE_INBOUND',
        entityType: 'Inbound',
        entityId: inbound.id,
        detail: `Inbound ${inboundNumber} created with ${data.items.length} items`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.inbound.received', {
        inboundId: inbound.id,
        inboundNumber,
        poId: data.poId,
        itemsCount: data.items.length,
      });

      this.eventEmitter.emit('INBOUND_COMPLETED', {
        referenceId: inbound.id,
        metadata: {
          inboundNumber,
          poId: data.poId,
          itemsCount: data.items.length,
        },
      });

      return inbound;
    });
  }

  // === PHASE 1: Stock Adjustments ===

  async getAdjustments() {
    const adjustments = await this.prisma.stockAdjustment.findMany({
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true } },
          },
        },
        warehouse: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return adjustments.map((adj) => ({
      id: adj.id,
      adjNumber: `ADJ-${adj.id.slice(0, 8).toUpperCase()}`,
      materialName: adj.items[0]?.material?.name || 'Unknown',
      type: adj.type === 'IN' ? 'CORRECTION' : 'WRITE_OFF',
      qty:
        adj.type === 'IN'
          ? Number(adj.items[0]?.qty || 0)
          : -Math.abs(Number(adj.items[0]?.qty || 0)),
      unit: adj.items[0]?.material?.unit || '',
      status: adj.notes?.includes('[APPROVED]')
        ? 'APPROVED'
        : adj.notes?.includes('[REJECTED]')
          ? 'REJECTED'
          : 'PENDING',
      warehouseName: adj.warehouse?.name || 'Unknown',
      notes: adj.notes?.replace(/\[APPROVED\]|\[REJECTED\]/g, '').trim() || '',
      date: adj.date.toISOString().split('T')[0],
    }));
  }

  async createAdjustment(data: {
    materialId: string;
    type: 'WRITE_OFF' | 'CORRECTION' | 'DISPOSAL';
    qty: number;
    warehouseId: string;
    notes?: string;
  }) {
    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        type:
          data.type === 'WRITE_OFF' || data.type === 'DISPOSAL' ? 'OUT' : 'IN',
        warehouseId: data.warehouseId,
        accountId:
          data.type === 'DISPOSAL'
            ? '00000000-0000-0000-0000-000000000001'
            : '00000000-0000-0000-0000-000000000002',
        notes: data.notes || '',
        date: new Date(),
        items: {
          create: {
            materialId: data.materialId,
            qty: Math.abs(data.qty),
          },
        },
      },
      include: {
        items: {
          include: { material: { select: { name: true, unit: true } } },
        },
        warehouse: { select: { name: true } },
      },
    });

    this.eventEmitter.emit('warehouse.adjustment.created', {
      adjustmentId: adjustment.id,
      type: data.type,
      qty: Math.abs(data.qty),
      materialId: data.materialId,
    });
    this.eventEmitter.emit('activity.logged', {
      action: 'STOCK_ADJUSTMENT_CREATED',
      entityType: 'StockAdjustment',
      entityId: adjustment.id,
      detail: `Adjustment ${data.type} for ${Math.abs(data.qty)} units`,
      senderDivision: 'WAREHOUSE',
    });

    return adjustment;
  }

  async approveAdjustment(id: string, status: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const adj = await tx.stockAdjustment.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!adj) throw new NotFoundException('Adjustment not found');

      const notes = adj.notes
        ? `${adj.notes} [${status === 'APPROVED' ? 'APPROVED' : 'REJECTED'}]`
        : `[${status === 'APPROVED' ? 'APPROVED' : 'REJECTED'}]`;

      const updated = await tx.stockAdjustment.update({
        where: { id },
        data: { notes },
      });

      if (status === 'APPROVED') {
        for (const item of adj.items) {
          const qtyNum = Number(item.qty);
          const qtyChange = adj.type === 'IN' ? qtyNum : -qtyNum;
          await tx.materialItem.update({
            where: { id: item.materialId },
            data: { stockQty: { increment: qtyChange } },
          });
          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              type: 'ADJUSTMENT',
              quantity: Math.abs(qtyNum),
              referenceNo: `ADJ-${id.slice(0, 8)}`,
              performedBy: userId,
              notes:
                adj.type === 'IN'
                  ? 'Stock adjustment IN (approved)'
                  : 'Stock adjustment OUT (approved)',
            },
          });
        }

        this.eventEmitter.emit('warehouse.stock.adjusted', {
          adjustmentId: id,
          type: adj.type,
          itemsCount: adj.items.length,
          performedBy: userId,
        });
        this.eventEmitter.emit('warehouse.adjustment.approved', {
          adjustmentId: id,
          type: adj.type,
          performedBy: userId,
        });
      }

      this.eventEmitter.emit('activity.logged', {
        action: `STOCK_ADJUSTMENT_${status}`,
        entityType: 'StockAdjustment',
        entityId: id,
        detail: `Adjustment ${status} by ${userId}`,
        senderDivision: 'WAREHOUSE',
      });

      return updated;
    });
  }

  // === PHASE 1: Release Requests ===

  async getReleaseRequests() {
    const requisitions = await this.prisma.materialRequisition.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      include: {
        material: { select: { name: true, unit: true } },
        workOrder: {
          select: {
            id: true,
            woNumber: true,
            stage: true,
            lead: { select: { brandName: true, clientName: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
      take: 50,
    });

    const grouped = new Map<string, any>();
    for (const req of requisitions) {
      const key = req.workOrder?.id || req.woId || req.id;
      if (!grouped.has(key)) {
        const woNumber =
          req.workOrder?.woNumber || `WO-${key.slice(0, 8).toUpperCase()}`;
        grouped.set(key, {
          id: key,
          relNumber: `REL-${key.slice(0, 4).toUpperCase()}`,
          woNumber,
          productName: req.workOrder?.lead?.brandName || 'Unknown Product',
          requester: 'PRODUCTION',
          date: new Date().toISOString().split('T')[0],
          status: 'WAITING' as const,
          itemsCount: 0,
          materials: [],
        });
      }
      const group = grouped.get(key);
      group.itemsCount++;
      group.materials.push({
        name: req.material?.name || 'Unknown',
        requested: `${req.qtyRequested} ${req.material?.unit || ''}`,
        available: `${req.qtyRequested} ${req.material?.unit || ''}`,
        status: 'OK' as const,
      });
    }

    return Array.from(grouped.values()).slice(0, 10);
  }

  // === PHASE 1: Cross-Module Event Listeners ===

  @OnEvent('scm.inbound.received')
  async handleScmInboundReceived(payload: {
    inboundId: string;
    poNumber: string;
    itemsCount: number;
  }) {
    console.log(
      `[WAREHOUSE] SCM inbound received: ${payload.poNumber} (${payload.itemsCount} items)`,
    );
    this.statsCache = null;
  }

  @OnEvent('production.material.returned')
  async handleProductionMaterialReturn(payload: {
    workOrderId: string;
    materialId: string;
    qtyReturned: number;
  }) {
    console.log(
      `[WAREHOUSE] Production material return: ${payload.materialId} x ${payload.qtyReturned}`,
    );
    await this.prisma.materialItem.update({
      where: { id: payload.materialId },
      data: { stockQty: { increment: payload.qtyReturned } },
    });
    await this.prisma.inventoryTransaction.create({
      data: {
        materialId: payload.materialId,
        type: 'RETURN',
        quantity: payload.qtyReturned,
        referenceNo: `RET-PROD-${payload.workOrderId.slice(0, 8)}`,
        performedBy: 'SYSTEM_PRODUCTION',
        notes: 'Material returned from production',
      },
    });
    this.eventEmitter.emit('activity.logged', {
      action: 'MATERIAL_RETURNED_FROM_PRODUCTION',
      entityType: 'InventoryTransaction',
      entityId: payload.materialId,
      detail: `${payload.qtyReturned} units returned from WO ${payload.workOrderId}`,
      senderDivision: 'WAREHOUSE',
    });
  }

  /**
   * PHASE 4: Warehouse Capacity Readiness Check
   * Triggered when a Lead passes Financial Gate 2
   */
  async checkCapacityForNewDeal(leadId: string) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: leadId },
      select: { moq: true, clientName: true, brandName: true },
    });

    if (!lead) return { status: 'ERROR', message: 'Lead not found' };

    const stats = await this.getDashboardStats();
    const currentUtility = Number(stats.capacity.utility);

    if (currentUtility > 90) {
      return {
        status: 'CRITICAL',
        utility: currentUtility,
        message: `WAREHOUSE ALERT: Capacity is at ${currentUtility}%. Incoming order for ${lead.brandName} (${lead.moq} pcs) may cause overflow.`,
      };
    }

    if (currentUtility > 75) {
      return {
        status: 'WARNING',
        utility: currentUtility,
        message: `WAREHOUSE WARNING: Capacity is at ${currentUtility}%. Monitoring required for ${lead.brandName} production.`,
      };
    }

    return { status: 'OK', utility: currentUtility };
  }
}
