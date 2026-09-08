import { Controller, Get, Param } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/bank-accounts')
export class BankAccountsController {
  constructor(private service: BankAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all bank-accounts' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank-accounts by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
