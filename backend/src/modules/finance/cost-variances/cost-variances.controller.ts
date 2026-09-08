import { Controller, Get, Param } from '@nestjs/common';
import { CostVariancesService } from './cost-variances.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/cost-variances')
export class CostVariancesController {
  constructor(private service: CostVariancesService) {}

  @Get()
  @ApiOperation({ summary: 'List all cost-variances' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cost-variances by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
