import { Controller, Get, Param } from '@nestjs/common';
import { SalesInvoiceLineItemsService } from './sales-invoice-line-items.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/sales-invoice-line-items')
export class SalesInvoiceLineItemsController {
  constructor(private service: SalesInvoiceLineItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List all sales-invoice-line-items' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales-invoice-line-items by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
