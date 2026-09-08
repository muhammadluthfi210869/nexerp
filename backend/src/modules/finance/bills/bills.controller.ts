import { Controller, Get, Param } from '@nestjs/common';
import { BillsService } from './bills.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/bills')
export class BillsController {
  constructor(private service: BillsService) {}

  @Get()
  @ApiOperation({ summary: 'List all bills' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bills by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
