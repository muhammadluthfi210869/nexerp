import { Controller, Get, Post, Param, Body, Query, Req, BadRequestException } from '@nestjs/common';
import { CostAllocationsService } from './cost-allocations.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCostAllocationDto } from './dto/cost-allocations.dto';

@ApiTags('finance/cost-allocations')
@ApiBearerAuth()
@Controller('finance/cost-allocations')
export class CostAllocationsController {
  constructor(private service: CostAllocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List cost allocations (filter by from/to cost center)' })
  findAll(
    @Query('fromCostCenter') fromCostCenter?: string,
    @Query('toCostCenter') toCostCenter?: string,
  ) {
    return this.service.findAll({ fromCostCenter, toCostCenter });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Per cost-center inflow/outflow summary for a date range' })
  summary(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) throw new BadRequestException('from and to required');
    return this.service.getSummary(new Date(from), new Date(to));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cost allocation by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new cost allocation' })
  create(@Req() req: any, @Body() dto: CreateCostAllocationDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }
}
