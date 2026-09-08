import { Controller, Get, Param } from '@nestjs/common';
import { CostAllocationsService } from './cost-allocations.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/cost-allocations')
export class CostAllocationsController {
  constructor(private service: CostAllocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all cost-allocations' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cost-allocations by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
