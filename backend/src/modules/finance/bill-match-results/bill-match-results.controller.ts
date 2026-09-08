import { Controller, Get, Param } from '@nestjs/common';
import { BillMatchResultsService } from './bill-match-results.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/bill-match-results')
export class BillMatchResultsController {
  constructor(private service: BillMatchResultsService) {}

  @Get()
  @ApiOperation({ summary: 'List all bill-match-results' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill-match-results by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
