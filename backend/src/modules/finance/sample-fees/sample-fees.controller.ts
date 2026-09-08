import { Controller, Get, Param } from '@nestjs/common';
import { SampleFeesService } from './sample-fees.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/sample-fees')
export class SampleFeesController {
  constructor(private service: SampleFeesService) {}

  @Get()
  @ApiOperation({ summary: 'List all sample-fees' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sample-fees by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
