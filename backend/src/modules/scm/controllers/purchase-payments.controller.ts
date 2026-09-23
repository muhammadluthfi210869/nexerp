import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
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
import { UserRole } from '@prisma/client';
import { PurchasePaymentsService } from '../services/purchase-payments.service';
import {
  CreatePurchasePaymentDto,
  CreateDownPaymentDto,
} from '../dto/purchase-payment.dto';

@ApiTags('purchase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['purchase/payments', 'scm/purchase-payments'])
export class PurchasePaymentsController {
  constructor(private readonly service: PurchasePaymentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create a payment for purchase bills (BPB)' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  pay(@Body() dto: CreatePurchasePaymentDto, @Request() req: any) {
    return this.service.pay(dto, req.user.id);
  }

  @Post(':id/reverse')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Reverse/cancel an AP payment and restore bill balances' })
  reverse(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.service.reversePayment(id, req.user.id, reason);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get all AP payments' })
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ vendorId, search });
  }
}

@ApiTags('purchase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['purchase/down-payments', 'scm/down-payments'])
export class PurchaseDownPaymentsController {
  constructor(private readonly service: PurchasePaymentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create a vendor advance / down payment (DPB)' })
  createDP(@Body() dto: CreateDownPaymentDto, @Request() req: any) {
    return this.service.createDownPayment(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get all vendor down payments' })
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: any,
  ) {
    return this.service.findAllDownPayments({ vendorId, status });
  }
}
