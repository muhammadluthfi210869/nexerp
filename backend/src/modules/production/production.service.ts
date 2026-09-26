import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { rel } from '../../common/helpers/prisma.helper';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { IdGeneratorService } from '../system/id-generator.service';
import { ProductionAnalyticsService } from './production-analytics.service';
import { ProductionBatchRecordService } from './production-batch-record.service';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionActualsService } from './production-actuals.service';
import { ProductionExecutionService } from './production-execution.service';

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    private analytics: ProductionAnalyticsService,
    private batchRecords: ProductionBatchRecordService,
    private planning: ProductionPlanningService,
    private actuals: ProductionActualsService,
    private execution: ProductionExecutionService,
  ) {}


  startProduction(...args: Parameters<ProductionExecutionService['startProduction']>) {
    return this.execution.startProduction(...args);
  }
  startStage(...args: Parameters<ProductionExecutionService['startStage']>) {
    return this.execution.startStage(...args);
  }
  reportBreakdown(...args: Parameters<ProductionExecutionService['reportBreakdown']>) {
    return this.execution.reportBreakdown(...args);
  }
  submitStageLog(...args: Parameters<ProductionExecutionService['submitStageLog']>) {
    return this.execution.submitStageLog(...args);
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

  calculateCOPQ(...args: Parameters<ProductionExecutionService['calculateCOPQ']>) {
    return this.execution.calculateCOPQ(...args);
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

  updateScheduleResult(...args: Parameters<ProductionActualsService['updateScheduleResult']>) {
    return this.actuals.updateScheduleResult(...args);
  }

  submitStepActuals(...args: Parameters<ProductionActualsService['submitStepActuals']>) {
    return this.actuals.submitStepActuals(...args);
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
