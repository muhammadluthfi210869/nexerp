import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
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
import { ProductionBatchRecordService } from './production-batch-record.service';
import { ProductionPlanningService } from './production-planning.service';
import { logBestEffort } from '../../common/helpers/best-effort';

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(
    private prisma: PrismaService,
    private legality: LegalityService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    private stateTransition: StateTransitionService,
    private analytics: ProductionAnalyticsService,
    private batchRecords: ProductionBatchRecordService,
    private planning: ProductionPlanningService,
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

  // --- PRODUCTION PLANNING (extracted in Fase 3C) ---
  //
  // The bodies live in ProductionPlanningService. These six stay here because
  // they are the call sites' contract: production.controller.ts binds them to
  // this service.
  //
  // `Parameters<...>` so the arity cannot drift from the real method.

  createBatchSchedule(...args: Parameters<ProductionPlanningService['createBatchSchedule']>) {
    return this.planning.createBatchSchedule(...args);
  }

  rescheduleBatchSchedule(...args: Parameters<ProductionPlanningService['rescheduleBatchSchedule']>) {
    return this.planning.rescheduleBatchSchedule(...args);
  }

  dispatchWorkOrder(...args: Parameters<ProductionPlanningService['dispatchWorkOrder']>) {
    return this.planning.dispatchWorkOrder(...args);
  }

  checkMaterialReadiness(...args: Parameters<ProductionPlanningService['checkMaterialReadiness']>) {
    return this.planning.checkMaterialReadiness(...args);
  }

  createWorkOrderFromSO(...args: Parameters<ProductionPlanningService['createWorkOrderFromSO']>) {
    return this.planning.createWorkOrderFromSO(...args);
  }

  getSchedulesByStage(...args: Parameters<ProductionPlanningService['getSchedulesByStage']>) {
    return this.planning.getSchedulesByStage(...args);
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
          try {
            await tx.finishedGood.create({
              data: {
                woId: schedule.workOrderId,
                stockQty: resultQty,
              },
            });
          } catch (err) {
            // Best-effort mirror: the schedule result is the authoritative row
            // and is already written, so a failed finished-good row must not
            // roll it back. It must not vanish either.
            logBestEffort(this.logger, 'production:finished-good-mirror', err);
          }
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

  // --- BATCH RECORDS (extracted in Fase 3C) ---
  //
  // The bodies live in ProductionBatchRecordService. These seven stay here
  // because they are the call sites' contract: production.controller.ts binds
  // all seven to this service. Nothing outside the production module reads
  // them — the same-named strings in the Swagger spec, metadata.ts and the
  // generated frontend types are descriptive, not call sites.
  //
  // `Parameters<...>` so the arity cannot drift from the real method.

  getBatchRecordDetail(...args: Parameters<ProductionBatchRecordService['getBatchRecordDetail']>) {
    return this.batchRecords.getBatchRecordDetail(...args);
  }

  createBatchRecord(...args: Parameters<ProductionBatchRecordService['createBatchRecord']>) {
    return this.batchRecords.createBatchRecord(...args);
  }

  getBatchRecord(...args: Parameters<ProductionBatchRecordService['getBatchRecord']>) {
    return this.batchRecords.getBatchRecord(...args);
  }

  updateBatchRecord(...args: Parameters<ProductionBatchRecordService['updateBatchRecord']>) {
    return this.batchRecords.updateBatchRecord(...args);
  }

  deleteBatchRecord(...args: Parameters<ProductionBatchRecordService['deleteBatchRecord']>) {
    return this.batchRecords.deleteBatchRecord(...args);
  }

  transitionBatchRecord(...args: Parameters<ProductionBatchRecordService['transitionBatchRecord']>) {
    return this.batchRecords.transitionBatchRecord(...args);
  }

  getBatchRecords(...args: Parameters<ProductionBatchRecordService['getBatchRecords']>) {
    return this.batchRecords.getBatchRecords(...args);
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
