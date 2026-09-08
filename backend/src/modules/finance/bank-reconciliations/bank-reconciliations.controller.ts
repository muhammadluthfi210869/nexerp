import { Controller, Get, Param } from '@nestjs/common';
import { BankReconciliationsService } from './bank-reconciliations.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/bank-reconciliations')
export class BankReconciliationsController {
  constructor(private service: BankReconciliationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all bank-reconciliations' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank-reconciliations by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
