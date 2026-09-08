import { Controller, Get, Param } from '@nestjs/common';
import { AdjustmentJournalsService } from './adjustment-journals.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/adjustment-journals')
export class AdjustmentJournalsController {
  constructor(private service: AdjustmentJournalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all adjustment-journals' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get adjustment-journals by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
