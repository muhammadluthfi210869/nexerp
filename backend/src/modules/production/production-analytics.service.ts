/**
 * Production analytics — the read-only half of the shop floor.
 *
 * Extracted from `ProductionService` in Fase 3C: the dashboard, OEE, step
 * logs, chain of custody, warehouse preparation, granular batch audit,
 * executive summary, QC stats, floor view, leakage and the work-order
 * timeline.
 *
 * Sixteen of that class's 55 methods share one property the rest do not — they
 * only read. Before the move this was measured rather than assumed: the
 * cluster uses `findMany` / `aggregate` / `groupBy` / `count` /
 * `findUnique` and nothing else, and `aggregate` and `groupBy` appear
 * nowhere else in the file at all. That measurement is now a guard — the unit
 * spec for this extraction fails if a write ever migrates in here, because a
 * "reads only" service that starts mutating is a design change, not a
 * refactor.
 *
 * What stays behind is the write path: stage logging, material issue,
 * scheduling, QC gates, batch records and costing.
 *
 * `ProductionService` keeps sixteen delegators. Nothing outside the production
 * module reads them: the only production caller is `production.controller.ts`,
 * and two unit specs drive four of these methods directly. The delegators exist
 * to keep those call sites still, not to serve another module. Four other
 * modules have a *method of the same name* on their own service
 * (`hr.getExecutiveSummary`, `scm.getActiveWorkOrders`,
 * `lead-capture`/`marketing.getDashboardAnalytics`) — a naming collision, not a
 * dependency.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class ProductionAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardAnalytics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [workOrders, metricsAgg, alertOrders, rawLogs] = await Promise.all([
      this.prisma.workOrder.findMany({
        where: { targetCompletion: { gte: startOfMonth } },
        select: {
          id: true,
          targetQty: true,
          stage: true,
          targetCompletion: true,
          actualCompletion: true,
          lead: { select: { brandName: true, productInterest: true } },
        },
      }),
      this.prisma.productionLog.aggregate({
        where: { loggedAt: { gte: startOfMonth } },
        _sum: {
          inputQty: true,
          goodQty: true,
          rejectQty: true,
        },
      }),
      this.prisma.workOrder.count({
        where: {
          stage: { notIn: ['FINISHED_GOODS', 'DELIVERED', 'CLOSED'] },
          targetCompletion: { lt: now },
        },
      }),
      this.prisma.productionLog.findMany({
        where: { loggedAt: { gte: startOfMonth } },
        select: {
          id: true,
          stage: true,
          inputQty: true,
          goodQty: true,
          rejectQty: true,
          notes: true,
          downtimeMinutes: true,
          workOrder: {
            select: {
              woNumber: true,
              targetCompletion: true,
              lead: { select: { brandName: true, productInterest: true } },
            },
          },
        },
        orderBy: { loggedAt: 'desc' },
        take: 50,
      }),
    ]);

    const totalPlannedUnits = workOrders.reduce(
      (sum, wo) => sum + wo.targetQty,
      0,
    );
    const totalActualUnits = Number(metricsAgg._sum.goodQty || 0);
    const totalRejectUnits = Number(metricsAgg._sum.rejectQty || 0);
    const achievementRate =
      totalPlannedUnits > 0 ? (totalActualUnits / totalPlannedUnits) * 100 : 0;

    const onTimeOrders = workOrders.filter((wo) => {
      if (
        wo.stage === 'FINISHED_GOODS' &&
        wo.actualCompletion &&
        wo.actualCompletion <= wo.targetCompletion
      )
        return true;
      if (wo.targetCompletion >= now) return true;
      return false;
    }).length;

    const totalOrders = workOrders.length;
    const workshopStats = {
      queue: workOrders.filter((wo) => wo.stage === 'WAITING_MATERIAL').length,
      mixing: workOrders.filter((wo) => wo.stage === 'MIXING').length,
      filling: workOrders.filter((wo) => wo.stage === 'FILLING').length,
      packing: workOrders.filter((wo) => wo.stage === 'PACKING').length,
      fg: workOrders.filter((wo) => wo.stage === 'FINISHED_GOODS').length,
    };

    // 4. Anomaly Detection (Rule based)
    const anomalies = rawLogs
      .filter((log) => {
        const rejectRate = (Number(log.rejectQty) / Number(log.inputQty)) * 100;
        return rejectRate > 5;
      })
      .map((log) => ({
        batchId: log.workOrder?.woNumber || 'LEGACY-PLAN',
        stage: log.stage,
        rate:
          ((Number(log.rejectQty) / Number(log.inputQty)) * 100).toFixed(1) +
          '%',
        reason: log.notes,
      }));

    // 5. Precision PCS Tracking (Tabel IV)
    const precisionTracking = rawLogs.map((log) => ({
      deadline: log.workOrder
        ? Math.ceil(
            (log.workOrder.targetCompletion.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0,
      productName: log.workOrder
        ? `${log.workOrder?.lead?.brandName} - ${log.workOrder?.lead?.productInterest}`
        : 'Legacy Plan Item',
      batchId: log.workOrder?.woNumber || 'LEGACY-PLAN',
      unitFlow: `${log.inputQty} >> ${log.goodQty}`,
      anomaly: Number(log.rejectQty) > 0 ? 'DEFECT_DETECTED' : 'NOMINAL',
      status: `PHASE_${log.stage}`,
    }));

    const workshops_detail = await this.getMicroFlowDiagnostics();

    return {
      cards: {
        achievement: {
          rate: parseFloat(achievementRate.toFixed(1)),
          planned: totalPlannedUnits,
          actual: totalActualUnits,
          completedOrders: workOrders.filter(
            (wo) => wo.stage === 'FINISHED_GOODS',
          ).length,
          totalOrders: workOrders.length,
        },
        timeliness: {
          rate:
            totalOrders > 0
              ? parseFloat(((onTimeOrders / totalOrders) * 100).toFixed(1))
              : 100,
          delayed: alertOrders,
          avgCycleHours:
            totalOrders > 0
              ? parseFloat(
                  ((Math.max(1, alertOrders) / totalOrders) * 24).toFixed(1),
                )
              : 0,
        },
        efficiency: {
          utilization: totalOrders > 0 ? 85 : 0, // Base utilization if orders exist
          labor: 90,
          downtime: `${(rawLogs.reduce((sum, l) => sum + Number(l.downtimeMinutes || 0), 0) / 60).toFixed(1)}h`,
        },
        quality: {
          goodUnits: totalActualUnits - totalRejectUnits,
          defectRate:
            totalActualUnits > 0
              ? parseFloat(
                  ((totalRejectUnits / totalActualUnits) * 100).toFixed(2),
                )
              : 0,
          reworkCount: 0,
        },
        alerts: {
          breakdown: 0,
          shortages: 0,
          urgent: anomalies.length,
        },
      },
      workshops: workshopStats,
      workshops_detail,
      precisionTracking,
      anomalies,
      period: 'Month-to-Date',
    };
  }
  async getMachineOEE() {
    const machines = await this.prisma.machine.findMany({
      include: {
        productionLogs: {
          where: {
            loggedAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        },
      },
    });

    return machines.map((machine) => {
      const logs = machine.productionLogs;
      if (logs.length === 0) {
        return {
          id: machine.id,
          name: machine.name,
          availability: 100,
          performance: 100,
          quality: 100,
          oee: 100,
          status: (machine as any).isActive ? 'ACTIVE' : 'OFFLINE',
        };
      }

      // 1. Availability = (Planned Time - Downtime) / Planned Time
      const totalDowntime = logs.reduce(
        (sum, l) => sum + Number(l.downtimeMinutes || 0),
        0,
      );
      const totalPlannedMinutes = 30 * 24 * 60; // Simplified for last 30 days
      const availability =
        ((totalPlannedMinutes - totalDowntime) / totalPlannedMinutes) * 100;

      // 2. Performance = (Actual Output / Theoretical Max Output)
      const totalGood = logs.reduce(
        (sum, l) => sum + Number(l.goodQty || 0),
        0,
      );
      const totalInput = logs.reduce(
        (sum, l) => sum + Number(l.inputQty || 0),
        0,
      );
      const performance = totalInput > 0 ? (totalGood / totalInput) * 100 : 100;

      // 3. Quality = Good Units / Total Units
      const quality = totalInput > 0 ? (totalGood / totalInput) * 100 : 100;

      const oee =
        (availability / 100) * (performance / 100) * (quality / 100) * 100;

      return {
        id: machine.id,
        name: machine.name,
        availability: parseFloat(availability.toFixed(1)),
        performance: parseFloat(performance.toFixed(1)),
        quality: parseFloat(quality.toFixed(1)),
        oee: parseFloat(oee.toFixed(1)),
        status: (machine as any).isActive ? 'ACTIVE' : 'OFFLINE',
      };
    });
  }
  async getStepLogs() {
    const logs = await this.prisma.productionLog.findMany({
      include: {
        workOrder: { select: { id: true, woNumber: true } },
      },
      orderBy: { loggedAt: 'desc' },
    });

    const workOrderIds = logs
      .map((l) => l.workOrderId)
      .filter((id): id is string => id !== null);
    const workOrders = await this.prisma.workOrder.findMany({
      where: { id: { in: workOrderIds } },
      select: { id: true, planId: true },
    });
    const planIds = [
      ...new Set(
        workOrders
          .map((wo) => wo.planId)
          .filter((id): id is string => id !== null),
      ),
    ];
    const stepLogs = await this.prisma.productionStepLog.findMany({
      where: { woId: { in: planIds } },
      include: { qcAudits: { select: { status: true, createdAt: true } } },
    });

    const auditsByPlan = new Map<string, any[]>();
    for (const sl of stepLogs) {
      if (!auditsByPlan.has(sl.woId)) {
        auditsByPlan.set(sl.woId, []);
      }
      auditsByPlan.get(sl.woId)!.push(...sl.qcAudits);
    }

    const auditMap = new Map<string, any[]>();
    for (const wo of workOrders) {
      if (wo.planId && auditsByPlan.has(wo.planId)) {
        auditMap.set(wo.id, auditsByPlan.get(wo.planId)!);
      }
    }

    return logs.map((l) => ({
      id: l.id,
      workOrderId: l.workOrderId,
      stage: l.stage,
      operatorId: l.operatorId,
      inputQty: Number(l.inputQty),
      goodQty: Number(l.goodQty),
      rejectQty: Number(l.rejectQty),
      shrinkageQty: Number(l.shrinkageQty),
      laborCost: l.laborCost ? Number(l.laborCost) : 0,
      overheadCost: l.overheadCost ? Number(l.overheadCost) : 0,
      loggedAt: l.loggedAt,
      qcAudits: l.workOrderId ? auditMap.get(l.workOrderId) || [] : [],
    }));
  }
  async getProductionAudit() {
    return this.prisma.workOrder.findMany({
      take: 20,
      orderBy: { targetCompletion: 'asc' },
      include: {
        lead: true,
        logs: {
          orderBy: { loggedAt: 'desc' },
          take: 1,
        },
      },
    });
  }
  async getChainOfCustody() {
    const now = new Date();
    const activeWOs = await this.prisma.workOrder.findMany({
      where: { stage: { notIn: ['CLOSED', 'CANCELLED'] } },
      include: {
        lead: true,
        logs: { orderBy: { loggedAt: 'desc' } },
      },
      take: 10,
    });

    const stages = [
      'WAITING_MATERIAL',
      'MIXING',
      'FILLING',
      'PACKING',
      'FINISHED_GOODS',
    ];

    return activeWOs.map((wo) => {
      const flow = stages.map((st) => {
        const log = wo.logs.find((l) => l.stage === st);
        return {
          stage: st,
          qty: log ? Number(log.goodQty) : null,
          isCompleted:
            stages.indexOf(wo.stage as any) >= stages.indexOf(st as any),
        };
      });

      const latestLog = wo.logs[0];
      const isOverdue =
        wo.targetCompletion < now && wo.stage !== 'FINISHED_GOODS';
      const hasDefects = wo.logs.some((l) => Number(l.rejectQty) > 0);
      const diffDays = Math.ceil(
        (wo.targetCompletion.getTime() - now.getTime()) / (1000 * 3600 * 24),
      );

      return {
        id: wo.id,
        woNumber: wo.woNumber,
        productName:
          wo.lead?.productInterest || wo.lead?.brandName || 'Unnamed Product',
        flow,
        deadline: wo.targetCompletion,
        status: wo.stage,
        diffDays,
        anomalyStatus: isOverdue
          ? 'LATE'
          : hasDefects
            ? 'QUALITY_ISSUE'
            : 'STABLE',
        reason: latestLog?.notes || 'Processing normally',
      };
    });
  }
  async getWarehousePreparation() {
    const now = new Date();
    const preps = await this.prisma.workOrder.findMany({
      where: {
        stage: { in: ['WAITING_MATERIAL'] },
      },
      include: {
        lead: true,
        logs: { orderBy: { loggedAt: 'desc' }, take: 5 },
        requisitions: {
          include: {
            material: true,
          },
        },
      },
      orderBy: { targetCompletion: 'asc' },
    });

    return preps.map((wo) => {
      const totalRequested = wo.requisitions.reduce(
        (sum, r) => sum + Number(r.qtyRequested),
        0,
      );
      const totalIssued = wo.requisitions.reduce(
        (sum, r) => sum + Number(r.qtyIssued),
        0,
      );
      const completeness =
        totalRequested > 0 ? (totalIssued / totalRequested) * 100 : 0;

      const latestLog = wo.logs[0];
      const isOverdue =
        wo.targetCompletion < now && wo.stage !== 'FINISHED_GOODS';
      const hasDefects = wo.logs.some((l: any) => Number(l.rejectQty) > 0);

      return {
        id: wo.id,
        woNumber: wo.woNumber,
        productName:
          wo.lead?.productInterest || wo.lead?.brandName || 'Unnamed Product',
        completeness: parseFloat(completeness.toFixed(1)),
        status:
          completeness >= 100
            ? 'READY'
            : totalIssued > 0
              ? 'PICKING'
              : 'PENDING',
        estimatedDelivery: wo.targetCompletion,
        diffDays: Math.ceil(
          (wo.targetCompletion.getTime() - now.getTime()) / (1000 * 3600 * 24),
        ),
        anomalyStatus: isOverdue
          ? 'LATE'
          : hasDefects
            ? 'QUALITY_ISSUE'
            : 'STABLE',
        reason: latestLog?.notes || 'Materials pending',
      };
    });
  }
  async getBatchGranularAudit() {
    const now = new Date();
    const activeWOs = await this.prisma.workOrder.findMany({
      where: { stage: { notIn: ['CLOSED', 'CANCELLED'] } },
      include: {
        lead: true,
        logs: { orderBy: { loggedAt: 'desc' } },
        schedules: true,
      },
      orderBy: { targetCompletion: 'asc' },
    });

    const ALL_STAGES = [
      'WAITING_MATERIAL',
      'MIXING',
      'FILLING',
      'PACKING',
      'FINISHED_GOODS',
    ];

    return activeWOs.map((wo) => {
      const diffDays = Math.ceil(
        (wo.targetCompletion.getTime() - now.getTime()) / (1000 * 3600 * 24),
      );
      const deadlineHeader =
        diffDays < 0 ? `LATE ${Math.abs(diffDays)} DAYS` : `H-${diffDays}`;

      const qtyDefect = wo.logs.reduce(
        (acc, l) => acc + Number(l.rejectQty || 0),
        0,
      );
      const totalInput = Number(
        wo.logs.find((l) => l.stage === 'MIXING')?.inputQty || wo.targetQty,
      );
      const defectRate = totalInput > 0 ? (qtyDefect / totalInput) * 100 : 0;

      let healthScore = 'ACTIVE';
      if (diffDays < 0 || defectRate > 5) healthScore = 'ANOMALY';
      else if (diffDays <= 2 || defectRate > 2) healthScore = 'WARNING';

      const currentStageIdx = ALL_STAGES.indexOf(wo.stage as any);

      const flow = ALL_STAGES.map((st, idx) => {
        let status = 'PENDING';
        if (idx < currentStageIdx) status = 'COMPLETED';
        if (idx === currentStageIdx) status = 'ACTIVE';
        if (wo.stage === 'FINISHED_GOODS') status = 'COMPLETED';
        return { stage: st, status };
      });

      return {
        id: wo.id,
        woNumber: wo.woNumber,
        productName: wo.lead?.brandName
          ? `${wo.lead.brandName} - ${wo.lead.productInterest}`
          : 'Unknown',
        clientName: wo.lead?.clientName || 'Unknown',
        currentStage: wo.stage,
        batchVol: wo.targetQty,
        estCompletion: wo.targetCompletion,
        qtyDefect,
        healthScore,
        deadlineHeader,
        flow,
      };
    });
  }
  async getProductionLeads() {
    return this.prisma.salesLead.findMany({
      where: {
        status: { in: ['SPK_SIGNED', 'WON_DEAL', 'PRODUCTION_PLAN'] },
      },
      select: {
        id: true,
        clientName: true,
        brandName: true,
        productInterest: true,
      },
      orderBy: { brandName: 'asc' },
    });
  }
  async getMicroFlowDiagnostics() {
    const activeWOs = await this.prisma.workOrder.findMany({
      where: {
        stage: {
          notIn: ['FINISHED_GOODS', 'DELIVERED', 'CLOSED', 'CANCELLED'],
        },
      },
      include: { logs: { orderBy: { loggedAt: 'desc' } } },
    });

    const stages = ['WAITING_MATERIAL', 'MIXING', 'FILLING', 'PACKING'];

    return stages.map((stage, idx) => {
      const wosAtStage = activeWOs.filter((wo) => wo.stage === stage);
      const batchCount = wosAtStage.length;
      const totalUnits = wosAtStage.reduce((sum, wo) => sum + wo.targetQty, 0);

      // Calculate Wait Time (Mocked for existing but ready for real delta logic)
      // Real logic: AVG(currentStage.startTime - prevStage.endTime)
      const waitTime = batchCount > 2 ? '45m' : batchCount > 0 ? '12m' : '0m';
      const heat =
        batchCount > 3 ? 'CRITICAL' : batchCount > 1 ? 'BUSY' : 'STABLE';

      return {
        stage,
        batchCount,
        totalUnits,
        waitTime,
        heat,
      };
    });
  }
  async getWorkOrders(userId?: string) {
    const where: any = {};
    if (userId) {
      where.lead = { bdId: userId };
    }
    return this.prisma.workOrder.findMany({
      where,
      include: {
        lead: {
          select: {
            clientName: true,
            brandName: true,
            productInterest: true,
            sampleRequests: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: { productName: true },
            },
          },
        },
        requisitions: {
          include: {
            material: {
              select: { id: true, code: true, name: true, unit: true },
            },
          },
        },
        logs: { orderBy: { loggedAt: 'desc' }, take: 1 },
      },
      orderBy: { woNumber: 'asc' },
    });
  }
  async getActiveWorkOrders() {
    return this.prisma.workOrder.findMany({
      where: {
        stage: {
          notIn: ['FINISHED_GOODS', 'DELIVERED', 'CLOSED', 'CANCELLED'],
        },
      },
      include: {
        lead: {
          select: { clientName: true, brandName: true, productInterest: true },
        },
        logs: {
          orderBy: { loggedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { woNumber: 'asc' },
    });
  }
  async getExecutiveSummary() {
    const [yieldAgg, stagesCounts, shrinkageAgg] = await Promise.all([
      this.prisma.productionLog.aggregate({
        _sum: {
          goodQty: true,
          rejectQty: true,
          quarantineQty: true,
        },
      }),
      this.prisma.workOrder.groupBy({
        by: ['stage'],
        _count: { _all: true },
        where: {
          NOT: { stage: { in: ['FINISHED_GOODS', 'CLOSED', 'CANCELLED'] } },
        },
      }),
      this.prisma.productionLog.groupBy({
        by: ['stage'],
        _sum: {
          goodQty: true,
          rejectQty: true,
        },
      }),
    ]);

    // Calculate Global Yield
    const totalGood = Number(yieldAgg._sum.goodQty || 0);
    const totalLost =
      Number(yieldAgg._sum.rejectQty || 0) +
      Number(yieldAgg._sum.quarantineQty || 0);
    const globalYield = totalGood / (totalGood + totalLost || 1);

    // Shrinkage by Stage
    const stageShrinkage = shrinkageAgg.map((item) => ({
      stage: item.stage,
      rate: (
        (Number(item._sum.rejectQty || 0) /
          (Number(item._sum.goodQty || 0) + Number(item._sum.rejectQty || 0) ||
            1)) *
        100
      ).toFixed(1),
    }));

    return {
      stats: {
        totalGood,
        totalLost,
        yieldPercentage: (globalYield * 100).toFixed(1),
        activeBatches: stagesCounts.reduce(
          (a: number, b: any) => a + b._count._all,
          0,
        ),
      },
      stageShrinkage,
    };
  }
  async getQCStats() {
    const [audits, qcedLogs, copqRecords] = await Promise.all([
      this.prisma.qCAudit.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.productionLog.findMany({
        where: { quarantineQty: { gt: 0 } },
      }),
      this.prisma.cOPQRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const totalInspected = audits.length;
    const passed = audits.filter((a: any) => a.status === 'GOOD').length;
    const rejected = audits.filter((a: any) => a.status === 'REJECT').length;
    const quarantined = audits.filter(
      (a: any) => a.status === 'QUARANTINE',
    ).length;

    const passRate =
      totalInspected > 0
        ? ((passed / totalInspected) * 100).toFixed(1)
        : '100.0';
    const firstPassCount = audits.filter(
      (a: any, i: number, arr: any[]) =>
        a.status === 'GOOD' &&
        arr.findIndex((x: any) => x.stepLogId === a.stepLogId) === i,
    ).length;
    const fty =
      totalInspected > 0
        ? ((firstPassCount / totalInspected) * 100).toFixed(1)
        : '100.0';

    const totalCopq = copqRecords.reduce(
      (sum, r) => sum + Number(r.totalLoss),
      0,
    );
    const leakage =
      totalInspected > 0
        ? ((rejected / totalInspected) * 100).toFixed(2)
        : '0.00';

    const recentAnomalies = audits
      .filter((a: any) => a.status === 'REJECT')
      .slice(0, 5)
      .map((a: any) => ({
        id: a.id.substring(0, 8).toUpperCase(),
        batchId: a.stepLogId?.substring(0, 8).toUpperCase() || '—',
        defect: a.notes || 'Rejected',
        severity: 'Critical',
        action: 'On Hold',
      }));

    return {
      passRate,
      fty,
      totalInspected,
      passed,
      rejected,
      pending: Math.max(0, qcedLogs.length - totalInspected),
      copq: totalCopq,
      leakage: parseFloat(leakage),
      holdAnomaly: quarantined,
      anomalies: recentAnomalies,
      complianceScore: parseFloat(passRate),
      trends: [
        { day: 'Mon', count: 12 },
        { day: 'Tue', count: 15 },
        { day: 'Wed', count: 8 },
        { day: 'Thu', count: 20 },
        { day: 'Fri', count: 14 },
      ],
    };
  }
  async getFloorData() {
    const activeWOs = await this.prisma.workOrder.findMany({
      where: {
        stage: {
          notIn: ['CLOSED', 'CANCELLED', 'FINISHED_GOODS', 'DELIVERED'],
        },
      },
      include: {
        lead: {
          select: { clientName: true, brandName: true, productInterest: true },
        },
        logs: { orderBy: { loggedAt: 'desc' }, take: 1 },
        schedules: {
          include: { machine: true },
          orderBy: { startTime: 'desc' },
          take: 1,
        },
      },
      orderBy: { targetCompletion: 'asc' },
    });

    const STAGES = [
      'PLANNING',
      'WAITING_MATERIAL',
      'WAITING_PROCUREMENT',
      'READY_TO_PRODUCE',
      'MIXING',
      'PENDING_QC',
      'QC_HOLD',
      'REWORK',
      'FILLING',
      'PACKING',
      'FINISHED_GOODS',
    ];

    const floorData = STAGES.reduce(
      (acc, stage) => {
        const wos = activeWOs.filter((wo) => wo.stage === stage);
        acc[stage] = wos.map((wo) => {
          const latestLog = wo.logs[0];
          const latestSchedule = wo.schedules[0];
          const now = new Date();
          const isOverdue = wo.targetCompletion < now;
          const hasReject = wo.logs.some((l) => Number(l.rejectQty) > 0);
          const stalledHours = latestLog?.loggedAt
            ? Math.round(
                (now.getTime() - latestLog.loggedAt.getTime()) /
                  (1000 * 60 * 60),
              )
            : 0;

          let health: 'ON_TRACK' | 'DELAYED' | 'CRITICAL' = 'ON_TRACK';
          if (isOverdue && stalledHours > 4) health = 'CRITICAL';
          else if (isOverdue || hasReject) health = 'DELAYED';

          return {
            id: wo.id,
            woNumber: wo.woNumber,
            productName:
              wo.lead?.productInterest || wo.lead?.brandName || 'Unnamed',
            clientName: wo.lead?.clientName || '',
            targetQty: wo.targetQty,
            targetCompletion: wo.targetCompletion,
            operatorId: latestLog?.operatorId || null,
            machineName: latestSchedule?.machine?.name || null,
            stageDuration:
              latestLog?.loggedAt && latestLog?.startTime
                ? Math.round(
                    (latestLog.loggedAt.getTime() -
                      latestLog.startTime.getTime()) /
                      60000,
                  )
                : null,
            timeSinceUpdate: stalledHours,
            health,
            hasReject,
            isOverdue,
          };
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return {
      stages: floorData,
      totalActive: activeWOs.length,
      timestamp: new Date(),
    };
  }
  async getLeakageData() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [allLogs, allSchedules, allQcAudits] = await Promise.all([
      this.prisma.productionLog.findMany({
        where: { loggedAt: { gte: thirtyDaysAgo } },
        include: {
          workOrder: { include: { lead: true } },
        },
        orderBy: { loggedAt: 'desc' },
      }),
      this.prisma.productionSchedule.findMany({
        where: { startTime: { gte: thirtyDaysAgo } },
        include: {
          stepDetails: true,
          workOrder: true,
          machine: true,
        },
      }),
      this.prisma.qCAudit.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const materialLeakage: any[] = [];
    const timeLeakage: any[] = [];
    const weightDeviation: any[] = [];
    const missingQCGate: any[] = [];
    const sequenceViolation: any[] = [];
    const rejectSpikes: any[] = [];

    // 1. Material Leakage: inputQty vs goodQty per stage
    const woLogMap = new Map<string, any[]>();
    for (const log of allLogs) {
      if (!log.workOrderId) continue;
      const arr = woLogMap.get(log.workOrderId) || [];
      arr.push(log);
      woLogMap.set(log.workOrderId, arr);
    }

    for (const [, logs] of woLogMap) {
      for (const log of logs) {
        const input = Number(log.inputQty);
        const good = Number(log.goodQty);
        const reject = Number(log.rejectQty);
        const quarantine = Number(log.quarantineQty);
        const shrinkage = Number(log.shrinkageQty || 0);
        const accountedOutput = good + reject + quarantine + shrinkage;
        if (input > 0) {
          const lossPct = ((input - accountedOutput) / input) * 100;
          if (lossPct > 2) {
            materialLeakage.push({
              woNumber: log.workOrder?.woNumber || 'N/A',
              stage: log.stage,
              input,
              output: accountedOutput,
              good,
              reject,
              quarantine,
              shrinkage,
              loss: input - accountedOutput,
              lossPct: parseFloat(lossPct.toFixed(2)),
              productName: log.workOrder?.lead?.productInterest || 'N/A',
              detectedAt: log.loggedAt,
            });
          }
        }
      }
    }

    // 2. Weight Deviation: step detail theoretical vs actual
    for (const schedule of allSchedules) {
      for (const detail of schedule.stepDetails) {
        if (detail.qtyActual && detail.qtyTheoretical) {
          const theoretical = Number(detail.qtyTheoretical);
          const actual = Number(detail.qtyActual);
          const devPct = (Math.abs(actual - theoretical) / theoretical) * 100;
          if (devPct > 0.5) {
            weightDeviation.push({
              woNumber: schedule.workOrder?.woNumber || 'N/A',
              scheduleId: schedule.id,
              stage: schedule.stage,
              materialId: detail.materialId,
              materialCode: detail.materialCode,
              theoretical,
              actual,
              devPct: parseFloat(devPct.toFixed(2)),
            });
          }
        }
      }
    }

    // 3. Missing QC Gate: completed schedules without QC audit
    for (const schedule of allSchedules.filter(
      (s) => s.status === 'COMPLETED',
    )) {
      const hasQc = allQcAudits.some((a) => a.stepLogId === schedule.id);
      if (!hasQc) {
        missingQCGate.push({
          scheduleId: schedule.id,
          woNumber: schedule.workOrder?.woNumber || 'N/A',
          stage: schedule.stage,
          machineName: schedule.machine?.name || 'N/A',
          completedAt: schedule.endTime,
        });
      }
    }

    // 4. Reject Spikes: per machine per day
    const machineRejectMap = new Map<
      string,
      { total: number; count: number }
    >();
    for (const log of allLogs) {
      if (!log.machineId) continue;
      const key = `${log.machineId}_${log.loggedAt.toISOString().slice(0, 10)}`;
      const existing = machineRejectMap.get(key) || { total: 0, count: 0 };
      existing.total += Number(log.rejectQty);
      existing.count += Number(log.goodQty) + Number(log.rejectQty);
      machineRejectMap.set(key, existing);
    }

    for (const [key, val] of machineRejectMap) {
      const rate = val.count > 0 ? (val.total / val.count) * 100 : 0;
      if (rate > 10) {
        const [machineId, dateStr] = key.split('_');
        rejectSpikes.push({
          machineId,
          date: dateStr,
          rejectRate: parseFloat(rate.toFixed(1)),
          totalReject: val.total,
          totalOutput: val.count,
        });
      }
    }

    // 5. Sequence Violation: check if stages were skipped
    for (const [, logs] of woLogMap) {
      const sortedLogs = logs.sort(
        (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime(),
      );
      const stageOrder = [
        'PLANNING',
        'WAITING_MATERIAL',
        'MIXING',
        'FILLING',
        'PACKING',
        'FINISHED_GOODS',
      ];
      let lastIdx = -1;
      for (const log of sortedLogs) {
        const idx = stageOrder.indexOf(log.stage);
        if (idx >= 0) {
          if (lastIdx >= 0 && idx > lastIdx + 1) {
            sequenceViolation.push({
              woNumber: log.workOrder?.woNumber || 'N/A',
              fromStage: stageOrder[lastIdx],
              attemptedStage: log.stage,
              skippedStages: stageOrder.slice(lastIdx + 1, idx),
              detectedAt: log.loggedAt,
            });
          }
          lastIdx = idx;
        }
      }
    }

    // 6. Time Leakage: gap between consecutive stage logs > 4h threshold
    for (const [, logs] of woLogMap) {
      const sortedLogs = logs.sort(
        (a, b) => a.loggedAt.getTime() - b.loggedAt.getTime(),
      );
      for (let i = 1; i < sortedLogs.length; i++) {
        const prev = sortedLogs[i - 1];
        const curr = sortedLogs[i];
        const gapHours =
          (curr.loggedAt.getTime() - prev.loggedAt.getTime()) /
          (1000 * 60 * 60);
        if (gapHours > 4) {
          timeLeakage.push({
            woNumber: curr.workOrder?.woNumber || 'N/A',
            fromStage: prev.stage,
            toStage: curr.stage,
            gapHours: parseFloat(gapHours.toFixed(1)),
            prevTime: prev.loggedAt,
            currTime: curr.loggedAt,
            productName: curr.workOrder?.lead?.productInterest || 'N/A',
          });
        }
      }
    }

    return {
      materialLeakage: materialLeakage.slice(0, 50),
      timeLeakage: timeLeakage.slice(0, 50),
      weightDeviation: weightDeviation.slice(0, 50),
      missingQCGate: missingQCGate.slice(0, 50),
      sequenceViolation: sequenceViolation.slice(0, 50),
      rejectSpikes: rejectSpikes.slice(0, 50),
      summary: {
        totalAnomalies:
          materialLeakage.length +
          timeLeakage.length +
          weightDeviation.length +
          missingQCGate.length +
          sequenceViolation.length +
          rejectSpikes.length,
        criticalCount:
          materialLeakage.filter((l) => l.lossPct > 10).length +
          rejectSpikes.filter((r) => r.rejectRate > 20).length,
      },
    };
  }
  async getWorkOrderTimeline(woId: string) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: woId },
      include: {
        lead: true,
        plan: {
          include: {
            stepLogs: {
              include: {
                qcAudits: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
        logs: {
          include: { machine: true, operator: true },
          orderBy: { loggedAt: 'asc' },
        },
        schedules: {
          include: {
            stepDetails: { include: { material: true } },
            machine: true,
          },
        },
        requisitions: { include: { material: true, fulfillments: true } },
      },
    });

    if (!wo) throw new NotFoundException('Work Order not found');

    const stepLogAuditMap = new Map<string, string | null>();
    for (const sl of wo.plan?.stepLogs || []) {
      stepLogAuditMap.set(sl.stage, sl.qcAudits[0]?.status || null);
    }

    const timeline = wo.logs.map((log) => ({
      stage: log.stage,
      startTime: log.startTime,
      endTime: log.loggedAt,
      durationMin:
        log.startTime && log.loggedAt
          ? Math.round(
              (log.loggedAt.getTime() - log.startTime.getTime()) / 60000,
            )
          : 0,
      inputQty: Number(log.inputQty),
      goodQty: Number(log.goodQty),
      rejectQty: Number(log.rejectQty),
      quarantineQty: Number(log.quarantineQty),
      shrinkageQty: Number(log.shrinkageQty),
      machineName: log.machine?.name || null,
      operatorName: log.operator?.fullName || null,
      downtimeMinutes: log.downtimeMinutes,
      laborCost: log.laborCost ? Number(log.laborCost) : null,
      overheadCost: log.overheadCost ? Number(log.overheadCost) : null,
      qcStatus: stepLogAuditMap.get(log.stage as any) || null,
      notes: log.notes,
    }));

    const totalInput = wo.logs.reduce((s, l) => s + Number(l.inputQty), 0);
    const totalGood = wo.logs.reduce((s, l) => s + Number(l.goodQty), 0);
    const totalReject = wo.logs.reduce((s, l) => s + Number(l.rejectQty), 0);
    const totalShrinkage = wo.logs.reduce(
      (s, l) => s + Number(l.shrinkageQty),
      0,
    );
    const totalDowntime = wo.logs.reduce((s, l) => s + l.downtimeMinutes, 0);
    const totalLaborCost = wo.logs.reduce(
      (s, l) => s + Number(l.laborCost || 0),
      0,
    );
    const totalOverheadCost = wo.logs.reduce(
      (s, l) => s + Number(l.overheadCost || 0),
      0,
    );

    return {
      woNumber: wo.woNumber,
      productName: wo.lead?.productInterest || wo.lead?.brandName || 'Unnamed',
      clientName: wo.lead?.clientName || '',
      targetQty: wo.targetQty,
      targetCompletion: wo.targetCompletion,
      currentStage: wo.stage,
      timeline,
      massBalance: {
        totalInput,
        totalGood,
        totalReject,
        totalShrinkage,
        leakage: totalInput - totalGood - totalReject - totalShrinkage,
        leakagePct:
          totalInput > 0
            ? parseFloat(
                (
                  ((totalInput - totalGood - totalReject - totalShrinkage) /
                    totalInput) *
                  100
                ).toFixed(2),
              )
            : 0,
        effectiveYield:
          totalInput > 0
            ? parseFloat(((totalGood / totalInput) * 100).toFixed(2))
            : 0,
      },
      costing: {
        totalLaborCost,
        totalOverheadCost,
        totalCost: totalLaborCost + totalOverheadCost,
        actualCogs: wo.actualCogs ? Number(wo.actualCogs) : null,
        targetHpp: wo.targetHpp ? Number(wo.targetHpp) : null,
      },
      schedules: wo.schedules.map((s) => ({
        id: s.id,
        stage: s.stage,
        scheduleNumber: s.scheduleNumber,
        machineName: s.machine?.name,
        startTime: s.startTime,
        endTime: s.endTime,
        targetQty: s.targetQty,
        resultQty: s.resultQty,
        status: s.status,
        components: s.stepDetails.map((d) => ({
          materialCode: d.materialCode,
          materialName: d.material?.name,
          category: d.category,
          qtyTheoretical: Number(d.qtyTheoretical),
          qtyActual: d.qtyActual ? Number(d.qtyActual) : null,
        })),
      })),
    };
  }
}
