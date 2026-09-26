import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { LifecycleStatus, Prisma } from '@prisma/client';

// Alias for backward compatibility in production logic
// LifecycleStatus is replaced by LifecycleStatus

import { LegalityService } from '../legality/legality.service';
import { rel } from '../../common/helpers/prisma.helper';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { IdGeneratorService } from '../system/id-generator.service';
import { StateTransitionService } from '../system/state-transition.service';
import { ProductionAnalyticsService } from './production-analytics.service';

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private legality: LegalityService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    private stateTransition: StateTransitionService,
    private analytics: ProductionAnalyticsService,
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
          // Validate state transition via canonical service
          this.stateTransition.validateTransition(
            'LifecycleStatus',
            wo.stage,
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

  // --- ANALYTICS READS (extracted in Fase 3C) ---
  //
  // The bodies live in ProductionAnalyticsService. These sixteen stay here
  // because they are the call sites' contract: production.controller.ts and two
  // unit specs call them on this service. Nothing outside the production module
  // reads them — the same-named methods in hr / SCM / marketing / lead-capture
  // belong to those modules' own services.
  //
  // `Parameters<...>` so the arity cannot drift from the real method.

  getDashboardAnalytics(...args: Parameters<ProductionAnalyticsService['getDashboardAnalytics']>) {
    return this.analytics.getDashboardAnalytics(...args);
  }

  getMachineOEE(...args: Parameters<ProductionAnalyticsService['getMachineOEE']>) {
    return this.analytics.getMachineOEE(...args);
  }

  getStepLogs(...args: Parameters<ProductionAnalyticsService['getStepLogs']>) {
    return this.analytics.getStepLogs(...args);
  }

  getProductionAudit(...args: Parameters<ProductionAnalyticsService['getProductionAudit']>) {
    return this.analytics.getProductionAudit(...args);
  }

  getChainOfCustody(...args: Parameters<ProductionAnalyticsService['getChainOfCustody']>) {
    return this.analytics.getChainOfCustody(...args);
  }

  getWarehousePreparation(...args: Parameters<ProductionAnalyticsService['getWarehousePreparation']>) {
    return this.analytics.getWarehousePreparation(...args);
  }

  getBatchGranularAudit(...args: Parameters<ProductionAnalyticsService['getBatchGranularAudit']>) {
    return this.analytics.getBatchGranularAudit(...args);
  }

  getProductionLeads(...args: Parameters<ProductionAnalyticsService['getProductionLeads']>) {
    return this.analytics.getProductionLeads(...args);
  }

  getMicroFlowDiagnostics(...args: Parameters<ProductionAnalyticsService['getMicroFlowDiagnostics']>) {
    return this.analytics.getMicroFlowDiagnostics(...args);
  }

  getWorkOrders(...args: Parameters<ProductionAnalyticsService['getWorkOrders']>) {
    return this.analytics.getWorkOrders(...args);
  }

  getActiveWorkOrders(...args: Parameters<ProductionAnalyticsService['getActiveWorkOrders']>) {
    return this.analytics.getActiveWorkOrders(...args);
  }

  getExecutiveSummary(...args: Parameters<ProductionAnalyticsService['getExecutiveSummary']>) {
    return this.analytics.getExecutiveSummary(...args);
  }

  getQCStats(...args: Parameters<ProductionAnalyticsService['getQCStats']>) {
    return this.analytics.getQCStats(...args);
  }

  getFloorData(...args: Parameters<ProductionAnalyticsService['getFloorData']>) {
    return this.analytics.getFloorData(...args);
  }

  getLeakageData(...args: Parameters<ProductionAnalyticsService['getLeakageData']>) {
    return this.analytics.getLeakageData(...args);
  }

  getWorkOrderTimeline(...args: Parameters<ProductionAnalyticsService['getWorkOrderTimeline']>) {
    return this.analytics.getWorkOrderTimeline(...args);
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

      // Create Material Requisitions from BOM
      const approvedSample = wo.lead?.sampleRequests?.find(
        (sr: any) => sr.stage === 'APPROVED',
      );
      const bom = approvedSample?.billOfMaterials || [];
      if (bom.length > 0) {
        for (const bomItem of bom) {
          const totalQty = Number(bomItem.quantityPerUnit) * dto.targetQty;
          await tx.materialRequisition.create({
            data: {
              workOrderId: wo.id,
              materialId: bomItem.materialId,
              qtyRequested: totalQty,
            },
          });
        }
      }

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
            workOrder: rel(requisition.workOrderId),
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
    const logs = await this.prisma.productionLog.findMany({
      where: {
        OR: [
          { quarantineQty: { gt: 0 } },
          { notes: { contains: 'QC_REQUIRED' } },
        ],
      },
      include: {
        workOrder: { include: { lead: true } },
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
      include: { qcAudits: { take: 1 } },
    });

    const auditedPlanIds = new Set(
      stepLogs.filter((sl) => sl.qcAudits.length > 0).map((sl) => sl.woId),
    );
    const auditedWoIds = new Set(
      workOrders
        .filter((wo) => wo.planId && auditedPlanIds.has(wo.planId))
        .map((wo) => wo.id),
    );

    return logs.filter(
      (l) => l.workOrderId && !auditedWoIds.has(l.workOrderId),
    );
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

  async createMachine(dto: any) {
    return await this.prisma.machine.create({ data: dto });
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
        const machine = await tx.machine.findUnique({
          where: { id: dto.machineId },
        });
        if (!machine) throw new NotFoundException('Machine not found');

        // P12 Capacity Check
        if (Number(machine.capacityPerBatch) > 0 && dto.targetQty > Number(machine.capacityPerBatch)) {
          throw new BadRequestException(
            `MACHINE_CAPACITY_EXCEEDED: Target quantity (${dto.targetQty}) exceeds machine capacity (${machine.capacityPerBatch})`,
          );
        }

        const newStart = new Date(dto.startTime);
        const newEnd = new Date(dto.endTime);
        if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
          throw new BadRequestException('Invalid startTime or endTime format');
        }
        if (newStart >= newEnd) {
          throw new BadRequestException('Schedule startTime must be before endTime');
        }

        // P12 Collision Interlock (Reject overlapping time slots on same active machine)
        const overlapping = await tx.productionSchedule.findFirst({
          where: {
            machineId: dto.machineId,
            status: { not: 'CANCELLED' },
            startTime: { lt: newEnd },
            endTime: { gt: newStart },
          },
        });
        if (overlapping) {
          throw new ConflictException(
            `SCHEDULE_COLLISION: Machine is already booked from ${overlapping.startTime.toISOString()} to ${overlapping.endTime.toISOString()} (Schedule ${overlapping.scheduleNumber})`,
          );
        }

        // P12 Stage Precedence Enforcement (MIXING -> FILLING -> PACKAGING)
        const stageOrder = ['MIXING', 'FILLING', 'PACKAGING'];
        const currentStageIndex = stageOrder.indexOf(dto.stage);
        if (currentStageIndex > 0) {
          const immediatePrevStage = stageOrder[currentStageIndex - 1];
          const prevSchedule = await tx.productionSchedule.findFirst({
            where: {
              workOrderId: dto.workOrderId,
              stage: immediatePrevStage as any,
              status: { not: 'CANCELLED' },
            },
            orderBy: { endTime: 'desc' },
          });
          if (!prevSchedule) {
            throw new BadRequestException(
              `STAGE_ORDER_VIOLATION: Cannot schedule ${dto.stage} before ${immediatePrevStage} schedule exists.`,
            );
          }
          if (new Date(prevSchedule.endTime) > newStart) {
            throw new BadRequestException(
              `STAGE_ORDER_VIOLATION: ${dto.stage} cannot start before ${immediatePrevStage} finishes (${prevSchedule.endTime.toISOString()}).`,
            );
          }
        }

        const scheduleNumber = await this.idGenerator.generateId('SCH');

        // Upscale Intelligence
        let upscaleResult = null;
        if (dto.upscalePercent && dto.targetQty) {
          upscaleResult = dto.targetQty * (1 + dto.upscalePercent / 100);
        }

        const schedule = await tx.productionSchedule.create({
          data: {
            scheduleNumber,
            workOrder: rel(dto.workOrderId),
            machine: rel(dto.machineId),
            stage: dto.stage as any,
            startTime: newStart,
            endTime: newEnd,
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

  async rescheduleBatchSchedule(
    scheduleId: string,
    dto: { startTime: string; endTime: string; reason: string; machineId?: string },
    user?: any,
  ) {
    if (!dto.reason || dto.reason.trim() === '') {
      throw new BadRequestException('Reschedule reason is mandatory');
    }
    const newStart = new Date(dto.startTime);
    const newEnd = new Date(dto.endTime);
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      throw new BadRequestException('Invalid startTime or endTime format');
    }
    if (newStart >= newEnd) {
      throw new BadRequestException('Schedule startTime must be before endTime');
    }

    return this.prisma
      .$transaction(async (tx: any) => {
        const existing = await tx.productionSchedule.findUnique({
          where: { id: scheduleId },
          include: { machine: true },
        });
        if (!existing) throw new NotFoundException('Schedule not found');
        const targetMachineId = dto.machineId || existing.machineId;

        // Check collision excluding current schedule
        const collision = await tx.productionSchedule.findFirst({
          where: {
            id: { not: scheduleId },
            machineId: targetMachineId,
            status: { not: 'CANCELLED' },
            startTime: { lt: newEnd },
            endTime: { gt: newStart },
          },
        });
        if (collision) {
          throw new ConflictException(
            `SCHEDULE_COLLISION: Machine is already booked during requested window (Schedule ${collision.scheduleNumber})`,
          );
        }

        const updated = await tx.productionSchedule.update({
          where: { id: scheduleId },
          data: {
            startTime: newStart,
            endTime: newEnd,
            machineId: targetMachineId,
            notes: existing.notes
              ? `${existing.notes} | Rescheduled: ${dto.reason}`
              : `Rescheduled: ${dto.reason}`,
          },
          include: { machine: true, workOrder: true },
        });

        return updated;
      })
      .then((result) => {
        this.eventEmitter.emit('production.schedule.rescheduled', {
          scheduleId: result.id,
          scheduleNumber: result.scheduleNumber,
          newStart,
          newEnd,
          reason: dto.reason,
          actorId: user?.id || 'SYSTEM',
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Schedule ${result.scheduleNumber} rescheduled: ${dto.reason}`,
          loggedBy: user?.fullName || 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async dispatchWorkOrder(workOrderId: string, user?: any) {
    return this.prisma
      .$transaction(async (tx: any) => {
        const wo = await tx.workOrder.findUnique({
          where: { id: workOrderId },
          include: { requisitions: true, schedules: true },
        });
        if (!wo) throw new NotFoundException('Work Order not found');

        // Check if already dispatched (Idempotent response)
        if (
          wo.stage === 'READY_TO_PRODUCE' ||
          wo.stage === 'MIXING' ||
          wo.stage === 'FILLING' ||
          wo.stage === 'PACKING'
        ) {
          return {
            workOrderId: wo.id,
            woNumber: wo.woNumber,
            stage: wo.stage,
            dispatched: true,
            message: 'Work order already dispatched (idempotent)',
            requisitionsCount: wo.requisitions.length,
          };
        }

        // Transition WorkOrder stage to READY_TO_PRODUCE
        const updated = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            stage: 'READY_TO_PRODUCE',
          },
        });

        return {
          workOrderId: updated.id,
          woNumber: updated.woNumber,
          stage: updated.stage,
          dispatched: true,
          message: 'Work order successfully dispatched to production floor',
          requisitionsCount: wo.requisitions.length,
        };
      })
      .then((res) => {
        this.eventEmitter.emit('production.workorder.dispatched', {
          workOrderId: res.workOrderId,
          woNumber: res.woNumber,
          dispatchedBy: user?.id || 'SYSTEM',
        });
        return res;
      });
  }

  async checkMaterialReadiness(workOrderId: string) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        requisitions: {
          include: {
            material: true,
          },
        },
        schedules: {
          include: {
            stepDetails: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    });
    if (!wo) throw new NotFoundException('Work Order not found');

    const shortages: Array<{
      materialId: string;
      materialCode: string;
      materialName: string;
      qtyRequired: number;
      qtyAvailable: number;
      deficit: number;
    }> = [];

    let totalRequired = 0;
    let totalAvailableSatisfied = 0;

    const requirementsMap = new Map<
      string,
      { code: string; name: string; qty: number; stock: number }
    >();

    for (const req of wo.requisitions) {
      const matId = req.materialId;
      const code = req.material?.code || 'UNKNOWN';
      const name = req.material?.name || 'UNKNOWN';
      const stock = Number(req.material?.stockQty || 0);
      const qty = Number(req.qtyRequested);
      const current = requirementsMap.get(matId) || { code, name, qty: 0, stock };
      current.qty += qty;
      requirementsMap.set(matId, current);
    }

    for (const sched of wo.schedules) {
      for (const detail of sched.stepDetails) {
        const matId = detail.materialId;
        const code = detail.materialCode || detail.material?.code || 'UNKNOWN';
        const name = detail.material?.name || 'UNKNOWN';
        const stock = Number(detail.material?.stockQty || 0);
        const qty = Number(detail.qtyTheoretical);
        const current = requirementsMap.get(matId) || { code, name, qty: 0, stock };
        if (!wo.requisitions.some((r: any) => r.materialId === matId)) {
          current.qty += qty;
        }
        requirementsMap.set(matId, current);
      }
    }

    for (const [matId, data] of requirementsMap.entries()) {
      totalRequired += data.qty;
      if (data.stock < data.qty) {
        const deficit = data.qty - data.stock;
        shortages.push({
          materialId: matId,
          materialCode: data.code,
          materialName: data.name,
          qtyRequired: data.qty,
          qtyAvailable: data.stock,
          deficit,
        });
        totalAvailableSatisfied += Math.max(0, data.stock);
      } else {
        totalAvailableSatisfied += data.qty;
      }
    }

    const readinessPercent =
      totalRequired > 0
        ? Math.round((totalAvailableSatisfied / totalRequired) * 100)
        : 100;
    const isReady = shortages.length === 0;

    return {
      workOrderId: wo.id,
      woNumber: wo.woNumber,
      readinessPercent,
      isReady,
      totalItems: requirementsMap.size,
      shortagesCount: shortages.length,
      shortages,
    };
  }

  async createWorkOrderFromSO(
    dto: { salesOrderId: string; targetCompletion?: string },
    user?: any,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const so = await tx.salesOrder.findUnique({
        where: { id: dto.salesOrderId },
        include: {
          sample: {
            include: {
              formulas: {
                where: {
                  status: {
                    in: ['PRODUCTION_LOCKED', 'SAMPLE_LOCKED'],
                  },
                },
                include: {
                  phases: {
                    include: { items: true },
                  },
                },
              },
            },
          },
          lead: true,
        },
      });
      if (!so) throw new NotFoundException('Sales Order not found');

      const validStatuses = [
        'ACTIVE',
        'READY_TO_PRODUCE',
        'LOCKED_ACTIVE',
        'IN_PRODUCTION',
        'DP_PAID',
        'READY_PROD',
        'APPROVED',
      ];
      if (!validStatuses.includes(so.status as string)) {
        throw new BadRequestException(
          `Cannot create Work Order for SO with status ${so.status}. DP must be paid.`,
        );
      }

      const formula = so.sample?.formulas?.[0];
      const now = new Date();
      const period = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const woNumber = `WO-${period}-${suffix}`;
      const targetQty = Number(so.quantity || 1000);
      const targetCompletion = dto.targetCompletion
        ? new Date(dto.targetCompletion)
        : new Date(Date.now() + 7 * 24 * 3600 * 1000);

      const workOrder = await tx.workOrder.create({
        data: {
          woNumber,
          leadId: so.leadId || so.lead?.id,
          targetQty,
          targetCompletion,
          stage: 'WAITING_MATERIAL',
        },
      });

      let adminUserId = user?.id;
      if (!adminUserId) {
        const anyUser = await tx.user.findFirst();
        adminUserId = anyUser?.id;
      }

      const batchNo = `BMR-${period}-${suffix}`;
      const plan = await tx.productionPlan.create({
        data: {
          soId: so.id,
          adminId: adminUserId,
          batchNo,
          status: 'PLANNING',
        },
      });

      await tx.workOrder.update({
        where: { id: workOrder.id },
        data: { planId: plan.id },
      });

      if (formula?.phases) {
        const allItems = formula.phases.flatMap((p: any) => p.items);
        let reqIdx = 1;
        for (const item of allItems) {
          if (!item.materialId) continue;
          const dosagePercent = Number(item.dosagePercentage || 0);
          const weightPerUnit = Number(formula.targetYieldGram || 100);
          const totalReq = (dosagePercent / 100) * weightPerUnit * targetQty;

          await tx.materialRequisition.create({
            data: {
              reqNumber: `REQ-${period}-${suffix}-${String(reqIdx++).padStart(3, '0')}`,
              workOrderId: workOrder.id,
              woId: plan.id,
              materialId: item.materialId,
              qtyRequested: totalReq,
              status: 'PENDING',
            },
          });
        }
      }

      return tx.workOrder.findUnique({
        where: { id: workOrder.id },
        include: {
          requisitions: { include: { material: true } },
          lead: true,
          plan: true,
        },
      });
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
      const schedule = await tx.productionSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          stepDetails: true,
          machine: true,
        },
      });

      if (!schedule) throw new NotFoundException('Schedule not found');

      // PHASE 3 & P13: Sequential Stage Order Enforcement (BUS-RULE-029)
      if (schedule.stage === 'FILLING') {
        const mixingSchedule = await tx.productionSchedule.findFirst({
          where: {
            workOrderId: schedule.workOrderId,
            stage: 'MIXING',
          },
        });
        if (mixingSchedule && mixingSchedule.status !== 'COMPLETED') {
          throw new BadRequestException({
            code: 'STAGE_ORDER_VIOLATION',
            message: `Tidak bisa menyelesaikan Filling sebelum Mixing selesai. Progresi harus sequential (BUS-RULE-029).`,
          });
        }
      } else if (schedule.stage === 'PACKAGING' || schedule.stage === 'PACKING') {
        const fillingSchedule = await tx.productionSchedule.findFirst({
          where: {
            workOrderId: schedule.workOrderId,
            stage: 'FILLING',
          },
        });
        if (fillingSchedule && fillingSchedule.status !== 'COMPLETED') {
          throw new BadRequestException({
            code: 'STAGE_ORDER_VIOLATION',
            message: `Tidak bisa menyelesaikan Packaging sebelum Filling selesai. Progresi harus sequential (BUS-RULE-029).`,
          });
        }
      }

      // Synchronize accurate duration from terminal to calculate precise overhead cost
      const actualDurationMinutes = elapsedSeconds
        ? Math.ceil(elapsedSeconds / 60)
        : 0;

      const machineRate = schedule.machine?.costPerHour || 50000;
      const laborRate = 25000; // Standard operator rate

      // PHASE 3: QC Interlock (Filling Stage) - BUS-RULE-032
      // Prevent FILLING if Mixing QC has not passed.
      if (schedule.stage === 'FILLING') {
        const mixingLog = await tx.productionLog.findFirst({
          where: {
            workOrderId: schedule.workOrderId,
            stage: 'MIXING',
          },
          orderBy: { loggedAt: 'desc' },
        });

        const bulkQcPass = mixingLog
          ? await tx.qCAudit.findFirst({
              where: { stepLogId: mixingLog.id, status: 'GOOD' as any },
            })
          : null;
        const isBulkPassed = !!bulkQcPass;

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
            message: `[AKSES DITOLAK: CURAH BELUM LULUS UJI LAB] Curah (Mixing) belum lulus uji lab atau status belum PASS. Dilarang melakukan pengisian! (BUS-RULE-032)`,
          });
        }
      }

      // PHASE 3b: Physical Law Validation (All Stages) - BUS-RULE-033
      // Prevent Good Output (pcs) from exceeding the logic limit of Actual Bulk (kg) consumed.
      if (schedule.stage === 'FILLING' || schedule.stage === 'MIXING') {
        const bulkComponent = schedule.stepDetails.find(
          (d: any) => d.category === 'BULK',
        );
        if (bulkComponent && bulkComponent.qtyTheoretical) {
          const actualBulk = Number(
            bulkComponent.qtyActual ?? bulkComponent.qtyTheoretical,
          );
          const theoreticalBulk = Number(bulkComponent.qtyTheoretical);
          const targetPcs = Number(schedule.targetQty);

          // Max possible output based on actual bulk consumed
          const maxPhysicalLimit = (actualBulk / theoreticalBulk) * targetPcs;

          // Tolerance of 1% for scaling/rounding in machine filling
          if (resultQty > maxPhysicalLimit * 1.01) {
            throw new BadRequestException({
              code: 'OUTPUT_EXCEEDS_PHYSICAL_LIMIT',
              message: `Hukum Fisika: Output (${resultQty} pcs) melebihi batas maksimal dari cairan curah yang dikonsumsi (${maxPhysicalLimit.toFixed(0)} pcs). Indikasi under-fill atau manipulasi volume (BUS-RULE-033).`,
              limit: maxPhysicalLimit.toFixed(0),
            });
          }
        }
      }

      // PHASE 3: Artwork Interlock (Packing Stage) - BUS-RULE-034
      // Ensure that final packaging is blocked if Artwork has not been approved by Legal.
      if (schedule.stage === 'PACKING' || schedule.stage === 'PACKAGING') {
        const wo = await tx.workOrder.findUnique({
          where: { id: schedule.workOrderId },
          include: {
            lead: {
              include: {
                registrations: { include: { artworkReviews: true } },
                designTasks: true,
              },
            },
          },
        });

        const hasApprovedArtwork =
          wo?.lead?.registrations?.some((p: any) =>
            p.artworkReviews?.some((a: any) => a.isApproved),
          ) ||
          wo?.lead?.designTasks?.some(
            (t: any) =>
              t.isFinal ||
              t.kanbanState === 'LOCKED' ||
              t.status === 'APPROVED',
          );

        if (!hasApprovedArtwork) {
          throw new BadRequestException({
            code: 'ARTWORK_NOT_APPROVED',
            message: `Artwork belum APPROVED. Packaging terkunci demi mencegah recall produk masif (BUS-RULE-034).`,
          });
        }
      }

      const updatedSchedule = await tx.productionSchedule.update({
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

      // BUS-RULE-035 & BUS-RULE-037: Packaging creates Quarantined Finished Goods & Traceability Data
      let qrCodeData: any = null;
      if (schedule.stage === 'PACKING' || schedule.stage === 'PACKAGING') {
        qrCodeData = {
          batchRecordNumber: schedule.scheduleNumber,
          workOrderId: schedule.workOrderId,
          goodFGOutput: resultQty,
          status: 'QUARANTINE',
          availableQty: 0,
          operator: schedule.machine?.name || 'OPERATOR_PACKAGING',
          finishedAt: new Date().toISOString(),
          traceability: {
            stage: 'PACKAGING',
            components: schedule.stepDetails.map((d: any) => ({
              materialId: d.materialId,
              materialCode: d.materialCode,
              qtyActual: d.qtyActual,
            })),
          },
        };

        const existingFg = await tx.finishedGood.findFirst({
          where: { woId: schedule.workOrderId },
        });
        if (existingFg) {
          await tx.finishedGood.update({
            where: { id: existingFg.id },
            data: { stockQty: resultQty },
          });
        } else {
          await tx.finishedGood.create({
            data: {
              woId: schedule.workOrderId,
              stockQty: resultQty,
            },
          }).catch(() => {});
        }
      }

      const laborCost = (actualDurationMinutes / 60) * Number(laborRate);
      const overheadCost = (actualDurationMinutes / 60) * Number(machineRate);

      const scheduleInput = schedule.targetQty;
      const scheduleGood = 0; // Wait for QC
      const scheduleReject = Math.max(0, schedule.targetQty - resultQty);
      const scheduleQuarantine = resultQty;
      const scheduleShrinkage = Math.max(
        0,
        scheduleInput - scheduleGood - scheduleReject - scheduleQuarantine,
      );

      await tx.productionLog.create({
        data: {
          logNumber: await this.idGenerator.generateStageId(schedule.stage),
          workOrder: rel(schedule.workOrderId),
          stage: schedule.stage,
          inputQty: scheduleInput,
          goodQty: scheduleGood,
          quarantineQty: scheduleQuarantine,
          rejectQty: scheduleReject,
          shrinkageQty: scheduleShrinkage,
          startTime: schedule.startTime,
          loggedAt: new Date(),
          machine: rel(schedule.machineId),
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
        qrCodeData,
      });

      return {
        scheduleId: updatedSchedule.id,
        scheduleNumber: updatedSchedule.scheduleNumber,
        workOrderId: updatedSchedule.workOrderId,
        stage: updatedSchedule.stage,
        resultQty: updatedSchedule.resultQty,
        status: updatedSchedule.status,
        machine: updatedSchedule.machine,
        stepDetails: updatedSchedule.stepDetails,
        qrCodeData,
        costing: {
          laborCost: Number(laborCost),
          overheadCost: Number(overheadCost),
          totalCost: Number(laborCost) + Number(overheadCost),
          actualDurationMinutes,
        },
      };
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

          // 1. FEFO Validation against older available unexpired stock (BUS-RULE-031)
          if (inventory.expDate) {
            const olderBatch = await tx.materialInventory.findFirst({
              where: {
                materialId: inventory.materialId,
                expDate: { not: null, lt: inventory.expDate },
                currentStock: { gt: 0 },
                qcStatus: 'GOOD',
                id: { not: item.inventoryId },
              },
              orderBy: { expDate: 'asc' },
            });
            if (olderBatch) {
              const expStr = olderBatch.expDate
                ? olderBatch.expDate.toISOString().split('T')[0]
                : 'N/A';
              throw new BadRequestException({
                code: 'FEFO_VIOLATION',
                message: `FEFO Violation: Batch ${olderBatch.batchNumber} (exp: ${expStr}) masih tersedia dan lebih tua dari batch yang dipilih ${inventory.batchNumber}. Gunakan batch tertua terlebih dahulu (BUS-RULE-031).`,
              });
            }
          }

          // 1b. FEFO Validation against SCM Allocation
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
            const anyFulfillment = await tx.requisitionFulfillment.findFirst({
              where: {
                requisition: {
                  workOrderId: schedule.workOrderId,
                  materialId: detail.materialId,
                },
              },
            });
            if (anyFulfillment) {
              throw new BadRequestException({
                code: 'FEFO_MISMATCH',
                message: `The scanned batch (${inventory.batchNumber}) for ${detail.material.name} does not match the Warehouse SCM FEFO allocation. Please use the exact material batch issued.`,
              });
            }
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

        // Constraint 2a: Hard-Stop 10% — Fraud Prevention (even supervisor PIN cannot bypass)
        if (deviation > 0.1) {
          throw new BadRequestException({
            code: 'DEVIATION_EXCESSIVE',
            message: `Deviasi ${(deviation * 100).toFixed(2)}% untuk ${detail.material.name} melebihi batas maksimal 10%. Transaksi ditolak. Hubungi PPIC untuk koreksi BOM/formula.`,
            deviation: (deviation * 100).toFixed(2),
            limit: '10%',
          });
        }

        // Constraint 2b: Weight Tolerance Hard-Stop (0.5%)
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

  async getBatchRecordDetail(batchNo: string) {
    const plan = await this.prisma.productionPlan.findFirst({
      where: { batchNo },
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
            logs: { orderBy: { loggedAt: 'desc' } },
            requisitions: { include: { material: true } },
          },
        },
        logs: { orderBy: { loggedAt: 'desc' } },
      },
    });
    if (!plan) throw new NotFoundException(`Batch record ${batchNo} not found`);
    return {
      ...plan,
      status: plan.apjSignatureUrl || plan.status,
    };
  }

  async createBatchRecord(dto: any, user: any) {
    const salesOrderId = dto.salesOrderId || dto.sales_order_id || dto.soId;
    if (!salesOrderId) {
      throw new BadRequestException({
        code: 'SALES_ORDER_REQUIRED',
        message: 'sales_order_id bridge is required (BUS-RULE-028)',
      });
    }

    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { lead: true },
    });
    if (!so) {
      throw new BadRequestException(`Sales order ${salesOrderId} not found`);
    }

    const batchNo =
      dto.batchNo ||
      `BMR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 4).toUpperCase()}`;

    const formulaId =
      dto.formulaId || dto.formulationId || dto.formulation_id || null;

    let adminId = user?.id;
    if (!adminId) {
      const defaultUser = await this.prisma.user.findFirst();
      adminId = defaultUser?.id;
    }

    const plan = await this.prisma.productionPlan.create({
      data: {
        batchNo,
        soId: salesOrderId,
        adminId,
        formulaId,
        status: 'PLANNING' as any,
        apjSignatureUrl: 'PLANNING',
        apjNotes: dto.note || dto.notes || null,
      },
      include: {
        so: { include: { lead: true } },
        formula: true,
        workOrders: true,
      },
    });

    const workOrderId = dto.workOrderId || dto.work_order_id;
    if (workOrderId) {
      await this.prisma.workOrder
        .update({
          where: { id: workOrderId },
          data: { planId: plan.id },
        })
        .catch(() => {});
    }

    this.eventEmitter.emit('production.batch_record.created', {
      batchRecordId: plan.id,
      batchNo: plan.batchNo,
      salesOrderId,
      actorId: user?.id,
    });

    return {
      data: {
        ...plan,
        status: plan.apjSignatureUrl || plan.status,
      },
    };
  }

  async getBatchRecord(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const plan = await this.prisma.productionPlan.findFirst({
      where: isUuid ? { OR: [{ id }, { batchNo: id }] } : { batchNo: id },
      include: {
        so: { include: { lead: true } },
        formula: true,
        workOrders: {
          include: {
            schedules: {
              include: {
                stepDetails: { include: { material: true } },
                machine: true,
              },
            },
            logs: { orderBy: { loggedAt: 'desc' } },
            requisitions: { include: { material: true } },
          },
        },
        logs: { orderBy: { loggedAt: 'desc' } },
      },
    });
    if (!plan) throw new NotFoundException(`Batch record ${id} not found`);
    return {
      data: {
        ...plan,
        status: plan.apjSignatureUrl || plan.status,
      },
    };
  }

  async updateBatchRecord(id: string, dto: any, user: any) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const plan = await this.prisma.productionPlan.findFirst({
      where: isUuid ? { OR: [{ id }, { batchNo: id }] } : { batchNo: id },
    });
    if (!plan) throw new NotFoundException(`Batch record ${id} not found`);

    const updated = await this.prisma.productionPlan.update({
      where: { id: plan.id },
      data: {
        apjNotes:
          dto.note !== undefined
            ? dto.note
            : dto.notes !== undefined
              ? dto.notes
              : plan.apjNotes,
        formulaId: dto.formulaId || dto.formulationId || plan.formulaId,
      },
      include: { so: true, formula: true, workOrders: true },
    });
    return {
      data: {
        ...updated,
        status: updated.apjSignatureUrl || updated.status,
      },
    };
  }

  async deleteBatchRecord(id: string, user: any) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const plan = await this.prisma.productionPlan.findFirst({
      where: isUuid ? { OR: [{ id }, { batchNo: id }] } : { batchNo: id },
    });
    if (!plan) throw new NotFoundException(`Batch record ${id} not found`);

    await this.prisma.productionPlan.delete({ where: { id: plan.id } });
    return { success: true };
  }

  async transitionBatchRecord(
    id: string,
    toStatus: string,
    user: any,
    notes?: string,
  ) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const plan = await this.prisma.productionPlan.findFirst({
      where: isUuid ? { OR: [{ id }, { batchNo: id }] } : { batchNo: id },
      include: {
        formula: true,
        workOrders: {
          include: {
            schedules: true,
          },
        },
      },
    });

    if (!plan) throw new NotFoundException(`Batch record ${id} not found`);

    const currentStatus =
      plan.apjSignatureUrl || (plan.status as string) || 'PLANNING';
    const normalizedTarget = toStatus?.toUpperCase();

    // Map allowable transitions per 03_WORKFLOW_STATE_MACHINE.yaml:
    // DRAFT (PLANNING) -> APPROVED -> LOCKED -> IN_PROGRESS -> COMPLETED
    const validTransitions: Record<string, string[]> = {
      PLANNING: ['APPROVED'],
      DRAFT: ['APPROVED'],
      APPROVED: ['LOCKED'],
      LOCKED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(normalizedTarget)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Tidak bisa transisi status dari ${currentStatus} ke ${normalizedTarget}. Harus berurutan: DRAFT -> APPROVED -> LOCKED -> IN_PROGRESS -> COMPLETED.`,
      });
    }

    // Preconditions
    if (normalizedTarget === 'APPROVED') {
      if (!plan.formulaId && !plan.formula) {
        throw new BadRequestException({
          code: 'FORMULA_REQUIRED',
          message:
            'Batch Record wajib terhubung dengan formula sebelum di-approve.',
        });
      }
    } else if (normalizedTarget === 'LOCKED') {
      const totalSchedules = plan.workOrders.reduce(
        (sum, wo) => sum + wo.schedules.length,
        0,
      );
      if (totalSchedules === 0) {
        throw new BadRequestException({
          code: 'SCHEDULES_REQUIRED',
          message:
            'Seluruh jadwal (Mixing/Filling/Packaging) wajib dibuat sebelum batch di-lock.',
        });
      }
    } else if (normalizedTarget === 'COMPLETED') {
      const allSchedules = plan.workOrders.flatMap((wo) => wo.schedules);
      const packagingSchedule = allSchedules.find(
        (s) =>
          (s.stage as string) === 'PACKAGING' ||
          (s.stage as string) === 'PACKING',
      );
      if (!packagingSchedule || packagingSchedule.status !== 'COMPLETED') {
        throw new BadRequestException({
          code: 'PACKAGING_NOT_COMPLETED',
          message:
            'Tahap Packaging wajib berstatus COMPLETED sebelum Batch Record dapat diselesaikan.',
        });
      }
    }

    let dbLifecycleStatus: LifecycleStatus = plan.status;
    let dbApjStatus = plan.apjStatus;

    if (normalizedTarget === 'APPROVED') {
      dbApjStatus = 'APPROVED' as any;
      dbLifecycleStatus = 'READY_TO_PRODUCE' as any;
    } else if (normalizedTarget === 'LOCKED') {
      dbLifecycleStatus = 'READY_TO_PRODUCE' as any;
    } else if (normalizedTarget === 'IN_PROGRESS') {
      dbLifecycleStatus = 'MIXING' as any;
    } else if (normalizedTarget === 'COMPLETED') {
      dbLifecycleStatus = 'FINISHED_GOODS' as any;
    } else if (normalizedTarget === 'PLANNING' || normalizedTarget === 'DRAFT') {
      dbLifecycleStatus = 'PLANNING' as any;
    }

    try {
      const updated = await this.prisma.productionPlan.update({
        where: { id: plan.id },
        data: {
          status: dbLifecycleStatus,
          apjStatus: dbApjStatus,
          apjSignatureUrl: normalizedTarget,
          apjNotes: notes || plan.apjNotes,
        },
        include: {
          so: { include: { lead: true } },
          formula: true,
          workOrders: { include: { schedules: true } },
        },
      });

      this.eventEmitter.emit('production.batch_record.transitioned', {
        batchRecordId: plan.id,
        fromStatus: currentStatus,
        toStatus: normalizedTarget,
        actorId: user?.id,
      });

      return {
        data: {
          ...updated,
          status: normalizedTarget,
        },
      };
    } catch (err: any) {
      console.error('transitionBatchRecord update failed:', err);
      throw err;
    }
  }

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
    if (
      !user ||
      (!user.roles.includes('QC_LAB' as any) &&
        !user.roles.includes('SUPER_ADMIN' as any))
    ) {
      throw new ForbiddenException(
        'Hanya QC_OFFICER atau SUPER_ADMIN yang diizinkan melakukan verifikasi kualitas.',
      );
    }

    const { stepLogId, status, notes, ...metrics } = dto;

    try {
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
    } catch (err: any) {
      console.error('verifyStageQC ERROR DETAILS:', err);
      throw err;
    }
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

  // --- FORMULA ADJUSTMENTS ---

  private formulaAdjustments: Array<{
    id: string;
    formulaId: string;
    requestedBy: string;
    reason: string;
    changes: any;
    status: string;
    createdAt: Date;
  }> = [];

  async getFormulaAdjustments() {
    const adjustments = await this.prisma.stateTransitionLog.findMany({
      where: { entityType: 'FORMULA_ADJUSTMENT' },
      orderBy: { createdAt: 'desc' },
    });

    return adjustments.map((a) => ({
      id: a.id,
      formulaId: a.entityId,
      requestedBy: a.changedById,
      reason: a.reason,
      changes: a.metadata,
      status: a.toState,
      createdAt: a.createdAt,
    }));
  }

  async createFormulaAdjustment(dto: {
    formulaId: string;
    requestedBy: string;
    reason: string;
    changes: any;
  }) {
    const log = await this.prisma.stateTransitionLog.create({
      data: {
        entityType: 'FORMULA_ADJUSTMENT',
        entityId: dto.formulaId,
        fromState: 'PENDING',
        toState: 'REQUESTED',
        changedById: dto.requestedBy,
        reason: dto.reason,
        metadata: dto.changes,
      },
    });

    return {
      id: log.id,
      formulaId: dto.formulaId,
      requestedBy: dto.requestedBy,
      reason: dto.reason,
      changes: dto.changes,
      status: 'REQUESTED',
      createdAt: log.createdAt,
    };
  }
}
