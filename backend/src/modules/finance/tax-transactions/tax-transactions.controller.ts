import { Controller, Get, Param } from '@nestjs/common';
import { TaxTransactionsService } from './tax-transactions.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/tax-transactions')
export class TaxTransactionsController {
  constructor(private service: TaxTransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tax-transactions' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax-transactions by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
