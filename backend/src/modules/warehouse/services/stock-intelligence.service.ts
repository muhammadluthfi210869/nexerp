import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class StockIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * BUS-RULE-050: Dead Stock Detection (>6 Bulan / 180 Hari No Movement)
   * Material with stock > 0 and no transactions in the last 180 days.
   */
  async getDeadStockItems(): Promise<any[]> {
    const cutoffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const materials = await this.prisma.materialItem.findMany({
      where: {
        stockQty: { gt: 0 },
        deletedAt: null,
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const deadStockItems: any[] = [];
    const now = Date.now();

    for (const mat of materials) {
      const lastTx = mat.transactions?.[0];
      const lastMovementDate = lastTx ? lastTx.createdAt : new Date(0);

      if (lastMovementDate < cutoffDate) {
        const daysIdle = Math.floor(
          (now - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        deadStockItems.push({
          id: mat.id,
          name: mat.name,
          code: mat.code,
          stockQty: Number(mat.stockQty),
          unitPrice: Number(mat.unitPrice || 0),
          totalValue: Number(mat.stockQty) * Number(mat.unitPrice || 0),
          lastMovementAt: lastMovementDate,
          daysIdle,
          status: 'DEAD_STOCK',
          category: (mat as any).category?.name || 'Uncategorized',
        });
      }
    }

    return deadStockItems;
  }

  async getCriticalStockItems(): Promise<any[]> {
    const materials = await this.prisma.materialItem.findMany({
      where: {
        deletedAt: null,
      },
    });

    return materials
      .filter((m) => Number(m.stockQty) <= Number(m.minLevel || 0))
      .map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        stockQty: Number(m.stockQty),
        minLevel: Number(m.minLevel || 0),
        deficit: Number(m.minLevel || 0) - Number(m.stockQty),
        unit: m.unit,
        category: (m as any).category?.name || 'Uncategorized',
        isCritical: true,
      }));
  }

  async getReorderSuggestions(): Promise<any[]> {
    const materials = await this.prisma.materialItem.findMany({
      where: {
        deletedAt: null,
      },
    });

    return materials
      .filter((m) => Number(m.stockQty) <= Number(m.reorderPoint || m.minLevel || 0))
      .map((m) => ({
        materialId: m.id,
        materialName: m.name,
        code: m.code,
        currentStock: Number(m.stockQty),
        reorderPoint: Number(m.reorderPoint || m.minLevel || 0),
        suggestedQty: Math.max(
          0,
          Number(m.maxLevel || 100) - Number(m.stockQty),
        ),
        unit: m.unit,
      }));
  }

  async getFastMovers(limit = 10): Promise<any[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const txs = await this.prisma.inventoryTransaction.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        type: { in: ['OUTBOUND', 'INTERNAL_MOVE'] },
      },
      include: { material: true },
    });

    const aggregates = new Map<string, { material: any; totalQty: number }>();
    for (const tx of txs) {
      const cur = aggregates.get(tx.materialId) || {
        material: tx.material,
        totalQty: 0,
      };
      cur.totalQty += Number(tx.quantity);
      aggregates.set(tx.materialId, cur);
    }

    return Array.from(aggregates.values())
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit)
      .map((item) => ({
        id: item.material?.id,
        name: item.material?.name,
        code: item.material?.code,
        monthlyVelocity: item.totalQty,
      }));
  }

  async getSlowMovers(days = 60): Promise<any[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const materials = await this.prisma.materialItem.findMany({
      where: { stockQty: { gt: 0 }, deletedAt: null },
      include: {
        transactions: {
          where: { createdAt: { gte: cutoffDate } },
        },
      },
    });

    return materials
      .filter((m) => m.transactions.length <= 1)
      .map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        stockQty: Number(m.stockQty),
        txCount: m.transactions.length,
      }));
  }

  async getABCAnalysis(): Promise<any[]> {
    const materials = await this.prisma.materialItem.findMany({
      where: { deletedAt: null },
    });

    const itemsWithValue = materials.map((m) => ({
      id: m.id,
      name: m.name,
      code: m.code,
      stockQty: Number(m.stockQty),
      unitPrice: Number(m.unitPrice || 0),
      totalValue: Number(m.stockQty) * Number(m.unitPrice || 0),
    }));

    itemsWithValue.sort((a, b) => b.totalValue - a.totalValue);
    const grandTotal = itemsWithValue.reduce((acc, i) => acc + i.totalValue, 0);

    let cumulative = 0;
    return itemsWithValue.map((item) => {
      cumulative += item.totalValue;
      const share = grandTotal > 0 ? (cumulative / grandTotal) * 100 : 0;
      let classification = 'C';
      if (share <= 70) classification = 'A';
      else if (share <= 90) classification = 'B';

      return {
        ...item,
        cumulativeShare: Math.round(share * 100) / 100,
        classification,
      };
    });
  }
}
