import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { ARReceiptsService } from './ar-receipts.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateArReceiptDto, AllocateArReceiptDto } from './dto/create-ar-receipt.dto';

@ApiTags('finance/ar-receipts')
@ApiBearerAuth()
@Controller('finance/ar-receipts')
export class ARReceiptsController {
  constructor(private service: ARReceiptsService) {}

  @Get()
  @ApiOperation({ summary: 'List all AR receipts, optionally filtered' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('invoiceId') invoiceId?: string,
  ) {
    return this.service.findAll({ customerId, invoiceId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AR receipt by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new AR receipt (customer payment)' })
  create(@Req() req: any, @Body() dto: CreateArReceiptDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/allocate')
  @ApiOperation({ summary: 'Allocate an existing receipt to a sales invoice' })
  allocate(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AllocateArReceiptDto,
  ) {
    const userId = req.user?.id;
    return this.service.allocateToInvoice(userId, id, dto);
  }
}
