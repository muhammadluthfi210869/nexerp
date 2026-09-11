import { Controller, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { JobOrderCostingsService } from './job-order-costings.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateJobOrderCostingDto,
  UpdateJobOrderTotalsDto,
} from './dto/job-order-costings.dto';

@ApiTags('finance/job-order-costings')
@ApiBearerAuth()
@Controller('finance/job-order-costings')
export class JobOrderCostingsController {
  constructor(private service: JobOrderCostingsService) {}

  @Get()
  @ApiOperation({ summary: 'List job order costings (filter open/closed)' })
  findAll(@Query('closed') closed?: string) {
    return this.service.findAll({
      closed: closed === undefined ? undefined : closed === 'true' || closed === '1',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job order costing by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/profitability')
  @ApiOperation({ summary: 'Get profitability breakdown for a job order (cost/revenue/profit/margin)' })
  profitability(@Param('id') id: string) {
    return this.service.getProfitability(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new job order costing' })
  create(@Req() req: any, @Body() dto: CreateJobOrderCostingDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job order cost/revenue totals (open only)' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateJobOrderTotalsDto) {
    const userId = req.user?.id;
    return this.service.updateTotals(userId, id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close job order (no more adjustments)' })
  close(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.close(userId, id);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a closed job order' })
  reopen(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.reopen(userId, id);
  }
}
