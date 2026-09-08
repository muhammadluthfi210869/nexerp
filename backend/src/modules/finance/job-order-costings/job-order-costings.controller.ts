import { Controller, Get, Param } from '@nestjs/common';
import { JobOrderCostingsService } from './job-order-costings.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/job-order-costings')
export class JobOrderCostingsController {
  constructor(private service: JobOrderCostingsService) {}

  @Get()
  @ApiOperation({ summary: 'List all job-order-costings' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job-order-costings by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
