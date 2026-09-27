import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import {
  InvoiceStatus,
  InvoiceCategory,
  WorkflowStatus,
  LifecycleStatus,
  QCStatus,
  TicketStatus,
  FundRequestStatus,
} from '@prisma/client';

@Injectable()
export class DashboardsService {
  constructor(private readonly prisma: PrismaService) {}

  private computeKpi(
    value: number,
    target: number,
    direction: 'higher-better' | 'lower-better' | 'zero-target',
  ) {
    let pct = 100;
    if (direction === 'higher-better') {
      pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    } else if (direction === 'lower-better') {
      const deficit = Math.max(0, value - target);
      pct = target > 0 ? Math.max(0, Math.round(100 - (deficit / target) * 100)) : 100;
    } else if (direction === 'zero-target') {
      pct = value === 0 ? 100 : Math.max(0, 100 - value * 10);
    }
    return { value, target, pct, direction };
  }

  // 1. Executive Dashboard
  async getExecutiveDashboard() {
    const [
      paidInvoices,
      overdueInvoices,
      activePlans,
      delayedPlans,
      activeLeads,
      wonLeads,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.PAID, category: InvoiceCategory.RECEIVABLE },
        _sum: { amountDue: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          category: InvoiceCategory.RECEIVABLE,
          status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
          dueDate: { lt: new Date() },
        },
        _sum: { outstandingAmount: true },
        _count: { id: true },
      }),
      this.prisma.productionPlan.count({
        where: { status: { in: [LifecycleStatus.MIXING, LifecycleStatus.FILLING, LifecycleStatus.PACKING, LifecycleStatus.PLANNING] } },
      }),
      this.prisma.productionPlan.count({
        where: {
          status: { in: [LifecycleStatus.MIXING, LifecycleStatus.FILLING, LifecycleStatus.PACKING] },
          so: { dueDate: { lt: new Date() } },
        },
      }),
      this.prisma.salesLead.count({
        where: { status: { notIn: [WorkflowStatus.WON_DEAL, WorkflowStatus.LOST] } },
      }),
      this.prisma.salesLead.count({
        where: { status: WorkflowStatus.WON_DEAL },
      }),
    ]);

    const revenueMtd = Number(paidInvoices._sum.amountDue || 0);
    const overdueAr = Number(overdueInvoices._sum.outstandingAmount || 0);
    const overdueCount = overdueInvoices._count.id;
    const totalLeads = activeLeads + wonLeads;
    const conversionRate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

    return {
      data: {
        cards: {
          revenueMtd,
          overdueAr,
          activeOrders: activePlans,
          delayedOrders: delayedPlans,
          activeLeads,
          conversionRate,
        },
        kpi: {
          revenue: this.computeKpi(revenueMtd, 5000000000, 'higher-better'),
          conversion: this.computeKpi(conversionRate, 15, 'higher-better'),
          overdue_orders: this.computeKpi(delayedPlans, 0, 'zero-target'),
          overdue_clients: this.computeKpi(overdueCount, 0, 'zero-target'),
        },
        freshness: {
          generated_at: new Date().toISOString(),
          sla_seconds: 300,
        },
      },
    };
  }

  // 2. Finance Dashboard
  async getFinanceDashboard() {
    const [paidInvoices, overdueAr, pendingPayments] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.PAID, category: InvoiceCategory.RECEIVABLE },
        _sum: { amountDue: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          category: InvoiceCategory.RECEIVABLE,
          status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
          dueDate: { lt: new Date() },
        },
        _sum: { outstandingAmount: true },
      }),
      this.prisma.fundRequest.count({
        where: { status: { in: [FundRequestStatus.PENDING_APPROVAL_MGR, FundRequestStatus.WAITING_FINANCE_DISBURSEMENT] } },
      }),
    ]);

    const revenue = Number(paidInvoices._sum.amountDue || 0);
    const overdue = Number(overdueAr._sum.outstandingAmount || 0);

    return {
      data: {
        cards: {
          revenue,
          overdueAr: overdue,
          pendingPaymentsCount: pendingPayments,
        },
        kpi: {
          revenue: this.computeKpi(revenue, 3000000000, 'higher-better'),
          overdue: this.computeKpi(overdue, 0, 'zero-target'),
        },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 3. BusDev Dashboard
  async getBusdevDashboard() {
    const [leads, samples, deals] = await Promise.all([
      this.prisma.salesLead.count(),
      this.prisma.salesLead.count({ where: { status: WorkflowStatus.SAMPLE_REQUESTED } }),
      this.prisma.salesLead.count({ where: { status: WorkflowStatus.WON_DEAL } }),
    ]);

    return {
      data: {
        cards: { totalLeads: leads, activeSamples: samples, wonDeals: deals },
        kpi: {
          leads: this.computeKpi(leads, 100, 'higher-better'),
          deals: this.computeKpi(deals, 20, 'higher-better'),
        },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 4. Production Dashboard
  async getProductionDashboard() {
    const [inProgress, completed, scheduled] = await Promise.all([
      this.prisma.productionPlan.count({
        where: { status: { in: [LifecycleStatus.MIXING, LifecycleStatus.FILLING, LifecycleStatus.PACKING] } },
      }),
      this.prisma.productionPlan.count({
        where: { status: { in: [LifecycleStatus.DONE, LifecycleStatus.FINISHED_GOODS, LifecycleStatus.DELIVERED] } },
      }),
      this.prisma.productionPlan.count({
        where: { status: { in: [LifecycleStatus.PLANNING, LifecycleStatus.READY_TO_PRODUCE] } },
      }),
    ]);

    return {
      data: {
        cards: { inProgress, completed, scheduled },
        kpi: {
          inProgress: this.computeKpi(inProgress, 10, 'higher-better'),
        },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 5. Warehouse Dashboard
  async getWarehouseDashboard() {
    const [totalItems, lowStock, totalWarehouses] = await Promise.all([
      this.prisma.materialItem.count({ where: { deletedAt: null } }),
      this.prisma.materialItem.count({
        where: { deletedAt: null, stockQty: { lte: 10 } },
      }),
      this.prisma.warehouse.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      data: {
        cards: { totalItems, lowStockItems: lowStock, totalWarehouses },
        kpi: {
          lowStock: this.computeKpi(lowStock, 0, 'zero-target'),
        },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 6. QC Dashboard
  async getQcDashboard() {
    const [passed, rejected, pending] = await Promise.all([
      this.prisma.qCAudit.count({ where: { status: QCStatus.GOOD } }),
      this.prisma.qCAudit.count({ where: { status: QCStatus.REJECT } }),
      this.prisma.qCAudit.count({ where: { status: QCStatus.QUARANTINE } }),
    ]);

    const total = passed + rejected;
    const fpy = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 100;

    return {
      data: {
        cards: { passedAudits: passed, rejectedAudits: rejected, pendingAudits: pending, fpy },
        kpi: {
          fpy: this.computeKpi(fpy, 95, 'higher-better'),
          rejected: this.computeKpi(rejected, 0, 'zero-target'),
        },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 7. R&D Dashboard
  async getRndDashboard() {
    const [formulas, revisions, samples] = await Promise.all([
      this.prisma.formula.count(),
      this.prisma.formula.count({ where: { version: { gt: 1 } } }),
      this.prisma.sampleRequest.count(),
    ]);

    return {
      data: {
        cards: { totalFormulas: formulas, totalRevisions: revisions, totalSamples: samples },
        kpi: {
          formulas: this.computeKpi(formulas, 50, 'higher-better'),
        },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 8. Marketing Dashboard
  async getMarketingDashboard() {
    const [campaigns, assets] = await Promise.all([
      this.prisma.campaignOkr.count(),
      this.prisma.contentAsset.count(),
    ]);

    return {
      data: {
        cards: { activeCampaigns: campaigns, contentAssets: assets },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 9. HR Dashboard
  async getHrDashboard() {
    const [activeEmployees, pendingTickets, todayAttendance] = await Promise.all([
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.PENDING } }),
      this.prisma.attendance.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    return {
      data: {
        cards: { activeEmployees, pendingTickets, todayAttendance },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 10. Legality Dashboard
  async getLegalityDashboard() {
    const [hkiCount, bpomCount, halalCount] = await Promise.all([
      this.prisma.hkiRecord.count(),
      this.prisma.bpomRecord.count(),
      this.prisma.halalRecord.count(),
    ]);

    return {
      data: {
        cards: { hkiCount, bpomCount, halalCount },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 11. Notifications Dashboard
  async getNotificationsDashboard() {
    const [unread, total] = await Promise.all([
      this.prisma.notification.count({ where: { isRead: false } }),
      this.prisma.notification.count(),
    ]);

    return {
      data: {
        cards: { unreadNotifications: unread, totalNotifications: total },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 12. Procurement Dashboard
  async getProcurementDashboard() {
    const [activePos, pendingPrs] = await Promise.all([
      this.prisma.purchaseOrder.count({ where: { status: 'PENDING' } }),
      this.prisma.purchaseRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      data: {
        cards: { activePos, pendingPrs },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }

  // 13. System Errors Dashboard
  async getSystemErrorsDashboard() {
    const errorCount = await this.prisma.activityLog.count({
      where: { status: { gte: 400 } },
    });

    return {
      data: {
        cards: { errorCount, serverStatus: 'HEALTHY' },
        freshness: { generated_at: new Date().toISOString(), sla_seconds: 300 },
      },
    };
  }
}
