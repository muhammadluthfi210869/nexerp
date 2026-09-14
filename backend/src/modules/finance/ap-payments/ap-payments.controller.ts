import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { APPaymentsService } from './ap-payments.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { CreateApPaymentDto, AllocateApPaymentDto } from './dto/create-ap-payment.dto';

@ApiTags('finance/ap-payments')
@ApiBearerAuth()
@Controller('finance/ap-payments')
export class APPaymentsController {
  constructor(private service: APPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all AP payments, optionally filtered' })
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.service.findAll({ vendorId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AP payment by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new AP payment (DRAFT/PENDING)' })
  create(@Req() req: any, @Body() dto: CreateApPaymentDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify AP payment (2-person rule, before paid)' })
  verify(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.verify(userId, id);
  }

  @Post(':id/paid')
  @ApiOperation({ summary: 'Mark AP payment as PAID (after verify, bank transfer done)' })
  markPaid(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.markPaid(userId, id);
  }

  @Post(':id/allocate')
  @ApiOperation({ summary: 'Allocate AP payment to a specific bill' })
  allocate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AllocateApPaymentDto,
  ) {
    const userId = req.user?.id;
    return this.service.allocateToBill(userId, id, dto);
  }
}
