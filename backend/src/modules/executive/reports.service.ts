import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { InvoiceCategory, InvoiceStatus, PaymentStatus } from '@prisma/client';

export interface ArAgingRow {
  id: string;
  customer: string;
  customerId: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  bucket: 'Current' | '1-30' | '31-60' | '61-90' | '>90';
}

export interface ApAgingRow {
  id: string;
  supplier: string;
  supplierId: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  bucket: 'Current' | '1-30' | '31-60' | '61-90' | '>90';
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  /**
   * AR Aging Report (BUS-RULE-010, BUS-RULE-084, SCR-130 / SCR-159)
   * Buckets: Current (<=0 overdue), 1-30, 31-60, 61-90, >90.
   */
  async getArAging(asOfDate?: Date, customerIdFilter?: string) {
    const asOf = asOfDate || new Date();

    // 1. Fetch open SalesInvoices
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
        paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        cancelledAt: null,
        ...(customerIdFilter ? { customerId: customerIdFilter } : {}),
      },
      include: {
        customer: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    // 2. Also fetch unified Invoices with category RECEIVABLE if any exist outside salesInvoices
    const existingInvNumbers = new Set(salesInvoices.map((si) => si.invoiceNumber));
    const unifiedInvoices = await this.prisma.invoice.findMany({
      where: {
        category: InvoiceCategory.RECEIVABLE,
        status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
        deletedAt: null,
        invoiceNumber: { notIn: Array.from(existingInvNumbers) },
      },
      include: {
        so: { include: { lead: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const items: ArAgingRow[] = [];

    for (const inv of salesInvoices) {
      const total = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount);
      const outstanding = Math.max(0, total - paid);
      if (outstanding <= 0) continue;

      const dueDate = new Date(inv.dueDate);
      const diffMs = asOf.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let bucket: 'Current' | '1-30' | '31-60' | '61-90' | '>90' = 'Current';
      if (daysOverdue > 90) bucket = '>90';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';
      else if (daysOverdue > 0) bucket = '1-30';

      items.push({
        id: inv.id,
        customer: inv.customer?.name || 'Pelanggan Umum',
        customerId: inv.customerId,
        invoiceNo: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        daysOverdue,
        totalAmount: total,
        paidAmount: paid,
        outstandingAmount: outstanding,
        bucket,
      });
    }

    for (const uInv of unifiedInvoices) {
      const total = Number(uInv.amountDue);
      const outstanding = Number(uInv.outstandingAmount);
      if (outstanding <= 0) continue;
      const paid = Math.max(0, total - outstanding);

      const dueDate = new Date(uInv.dueDate);
      const diffMs = asOf.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let bucket: 'Current' | '1-30' | '31-60' | '61-90' | '>90' = 'Current';
      if (daysOverdue > 90) bucket = '>90';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';
      else if (daysOverdue > 0) bucket = '1-30';

      items.push({
        id: uInv.id,
        customer: uInv.so?.lead?.clientName || 'Pelanggan Umum',
        customerId: uInv.so?.leadId || uInv.id,
        invoiceNo: uInv.invoiceNumber,
        invoiceDate: uInv.issuedAt.toISOString(),
        dueDate: uInv.dueDate.toISOString(),
        daysOverdue,
        totalAmount: total,
        paidAmount: paid,
        outstandingAmount: outstanding,
        bucket,
      });
    }

    const bucketTotals = {
      Current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '>90': 0,
    };

    let totalOutstanding = 0;
    let overdueTotal = 0;
    let currentTotal = 0;

    for (const it of items) {
      bucketTotals[it.bucket] += it.outstandingAmount;
      totalOutstanding += it.outstandingAmount;
      if (it.bucket === 'Current') {
        currentTotal += it.outstandingAmount;
      } else {
        overdueTotal += it.outstandingAmount;
      }
    }

    const overdue90Pct = totalOutstanding > 0 ? (bucketTotals['>90'] / totalOutstanding) * 100 : 0;

    return {
      data: items,
      summary: {
        totalOutstanding,
        currentTotal,
        overdueTotal,
        overdue90Pct: Number(overdue90Pct.toFixed(2)),
        isHealthy: overdue90Pct <= 10, // BUS-RULE-084: >90 days bucket should be <= 10%
        buckets: bucketTotals,
        count: items.length,
      },
    };
  }

  /**
   * AP Aging Report (BUS-RULE-084 analog for Payables, SCR-131)
   */
  async getApAging(asOfDate?: Date, supplierIdFilter?: string) {
    const asOf = asOfDate || new Date();

    const payables = await this.prisma.invoice.findMany({
      where: {
        category: InvoiceCategory.PAYABLE,
        status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
        deletedAt: null,
        ...(supplierIdFilter ? { supplierId: supplierIdFilter } : {}),
      },
      include: {
        supplier: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const items: ApAgingRow[] = [];

    for (const inv of payables) {
      const total = Number(inv.amountDue);
      const outstanding = Number(inv.outstandingAmount);
      if (outstanding <= 0) continue;
      const paid = Math.max(0, total - outstanding);

      const dueDate = new Date(inv.dueDate);
      const diffMs = asOf.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let bucket: 'Current' | '1-30' | '31-60' | '61-90' | '>90' = 'Current';
      if (daysOverdue > 90) bucket = '>90';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';
      else if (daysOverdue > 0) bucket = '1-30';

      items.push({
        id: inv.id,
        supplier: inv.supplier?.name || 'Pemasok Umum',
        supplierId: inv.supplierId || inv.id,
        invoiceNo: inv.invoiceNumber,
        invoiceDate: inv.issuedAt.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        daysOverdue,
        totalAmount: total,
        paidAmount: paid,
        outstandingAmount: outstanding,
        bucket,
      });
    }

    const bucketTotals = {
      Current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '>90': 0,
    };

    let totalOutstanding = 0;
    let overdueTotal = 0;
    let currentTotal = 0;

    for (const it of items) {
      bucketTotals[it.bucket] += it.outstandingAmount;
      totalOutstanding += it.outstandingAmount;
      if (it.bucket === 'Current') {
        currentTotal += it.outstandingAmount;
      } else {
        overdueTotal += it.outstandingAmount;
      }
    }

    return {
      data: items,
      summary: {
        totalOutstanding,
        currentTotal,
        overdueTotal,
        buckets: bucketTotals,
        count: items.length,
      },
    };
  }

  /**
   * Sales Summary Report (SCR-133)
   */
  async getSalesSummary(startDate?: Date, endDate?: Date, customerId?: string) {
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
        cancelledAt: null,
        ...(customerId ? { customerId } : {}),
        ...(startDate || endDate
          ? {
              invoiceDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        customer: true,
      },
    });

    const customerMap = new Map<string, {
      id: string;
      customer: string;
      contractType: string;
      invoiceCount: number;
      totalAmount: number;
      totalReceived: number;
      outstanding: number;
    }>();

    for (const inv of salesInvoices) {
      const cId = inv.customerId;
      const cName = inv.customer?.name || 'Pelanggan Umum';
      const orderTotal = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount);
      const remaining = Math.max(0, orderTotal - paid);

      const existing = customerMap.get(cId) || {
        id: `cust-${cId}`,
        customer: cName,
        contractType: 'Jasa Maklon',
        invoiceCount: 0,
        totalAmount: 0,
        totalReceived: 0,
        outstanding: 0,
      };

      existing.invoiceCount += 1;
      existing.totalAmount += orderTotal;
      existing.totalReceived += paid;
      existing.outstanding += remaining;

      customerMap.set(cId, existing);
    }

    if (salesInvoices.length === 0) {
      const orders = await this.prisma.salesOrder.findMany({
        where: {
          deletedAt: null,
          ...(startDate || endDate
            ? {
                transactionDate: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        include: {
          lead: true,
          invoices: true,
        },
      });

      for (const so of orders) {
        const cId = so.leadId;
        const cName = so.lead?.clientName || so.brandName || 'Pelanggan Umum';
        const orderTotal = Number(so.totalAmount);
        const paid = so.invoices.reduce(
          (sum, i) => sum + (Number(i.amountDue) - Number(i.outstandingAmount)),
          0,
        );
        const remaining = Math.max(0, orderTotal - paid);

        const existing = customerMap.get(cId) || {
          id: `cust-${cId}`,
          customer: cName,
          contractType: 'Jasa Maklon',
          invoiceCount: 0,
          totalAmount: 0,
          totalReceived: 0,
          outstanding: 0,
        };

        existing.invoiceCount += so.invoices.length || 1;
        existing.totalAmount += orderTotal;
        existing.totalReceived += paid;
        existing.outstanding += remaining;

        customerMap.set(cId, existing);
      }
    }

    const items = Array.from(customerMap.values());
    const totalAmount = items.reduce((sum, it) => sum + it.totalAmount, 0);
    const totalReceived = items.reduce((sum, it) => sum + it.totalReceived, 0);
    const totalOutstanding = items.reduce((sum, it) => sum + it.outstanding, 0);
    const totalInvoices = items.reduce((sum, it) => sum + it.invoiceCount, 0);

    return {
      data: items,
      summary: {
        totalAmount,
        totalReceived,
        totalOutstanding,
        totalOrders: totalInvoices,
        totalCustomers: items.length,
      },
    };
  }

  /**
   * Stock Valuation Report (SCR-126)
   */
  async getStockValuation(warehouseId?: string) {
    const inventories = await this.prisma.materialInventory.findMany({
      where: {
        currentStock: { gt: 0 },
        ...(warehouseId
          ? {
              location: {
                warehouseId,
              },
            }
          : {}),
      },
      include: {
        material: true,
        location: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const items = inventories.map((inv) => {
      const stock = Number(inv.currentStock);
      const unitCost = Number(inv.material.autoCalculatedHpp || inv.material.manualOverrideHpp || 0);
      const totalVal = stock * unitCost;

      return {
        id: inv.id,
        materialCode: inv.material.id.slice(0, 8),
        materialName: inv.material.name,
        type: inv.material.type,
        batchNumber: inv.batchNumber,
        warehouse: inv.location?.warehouse?.name || 'Gudang Utama',
        currentStock: stock,
        unit: inv.material.unit,
        unitCost,
        totalValue: totalVal,
        qcStatus: inv.qcStatus,
      };
    });

    const totalStockValue = items.reduce((sum, it) => sum + it.totalValue, 0);
    const totalQuantity = items.reduce((sum, it) => sum + it.currentStock, 0);

    return {
      data: items,
      summary: {
        totalStockValue,
        totalQuantity,
        totalItems: items.length,
      },
    };
  }

  // Financial Reports Passthrough
  async getProfitLoss(startDate?: Date, endDate?: Date) {
    return this.financeService.getProfitLoss(
      startDate || new Date(new Date().getFullYear(), 0, 1),
      endDate || new Date(),
    );
  }

  async getBalanceSheet(date?: Date) {
    return this.financeService.getBalanceSheet(date || new Date());
  }

  async getTrialBalance(startDate?: Date, endDate?: Date) {
    return this.financeService.getTrialBalance(startDate, endDate);
  }

  async getCashFlow(startDate?: Date, endDate?: Date) {
    return this.financeService.getCashFlow(
      startDate || new Date(new Date().getFullYear(), 0, 1),
      endDate || new Date(),
    );
  }
}
