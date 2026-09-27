/**
 * production-execution.service.ts — Fase 3C (part 6).
 *
 * The production floor itself: starting a work order, starting and closing a
 * stage, reporting a breakdown, submitting a stage log, and the cost-of-poor-
 * quality figure derived from that log's reject quantity.
 *
 * This is the slice the refactor plan named from the start. It is also the first
 * one that is not a single contiguous range: the four execution methods sit at
 * lines 42-350, and `calculateCOPQ` — the only method they call on themselves —
 * sits alone at 814-881.
 *
 * Moving a method across a 460-line gap is only safe because of a measurement:
 * `calculateCOPQ` had exactly one caller outside its own body, line 293 inside
 * `submitStageLog`. Two callers and this split would have had to carry the
 * second one too.
 *
 * Measured before the move, not assumed:
 *   ranges 42-350 and 814-881 — five methods, nothing else inside either range
 *   `this.X` inside: prisma (6), idGenerator (3), eventEmitter (6),
 *     legality (1), stateTransition (1), calculateCOPQ (1, self, moving)
 *   zero references to any of the five names outside the ranges
 *   no Logger use at all — this service does not log, so it gets no logger
 *
 * Two constructor parameters left ProductionService with this move: `legality`
 * and `stateTransition` were used by `submitStageLog` and by nothing else in
 * the 1200-line facade. They travel with their only caller rather than staying
 * behind as dead wiring.
 *
 * ProductionService keeps five thin delegators, so controller routes and the
 * test modules that build a ProductionService did not have to change because a
 * file was split.
 */

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LifecycleStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LegalityService } from '../legality/legality.service';
import { rel } from '../../common/helpers/prisma.helper';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../system/id-generator.service';
import { StateTransitionService } from '../system/state-transition.service';

@Injectable()
export class ProductionExecutionService {
  constructor(
    private prisma: PrismaService,
    private legality: LegalityService,
    private stateTransition: StateTransitionService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {}

  async startProduction(
    workOrderId: string,
    machineId?: string,
    operatorId?: string,
  ) {
    // 0. Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workOrderId)) {
      throw new BadRequestException('Invalid Work Order ID format');
    }

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
            workOrder: rel(wo.id),
            stage: LifecycleStatus.MIXING,
            inputQty: wo.targetQty,
            goodQty: 0,
            quarantineQty: 0,
            rejectQty: 0,
            startTime: new Date(),
            machine: rel(machineId),
            operator: rel(operatorId),
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
        workOrder: rel(workOrderId),
        stage,
        inputQty: 0,
        goodQty: 0,
        quarantineQty: 0,
        rejectQty: 0,
        startTime: new Date(),
        machine: rel(machineId),
        operator: rel(operatorId),
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
        const machine = await tx.machine.findUnique({
          where: { id: machineId },
        });
        if (!machine) throw new NotFoundException('Machine not found');

        const workOrder = await tx.workOrder.findUnique({
          where: { id: workOrderId },
        });
        if (!workOrder) throw new NotFoundException('Work Order not found');

        // Update Machine Status
        await tx.machine.update({
          where: { id: machineId },
          data: { isActive: false },
        });

        // Log the Incident
        return await tx.productionLog.create({
          data: {
            workOrder: rel(workOrderId),
            stage,
            inputQty: 0,
            goodQty: 0,
            quarantineQty: 0,
            rejectQty: 0,
            notes: `CRITICAL_ALERT: BREAKDOWN - ${notes}`,
            downtimeMinutes: 0,
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

        // Auto-calc shrinkage: what went in minus what came out
        const input = Number(inputQty || 0);
        const good = Number(goodQty || 0);
        const reject = Number(rejectQty || 0);
        const quarantine = Number(quarantineQty || 0);
        const shrinkage = Math.max(0, input - good - reject - quarantine);

        // Create/Update Final Log for this stage
        await tx.productionLog.create({
          data: {
            logNumber,
            stage,
            inputQty: input,
            goodQty: good,
            quarantineQty: quarantine,
            rejectQty: reject,
            shrinkageQty: shrinkage,
            startTime,
            loggedAt: endTime,
            downtimeMinutes: Number(downtimeMinutes || 0),
            notes: notes || `RELAY_COMPLETED: Duration ${durationMin}m`,
            workOrder: rel(workOrderId),
            plan: rel(wo?.planId),
            machine: rel(machineId),
            // Phase 2: HPP Snapshot & Batch Tracking
            unitValueAtTransaction: dto.unitValueAtTransaction || 0,
            materialInventory: rel(dto.materialInventoryId),
          },
        });

        // --- PHASE 2: FTY & COPQ LOGIC ---
        if (Number(rejectQty) > 0 || Number(quarantineQty) > 0) {
          // If any issue occurs, it's no longer a First Pass (FTY)
          if (wo.planId) {
            await tx.productionPlan.update({
              where: { id: wo.planId },
              data: { isFirstPass: false },
            });
          }

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
          const currentWoStage =
            wo.stage === LifecycleStatus.WAITING_MATERIAL &&
            stage === LifecycleStatus.MIXING
              ? LifecycleStatus.MIXING
              : wo.stage;

          // Validate state transition via canonical service
          this.stateTransition.validateTransition(
            'LifecycleStatus',
            currentWoStage,
            targetStage,
          );
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
}
