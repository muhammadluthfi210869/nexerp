import { Controller, Get, Param } from '@nestjs/common';
import { BankTransactionsService } from './bank-transactions.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/bank-transactions')
export class BankTransactionsController {
  constructor(private service: BankTransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all bank-transactions' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank-transactions by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
