import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { CostVariancesService } from './cost-variances.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCostVarianceDto } from './dto/cost-variances.dto';

@ApiTags('finance/cost-variances')
@ApiBearerAuth()
@Controller('finance/cost-variances')
export class CostVariancesController {
  constructor(private service: CostVariancesService) {}

  @Get()
  @ApiOperation({ summary: 'List cost variances (filter by job order, variance type)' })
  findAll(
    @Query('jobOrderId') jobOrderId?: string,
    @Query('varianceType') varianceType?: string,
  ) {
    return this.service.findAll({ jobOrderId, varianceType: varianceType as any });
  }

  @Get('by-job/:jobOrderId/summary')
  @ApiOperation({ summary: 'Per-type variance summary (favorable vs unfavorable) for a job order' })
  summary(@Param('jobOrderId') jobOrderId: string) {
    return this.service.getSummaryByJob(jobOrderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cost variance by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a cost variance (auto-computes variance = actual - standard)' })
  create(@Req() req: any, @Body() dto: CreateCostVarianceDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }
}
