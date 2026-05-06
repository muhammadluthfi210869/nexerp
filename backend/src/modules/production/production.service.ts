import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { LifecycleStatus, Prisma } from '@prisma/client';

// Alias for backward compatibility in production logic
// LifecycleStatus is replaced by LifecycleStatus

import { LegalityService } from '../legality/legality.service';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { IdGeneratorService } from '../system/id-generator.service';

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private legality: LegalityService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  async startProduction(
    workOrderId: string,
    machineId?: string,
    operatorId?: string,
  ) {
    // 1. Validation: Check if Warehouse has released material
    const pendingReqs = await this.prisma.materialRequisition.findMany({
      where: {
        workOrderId: workOrderId,
        status: { in: ['PENDING', 'SHORTAGE', 'PARTIAL'] },
      },
    });

    if (pendingReqs.length > 0) {
      throw new BadRequestException(
        'Warehouse has not fully released materials yet (Handover Lock)',
      );
    }

    // 2. DESIGN GATE: Check for Approved Packaging
    const woData = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { lead: { include: { designTasks: true } } },
    });

    if (!woData) throw new BadRequestException('Work Order not found');

    const approvedDesigns = woData.lead.designTasks.filter(
      (t) => t.isFinal || t.kanbanState === 'LOCKED',
    );
    if (approvedDesigns.length === 0) {
      throw new BadRequestException(
        'CRITICAL_GATE: Packaging Design has not been approved for this brand yet. Handover blocked.',
      );
    }

    // 3. ACID Transaction: Start Production with Event Tracking
    return await this.prisma
      .$transaction(async (tx: any) => {
        const wo = await tx.workOrder.update({
          where: { id: workOrderId },
          data: { stage: LifecycleStatus.MIXING },
        });

        await tx.productionLog.create({
          data: {
            logNumber: await this.idGenerator.generateStageId(
              LifecycleStatus.MIXING,
            ),
            workOrderId: wo.id,
            stage: LifecycleStatus.MIXING,
            inputQty: wo.targetQty,
            goodQty: 0,
            quarantineQty: 0,
            rejectQty: 0,
            startTime: new Date(),
            machineId,
            operatorId,
            notes: 'SYSTEM: PRODUCTION_STARTED_OEE_ACTIVE',
          },
        });

        if (machineId) {
          await tx.machine.update({
            where: { id: machineId },
            data: { status: 'BUSY' },
          });
        }

        return {
          message: 'Production started. OEE sequence initiated.',
          woNumber: wo.woNumber,
          startTime: new Date(),
        };
      })
      .then((result) => {
        this.eventEmitter.emit('production.work_order.started', {
          workOrderId,
          woNumber: result.woNumber,
          startTime: result.startTime,
          machineId,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Production started for ${result.woNumber}`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async startStage(
    workOrderId: string,
    stage: LifecycleStatus,
    machineId: string,
    operatorId: string,
  ) {
    const logNumber = await this.idGenerator.generateStageId(stage);
    return await this.prisma.productionLog.create({
      data: {
        logNumber,
        workOrderId,
        stage,
        inputQty: 0, // Will be updated on submit
        goodQty: 0,
        quarantineQty: 0,
        rejectQty: 0,
        startTime: new Date(),
        machineId,
        operatorId,
        notes: `EVENT: STAGE_${stage}_STARTED`,
      },
    });
  }

  async reportBreakdown(
    workOrderId: string,
    stage: LifecycleStatus,
    machineId: string,
    notes: string,
  ) {
    return await this.prisma
      .$transaction(async (tx: any) => {
        // Update Machine Status
        await tx.machine.update({
          where: { id: machineId },
          data: { status: 'DOWN' },
        });

        // Log the Incident
        return await tx.productionLog.create({
          data: {
            workOrderId,
            stage,
            inputQty: 0,
            goodQty: 0,
            quarantineQty: 0,
            rejectQty: 0,
            notes: `CRITICAL_ALERT: BREAKDOWN - ${notes}`,
            downtimeMinutes: 0, // Still active
          },
        });
      })
      .then((result) => {
        this.eventEmitter.emit('production.breakdown.reported', {
          workOrderId,
          stage,
          machineId,
          notes,
          logId: result.id,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Breakdown reported: ${notes}`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async submitStageLog(workOrderId: string, dto: any) {
    const {
      stage,
      inputQty,
      goodQty,
      quarantineQty,
      rejectQty,
      notes,
      nextStage,
      machineId,
      downtimeMinutes,
    } = dto;

    return await this.prisma
      .$transaction(async (tx: any) => {
        const wo = await tx.workOrder.findUnique({
          where: { id: workOrderId },
        });
        if (!wo) throw new BadRequestException('Work Order not found');

        // Find THE existing log for this stage to calculate duration
        const activeLog = await tx.productionLog.findFirst({
          where: { workOrderId, stage, goodQty: 0, rejectQty: 0 },
          orderBy: { startTime: 'desc' },
        });

        const startTime = activeLog?.startTime || new Date();
        const endTime = new Date();
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMin = Math.round(durationMs / 60000);

        const logNumber = await this.idGenerator.generateStageId(stage);

        // Create/Update Final Log for this stage
        await tx.productionLog.create({
          data: {
            logNumber,
            stage,
            inputQty: Number(inputQty || 0),
            goodQty: Number(goodQty || 0),
            quarantineQty: Number(quarantineQty || 0),
            rejectQty: Number(rejectQty || 0),
            startTime,
            loggedAt: endTime,
            machineId,
            downtimeMinutes: Number(downtimeMinutes || 0),
            notes: notes || `RELAY_COMPLETED: Duration ${durationMin}m`,
            workOrder: workOrderId
              ? { connect: { id: workOrderId } }
              : undefined,
            plan: wo?.planId ? { connect: { id: wo.planId } } : undefined,
            // Phase 2: HPP Snapshot & Batch Tracking
            unitValueAtTransaction: dto.unitValueAtTransaction || 0,
            materialInventoryId: dto.materialInventoryId,
          },
        });

        // --- PHASE 2: FTY & COPQ LOGIC ---
        if (Number(rejectQty) > 0 || Number(quarantineQty) > 0) {
          // If any issue occurs, it's no longer a First Pass (FTY)
          await tx.productionPlan.update({
            where: { id: wo.planId || '' },
            data: { isFirstPass: false },
          });

          if (Number(rejectQty) > 0) {
            await this.calculateCOPQ(tx, workOrderId, stage, Number(rejectQty));
          }
        }

        if (machineId) {
          await tx.machine.update({
            where: { id: machineId },
            data: { isActive: true },
          });
        }

        if (nextStage) {
          // PRODUCTION GATE: Filling & Packing require BPOM Number
          if (
            nextStage === LifecycleStatus.FILLING ||
            nextStage === LifecycleStatus.PACKING
          ) {
            const gate = await this.legality.checkProductionGate(wo.leadId);
            if (!gate.allowed) {
              throw new ForbiddenException(gate.reason);
            }
          }

          const targetStage =
            Number(quarantineQty) > 0 ? LifecycleStatus.PENDING_QC : nextStage;
          await tx.workOrder.update({
            where: { id: workOrderId },
            data: { stage: targetStage },
          });
        }

        return {
          message: `Stage ${stage} finalized. Duration: ${durationMin} min.`,
          durationMin,
          nextStage,
        };
      })
      .then((result) => {
        this.eventEmitter.emit('production.stage.completed', {
          workOrderId,
          stage,
          nextStage: result.nextStage,
          durationMin: result.durationMin,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Stage ${stage} completed for WO ${workOrderId}`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return { message: result.message, durationMin: result.durationMin };
      });
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
          avgCycle:
            totalOrders > 0
              ? `${Math.round(totalActualUnits / totalOrders)} unit/batch`
              : '0 unit/batch',
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
        qcAudits: { select: { status: true, createdAt: true } },
      },
      orderBy: { loggedAt: 'desc' },
    });
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
      qcAudits: l.qcAudits,
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

  async createWorkOrder(dto: {
    leadId: string;
    targetQty: number;
    targetCompletion: string | Date;
    notes?: string;
  }) {
    const woNumber = await this.idGenerator.generateId('WO');

    return this.prisma.$transaction(async (tx: any) => {
      const wo = await tx.workOrder.create({
        data: {
          woNumber,
          leadId: dto.leadId,
          targetQty: dto.targetQty,
          targetCompletion: new Date(dto.targetCompletion),
          stage: 'WAITING_MATERIAL',
        },
        include: { lead: true },
      });

      // Phase 3: Create Material Requisition automatically for Warehouse
      // We'll create a summary requisition for the batch
      await tx.materialRequisition.create({
        data: {
          workOrderId: wo.id,
          qtyRequested: dto.targetQty, // Placeholder for actual formula-based qty
          materialId: (await tx.materialItem.findFirst({}))?.id || '', // Just a dummy link for prototype
        },
      });

      this.eventEmitter.emit('production.work_order.created', {
        workOrderId: wo.id,
        woNumber: wo.woNumber,
        leadId: dto.leadId,
        targetQty: dto.targetQty,
      });
      this.eventEmitter.emit('activity.logged', {
        senderDivision: 'PRODUCTION',
        notes: `Work Order ${wo.woNumber} created for lead ${dto.leadId}`,
        loggedBy: 'SYSTEM:PRODUCTION',
      });

      return wo;
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

  async getWorkOrders() {
    return this.prisma.workOrder.findMany({
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

  // --- PHASE 1: WAREHOUSE COMMANDS ---
  async issueMaterial(requisitionId: string) {
    return await this.prisma
      .$transaction(async (tx: any) => {
        const requisition = await tx.materialRequisition.findUnique({
          where: { id: requisitionId },
          include: { material: true },
        });

        if (!requisition)
          throw new BadRequestException('Requisition not found');

        // Validate stock availability
        if (
          Number(requisition.material.stockQty) <
          Number(requisition.qtyRequested)
        ) {
          throw new BadRequestException({
            code: 'INSUFFICIENT_STOCK',
            message: `Stock不足: ${requisition.material.name} — tersedia ${Number(requisition.material.stockQty)} ${requisition.material.unit}, dibutuhkan ${Number(requisition.qtyRequested)}`,
          });
        }

        // Decrement stock
        await tx.materialItem.update({
          where: { id: requisition.materialId },
          data: { stockQty: { decrement: Number(requisition.qtyRequested) } },
        });

        // Log InventoryTransaction
        await tx.inventoryTransaction.create({
          data: {
            materialId: requisition.materialId,
            type: 'OUTBOUND',
            quantity: Number(requisition.qtyRequested),
            referenceNo:
              requisition.reqNumber || `REQ-${requisition.id.slice(0, 8)}`,
            notes: `ISSUED to WorkOrder ${requisition.workOrderId}`,
            performedBy: 'SYSTEM:PRODUCTION',
          },
        });

        const updated = await tx.materialRequisition.update({
          where: { id: requisitionId },
          data: {
            status: 'ISSUED',
            qtyIssued: { increment: Number(requisition.qtyRequested) },
          },
          include: { workOrder: true },
        });

        // Create a production log to notify that material is released
        await tx.productionLog.create({
          data: {
            workOrderId: requisition.workOrderId,
            stage: updated.workOrder.stage,
            inputQty: 0,
            goodQty: 0,
            quarantineQty: 0,
            rejectQty: 0,
            notes: `WAREHOUSE_ACTION: MATERIAL_RELEASED (${requisition.id}) — ${Number(requisition.qtyRequested)} ${requisition.material.unit} deducted`,
          },
        });

        return updated;
      })
      .then((result) => {
        this.eventEmitter.emit('production.material.issued', {
          requisitionId,
          workOrderId: result.workOrderId,
          qtyIssued: Number(result.qtyIssued),
        });
        this.eventEmitter.emit('warehouse.material.issued', {
          requisitionId,
          workOrderId: result.workOrderId,
          qtyIssued: Number(result.qtyIssued),
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Materials issued for requisition ${result.id} — stock decremented`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async flagShortage(requisitionId: string) {
    return await this.prisma
      .$transaction(async (tx: any) => {
        const requisition = await tx.materialRequisition.update({
          where: { id: requisitionId },
          data: { status: 'SHORTAGE' },
          include: { workOrder: true },
        });

        // Escalation: Update WO status to WAITING_PROCUREMENT
        await tx.workOrder.update({
          where: { id: requisition.workOrderId },
          data: { stage: 'WAITING_PROCUREMENT' },
        });

        return requisition;
      })
      .then((result) => {
        this.eventEmitter.emit('production.material.shortage', {
          requisitionId,
          workOrderId: result.workOrderId,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Material shortage flagged for requisition ${result.id}`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async getPendingAudits() {
    return this.prisma.productionLog.findMany({
      where: {
        OR: [
          { quarantineQty: { gt: 0 } },
          { notes: { contains: 'QC_REQUIRED' } },
        ],
        // Check if already audited
        qcAudits: { none: {} },
      },
      include: {
        workOrder: { include: { lead: true } },
      },
      orderBy: { loggedAt: 'desc' },
    });
  }

  async submitAudit(
    logId: string,
    auditorId: string,
    status: any,
    notes: string,
  ) {
    return await this.prisma.$transaction(async (tx: any) => {
      const log = await tx.productionLog.findUnique({
        where: { id: logId },
      });

      if (!log) throw new BadRequestException('Log entry not found');

      // Create Audit Record
      const audit = await tx.qCAudit.create({
        data: {
          stepLogId: logId,
          qcId: auditorId, // In reality, use user from JWT
          status,
          notes,
        },
      });

      // DECISION LOGIC:
      // If PASS and in PENDING_QC, move WO forward
      const wo = await tx.workOrder.findUnique({
        where: { id: log.workOrderId },
      });
      if (wo.stage === 'PENDING_QC') {
        if (status === 'GOOD') {
          // Determine next stage
          const next = this.calculateNextStage(log.stage);
          await tx.workOrder.update({
            where: { id: log.workOrderId },
            data: { stage: next },
          });
        } else if (status === 'REJECT') {
          await tx.workOrder.update({
            where: { id: log.workOrderId },
            data: { stage: 'REWORK' },
          });
        }
      }

      return audit;
    });
  }

  private calculateNextStage(currentLogStage: string): any {
    switch (currentLogStage) {
      case 'MIXING':
        return 'FILLING';
      case 'FILLING':
        return 'PACKING';
      case 'PACKING':
        return 'FINISHED_GOODS';
      default:
        return 'FINISHED_GOODS';
    }
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

  async createMachine(dto: any) {
    return await this.prisma.machine.create({ data: dto });
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

  async getAllRequisitions() {
    const reqs = await this.prisma.materialRequisition.findMany({
      include: {
        workOrder: { include: { lead: true } },
        material: true,
      },
      orderBy: { status: 'asc' },
    });
    return reqs.map((r) => ({
      ...r,
      qty_requested: Number(r.qtyRequested),
    }));
  }

  async getMachines(category?: string) {
    return await this.prisma.machine.findMany({
      where: category ? { type: category as any } : {},
      orderBy: { name: 'asc' },
    });
  }

  async getActiveMachines() {
    return await this.prisma.machine.findMany({
      where: { isActive: true },
      include: {
        productionLogs: {
          where: { goodQty: 0, rejectQty: 0 },
          include: { workOrder: true },
          take: 1,
        },
      },
    });
  }
  async resolveQRContext(uuid: string) {
    // 1. Check if it's a Production Log (Stage-specific: Mixing, Filling, Packing)
    const log = await this.prisma.productionLog.findUnique({
      where: { id: uuid },
      include: { workOrder: { include: { lead: true } } },
    });
    if (log) {
      return {
        type: 'PRODUCTION_QC',
        title: `QC Tahap: ${log.stage}`,
        origin: log.workOrder?.lead?.brandName || 'Internal',
        reference: log.id,
        context: 'PRODUCTION',
        stage: log.stage,
        batchNo: log.logNumber,
      };
    }

    // 2. Check if it's an Inbound Transaction
    const inbound = await this.prisma.warehouseInbound.findUnique({
      where: { id: uuid },
      include: { po: { include: { supplier: true } } },
    });
    if (inbound) {
      return {
        type: 'INBOUND_QC',
        title: 'QC Kedatangan Barang',
        origin: inbound.po?.supplier?.name || 'Unknown Supplier',
        reference: inbound.id,
        context: 'WAREHOUSE',
      };
    }

    // 3. Check if it's a Material Inventory Batch (Internal QR)
    const inventory = await this.prisma.materialInventory.findFirst({
      where: { OR: [{ id: uuid }, { internalQrCode: uuid }] },
      include: { material: true, supplier: true },
    });
    if (inventory) {
      return {
        type: 'MATERIAL_QC',
        title: `QC Material: ${inventory.material.name}`,
        origin: inventory.supplier?.name || 'Unknown',
        reference: inventory.id,
        context: 'WAREHOUSE',
        batchNumber: inventory.batchNumber,
      };
    }

    // 4. Check if it's a Production Plan (Fallback)
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id: uuid },
      include: { so: { include: { lead: true } } },
    });
    if (plan) {
      return {
        type: 'PRODUCTION_QC',
        title: `QC Produksi: ${plan.batchNo}`,
        origin: plan.so?.lead?.brandName || 'Internal Batch',
        reference: plan.id,
        context: 'PRODUCTION',
      };
    }

    // 5. Fallback/Manual Mode
    return {
      type: 'MANUAL_MODE',
      title: 'Context Not Found',
      message: 'QR Code tidak terdaftar. Masuk ke mode manual?',
    };
  }

  async calculateCOPQ(
    tx: any,
    workOrderId: string,
    stage: LifecycleStatus,
    rejectQty: number,
  ) {
    console.log(
      `[COPQ_ENGINE] Calculating loss for WO: ${workOrderId} at ${stage}`,
    );

    // 1. Get Base Data
    const wo = await tx.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        plan: { include: { so: { include: { lead: true } } } },
      },
    });

    const activeLog = await tx.productionLog.findFirst({
      where: { workOrderId, stage },
      orderBy: { loggedAt: 'desc' },
      include: { machine: true },
    });

    if (!wo || !activeLog) return;

    // 2. Calculate Material Loss (Actual MAP)
    // For prototype, we use the material unitPrice as MAP
    // In real ERP, this would look up the specific formula's material cost
    const materialLoss = rejectQty * 15000; // Mocked unit cost for prototype

    // 3. Calculate Labor & Machine Loss using exact duration
    const durationMin =
      activeLog.startTime && activeLog.loggedAt
        ? Math.max(
            0,
            (activeLog.loggedAt.getTime() - activeLog.startTime.getTime()) /
              60000,
          )
        : activeLog.downtimeMinutes || 60; // Fallback

    const laborRate = activeLog.actualLaborRate || 25000; // Phase 2: Use actual rate if available
    const machineRate =
      activeLog.actualMachineRate || activeLog.machine?.costPerHour || 50000;

    const laborLoss = (durationMin / 60) * Number(laborRate);
    const machineLoss = (durationMin / 60) * Number(machineRate);

    const totalLoss = materialLoss + laborLoss + machineLoss;

    // 4. Record to COPQRecord
    if (wo.planId) {
      await tx.cOPQRecord.create({
        data: {
          planId: wo.planId,
          materialLoss,
          laborLoss,
          overheadLoss: machineLoss,
          totalLoss,
          reason: `REJECT_${rejectQty}_AT_${stage}`,
        },
      });
    }

    console.log(
      `[COPQ_ENGINE] Total COPQ Logged: Rp ${totalLoss.toLocaleString()}`,
    );
  }

  // === PHASE 3: Schedule & Batch Record Management ===

  async createBatchSchedule(dto: {
    workOrderId: string;
    machineId: string;
    stage: string;
    startTime: string;
    endTime: string;
    targetQty: number;
    upscalePercent?: number;
    notes?: string;
    formulaDetails?: {
      materialId: string;
      concentration?: number;
      qtyTheoretical: number;
      category?: string;
    }[];
  }) {
    return this.prisma
      .$transaction(async (tx: any) => {
        const scheduleNumber = await this.idGenerator.generateId('SCH');

        // Upscale Intelligence
        let upscaleResult = null;
        if (dto.upscalePercent && dto.targetQty) {
          upscaleResult = dto.targetQty * (1 + dto.upscalePercent / 100);
        }

        const schedule = await tx.productionSchedule.create({
          data: {
            scheduleNumber,
            workOrderId: dto.workOrderId,
            machineId: dto.machineId,
            stage: dto.stage as any,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            targetQty: dto.targetQty,
            upscalePercent: dto.upscalePercent,
            upscaleResult,
            notes: dto.notes,
            status: 'SCHEDULED',
          },
        });

        // Create formula/component details if provided
        if (dto.formulaDetails && dto.formulaDetails.length > 0) {
          for (const detail of dto.formulaDetails) {
            // Fetch material stock for availability
            const material = await tx.materialItem.findUnique({
              where: { id: detail.materialId },
              select: { stockQty: true, code: true },
            });

            await tx.productionStepDetail.create({
              data: {
                scheduleId: schedule.id,
                materialId: detail.materialId,
                materialCode: material?.code || null,
                concentration: detail.concentration,
                qtyTheoretical: detail.qtyTheoretical,
                qtyAvailable: material ? Number(material.stockQty) : 0,
                category: detail.category || 'RAW',
              },
            });
          }
        }

        return tx.productionSchedule.findUnique({
          where: { id: schedule.id },
          include: {
            stepDetails: { include: { material: true } },
            machine: true,
            workOrder: { include: { lead: true } },
          },
        });
      })
      .then((result) => {
        this.eventEmitter.emit('production.schedule.created', {
          scheduleId: result.id,
          scheduleNumber: result.scheduleNumber,
          workOrderId: result.workOrderId,
          stage: result.stage,
          targetQty: result.targetQty,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Schedule ${result.scheduleNumber} created for WO ${result.workOrderId}`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async getSchedulesByStage(stage?: string) {
    return this.prisma.productionSchedule.findMany({
      where: stage ? { stage: stage as any } : {},
      include: {
        stepDetails: { include: { material: true } },
        machine: true,
        workOrder: { include: { lead: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async updateScheduleResult(
    scheduleId: string,
    resultQty: number,
    notes?: string,
    elapsedSeconds?: number,
    downtimeMinutes?: number,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const schedule = await tx.productionSchedule.update({
        where: { id: scheduleId },
        data: {
          resultQty,
          status: 'COMPLETED',
          notes: notes || `COMPLETED: Yield ${resultQty} pcs`,
        },
        include: {
          stepDetails: true,
          machine: true,
        },
      });

      // Synchronize accurate duration from terminal to calculate precise overhead cost
      const actualDurationMinutes = elapsedSeconds
        ? Math.ceil(elapsedSeconds / 60)
        : 0;

      const machineRate = schedule.machine?.costPerHour || 50000;
      const laborRate = 25000; // Standard operator rate

      // PHASE 3: Physical Law Validation (Filling Stage)
      // Prevent Good Output (pcs) from exceeding the logic limit of Actual Bulk (kg) consumed.
      if (schedule.stage === 'FILLING') {
        // 1. QC Interlock: Check if Bulk (Mixing) has passed QC
        const mixingLog = await tx.productionLog.findFirst({
          where: {
            workOrderId: schedule.workOrderId,
            stage: 'MIXING',
          },
          include: { qcAudits: true },
          orderBy: { loggedAt: 'desc' },
        });

        const isBulkPassed = mixingLog?.qcAudits?.some(
          (a: any) => a.status === 'PASS',
        );

        if (!isBulkPassed) {
          this.eventEmitter.emit('production.qc_interlock_triggered', {
            scheduleId,
            workOrderId: schedule.workOrderId,
            stage: schedule.stage,
            reason: 'MIXING QC not passed',
          });
          this.eventEmitter.emit('activity.logged', {
            senderDivision: 'PRODUCTION',
            notes: `QC Interlock: FILLING blocked for schedule ${scheduleId} — MIXING QC not passed`,
            loggedBy: 'SYSTEM:PRODUCTION',
          });
          throw new BadRequestException({
            code: 'QC_BULK_NOT_PASSED',
            message: `Layar Merah: AKSES DITOLAK. Curah (Mixing) belum lulus uji lab atau status belum PASS. Dilarang melakukan pengisian!`,
          });
        }

        // 2. Physical Law validation
        const bulkComponent = schedule.stepDetails.find(
          (d: any) => d.category === 'BULK',
        );
        if (
          bulkComponent &&
          bulkComponent.qtyActual &&
          bulkComponent.qtyTheoretical
        ) {
          const actualBulk = Number(bulkComponent.qtyActual);
          const theoreticalBulk = Number(bulkComponent.qtyTheoretical);
          const targetPcs = Number(schedule.targetQty);

          // Max possible output based on actual bulk consumed
          const maxPhysicalLimit = (actualBulk / theoreticalBulk) * targetPcs;

          // Tolerance of 1% for scaling/rounding in machine filling
          if (resultQty > maxPhysicalLimit * 1.01) {
            throw new BadRequestException({
              code: 'PHYSICAL_LIMIT_EXCEEDED',
              message: `Hukum Fisika: Output (${resultQty} pcs) melebihi batas maksimal dari cairan curah yang dikonsumsi (${maxPhysicalLimit.toFixed(0)} pcs). Indikasi under-fill atau manipulasi volume.`,
              limit: maxPhysicalLimit.toFixed(0),
            });
          }
        }
      }

      // PHASE 3: Artwork Interlock (Packing Stage)
      // Ensure that final packaging is blocked if Artwork has not been approved by Legal.
      if (schedule.stage === 'PACKING') {
        const wo = await tx.workOrder.findUnique({
          where: { id: schedule.workOrderId },
          include: {
            lead: {
              include: {
                regulatoryPipelines: { include: { artworkReviews: true } },
              },
            },
          },
        });

        const hasApprovedArtwork = wo?.lead?.regulatoryPipelines?.some(
          (p: any) => p.artworkReviews?.some((a: any) => a.isApproved),
        );

        if (!hasApprovedArtwork) {
          throw new BadRequestException({
            code: 'ARTWORK_NOT_APPROVED',
            message: `Gerbang Legal: Artwork untuk produk ini belum disetujui (APPROVED). Packing ditangguhkan demi mencegah recall produk masif.`,
          });
        }
      }

      const laborCost = (actualDurationMinutes / 60) * Number(laborRate);
      const overheadCost = (actualDurationMinutes / 60) * Number(machineRate);

      await tx.productionLog.create({
        data: {
          logNumber: await this.idGenerator.generateStageId(schedule.stage),
          workOrderId: schedule.workOrderId,
          stage: schedule.stage,
          inputQty: schedule.targetQty,
          goodQty: 0, // Wait for QC
          quarantineQty: resultQty, // Blocked in Quarantine
          rejectQty: Math.max(0, schedule.targetQty - resultQty),
          startTime: schedule.startTime,
          loggedAt: new Date(),
          machineId: schedule.machineId,
          downtimeMinutes: downtimeMinutes || 0,
          notes: `TERMINAL_SYNC: Duration ${actualDurationMinutes}m. ${notes || ''}`,
          laborCost,
          overheadCost,
          actualLaborRate: laborRate,
          actualMachineRate: machineRate,
        },
      });

      // World-Class Communication Protocol: Auto-trigger stock deduction in Warehouse
      console.log(
        `[EVENT_BUS] Emitting production.schedule_completed for ${scheduleId} with precise duration: ${actualDurationMinutes}m`,
      );
      this.eventEmitter.emit('production.schedule_completed', {
        scheduleId,
        workOrderId: schedule.workOrderId,
        materialsConsumed: schedule.stepDetails.map((d: any) => ({
          materialId: d.materialId,
          qty: Number(d.qtyActual || d.qtyTheoretical),
        })),
      });

      return schedule;
    });
  }

  async submitStepActuals(
    scheduleId: string,
    actuals: { detailId: string; qtyActual: number; inventoryId?: string }[],
    supervisorPin?: string,
    supervisorId?: string,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const schedule = await tx.productionSchedule.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule) throw new BadRequestException('Schedule not found');

      // PHASE 3: Atomic Phase Enforcement
      // Ensure we are scanning the NEXT expected component in the sequence.
      const allDetails = await tx.productionStepDetail.findMany({
        where: { scheduleId },
        orderBy: { id: 'asc' }, // Assuming insertion order is sequence
      });

      for (const item of actuals) {
        const detail = await tx.productionStepDetail.findUnique({
          where: { id: item.detailId },
          include: { material: true },
        });

        if (!detail) continue;

        // Atomic check: Are there any previous items not yet filled?
        const currentIndex = allDetails.findIndex(
          (d: any) => d.id === detail.id,
        );
        const previousUnfilled = allDetails
          .slice(0, currentIndex)
          .filter((d: any) => !d.qtyActual);

        if (previousUnfilled.length > 0) {
          throw new BadRequestException({
            code: 'ATOMIC_SEQUENCE_VIOLATION',
            message: `Pelanggaran Protokol Atomic: Anda mencoba scan ${detail.material.name}, padahal komponen sebelumnya (${previousUnfilled[0].materialCode}) belum diselesaikan. Proses harus berurutan!`,
          });
        }

        // FEFO & Material Validation Gate (Phase 2)
        if (item.inventoryId) {
          const inventory = await tx.materialInventory.findUnique({
            where: { id: item.inventoryId },
          });

          if (!inventory) {
            throw new BadRequestException(
              'Invalid material barcode/batch scanned.',
            );
          }

          // 1. FEFO Validation against SCM Allocation
          const fulfillment = await tx.requisitionFulfillment.findFirst({
            where: {
              requisition: {
                workOrderId: schedule.workOrderId,
                materialId: detail.materialId,
              },
              inventoryId: item.inventoryId,
            },
          });

          if (!fulfillment && detail.category !== 'BULK') {
            throw new BadRequestException({
              code: 'FEFO_MISMATCH',
              message: `The scanned batch (${inventory.batchNumber}) for ${detail.material.name} does not match the Warehouse SCM FEFO allocation. Please use the exact material batch issued.`,
            });
          }

          // 2. QC Status Validation
          if (inventory.qcStatus !== 'GOOD') {
            this.eventEmitter.emit('production.qc_gate_blocked', {
              scheduleId,
              materialId: detail.materialId,
              inventoryId: item.inventoryId,
              qcStatus: inventory.qcStatus,
              batchNumber: inventory.batchNumber,
            });
            this.eventEmitter.emit('activity.logged', {
              senderDivision: 'PRODUCTION',
              notes: `QC Gate: Material ${detail.material.name} (${inventory.batchNumber}) blocked — status ${inventory.qcStatus}`,
              loggedBy: 'SYSTEM:PRODUCTION',
            });
            throw new BadRequestException({
              code: 'QC_FAILED',
              message: `The material ${detail.material.name} (Batch: ${inventory.batchNumber}) is in ${inventory.qcStatus} status and cannot be used in production.`,
            });
          }
        }

        const theoretical = Number(detail.qtyTheoretical);
        const actual = Number(item.qtyActual);
        const deviation = Math.abs(actual - theoretical) / theoretical;

        // Constraint 2: Weight Tolerance Hard-Stop (0.5%)
        if (deviation > 0.005) {
          if (!supervisorPin || !supervisorId) {
            throw new BadRequestException({
              code: 'TOLERANCE_EXCEEDED',
              message: `Deviation for ${detail.material.name} is ${(deviation * 100).toFixed(2)}%. Supervisor PIN required.`,
              deviation: (deviation * 100).toFixed(2),
            });
          }

          // Verify Supervisor PIN
          const supervisor = await tx.user.findUnique({
            where: { id: supervisorId },
            select: { managerPin: true },
          });

          if (!supervisor || supervisor.managerPin !== supervisorPin) {
            throw new BadRequestException('Invalid Supervisor PIN.');
          }

          console.log(
            `[SECURITY_GATE] Weight deviation approved by ${supervisorId}`,
          );
        }

        await tx.productionStepDetail.update({
          where: { id: item.detailId },
          data: { qtyActual: item.qtyActual },
        });
      }

      return tx.productionSchedule.findUnique({
        where: { id: scheduleId },
        include: { stepDetails: { include: { material: true } } },
      });
    });
  }

  // === PHASE 3: Batch Records ===

  async getBatchRecords() {
    const plans = await this.prisma.productionPlan.findMany({
      include: {
        so: { include: { lead: true } },
        workOrders: {
          include: {
            schedules: {
              include: {
                stepDetails: { include: { material: true } },
                machine: true,
              },
            },
            logs: { orderBy: { loggedAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { apjReleasedAt: 'desc' },
    });
    return plans.map((p) => ({
      id: p.id,
      batchNo: p.batchNo,
      targetQty: p.workOrders.reduce((s, wo) => s + wo.targetQty, 0),
      stage: p.status,
      createdAt: p.apjReleasedAt || p.so?.createdAt,
      lead: p.so?.lead
        ? {
            brandName: p.so.lead.brandName,
            productInterest: p.so.lead.productInterest,
            clientName: p.so.lead.clientName,
          }
        : null,
      schedules: p.workOrders.flatMap((wo) =>
        wo.schedules.map((sch) => ({
          id: sch.id,
          stage: sch.stage,
          scheduleNumber: sch.scheduleNumber,
          targetQty: sch.targetQty,
          resultQty: sch.resultQty,
          machine: sch.machine ? { name: sch.machine.name } : null,
          stepDetails: sch.stepDetails.map((det) => ({
            id: det.id,
            qtyTheoretical: Number(det.qtyTheoretical),
            qtyActual: det.qtyActual ? Number(det.qtyActual) : null,
            material: det.material ? { name: det.material.name } : null,
          })),
        })),
      ),
    }));
  }

  async verifyStageQC(userId: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.roles.includes('QC_LAB' as any)) {
      throw new ForbiddenException(
        'Hanya QC_OFFICER yang diizinkan melakukan verifikasi kualitas.',
      );
    }

    const { stepLogId, status, notes, ...metrics } = dto;

    const audit = await this.prisma.$transaction(async (tx: any) => {
      const log = await tx.productionLog.findFirst({
        where: { id: stepLogId },
        include: { workOrder: true },
      });

      if (!log) throw new BadRequestException('Log produksi tidak ditemukan.');

      const audit = await tx.qCAudit.create({
        data: {
          stepLogId,
          qcId: userId,
          status,
          notes,
          ...metrics,
        },
      });

      // Update Production Log notes to reflect QC sign-off
      await tx.productionLog.update({
        where: { id: stepLogId },
        data: {
          notes: `${log.notes} | QC_VERIFIED BY ${user.fullName} [${status}]`,
        },
      });

      return audit;
    });

    this.eventEmitter.emit('production.qc_verified', {
      auditId: audit.id,
      stepLogId,
      status,
      notes,
      loggedBy: userId,
    });

    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'PRODUCTION',
      notes: `QC verified stage log ${stepLogId} as ${status}`,
      loggedBy: `SYSTEM:PRODUCTION`,
    });

    return audit;
  }

  async returnMaterial(userId: string, dto: any) {
    const { workOrderId, materialId, qtyReturned, reason } = dto;
    const result = await (this.prisma as any).materialReturn.create({
      data: {
        workOrderId,
        materialId,
        qtyReturned,
        reason,
        status: 'PENDING',
      },
    });
    this.eventEmitter.emit('production.material.returned', {
      workOrderId,
      materialId,
      qtyReturned: Number(qtyReturned),
      reason,
      returnId: result.id,
    });
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'PRODUCTION',
      notes: `Material ${materialId} returned to warehouse from WO ${workOrderId}`,
      loggedBy: 'SYSTEM:PRODUCTION',
    });
    return result;
  }

  async finalizeWorkOrderCosting(woNumber: string) {
    const wo = await this.prisma.workOrder.findFirst({
      where: { woNumber },
      include: {
        lead: {
          include: {
            sampleRequests: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: { billOfMaterials: { include: { material: true } } },
            },
          },
        },
        logs: { orderBy: { loggedAt: 'desc' }, take: 1 },
      },
    });
    if (!wo) throw new NotFoundException('Work Order not found');

    const bom = wo.lead?.sampleRequests?.[0]?.billOfMaterials || [];
    let totalMaterialCost = 0;
    for (const item of bom) {
      totalMaterialCost +=
        Number(item.quantityPerUnit || 0) *
        Number(item.material?.unitPrice || 0);
    }
    const totalLaborCost = wo.logs.reduce(
      (s, l) => s + Number(l.laborCost || 0),
      0,
    );
    const totalOverheadCost = wo.logs.reduce(
      (s, l) => s + Number(l.overheadCost || 0),
      0,
    );
    const actualCogs =
      totalMaterialCost * wo.targetQty + totalLaborCost + totalOverheadCost;

    await this.prisma.workOrder.update({
      where: { id: wo.id },
      data: { stage: 'FINISHED_GOODS' as any, actualCogs },
    });

    this.eventEmitter.emit('BATCH_COMPLETED', {
      employeeId: (wo.lead as any)?.bdId,
      referenceId: wo.id,
      metadata: { woNumber: wo.woNumber, targetQty: wo.targetQty, actualCogs },
    });

    this.eventEmitter.emit('production.qc_final_passed', {
      workOrderId: wo.id,
      loggedBy: 'SYSTEM_FINANCE',
    });

    return { success: true, woNumber, actualCogs };
  }

  async assignFormulaToPlan(planId: string, formulaId: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Production Plan not found');

    const formula = await this.prisma.formula.findUnique({
      where: { id: formulaId },
    });
    if (!formula) throw new NotFoundException('Formula not found');

    return this.prisma.productionPlan.update({
      where: { id: planId },
      data: { formulaId },
    });
  }

  @OnEvent('warehouse.stock.adjusted')
  async handleStockAdjusted(payload: any) {
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'PRODUCTION',
      notes: `Warehouse stock adjusted: ${payload.notes || 'No details'}`,
      loggedBy: 'SYSTEM:PRODUCTION',
    });
  }

  @OnEvent('warehouse.inbound.received')
  async handleInboundReceived(payload: any) {
    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'PRODUCTION',
      notes: `Inbound received: materials available for production`,
      loggedBy: 'SYSTEM:PRODUCTION',
    });
  }
}
