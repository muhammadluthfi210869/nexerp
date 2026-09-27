import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  StockReportQueryDto,
  StockValuationQueryDto,
  ValuationMethod,
  GoodsMutationQueryDto,
  SalesSummaryQueryDto,
  SalesSummaryGroupBy,
  FollowUpCustomerQueryDto,
  DateRangeQueryDto,
} from '../dto/report-query.dto';
import { TransactionType, QCStatus } from '@prisma/client';

@Injectable()
export class OperationalReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDates(query: DateRangeQueryDto) {
    const fromStr = query.date_from || query.startDate;
    const toStr = query.date_to || query.endDate;

    const from = fromStr
      ? new Date(fromStr)
      : new Date(new Date().getFullYear(), 0, 1);
    const to = toStr ? new Date(toStr) : new Date();

    return { from, to };
  }

  async getStockReport(query: StockReportQueryDto) {
    const whereMaterial: any = { deletedAt: null };
    if (query.category_id) {
      whereMaterial.categoryId = query.category_id;
    }

    const materials = await this.prisma.materialItem.findMany({
      where: whereMaterial,
      include: {
        inventories: {
          where: query.warehouse_id
            ? { location: { warehouseId: query.warehouse_id } }
            : {},
          include: {
            location: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data: any[] = [];

    for (const m of materials) {
      if (m.inventories.length === 0) {
        data.push({
          goods_id: m.id,
          goods_code: m.code || 'NO-CODE',
          goods_name: m.name,
          warehouse_name: 'Semua Gudang',
          qty_bagus: Number(m.stockQty),
          qty_reject: 0,
          qty_free: 0,
        });
      } else {
        const byWarehouse = new Map<string, { bagus: number; reject: number; free: number }>();

        for (const inv of m.inventories) {
          const whName = inv.location?.warehouse?.name || 'Gudang Utama';
          if (!byWarehouse.has(whName)) {
            byWarehouse.set(whName, { bagus: 0, reject: 0, free: 0 });
          }
          const w = byWarehouse.get(whName)!;
          const qty = Number(inv.currentStock);

          // BUS-RULE-053 3-Pilar Status: Bagus, Reject, Free
          if (inv.qcStatus === QCStatus.REJECT) {
            w.reject += qty;
          } else {
            w.bagus += qty;
          }
        }

        for (const [whName, counts] of byWarehouse.entries()) {
          data.push({
            goods_id: m.id,
            goods_code: m.code || 'NO-CODE',
            goods_name: m.name,
            warehouse_name: whName,
            qty_bagus: counts.bagus,
            qty_reject: counts.reject,
            qty_free: counts.free,
          });
        }
      }
    }

    return { data };
  }

  async getStockValuation(query: StockValuationQueryDto) {
    const materials = await this.prisma.materialItem.findMany({
      where: { deletedAt: null },
      include: {
        valuations: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    const isFifo = query.method === ValuationMethod.FIFO;

    const data = materials.map((m) => {
      const qty = Number(m.stockQty);
      const latestValuation = m.valuations[0];
      let unitCost = Number(m.unitPrice);

      if (latestValuation) {
        unitCost = isFifo
          ? Number(latestValuation.lastPurchasePrice || m.unitPrice)
          : Number(latestValuation.movingAveragePrice || m.unitPrice);
      }

      const totalValue = Math.round(qty * unitCost);

      return {
        goods_id: m.id,
        goods_code: m.code || 'NO-CODE',
        goods_name: m.name,
        unit: m.unit,
        qty,
        unit_cost: Math.round(unitCost),
        total_value: totalValue,
        valuation_method: query.method || ValuationMethod.AVERAGE,
      };
    });

    const totalValuation = data.reduce((sum, item) => sum + item.total_value, 0);

    return {
      data,
      total_valuation: totalValuation,
    };
  }

  async getGoodsMutation(query: GoodsMutationQueryDto) {
    if (!query.goods_id) {
      throw new BadRequestException('goods_id is required for mutation report');
    }

    const { from, to } = this.parseDates(query);

    const material = await this.prisma.materialItem.findUnique({
      where: { id: query.goods_id },
    });
    if (!material) {
      throw new BadRequestException('Material/Goods not found');
    }

    // Historical transactions prior to 'from' to compute opening_qty
    const priorTransactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        materialId: query.goods_id,
        createdAt: { lt: from },
        warehouseId: query.warehouse_id || undefined,
      },
    });

    let openingQty = 0;
    for (const t of priorTransactions) {
      const q = Number(t.quantity);
      if (t.type === TransactionType.INBOUND || t.type === TransactionType.RETURN) {
        openingQty += q;
      } else if (t.type === TransactionType.OUTBOUND) {
        openingQty -= q;
      } else if (t.type === TransactionType.ADJUSTMENT) {
        openingQty += q; // positive or negative adjustment
      }
    }

    // Transactions within the period
    const periodTransactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        materialId: query.goods_id,
        createdAt: { gte: from, lte: to },
        warehouseId: query.warehouse_id || undefined,
      },
      orderBy: { createdAt: 'asc' },
    });

    let inQty = 0;
    let outQty = 0;
    let adjustmentQty = 0;

    const movements = periodTransactions.map((t) => {
      const q = Number(t.quantity);
      if (t.type === TransactionType.INBOUND || t.type === TransactionType.RETURN) {
        inQty += q;
      } else if (t.type === TransactionType.OUTBOUND) {
        outQty += q;
      } else if (t.type === TransactionType.ADJUSTMENT) {
        adjustmentQty += q;
      }

      return {
        id: t.id,
        date: t.createdAt.toISOString(),
        type: t.type,
        quantity: q,
        reference_no: t.referenceNo,
        notes: t.notes,
      };
    });

    const closingQty = openingQty + inQty - outQty + adjustmentQty;

    return {
      data: {
        goods_id: material.id,
        goods_name: material.name,
        goods_code: material.code,
        period_from: from.toISOString().split('T')[0],
        period_to: to.toISOString().split('T')[0],
        opening_qty: openingQty,
        in_qty: inQty,
        out_qty: outQty,
        adjustment_qty: adjustmentQty,
        closing_qty: closingQty,
        movements,
      },
    };
  }

  async getSalesSummary(query: SalesSummaryQueryDto) {
    const { from, to } = this.parseDates(query);
    const groupBy = query.group_by || SalesSummaryGroupBy.CUSTOMER;

    const orders = await this.prisma.salesOrder.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
      include: {
        lead: {
          include: {
            pic: true,
          },
        },
        items: {
          include: {
            materialItem: true,
          },
        },
      },
    });

    const groups = new Map<string, { label: string; total_orders: number; total_amount: number; total_quantity: number }>();

    for (const so of orders) {
      let key = '';
      let label = '';

      if (groupBy === SalesSummaryGroupBy.CUSTOMER) {
        key = so.leadId || 'UNKNOWN';
        label = so.lead?.clientName || so.brandName || 'Pelanggan Umum';
      } else if (groupBy === SalesSummaryGroupBy.OWNER) {
        key = so.lead?.picId || 'UNASSIGNED';
        label = so.lead?.pic?.name || 'Unassigned PIC';
      } else if (groupBy === SalesSummaryGroupBy.MONTH) {
        key = so.createdAt.toISOString().slice(0, 7);
        label = key;
      }

      if (groupBy !== SalesSummaryGroupBy.GOODS) {
        if (!groups.has(key)) {
          groups.set(key, { label, total_orders: 0, total_amount: 0, total_quantity: 0 });
        }
        const g = groups.get(key)!;
        g.total_orders += 1;
        g.total_amount += Math.round(Number(so.totalAmount));
        g.total_quantity += so.items.reduce((s: number, i) => s + Number(i.quantity), 0);
      } else {
        // Group by goods
        for (const item of so.items) {
          const itemKey = item.materialItemId || item.productName;
          const itemLabel = item.productName || item.materialItem?.name || 'Produk';
          if (!groups.has(itemKey)) {
            groups.set(itemKey, { label: itemLabel, total_orders: 0, total_amount: 0, total_quantity: 0 });
          }
          const g = groups.get(itemKey)!;
          g.total_orders += 1;
          g.total_amount += Math.round(Number(item.subtotal || Number(item.quantity) * Number(item.unitPrice)));
          g.total_quantity += Number(item.quantity);
        }
      }
    }

    const items = Array.from(groups.entries()).map(([key, val]) => ({
      group_key: key,
      group_label: val.label,
      total_orders: val.total_orders,
      total_amount: val.total_amount,
      total_quantity: val.total_quantity,
    }));

    return {
      data: {
        group_by: groupBy,
        period_from: from.toISOString().split('T')[0],
        period_to: to.toISOString().split('T')[0],
        items,
        grand_total: items.reduce((s, i) => s + i.total_amount, 0),
      },
    };
  }

  async getFollowUpCustomer(query: FollowUpCustomerQueryDto) {
    const { from, to } = this.parseDates(query);

    const whereLead: any = {
      createdAt: { gte: from, lte: to },
    };
    if (query.owner_user_id) {
      whereLead.picId = query.owner_user_id;
    }

    const leads = await this.prisma.salesLead.findMany({
      where: whereLead,
      include: {
        sampleRequests: true,
        salesOrders: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const data = leads.map((l) => ({
      customer_id: l.id,
      customer_name: l.clientName,
      last_follow_up_at: l.activities[0]?.createdAt?.toISOString() || (l.updatedAt ? l.updatedAt.toISOString() : l.createdAt.toISOString()),
      lead_status: l.status,
      total_samples: l.sampleRequests.length,
      total_orders: l.salesOrders.length,
    }));

    return { data };
  }

  async getGuestBook(query: DateRangeQueryDto) {
    const { from, to } = this.parseDates(query);

    const guests = await this.prisma.guestLog.findMany({
      where: {
        visitDate: { gte: from, lte: to },
      },
      orderBy: { visitDate: 'desc' },
    });

    const data = guests.map((g) => ({
      date: g.visitDate.toISOString().split('T')[0],
      name: g.clientName,
      institution: g.instansi || '-',
      purpose: g.purpose || g.productInterest || 'Kunjungan Bisnis',
    }));

    return { data };
  }

  async generateGoodsReceiptReport() {
    // Contract returns 202 Accepted
    return {
      status: 'QUEUED',
      jobId: `gr-rpt-${Date.now()}`,
      description: 'Report generation queued',
    };
  }
}
