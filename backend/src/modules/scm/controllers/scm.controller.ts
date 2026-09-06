import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ScmService } from '../services/scm.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole, User } from '@prisma/client';

@ApiTags('scm')
@Controller('v1/scm')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScmController {
  constructor(private readonly scmService: ScmService) {}

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

  @Post('purchase-requests/:id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  async rejectPurchaseRequest(
    @Param('id') id: string,
    @Body() dto: { reason?: string },
  ) {
    return this.scmService.rejectPurchaseRequest(id, dto.reason);
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

  @Get('hpp-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE, UserRole.RND, UserRole.COMMERCIAL)
  async getHppRequests() {
    return this.scmService.getHppRequests();
  }

  @Post('hpp-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.RND, UserRole.COMMERCIAL)
  async createHppRequest(@Body() dto: any) {
    return this.scmService.createHppRequest(dto);
  }

  @Patch('hpp-requests/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE, UserRole.DIRECTOR)
  async updateHppStatus(
    @Param('id') id: string,
    @Body() body: { status: string; calculatedHpp?: number },
  ) {
    return this.scmService.updateHppStatus(id, body.status, body.calculatedHpp);
  }
  @Get('purchase-approval/pending-count')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get pending purchase approval count' })
  async getPendingApprovalCount() {
    return this.scmService.getPendingApprovalCount();
  }}
