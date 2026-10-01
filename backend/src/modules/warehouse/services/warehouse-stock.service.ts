import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { Division, StreamEventType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';
import { logBestEffort } from '../../../common/helpers/best-effort';

@Injectable()
export class WarehouseStockService {
  private readonly logger = new Logger(WarehouseStockService.name);
  private statsCache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==========================================
  // Catalog & Locations
  // ==========================================

  async getCatalog(warehouseId?: string) {
    const where: any = { deletedAt: null };
    if (warehouseId) {
      where.inventories = {
        some: {
          location: {
            warehouseId,
          },
        },
      };
    }
    return this.prisma.materialItem.findMany({
      where,
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

  async getActiveWarehouses() {
    return this.prisma.warehouse.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async getLocations() {
    return this.prisma.warehouseLocation.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateBatchStatus(id: string, status: any, userId: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id))
      throw new BadRequestException('Invalid batch ID format');

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

  async assertWarehouseAccess(
    userId: string,
    warehouseId: string,
    permission: 'canRead' | 'canWrite' | 'canApprove' = 'canWrite',
  ) {
    if (!userId || !warehouseId) return true;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (
      user &&
      (user.roles.includes('SUPER_ADMIN' as any) ||
        user.roles.includes('ADMIN' as any))
    ) {
      return true;
    }

    const access = await this.prisma.warehouseAccess.findUnique({
      where: {
        userId_warehouseId: {
          userId,
          warehouseId,
        },
      },
    });

    if (!access || !access[permission]) {
      throw new ForbiddenException('WAREHOUSE_ACCESS_DENIED');
    }
    return true;
  }

  // ==========================================
  // Transactions & Dashboard Stats
  // ==========================================

  async getDashboardStats() {
    if (
      this.statsCache &&
      Date.now() - this.statsCache.timestamp < this.CACHE_TTL
    ) {
      return this.statsCache.data;
    }

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      locations,
      activeMaterials,
      outboundTransactions,
      inventoryAgg,
      quarantineBatches,
    ] = await Promise.all([
      this.prisma.warehouseLocation.findMany({
        select: { capacity: true, currentUsage: true },
      }),
      this.prisma.materialItem.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        select: {
          id: true,
          type: true,
          stockQty: true,
          unitPrice: true,
          minLevel: true,
          isCritical: true,
          valuations: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { movingAveragePrice: true },
          },
        },
      }),
      this.prisma.inventoryTransaction.findMany({
        where: { type: 'OUTBOUND', createdAt: { gte: ninetyDaysAgo } },
        select: {
          materialId: true,
          quantity: true,
          unitValueAtTransaction: true,
        },
      }),
      this.prisma.materialInventory.aggregate({
        _avg: { auditAccuracy: true },
      }),
      this.prisma.materialInventory.findMany({
        where: { qcStatus: 'QUARANTINE', currentStock: { gt: 0 } },
        select: { receivingDate: true, currentStock: true },
      }),
    ]);

    const totalCap = locations.reduce((s, l) => s + Number(l.capacity), 0);
    const usedCap = locations.reduce((s, l) => s + Number(l.currentUsage), 0);
    const capacityUtility = totalCap > 0 ? (usedCap / totalCap) * 100 : 0;

    // Real valuation by type
    const valuationByType: Record<string, number> = {};
    let totalValuation = 0;
    let criticalCount = 0;
    for (const m of activeMaterials) {
      const price = Number(
        m.valuations?.[0]?.movingAveragePrice || m.unitPrice || 0,
      );
      const value = Number(m.stockQty) * price;
      const type = m.type.toLowerCase();
      valuationByType[type] = (valuationByType[type] || 0) + value;
      totalValuation += value;
      if (Number(m.stockQty) < Number(m.minLevel)) criticalCount++;
    }

    // Turnover: COGS from OUTBOUND / avg inventory value
    const totalCogs = outboundTransactions.reduce(
      (s, t) => s + Number(t.quantity) * Number(t.unitValueAtTransaction || 0),
      0,
    );
    const avgInventory =
      activeMaterials.length > 0 ? totalValuation / activeMaterials.length : 1;
    const turnoverRatio = avgInventory > 0 ? totalCogs / avgInventory : 0;

    // Dead stock estimate: items with no OUTBOUND in 90 days
    const movedMaterialIds = new Set(
      outboundTransactions.map((t) => t.materialId),
    );
    const deadStockItems = activeMaterials.filter(
      (m) => !movedMaterialIds.has(m.id),
    );
    const deadStockValue = deadStockItems.reduce((s, m) => {
      const price = Number(
        m.valuations?.[0]?.movingAveragePrice || m.unitPrice || 0,
      );
      return s + Number(m.stockQty) * price;
    }, 0);

    // Aging karantina
    const avgAging =
      quarantineBatches.length > 0
        ? quarantineBatches.reduce((s, b) => {
            const days = b.receivingDate
              ? (now.getTime() - b.receivingDate.getTime()) /
                (1000 * 60 * 60 * 24)
              : 0;
            return s + days;
          }, 0) / quarantineBatches.length
        : 0;

    // Health score composite (simplified real calculation)
    const accuracy = Number(inventoryAgg._avg.auditAccuracy || 0) / 100;
    const turnoverHealth = Math.min(turnoverRatio / 12, 1);
    const criticalHealth =
      criticalCount > 0
        ? Math.max(0, 1 - criticalCount / activeMaterials.length)
        : 1;
    const healthScore = Math.round(
      (accuracy * 0.4 + turnoverHealth * 0.3 + criticalHealth * 0.3) * 100,
    );

    const result = {
      capacity: {
        utility: capacityUtility.toFixed(1),
        accuracy: Number(inventoryAgg._avg.auditAccuracy || 0),
        fifoScore: Math.min(10, parseFloat((accuracy * 10).toFixed(1))),
      },
      valuation: {
        total: (totalValuation / 1e9).toFixed(2),
        raw: ((valuationByType['raw_material'] || 0) / 1e9).toFixed(2),
        pack: ((valuationByType['packaging'] || 0) / 1e9).toFixed(2),
        box: ((valuationByType['box'] || 0) / 1e9).toFixed(2),
        label: ((valuationByType['label'] || 0) / 1e9).toFixed(2),
      },
      turnover: {
        ratio: parseFloat(turnoverRatio.toFixed(1)),
        health: healthScore,
      },
      risk: {
        deadStock: Math.round(deadStockValue),
        criticalItems: criticalCount,
        agingKarantina: parseFloat(avgAging.toFixed(1)),
      },
    };

    this.statsCache = { data: result, timestamp: Date.now() };
    return result;
  }

  async getAuditGranular() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      inbounds,
      quarantinedBatches,
      rawMaterials,
      packagingItems,
      recentTransactions,
      outboundCount,
      requisitionCount,
      productionLogs,
    ] = await Promise.all([
      this.prisma.warehouseInbound.count({
        where: { receivedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.materialInventory.count({
        where: { qcStatus: 'QUARANTINE', currentStock: { gt: 0 } },
      }),
      this.prisma.materialInventory.findMany({
        where: { material: { type: 'RAW_MATERIAL' }, currentStock: { gt: 0 } },
        include: {
          material: { select: { name: true, unit: true, unitPrice: true } },
        },
        take: 10,
        orderBy: { expDate: 'asc' },
      }),
      this.prisma.materialItem.findMany({
        where: { type: 'PACKAGING', deletedAt: null },
        include: { inventories: { select: { currentStock: true } } },
        take: 10,
      }),
      this.prisma.inventoryTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { material: { select: { name: true } } },
      }),
      this.prisma.inventoryTransaction.count({
        where: { type: 'OUTBOUND', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.materialRequisition.count(),
      this.prisma.productionLog.findMany({
        where: { loggedAt: { gte: thirtyDaysAgo } },
        select: {
          goodQty: true,
          rejectQty: true,
          workOrder: { select: { woNumber: true } },
        },
        take: 50,
      }),
    ]);

    // Top 5 Raw Materials by stock value
    const topRaw = rawMaterials.slice(0, 5).map((inv) => ({
      name: inv.material.name,
      usage: `${Number(inv.currentStock).toLocaleString()} ${inv.material.unit}`,
      value:
        'Rp ' +
        (
          (Number(inv.currentStock) * Number(inv.material.unitPrice)) /
          1e6
        ).toFixed(1) +
        'M',
    }));

    // Packaging stock status
    const packStocks = packagingItems.slice(0, 5).map((item) => {
      const total = item.inventories.reduce(
        (s, i) => s + Number(i.currentStock),
        0,
      );
      return {
        name: item.name,
        qty: `${total.toLocaleString()} Pcs`,
        status:
          total < 1000 ? 'LOW_STOCK' : total < 5000 ? 'STABLE' : 'OVERSTOCK',
      };
    });

    // Sensitive materials with FEFO status
    const sensitiveMats = rawMaterials.slice(0, 5).map((inv) => {
      const expDays = inv.expDate
        ? Math.round(
            (inv.expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 999;
      let status = 'FEFO_OK';
      if (inv.qcStatus !== 'GOOD') status = 'NEEDS_QC';
      else if (expDays < 30) status = 'EXPIRING_SOON';
      else if (expDays < 90) status = 'WATCH';
      return {
        name: inv.material.name,
        date: inv.expDate?.toLocaleDateString() || 'N/A',
        status,
        qty: `${inv.currentStock} ${inv.material.unit}`,
      };
    });

    // Productivity from production logs
    const productivity = productionLogs
      .filter((l) => l.workOrder?.woNumber)
      .reduce((acc: any[], log) => {
        const key = log.workOrder?.woNumber || 'unknown';
        const existing = acc.find((a) => a.name === key);
        if (existing) {
          existing.points += Number(log.goodQty);
          existing.batchCount++;
        } else {
          acc.push({
            name: key,
            points: Number(log.goodQty),
            batchCount: 1,
          });
        }
        return acc;
      }, [])
      .sort((a: any, b: any) => b.points - a.points)
      .slice(0, 5)
      .map((item: any, idx: number) => ({
        name: `WO ${item.name}`,
        points: item.points,
        batch: `${item.batchCount} Batch`,
        rank: idx + 1,
      }));

    // Velocity scores (simplified real calculation)
    const inboundVelocity =
      inbounds > 0 ? Math.min(10, (inbounds / 30) * 10) : 0;
    const internalVelocity =
      outboundCount > 0 ? Math.min(10, (outboundCount / 30) * 10) : 0;

    const result = {
      jalurA: {
        inbound: inbounds,
        karantina: quarantinedBatches,
        velocity: parseFloat(inboundVelocity.toFixed(1)),
      },
      jalurB: {
        reqProd: requisitionCount,
        picking: outboundCount,
        handover: 0,
        velocity: parseFloat(internalVelocity.toFixed(1)),
      },
      jalurC: { orderProc: 0, shipping: 0, delivered: 0, velocity: 0 },
      sensitiveMaterials: sensitiveMats,
      packagingStocks: packStocks,
      soFulfillment: [],
      riskLoss: [],
      topRaw,
      topPack: packStocks,
      productivity,
      recentLogs: recentTransactions.map((t) => ({
        id: t.id,
        item: t.material.name,
        type: t.type,
        qty: t.quantity,
        time: t.createdAt,
      })),
    };
    return result;
  }

  async getTransactionHistory(materialId: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: { materialId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAllTransactions(materialId?: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: materialId ? { materialId } : undefined,
      include: {
        material: { select: { id: true, name: true, code: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getStockSummaryByBahanType() {
    const inventories = await this.prisma.materialInventory.findMany({
      where: { currentStock: { gt: 0 } },
      include: { material: { select: { bahanType: true } } },
    });

    const summary = new Map<
      string,
      { totalBagus: number; totalReject: number; count: number }
    >();

    for (const inv of inventories) {
      const bt = inv.material.bahanType || 'LAINNYA';
      const current = Number(inv.currentStock);
      if (!summary.has(bt)) {
        summary.set(bt, { totalBagus: 0, totalReject: 0, count: 0 });
      }
      const entry = summary.get(bt)!;
      if (inv.qcStatus === 'GOOD') {
        entry.totalBagus += current;
      } else if (inv.qcStatus === 'REJECT') {
        entry.totalReject += current;
      }
      entry.count += 1;
    }

    return Array.from(summary.entries()).map(([bahanType, data]) => ({
      bahanType,
      ...data,
    }));
  }

  // ==========================================
  // Capacity & Hold Threshold Checks
  // ==========================================

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

  @OnEvent('finance.payment_verified_warehouse_check')
  async handlePaymentVerifiedWarehouseCheck(payload: { leadId: string }) {
    try {
      const whResult = await this.checkCapacityForNewDeal(payload.leadId);
      if (whResult && whResult.status !== 'OK') {
        this.eventEmitter.emit(ACTIVITY_EVENT, {
          leadId: payload.leadId,
          senderDivision: Division.WAREHOUSE,
          eventType: StreamEventType.STOCK_CHECK_SHORTAGE,
          notes: whResult.message,
          loggedBy: 'SYSTEM_WAREHOUSE',
          isCritical: whResult.status === 'CRITICAL',
        });
      }
    } catch (err) {
      logBestEffort(this.logger, 'warehouse:payment-verified-check', err);
    }
  }

  async checkHoldThresholds() {
    const now = new Date();
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
}
