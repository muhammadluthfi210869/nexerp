import { Controller, Get, Param } from '@nestjs/common';
import { PeriodLocksService } from './period-locks.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/period-locks')
export class PeriodLocksController {
  constructor(private service: PeriodLocksService) {}

  @Get()
  @ApiOperation({ summary: 'List all period-locks' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get period-locks by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
