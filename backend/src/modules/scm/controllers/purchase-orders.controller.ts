import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { CreatePurchaseOrderDto } from '../dto/create-po.dto';

@ApiTags('purchase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['purchase/orders', 'scm/purchase-orders'])
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.SCM)
  @ApiOperation({ summary: 'Create a new Purchase Order' })
  @ApiResponse({ status: 201, description: 'PO created successfully' })
  create(@Request() req: { user: User }, @Body() dto: CreatePurchaseOrderDto) {
    return this.poService.create(req.user.id, dto);
  }

  @Post('from-requirement')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.SCM)
  @ApiOperation({ summary: 'Create PO from Goods Requirement' })
  createFromRequirement(
    @Request() req: { user: User },
    @Body() dto: { materialId: string; supplierId: string; qty: number; unitPrice: number },
  ) {
    return this.poService.create(req.user.id, {
      supplierId: dto.supplierId,
      totalAmount: dto.qty * dto.unitPrice,
      items: [
        {
          materialId: dto.materialId,
          qty: dto.qty,
          unitPrice: dto.unitPrice,
          totalPrice: dto.qty * dto.unitPrice,
        },
      ],
    });
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.SCM, UserRole.FINANCE, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get all Purchase Orders' })
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.poService.findAll({ status, search });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.SCM, UserRole.FINANCE, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get a single Purchase Order by ID' })
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Post(':id/approve')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.SCM,
    UserRole.DIRECTOR,
  )
  @ApiOperation({ summary: 'Approve PO with digital signature' })
  approve(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Body('signatureUrl') signatureUrl?: string,
  ) {
    return this.poService.approve(id, req.user, signatureUrl);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Reject PO' })
  reject(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.poService.updateStatus(id, 'REJECTED', reason);
  }

  @Patch(':id/status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.DIRECTOR,
    UserRole.FINANCE,
  )
  @ApiOperation({ summary: 'Update PO status (approve/reject)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; reason?: string },
  ) {
    return this.poService.updateStatus(id, dto.status as any, dto.reason);
  }

  @Post(':id/down-payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create a Down Payment for a PO' })
  createDP(
    @Param('id') id: string,
    @Body() dto: { amount: number; notes?: string },
  ) {
    return this.poService.createDownPayment(id, dto.amount, dto.notes);
  }

  @Get(':id/hpp-breakdown')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.FINANCE,
    UserRole.RND,
  )
  @ApiOperation({ summary: 'Get HPP breakdown for a material' })
  getHppBreakdown(@Param('id') id: string) {
    return this.poService.getHppBreakdown(id);
  }
}
