import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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

@ApiTags('scm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scm/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  @ApiOperation({ summary: 'Create a new Purchase Order' })
  @ApiResponse({ status: 201, description: 'PO created successfully' })
  create(@Request() req: { user: User }, @Body() dto: CreatePurchaseOrderDto) {
    return this.poService.create(req.user.id, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get all Purchase Orders' })
  findAll() {
    return this.poService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Get a single Purchase Order by ID' })
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Post(':id/down-payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  @ApiOperation({ summary: 'Create a Down Payment for a PO' })
  createDP(
    @Param('id') id: string,
    @Body() dto: { amount: number; notes?: string },
  ) {
    return this.poService.createDownPayment(id, dto.amount, dto.notes);
  }
}
