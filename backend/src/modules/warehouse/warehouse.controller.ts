import {
  Controller,
  Post,
  Param,
  Get,
  Body,
  UseGuards,
  Patch,
  Request,
  Query,
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { RequisitionService } from './services/requisition.service';
import { StockIntelligenceService } from './services/stock-intelligence.service';
import {
  CreateRequisitionDto,
  UpdateRequisitionStatusDto,
} from './dto/requisition.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly requisitionService: RequisitionService,
    private readonly stockIntel: StockIntelligenceService,
  ) {}

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.DIRECTOR)
  async getStats() {
    return this.warehouseService.getDashboardStats();
  }

  @Get('audit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getAudit() {
    return this.warehouseService.getAuditGranular();
  }

  @Get('catalog')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getCatalog(@Query('warehouseId') warehouseId?: string) {
    return this.warehouseService.getCatalog(warehouseId);
  }

  @Get('warehouses')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getWarehouses() {
    return this.warehouseService.getActiveWarehouses();
  }

  @Get('history/:materialId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getHistory(@Param('materialId') materialId: string) {
    return this.warehouseService.getTransactionHistory(materialId);
  }

  @Get('check-thresholds')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async checkThresholds() {
    return this.warehouseService.checkHoldThresholds();
  }

  @Get('locations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getLocations() {
    return this.warehouseService.getLocations();
  }

  @Get('suggest-batch/:materialId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getSuggestedBatch(@Param('materialId') materialId: string) {
    return this.warehouseService.getSuggestedBatch(materialId);
  }

  @Post('validate-handover')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async validateHandover(@Body() data: any) {
    return this.warehouseService.validateHandover(data);
  }

  @Post('opname/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async approveOpname(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.warehouseService.approveOpname(id, body.userId);
  }

  @Post('release/:workOrderId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async releaseMaterial(@Param('workOrderId') workOrderId: string) {
    return this.warehouseService.releaseMaterial(workOrderId);
  }

  @Post('batches/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async updateBatchStatus(
    @Param('id') id: string,
    @Body() body: { status: any; userId: string },
  ) {
    return this.warehouseService.updateBatchStatus(
      id,
      body.status,
      body.userId,
    );
  }

  // === PHASE 2: Transfer Orders ===

  @Post('transfers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async createTransfer(@Body() data: any) {
    return this.warehouseService.createTransferOrder(data);
  }

  @Get('transfers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getTransfers() {
    return this.warehouseService.getTransferOrders();
  }

  @Post('transfers/:id/execute')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async executeTransfer(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.warehouseService.executeTransferOrder(id, body.userId);
  }

  // === PHASE 2: Stock Opname ===

  @Post('opname')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async createOpname(@Body() data: any) {
    return this.warehouseService.createOpname(data);
  }

  @Get('opname')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getOpnames() {
    return this.warehouseService.getOpnames();
  }

  @Post('opname/:id/approve-pin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async approveOpnameWithPin(
    @Param('id') id: string,
    @Body() body: { userId: string; pin: string },
  ) {
    return this.warehouseService.approveOpnameWithPin(
      id,
      body.userId,
      body.pin,
    );
  }

  // === PHASE 1: Inbound Management ===

  @Get('inbounds')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getInbounds() {
    return this.warehouseService.getInbounds();
  }

  @Post('inbounds')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async createInbound(@Body() data: any) {
    return this.warehouseService.createInbound(data);
  }

  // === PHASE 1: Stock Adjustment ===

  @Get('adjustments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getAdjustments() {
    return this.warehouseService.getAdjustments();
  }

  @Post('adjustments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async createAdjustment(@Body() data: any) {
    return this.warehouseService.createAdjustment(data);
  }

  @Post('adjustments/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async approveAdjustment(
    @Param('id') id: string,
    @Body() body: { status: string; userId: string },
  ) {
    return this.warehouseService.approveAdjustment(
      id,
      body.status,
      body.userId,
    );
  }

  // === PHASE 1: Release Requests ===

  @Get('release-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getReleaseRequests() {
    return this.warehouseService.getReleaseRequests();
  }

  // === QUARANTINE RELEASE ===

  @Post('inbounds/:id/release')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.QC_LAB)
  async releaseFromQuarantine(
    @Param('id') id: string,
    @Body() body: { performedBy?: string },
  ) {
    return this.warehouseService.releaseFromQuarantine(id, body.performedBy);
  }

  // === STOCK INTELLIGENCE ===

  @Get('stock-intelligence/abc')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.DIRECTOR)
  async getABCAnalysis() {
    return this.stockIntel.getABCAnalysis();
  }

  @Get('stock-intelligence/dead-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getDeadStock() {
    return this.stockIntel.getDeadStockItems();
  }

  @Get('stock-intelligence/fast-movers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getFastMovers(@Query('limit') limit?: string) {
    return this.stockIntel.getFastMovers(limit ? Number(limit) : 10);
  }

  @Get('stock-intelligence/slow-movers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getSlowMovers(@Query('days') days?: string) {
    return this.stockIntel.getSlowMovers(days ? Number(days) : 60);
  }

  @Get('stock-intelligence/reorder-suggestions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.PURCHASING)
  async getReorderSuggestions() {
    return this.stockIntel.getReorderSuggestions();
  }

  @Get('stock-intelligence/critical')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.PURCHASING)
  async getCriticalItems() {
    return this.stockIntel.getCriticalStockItems();
  }

  // === REQUISITIONS (Permintaan Barang) ===

  @Post('requisitions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.PRODUCTION)
  async createRequisition(
    @Body() dto: CreateRequisitionDto,
    @Request() req: any,
  ) {
    return this.requisitionService.create(dto, req.user.id);
  }

  @Get('requisitions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async listRequisitions() {
    return this.requisitionService.findAll();
  }

  @Get('requisitions/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getRequisition(@Param('id') id: string) {
    return this.requisitionService.findOne(id);
  }

  @Patch('requisitions/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async updateRequisitionStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRequisitionStatusDto,
  ) {
    return this.requisitionService.updateStatus(id, dto);
  }
}
