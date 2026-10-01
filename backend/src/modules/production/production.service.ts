import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { IdGeneratorService } from '../system/id-generator.service';
import { ProductionAnalyticsService } from './production-analytics.service';
import { ProductionBatchRecordService } from './production-batch-record.service';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionActualsService } from './production-actuals.service';
import { ProductionExecutionService } from './production-execution.service';
import { ProductionAuditService } from './production-audit.service';
import { ProductionMachineService } from './production-machine.service';
import { ProductionQrContextService } from './production-qr-context.service';
import { ProductionWorkOrderService } from './production-work-order.service';

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
    private audit: ProductionAuditService,
    private machines: ProductionMachineService,
    private qrContexts: ProductionQrContextService,
    private workOrders: ProductionWorkOrderService,
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

  // --- WORK ORDERS & REQUISITIONS (extracted in Fase 3C, part 9) ---
  //
  // The bodies live in ProductionWorkOrderService.
  // `Parameters<...>` so the arity cannot drift from the real method.

  createWorkOrder(...args: Parameters<ProductionWorkOrderService['createWorkOrder']>) {
    return this.workOrders.createWorkOrder(...args);
  }

  issueMaterial(...args: Parameters<ProductionWorkOrderService['issueMaterial']>) {
    return this.workOrders.issueMaterial(...args);
  }

  flagShortage(...args: Parameters<ProductionWorkOrderService['flagShortage']>) {
    return this.workOrders.flagShortage(...args);
  }

  // --- QC AUDIT (extracted in Fase 3C, part 7) ---
  //
  // The bodies live in ProductionAuditService. The private stage calculator went
  // with them and keeps no delegator here: nothing outside that block ever
  // called it, so leaving one behind would just be dead wiring.
  //
  // `Parameters<...>` so the arity cannot drift from the real method.

  getPendingAudits(...args: Parameters<ProductionAuditService['getPendingAudits']>) {
    return this.audit.getPendingAudits(...args);
  }

  submitAudit(...args: Parameters<ProductionAuditService['submitAudit']>) {
    return this.audit.submitAudit(...args);
  }

  // --- MACHINE REGISTRY (extracted in Fase 3C, part 8) ---
  //
  // The bodies live in ProductionMachineService. Two of the three have no route
  // and no caller anywhere — see the QA gate report §14.1. They are moved, not
  // deleted: removing public surface is a decision, not a refactor step.
  //
  // `Parameters<...>` so the arity cannot drift from the real method.

  createMachine(...args: Parameters<ProductionMachineService['createMachine']>) {
    return this.machines.createMachine(...args);
  }


  createRequisition(...args: Parameters<ProductionWorkOrderService['createRequisition']>) {
    return this.workOrders.createRequisition(...args);
  }

  getAllRequisitions(...args: Parameters<ProductionWorkOrderService['getAllRequisitions']>) {
    return this.workOrders.getAllRequisitions(...args);
  }

  getMachines(...args: Parameters<ProductionMachineService['getMachines']>) {
    return this.machines.getMachines(...args);
  }

  getActiveMachines(...args: Parameters<ProductionMachineService['getActiveMachines']>) {
    return this.machines.getActiveMachines(...args);
  }

  // --- QR SCAN (extracted in Fase 3C, part 8) ---
  //
  // The body lives in ProductionQrContextService: one scan resolved into what
  // QC should look at, fanning out to production, warehouse and material master.

  resolveQRContext(...args: Parameters<ProductionQrContextService['resolveQRContext']>) {
    return this.qrContexts.resolveQRContext(...args);
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
    const isUuid =
      typeof dto.requestedBy === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        dto.requestedBy,
      );

    const log = await this.prisma.stateTransitionLog.create({
      data: {
        entityType: 'FORMULA_ADJUSTMENT',
        entityId: dto.formulaId,
        fromState: 'PENDING',
        toState: 'REQUESTED',
        changedById: isUuid ? dto.requestedBy : null,
        reason: dto.reason,
        metadata: {
          changes: dto.changes,
          requestedBy: dto.requestedBy,
        },
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
