import { Controller, Post, Param, Get, Body, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

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
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.WAREHOUSE,
    UserRole.PURCHASING,
    UserRole.PRODUCTION,
  )
  async getCatalog() {
    return this.warehouseService.getCatalog();
  }

  @Get('history/:materialId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getHistory(@Param('materialId') materialId: string) {
    return this.warehouseService.getTransactionHistory(materialId);
  }

  @Get('check-thresholds')
  async checkThresholds() {
    return this.warehouseService.checkHoldThresholds();
  }

  @Get('locations')
  async getLocations() {
    return this.warehouseService.getLocations();
  }

  @Get('suggest-batch/:materialId')
  async getSuggestedBatch(@Param('materialId') materialId: string) {
    return this.warehouseService.getSuggestedBatch(materialId);
  }

  @Post('validate-handover')
  async validateHandover(@Body() data: any) {
    return this.warehouseService.validateHandover(data);
  }

  @Post('opname/:id/approve')
  async approveOpname(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.warehouseService.approveOpname(id, body.userId);
  }

  @Post('release/:workOrderId')
  async releaseMaterial(@Param('workOrderId') workOrderId: string) {
    return this.warehouseService.releaseMaterial(workOrderId);
  }

  @Post('batches/:id/status')
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
  async createTransfer(@Body() data: any) {
    return this.warehouseService.createTransferOrder(data);
  }

  @Get('transfers')
  async getTransfers() {
    return this.warehouseService.getTransferOrders();
  }

  @Post('transfers/:id/execute')
  async executeTransfer(
    @Param('id') id: string,
    @Body() body: { userId: string },
  ) {
    return this.warehouseService.executeTransferOrder(id, body.userId);
  }

  // === PHASE 2: Stock Opname ===

  @Post('opname')
  async createOpname(@Body() data: any) {
    return this.warehouseService.createOpname(data);
  }

  @Get('opname')
  async getOpnames() {
    return this.warehouseService.getOpnames();
  }

  @Post('opname/:id/approve-pin')
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
  async getInbounds() {
    return this.warehouseService.getInbounds();
  }

  @Post('inbounds')
  async createInbound(@Body() data: any) {
    return this.warehouseService.createInbound(data);
  }

  // === PHASE 1: Stock Adjustment ===

  @Get('adjustments')
  async getAdjustments() {
    return this.warehouseService.getAdjustments();
  }

  @Post('adjustments')
  async createAdjustment(@Body() data: any) {
    return this.warehouseService.createAdjustment(data);
  }

  @Post('adjustments/:id/approve')
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
  async getReleaseRequests() {
    return this.warehouseService.getReleaseRequests();
  }
}
