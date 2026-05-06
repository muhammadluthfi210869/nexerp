import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ScmService } from '../services/scm.service';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';

@Controller('scm')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScmController {
  constructor(
    private readonly scmService: ScmService,
    private readonly poService: PurchaseOrdersService,
  ) {}

  @Get('vendors')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
  )
  async getVendors() {
    return this.scmService.getVendors();
  }

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.DIRECTOR)
  async getDashboardStats() {
    return this.scmService.getDashboardStats();
  }

  @Get('work-orders/active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.DIRECTOR)
  async getActiveWorkOrders() {
    return this.scmService.getActiveWorkOrders();
  }

  @Get('work-orders/:id/readiness')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.DIRECTOR)
  async checkMaterialReadiness(@Param('id') id: string) {
    return this.scmService.checkMaterialReadiness(id);
  }

  @Post('purchase-orders/initialize')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  async initializePurchase(
    @Request() req: { user: User },
    @Body() dto: { materialId: string },
  ) {
    return this.scmService.initializePurchaseFromSuggestion(
      dto.materialId,
      req.user.id,
    );
  }

  @Post('purchase-requests/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  async approvePurchaseRequest(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    return this.scmService.approvePurchaseRequest(id, req.user.id);
  }

  @Post('purchase-order')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  async createPurchaseOrder(@Request() req: { user: User }, @Body() body: any) {
    return this.poService.create(req.user.id, body);
  }

  @Get('purchase-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE)
  async getPurchaseRequests() {
    return this.scmService.getPurchaseRequests();
  }

  @Post('purchase-request')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE)
  async createPurchaseRequest(@Body() body: any) {
    return this.scmService.createPurchaseRequest(body);
  }
}
