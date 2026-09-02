import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import {
  InvoiceStatus,
  LifecycleStatus,
  WorkflowStatus,
  InvoiceCategory,
} from '@prisma/client';

@Injectable()
export class ExecutiveService {
  constructor(private prisma: PrismaService) {}

  async getExecutiveMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const currentDay = now.getDate() || 1;

    const metrics: any = {
      revenue: {
        mtd: 0,
        target: 5000000000,
        achievement: 0,
        projection: 0,
        growth: 0,
      },
      pipeline: { total: 0, deal: 0, prospect: 0, hot: 0 },
      production: {
        activeOrders: 0,
        onProd: 0,
        ready: 0,
        qcFlow: 0,
        overdue: 0,
      },
      cashflow: { totalAR: 0, aging: { '0-30': 0, '31-60': 0, '60+': 0 } },
      lost: { totalVal: 0, churnRate: 0 },
      repeatOrder: { rate: 0, revenue: 0, readyToRepeat: 0, targetFollowUp: 0 },
    };

    try {
      // 1. REVENUE (Optimized via Summary Ledger)
      try {
        const period = await this.prisma.financialPeriod.findFirst({
          where: { startDate: { lte: now }, endDate: { gte: now } },
        });

        if (period) {
          const summary = await this.prisma.financialSummaryLedger.findUnique({
            where: {
              periodId_category_currencyCode: {
                periodId: period.id,
                category: 'TOTAL_REVENUE',
                currencyCode: 'IDR',
              },
            },
          });

          if (summary) {
            metrics.revenue.mtd = Number(summary.nominalValue);
          } else {
            // Fallback to real-time calculation if ledger not updated
            const currentRevenue = await this.prisma.invoice.aggregate({
              where: {
                status: InvoiceStatus.PAID,
                category: InvoiceCategory.RECEIVABLE,
                paidAt: { gte: startOfMonth },
              },
              _sum: { amountDue: true },
            });
            metrics.revenue.mtd = Number(currentRevenue._sum.amountDue || 0);
          }
        }

        // Achievement and Projection logic remains same
        metrics.revenue.achievement =
          (metrics.revenue.mtd / metrics.revenue.target) * 100;
        metrics.revenue.projection =
          (metrics.revenue.mtd / currentDay) * daysInMonth;
      } catch (e) {
        console.error('ExecMetrics Error (Revenue):', e);
      }

      // 2. PIPELINE
      try {
        const stageCounts = await this.prisma.salesLead.groupBy({
          by: ['status'],
          _count: { _all: true },
        });

        const getC = (s: WorkflowStatus) =>
          stageCounts.find((sc) => sc.status === s)?._count._all || 0;

        metrics.pipeline.total = await this.prisma.salesLead.count({
          where: { status: { not: 'LOST' } },
        });
        metrics.pipeline.deal = getC('WON_DEAL');
        metrics.pipeline.prospect = getC('NEGOTIATION');
        metrics.pipeline.hot = getC('SAMPLE_APPROVED');
      } catch (e) {
        console.error('ExecMetrics Error (Pipeline):', e);
      }

      // 3. PRODUCTION
      try {
        metrics.production.activeOrders =
          await this.prisma.productionPlan.count({
            where: { status: { not: LifecycleStatus.DONE } },
          });
        metrics.production.onProd = await this.prisma.productionPlan.count({
          where: {
            status: {
              in: [
                LifecycleStatus.MIXING,
                LifecycleStatus.FILLING,
                LifecycleStatus.PACKING,
              ],
            },
          },
        });
        metrics.production.ready = await this.prisma.productionPlan.count({
          where: {
            status: LifecycleStatus.DONE,
            logs: { some: { stage: LifecycleStatus.FINISHED_GOODS } },
          },
        });
        metrics.production.qcFlow = await this.prisma.productionPlan.count({
          where: {
            status: {
              in: [
                LifecycleStatus.MIXING,
                LifecycleStatus.FILLING,
                LifecycleStatus.PACKING,
              ],
            },
            logs: { some: { stage: LifecycleStatus.QC_HOLD } },
          },
        });

        const overdue = await this.prisma.productionPlan.findMany({
          where: { status: { not: LifecycleStatus.DONE } },
          include: { so: true },
        });
        metrics.production.overdue = overdue.filter(
          (p) => p.so?.dueDate && p.so.dueDate < now,
        ).length;
      } catch (e) {
        console.error('ExecMetrics Error (Production):', e);
      }

      // 4. CASHFLOW (AR/AP Analysis)
      try {
        const arData = await this.prisma.invoice.aggregate({
          where: {
            category: InvoiceCategory.RECEIVABLE,
            status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
          },
          _sum: { outstandingAmount: true },
        });
        metrics.cashflow.totalAR = Number(arData._sum.outstandingAmount || 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(now.getDate() - 60);

        const ar0_30 = await this.prisma.invoice.aggregate({
          where: {
            category: InvoiceCategory.RECEIVABLE,
            status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
            issuedAt: { gte: thirtyDaysAgo },
          },
          _sum: { outstandingAmount: true },
        });
        metrics.cashflow.aging['0-30'] = Number(
          ar0_30._sum.outstandingAmount || 0,
        );

        const ar31_60 = await this.prisma.invoice.aggregate({
          where: {
            category: InvoiceCategory.RECEIVABLE,
            status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
            issuedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          },
          _sum: { outstandingAmount: true },
        });
        metrics.cashflow.aging['31-60'] = Number(
          ar31_60._sum.outstandingAmount || 0,
        );

        const ar60plus = await this.prisma.invoice.aggregate({
          where: {
            category: InvoiceCategory.RECEIVABLE,
            status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
            issuedAt: { lt: sixtyDaysAgo },
          },
          _sum: { outstandingAmount: true },
        });
        metrics.cashflow.aging['60+'] = Number(
          ar60plus._sum.outstandingAmount || 0,
        );
      } catch (e) {
        console.error('ExecMetrics Error (Cashflow):', e);
      }

      // 5. LOST
      try {
        const lost = await this.prisma.salesLead.aggregate({
          where: { status: 'LOST' },
          _sum: { estimatedValue: true },
        });
        metrics.lost.totalVal = Number(lost._sum.estimatedValue || 0);

        const totalCount = await this.prisma.salesLead.count();
        const lostCount = await this.prisma.salesLead.count({
          where: { status: 'LOST' },
        });
        metrics.lost.churnRate =
          totalCount > 0 ? (lostCount / totalCount) * 100 : 0;
      } catch (e) {
        console.error('ExecMetrics Error (Lost):', e);
      }

      // 6. REPEAT ORDER
      try {
        const won = await this.prisma.salesLead.count({
          where: { status: 'WON_DEAL' },
        });
        const ro = await this.prisma.salesLead.count({
          where: { isRepeatOrder: true },
        });
        metrics.repeatOrder.rate = won > 0 ? (ro / won) * 100 : 0;
        metrics.repeatOrder.revenue = metrics.revenue.mtd * 0.35;
        metrics.repeatOrder.readyToRepeat =
          await this.prisma.retentionEngine.count({
            where: { status: 'WAITING' },
          });
      } catch (e) {
        console.error('ExecMetrics Error (RepeatOrder):', e);
      }
    } catch (globalError) {
      console.error('CRITICAL: Global Executive Metrics Failure', globalError);
    }

    return metrics;
  }

  async getExecutiveAlerts() {
    const now = new Date();
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(now.getHours() - 24);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const alerts: any = {
      production: { overdue: 0, nearDeadline: 0, bottlenecks: 0, alerts: [] },
      cashflow: { overdueInvoices: 0, largeUnpaid: 0, alerts: [] },
      repeatOrder: { readyThisWeek: 0, churnRisk: 0, alerts: [] },
      lostRisk: { churnRisk: 0, dealAtRisk: 0, alerts: [] },
      sales: { unfollowed: 0, stuck: 0, alerts: [] },
      sample: { overdue: 0, multiRevision: 0, alerts: [] },
    };

    try {
      try {
        // 1. PRODUCTION ALERTS
        const activePlans = await this.prisma.productionPlan.findMany({
          where: { status: { not: LifecycleStatus.DONE } },
          include: { so: true },
        });
        alerts.production.overdue = activePlans.filter(
          (p) => p.so?.dueDate && p.so.dueDate < now,
        ).length;
        alerts.production.nearDeadline = activePlans.filter(
          (p) =>
            p.so?.dueDate &&
            p.so.dueDate >= now &&
            p.so.dueDate <= threeDaysFromNow,
        ).length;

        if (alerts.production.overdue > 0)
          alerts.production.alerts.push(
            `${alerts.production.overdue} Work Orders are currently overdue`,
          );

        const bottlenecks = await this.prisma.productionPlan.count({
          where: {
            status: {
              in: [
                LifecycleStatus.MIXING,
                LifecycleStatus.FILLING,
                LifecycleStatus.PACKING,
              ],
            },
            logs: { some: { stage: LifecycleStatus.MIXING } },
          },
        });
        alerts.production.bottlenecks = bottlenecks;
      } catch (e) {
        console.error('ExecAlerts Error (Production):', e);
      }

      try {
        // 2. CASHFLOW ALERTS
        alerts.cashflow.overdueInvoices = await this.prisma.invoice.count({
          where: {
            category: InvoiceCategory.RECEIVABLE,
            status: InvoiceStatus.UNPAID,
            dueDate: { lt: now },
          },
        });
        alerts.cashflow.largeUnpaid = await this.prisma.invoice.count({
          where: {
            category: InvoiceCategory.RECEIVABLE,
            status: InvoiceStatus.UNPAID,
            amountDue: { gte: 100000000 },
          },
        });

        if (alerts.cashflow.largeUnpaid > 0)
          alerts.cashflow.alerts.push(
            `${alerts.cashflow.largeUnpaid} High-value invoices pending payment`,
          );
      } catch (e) {
        console.error('ExecAlerts Error (Cashflow):', e);
      }

      try {
        // 3. SALES ALERTS
        alerts.sales.unfollowed = await this.prisma.salesLead.count({
          where: {
            lastFollowUpAt: null,
            createdAt: { lt: twentyFourHoursAgo },
            status: { not: 'LOST' },
          },
        });
        alerts.sales.stuck = await this.prisma.salesLead.count({
          where: {
            updatedAt: { lt: sevenDaysAgo },
            status: { notIn: ['WON_DEAL', 'LOST'] },
          },
        });

        if (alerts.sales.unfollowed > 0)
          alerts.sales.alerts.push(
            `${alerts.sales.unfollowed} Leads neglected for over 24 hours`,
          );
        if (alerts.sales.stuck > 0)
          alerts.sales.alerts.push(
            `${alerts.sales.stuck} Deals stuck in pipeline for > 7 days`,
          );
      } catch (e) {
        console.error('ExecAlerts Error (Sales):', e);
      }

      try {
        // 4. REPEAT ORDER
        alerts.repeatOrder.readyThisWeek =
          await this.prisma.retentionEngine.count({
            where: {
              status: 'WAITING',
              estDepletionDate: { lte: threeDaysFromNow },
            },
          });
        if (alerts.repeatOrder.readyThisWeek > 0)
          alerts.repeatOrder.alerts.push(
            `${alerts.repeatOrder.readyThisWeek} clients due for reorder this week`,
          );
      } catch (e) {
        console.error('ExecAlerts Error (RepeatOrder):', e);
      }
    } catch (globalError) {
      console.error('CRITICAL: Global Executive Alerts Failure', globalError);
    }

    return alerts;
  }

  /**
   * Recalculates the FinancialSummaryLedger for a given period.
   * This is the 'Hard-Gate' for Executive Analytics.
   */
  async recalculateSummaryLedger(periodId: string) {
    const period = await this.prisma.financialPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) throw new Error('Financial Period not found');

    // 1. Calculate Total Revenue (Paid Receivables)
    const totalRevenue = await this.prisma.invoice.aggregate({
      where: {
        category: InvoiceCategory.RECEIVABLE,
        status: InvoiceStatus.PAID,
        paidAt: { gte: period.startDate, lte: period.endDate },
      },
      _sum: { amountDue: true },
    });

    await this.updateLedgerItem(
      periodId,
      'TOTAL_REVENUE',
      Number(totalRevenue._sum.amountDue || 0),
    );

    // 2. Calculate Total AR (Outstanding Receivables)
    const totalAR = await this.prisma.invoice.aggregate({
      where: {
        category: InvoiceCategory.RECEIVABLE,
        status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
        issuedAt: { lte: period.endDate },
      },
      _sum: { outstandingAmount: true },
    });

    await this.updateLedgerItem(
      periodId,
      'TOTAL_AR',
      Number(totalAR._sum.outstandingAmount || 0),
    );

    // 3. Calculate Total Payroll (Architectural Placeholder)
    // NOTE: Payroll data is AES-256 encrypted. Decryption-based summation must happen in a secure context.
    // For the executive summary ledger, we record the total transaction count or a pre-calculated sum if available.
    const payrollCount = await this.prisma.payrollItem.count({
      where: {
        payroll: {
          periodId: period.id,
          status: 'PAID',
        },
      },
    });

    // Placeholder: In production, this would be updated by the Payroll decryption engine.
    await this.updateLedgerItem(periodId, 'TOTAL_PAYROLL_COUNT', payrollCount);

    return { success: true, period: period.name };
  }

  private async updateLedgerItem(
    periodId: string,
    category: string,
    value: number,
  ) {
    await this.prisma.financialSummaryLedger.upsert({
      where: {
        periodId_category_currencyCode: {
          periodId,
          category,
          currencyCode: 'IDR',
        },
      },
      update: {
        nominalValue: value,
        lastCalculated: new Date(),
      },
      create: {
        periodId,
        category,
        nominalValue: value,
        currencyCode: 'IDR',
      },
    });
  }
}
