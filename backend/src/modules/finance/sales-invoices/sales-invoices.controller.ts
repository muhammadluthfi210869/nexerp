import { Controller, Get, Param } from '@nestjs/common';
import { SalesInvoicesService } from './sales-invoices.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/sales-invoices')
export class SalesInvoicesController {
  constructor(private service: SalesInvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all sales-invoices' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales-invoices by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
