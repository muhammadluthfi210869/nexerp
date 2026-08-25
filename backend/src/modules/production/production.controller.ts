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
import { UserRole } from '@prisma/client';
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Per Batch 1 closure §16 P0 #2: ProductionController had only @UseGuards(JwtAuthGuard).
// Now protected by RolesGuard + @Roles per endpoint. SUPER_ADMIN + DIRECTOR always pass.
@Controller('production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('machines')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.PRODUCTION_OP)
  async getMachines(@Query('category') category?: string) {
    return this.productionService.getMachines(category);
  }

  @Get('dashboard')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.PRODUCTION_OP,
    UserRole.HEAD_OPS,
  )
  async getDashboardAlias() {
    return this.productionService.getDashboardAnalytics();
  }

  @Get('analytics/dashboard')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.PRODUCTION_OP,
    UserRole.HEAD_OPS,
  )
  async getDashboard() {
    return this.productionService.getDashboardAnalytics();
  }

  @Get('oee')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getOEEAlias() {
    return this.productionService.getMachineOEE();
  }

  @Get('analytics/oee')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getOEE() {
    return this.productionService.getMachineOEE();
  }

  @Get('leads')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.COMMERCIAL)
  async getLeads() {
    return this.productionService.getProductionLeads();
  }

  @Post('work-orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.PPIC)
  async createWO(@Body() dto: any) {
    return this.productionService.createWorkOrder(dto);
  }

  @Get('work-orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.PRODUCTION_OP)
  async getWorkOrders(@Req() req: any, @Query('mine') mine?: string) {
    return this.productionService.getWorkOrders(mine === 'true' ? req.user.id : undefined);
  }

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getActive() {
    return this.productionService.getActiveWorkOrders();
  }

  @Post('start/:workOrderId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.PRODUCTION_OP,
  )
  async startProduction(@Param('workOrderId') workOrderId: string) {
    return this.productionService.startProduction(workOrderId);
  }

  @Post(':workOrderId/submit-log')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
  async submitLog(@Param('workOrderId') workOrderId: string, @Body() dto: any) {
    return this.productionService.submitStageLog(workOrderId, dto);
  }

  @Post(':workOrderId/execution')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
  async recordExecution(@Param('workOrderId') workOrderId: string, @Body() dto: any, @Request() req: any) {
    return this.productionService.recordExecution(workOrderId, req.user.id, dto);
  }

  @Post(':workOrderId/qc-checkpoint')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  async recordCheckpoint(@Param('workOrderId') workOrderId: string, @Body() dto: any, @Request() req: any) {
    return this.productionService.recordCheckpoint(workOrderId, req.user.id, dto);
  }

  @Post(':workOrderId/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async completeBatch(@Param('workOrderId') workOrderId: string, @Body() dto: any, @Request() req: any) {
    return this.productionService.completeBatch(workOrderId, req.user.id, dto);
  }
  @Get('step-logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.PRODUCTION_OP)
  async getStepLogs() {
    return this.productionService.getStepLogs();
  }

  @Get('audit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getAudit() {
    return this.productionService.getProductionAudit();
  }

  @Get('chain-of-custody')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.PRODUCTION_OP,
    UserRole.QC_LAB,
  )
  async getChainOfCustody() {
    return this.productionService.getChainOfCustody();
  }

  @Get('warehouse-preparation')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.WAREHOUSE,
  )
  async getWarehousePrep() {
    return this.productionService.getWarehousePreparation();
  }

  @Get('micro-flow')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getMicroFlow() {
    return this.productionService.getMicroFlowDiagnostics();
  }

  @Get('batch-audit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getBatchAudit() {
    return this.productionService.getBatchGranularAudit();
  }

  @Get('summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.HEAD_OPS,
  )
  async getSummary() {
    return this.productionService.getExecutiveSummary();
  }

  @Get('requisitions')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.WAREHOUSE,
  )
  async getRequisitions() {
    return this.productionService.getAllRequisitions();
  }

  @Post('requisitions/:id/issue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async issueReq(@Param('id') id: string) {
    return this.productionService.issueMaterial(id);
  }

  @Post('requisitions/:id/shortage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async shortageReq(@Param('id') id: string) {
    return this.productionService.flagShortage(id);
  }

  // --- PHASE 3: QC AUDIT ---
  @Get('qc/pending')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  async getQCPending() {
    return this.productionService.getPendingAudits();
  }

  @Get('qc/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  async getQCStats() {
    return this.productionService.getQCStats();
  }

  @Post('start-stage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
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
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.PRODUCTION_OP,
  )
  async resolveQR(@Param('uuid') uuid: string) {
    return this.productionService.resolveQRContext(uuid);
  }

  @Post('breakdown')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.PPIC)
  async createSchedule(@Body() dto: any) {
    return this.productionService.createBatchSchedule(dto);
  }

  @Get('schedules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getSchedules(@Query('stage') stage?: string) {
    return this.productionService.getSchedulesByStage(stage);
  }

  @Post('schedules/:id/result')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getBatchRecords() {
    return this.productionService.getBatchRecords();
  }

  @Get('batch-records/:batchNo/detail')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getBatchRecordDetail(@Param('batchNo') batchNo: string) {
    return this.productionService.getBatchRecordDetail(batchNo);
  }

  @Post('qc/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  async verifyQC(@Body() dto: any, @Request() req: any) {
    return this.productionService.verifyStageQC(req.user.id, dto);
  }

  @Post('reconciliation/return')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION_OP,
    UserRole.WAREHOUSE,
  )
  async returnMaterial(@Body() dto: any, @Request() req: any) {
    return this.productionService.returnMaterial(req.user.id, dto);
  }

  @Post('finalize/:woNumber')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async finalizeWorkOrder(@Param('woNumber') woNumber: string) {
    return this.productionService.finalizeWorkOrderCosting(woNumber);
  }

  @Post('production-plans/:id/assign-formula')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.RND,
  )
  async assignFormula(
    @Param('id') id: string,
    @Body() dto: { formulaId: string },
  ) {
    return this.productionService.assignFormulaToPlan(id, dto.formulaId);
  }

  // === PHASE 4: Floor, Leakage & Timeline ===

  @Get('floor')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.HEAD_OPS,
  )
  async getFloor() {
    return this.productionService.getFloorData();
  }

  @Get('leakage')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION,
    UserRole.HEAD_OPS,
  )
  async getLeakage() {
    return this.productionService.getLeakageData();
  }

  @Get('work-orders/:woId/timeline')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION)
  async getTimeline(@Param('woId') woId: string) {
    return this.productionService.getWorkOrderTimeline(woId);
  }

  // --- FORMULA ADJUSTMENTS ---

  @Get('formula-adjustments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.RND)
  async getFormulaAdjustments() {
    return this.productionService.getFormulaAdjustments();
  }

  @Post('formula-adjustments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.RND)
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
