import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * ProductionCapacityService — Domain service for line capacity forecasting, machine utilization, and workload distribution.
 *
 * Responsibilities:
 * - Real-time shop floor status across all stages, stalled order health, and machine assignments
 * - Micro-flow diagnostics and bottleneck / heat detection across stages
 * - Warehouse preparation & material readiness tracking
 * - Chain of custody multi-stage flow tracking
 * - Work order queries and active production leads
 */
@Injectable()
export class ProductionCapacityService {
  constructor(private prisma: PrismaService) {}

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
}
