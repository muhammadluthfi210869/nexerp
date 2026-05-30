import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('production')
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('machines')
  async getMachines(@Query('category') category?: string) {
    return this.productionService.getMachines(category);
  }

  @Get('dashboard')
  async getDashboardAlias() {
    return this.productionService.getDashboardAnalytics();
  }

  @Get('analytics/dashboard')
  async getDashboard() {
    return this.productionService.getDashboardAnalytics();
  }

  @Get('oee')
  async getOEEAlias() {
    return this.productionService.getMachineOEE();
  }

  @Get('analytics/oee')
  async getOEE() {
    return this.productionService.getMachineOEE();
  }

  @Get('leads')
  async getLeads() {
    return this.productionService.getProductionLeads();
  }

  @Post('work-orders')
  async createWO(@Body() dto: any) {
    return this.productionService.createWorkOrder(dto);
  }

  @Get('work-orders')
  async getWorkOrders(@Req() req: any, @Query('mine') mine?: string) {
    return this.productionService.getWorkOrders(mine === 'true' ? req.user.id : undefined);
  }

  @Get('active')
  async getActive() {
    return this.productionService.getActiveWorkOrders();
  }

  @Post('start/:workOrderId')
  async startProduction(@Param('workOrderId') workOrderId: string) {
    return this.productionService.startProduction(workOrderId);
  }

  @Post(':workOrderId/submit-log')
  async submitLog(@Param('workOrderId') workOrderId: string, @Body() dto: any) {
    return this.productionService.submitStageLog(workOrderId, dto);
  }
  @Get('step-logs')
  async getStepLogs() {
    return this.productionService.getStepLogs();
  }

  @Get('audit')
  async getAudit() {
    return this.productionService.getProductionAudit();
  }

  @Get('chain-of-custody')
  async getChainOfCustody() {
    return this.productionService.getChainOfCustody();
  }

  @Get('warehouse-preparation')
  async getWarehousePrep() {
    return this.productionService.getWarehousePreparation();
  }

  @Get('micro-flow')
  async getMicroFlow() {
    return this.productionService.getMicroFlowDiagnostics();
  }

  @Get('batch-audit')
  async getBatchAudit() {
    return this.productionService.getBatchGranularAudit();
  }

  @Get('summary')
  async getSummary() {
    return this.productionService.getExecutiveSummary();
  }

  @Get('requisitions')
  async getRequisitions() {
    return this.productionService.getAllRequisitions();
  }

  @Post('requisitions/:id/issue')
  async issueReq(@Param('id') id: string) {
    return this.productionService.issueMaterial(id);
  }

  @Post('requisitions/:id/shortage')
  async shortageReq(@Param('id') id: string) {
    return this.productionService.flagShortage(id);
  }

  // --- PHASE 3: QC AUDIT ---
  @Get('qc/pending')
  async getQCPending() {
    return this.productionService.getPendingAudits();
  }

  @Get('qc/stats')
  async getQCStats() {
    return this.productionService.getQCStats();
  }

  @Post('start-stage')
  async startStage(
    @Body()
    dto: {
      workOrderId: string;
      stage: any;
      machineId: string;
      operatorId: string;
    },
  ) {
    return this.productionService.startStage(
      dto.workOrderId,
      dto.stage,
      dto.machineId,
      dto.operatorId,
    );
  }

  @Get('qr/resolve/:uuid')
  async resolveQR(@Param('uuid') uuid: string) {
    return this.productionService.resolveQRContext(uuid);
  }

  @Post('breakdown')
  async reportBreakdown(
    @Body()
    dto: {
      workOrderId: string;
      stage: any;
      machineId: string;
      notes: string;
    },
  ) {
    return this.productionService.reportBreakdown(
      dto.workOrderId,
      dto.stage,
      dto.machineId,
      dto.notes,
    );
  }

  // === PHASE 3: Schedule & Batch Records ===

  @Post('schedules')
  async createSchedule(@Body() dto: any) {
    return this.productionService.createBatchSchedule(dto);
  }

  @Get('schedules')
  async getSchedules(@Query('stage') stage?: string) {
    return this.productionService.getSchedulesByStage(stage);
  }

  @Post('schedules/:id/result')
  async submitResult(
    @Param('id') id: string,
    @Body()
    body: {
      resultQty: number;
      notes?: string;
      elapsedSeconds?: number;
      downtimeMinutes?: number;
    },
  ) {
    return this.productionService.updateScheduleResult(
      id,
      body.resultQty,
      body.notes,
      body.elapsedSeconds,
      body.downtimeMinutes,
    );
  }

  @Post('schedules/:id/actuals')
  async submitActuals(
    @Param('id') id: string,
    @Body()
    body: {
      actuals: { detailId: string; qtyActual: number; inventoryId?: string }[];
      supervisorPin?: string;
      supervisorId?: string;
    },
  ) {
    return this.productionService.submitStepActuals(
      id,
      body.actuals,
      body.supervisorPin,
      body.supervisorId,
    );
  }

  @Get('batch-records')
  async getBatchRecords() {
    return this.productionService.getBatchRecords();
  }

  @Get('batch-records/:batchNo/detail')
  async getBatchRecordDetail(@Param('batchNo') batchNo: string) {
    return this.productionService.getBatchRecordDetail(batchNo);
  }

  @Post('qc/verify')
  async verifyQC(@Body() dto: any, @Request() req: any) {
    return this.productionService.verifyStageQC(req.user.id, dto);
  }

  @Post('reconciliation/return')
  async returnMaterial(@Body() dto: any, @Request() req: any) {
    return this.productionService.returnMaterial(req.user.id, dto);
  }

  @Post('finalize/:woNumber')
  async finalizeWorkOrder(@Param('woNumber') woNumber: string) {
    return this.productionService.finalizeWorkOrderCosting(woNumber);
  }

  @Post('production-plans/:id/assign-formula')
  async assignFormula(
    @Param('id') id: string,
    @Body() dto: { formulaId: string },
  ) {
    return this.productionService.assignFormulaToPlan(id, dto.formulaId);
  }

  // === PHASE 4: Floor, Leakage & Timeline ===

  @Get('floor')
  async getFloor() {
    return this.productionService.getFloorData();
  }

  @Get('leakage')
  async getLeakage() {
    return this.productionService.getLeakageData();
  }

  @Get('work-orders/:woId/timeline')
  async getTimeline(@Param('woId') woId: string) {
    return this.productionService.getWorkOrderTimeline(woId);
  }

  // --- FORMULA ADJUSTMENTS ---

  @Get('formula-adjustments')
  async getFormulaAdjustments() {
    return this.productionService.getFormulaAdjustments();
  }

  @Post('formula-adjustments')
  async createFormulaAdjustment(
    @Body()
    dto: {
      formulaId: string;
      requestedBy: string;
      reason: string;
      changes: any;
    },
  ) {
    return this.productionService.createFormulaAdjustment(dto);
  }
}
