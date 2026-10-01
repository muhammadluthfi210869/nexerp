import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { ProductionCapacityService } from './production-capacity.service';

/**
 * ProductionKpiService — Domain service for production KPI, yield, batch cycle times, and dashboards.
 *
 * Responsibilities:
 * - High-level Month-to-Date executive dashboard analytics & anomaly detection
 * - Global yields, scrap rates, and shrinkage aggregations by stage
 * - Granular batch audits and step logs with QC audit linkage
 * - Work order production audit and full timeline / mass balance / costing diagnostics
 */
@Injectable()
export class ProductionKpiService {
  private capacityService: ProductionCapacityService;

  constructor(
    private prisma: PrismaService,
    @Optional() capacityService?: ProductionCapacityService,
  ) {
    this.capacityService =
      capacityService || new ProductionCapacityService(prisma);
  }

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

    // Anomaly Detection (Rule based)
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

    // Precision PCS Tracking (Tabel IV)
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

    const workshops_detail =
      await this.capacityService.getMicroFlowDiagnostics();

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
