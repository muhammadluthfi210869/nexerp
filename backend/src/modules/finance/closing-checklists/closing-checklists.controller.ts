import { Controller, Get, Param } from '@nestjs/common';
import { ClosingChecklistsService } from './closing-checklists.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/closing-checklists')
export class ClosingChecklistsController {
  constructor(private service: ClosingChecklistsService) {}

  @Get()
  @ApiOperation({ summary: 'List all closing-checklists' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get closing-checklists by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
