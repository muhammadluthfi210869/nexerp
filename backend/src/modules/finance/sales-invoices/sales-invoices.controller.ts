import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { SalesInvoicesService } from './sales-invoices.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { CreateSalesInvoiceDto, CancelSalesInvoiceDto } from './dto/create-sales-invoice.dto';

@ApiTags('finance/sales-invoices')
@ApiBearerAuth()
@Controller('finance/sales-invoices')
export class SalesInvoicesController {
  constructor(private service: SalesInvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all sales invoices' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.service.findAll({ customerId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer sales invoice with line items' })
  create(@Req() req: any, @Body() dto: CreateSalesInvoiceDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post sales invoice — creates AR + Revenue journal' })
  post(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.post(userId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel sales invoice (only if not paid)' })
  cancel(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CancelSalesInvoiceDto,
  ) {
    const userId = req.user?.id;
    return this.service.cancel(userId, id, dto.reason);
  }
}
