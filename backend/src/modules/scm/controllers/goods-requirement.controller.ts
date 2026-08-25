import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoodsRequirementService } from '../services/goods-requirement.service';
import { UpdateGoodsRequirementStatusDto } from '../dto/goods-requirement.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('scm/goods-requirements')
@ApiBearerAuth()
@Controller('scm/goods-requirements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoodsRequirementController {
  constructor(private readonly service: GoodsRequirementService) {}

  @Post('from-sales-order/:salesOrderId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.SCM)
  @ApiOperation({ summary: 'Derive an immutable requirement from a committed Sales Order' })
  generate(@Param('salesOrderId') salesOrderId: string, @Req() req: { user: { id: string } }) {
    return this.service.generateFromCommittedSalesOrder(salesOrderId, req.user.id);
  }

  @Post(':id/purchase-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.SCM)
  @ApiOperation({ summary: 'Create a PR from inherited requirement lines; no material re-entry' })
  createPurchaseRequest(
    @Param('id') id: string,
    @Body() body: { warehouseId: string; supplierId?: string; priority?: any; notes?: string; idempotencyKey: string; unitPrices?: Array<{ requirementItemId: string; unitPrice: number }> },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.createPurchaseRequestFromRequirement(id, req.user.id, body);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.PRODUCTION,
    UserRole.WAREHOUSE,
  )
  @ApiOperation({ summary: 'List all goods requirements' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.PRODUCTION,
    UserRole.WAREHOUSE,
  )
  @ApiOperation({ summary: 'Get goods requirement by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  @ApiOperation({ summary: 'Update goods requirement status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGoodsRequirementStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
