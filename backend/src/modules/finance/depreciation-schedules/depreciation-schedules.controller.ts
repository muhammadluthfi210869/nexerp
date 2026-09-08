import { Controller, Get, Param } from '@nestjs/common';
import { DepreciationSchedulesService } from './depreciation-schedules.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/depreciation-schedules')
export class DepreciationSchedulesController {
  constructor(private service: DepreciationSchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all depreciation-schedules' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get depreciation-schedules by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
