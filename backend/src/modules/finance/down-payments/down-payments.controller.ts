import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { DownPaymentsService } from './down-payments.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import {
  CreateDownPaymentDto,
  PostDownPaymentDto,
  ApplyDownPaymentDto,
  CancelDownPaymentDto,
} from './dto/create-down-payment.dto';

@ApiTags('finance/down-payments')
@ApiBearerAuth()
@Controller('finance/down-payments')
export class DownPaymentsController {
  constructor(private service: DownPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all down-payments, optionally filtered' })
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.service.findAll({ vendorId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get down-payment by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new down-payment (PENDING)' })
  create(@Req() req: any, @Body() dto: CreateDownPaymentDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post down-payment (mark as PAID, create journal)' })
  post(@Req() req: any, @Param('id') id: string, @Body() dto: PostDownPaymentDto) {
    const userId = req.user?.id;
    return this.service.post(userId, id, dto);
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply paid down-payment to a bill' })
  applyToBill(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApplyDownPaymentDto,
  ) {
    const userId = req.user?.id;
    return this.service.applyToBill(userId, id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a PENDING down-payment' })
  cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelDownPaymentDto,
  ) {
    const userId = req.user?.id;
    return this.service.cancel(userId, id, dto.reason);
  }
}
