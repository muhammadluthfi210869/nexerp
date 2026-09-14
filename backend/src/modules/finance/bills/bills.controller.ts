import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { BillsService } from './bills.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { CreateBillDto, CancelBillDto } from './dto/create-bill.dto';

@ApiTags('finance/bills')
@ApiBearerAuth()
@Controller('finance/bills')
export class BillsController {
  constructor(private service: BillsService) {}

  @Get()
  @ApiOperation({ summary: 'List all bills, optionally filtered' })
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.service.findAll({ vendorId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill by ID with line items and allocations' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vendor bill with line items' })
  create(@Req() req: any, @Body() dto: CreateBillDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post bill — mark as ready for payment, create journal' })
  post(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.post(userId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a bill (only if not yet paid)' })
  cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelBillDto,
  ) {
    const userId = req.user?.id;
    return this.service.cancel(userId, id, dto.reason);
  }
}
