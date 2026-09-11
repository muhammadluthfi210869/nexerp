import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { ClosingChecklistsService } from './closing-checklists.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  GenerateChecklistDto,
  CompleteItemDto,
} from './dto/closing-checklists.dto';

@ApiTags('finance/closing-checklists')
@ApiBearerAuth()
@Controller('finance/closing-checklists')
export class ClosingChecklistsController {
  constructor(private service: ClosingChecklistsService) {}

  @Get()
  @ApiOperation({ summary: 'List checklist items (filter by period, department, completion)' })
  findAll(
    @Query('period') period?: string,
    @Query('department') department?: string,
    @Query('completed') completed?: string,
  ) {
    return this.service.findAll({
      period,
      department,
      completed:
        completed === undefined ? undefined : completed === 'true' || completed === '1',
    });
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get progress summary for a period (overall + per department)' })
  progress(@Query('period') period: string) {
    return this.service.getProgress(period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get checklist item by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate standard monthly close checklist (idempotent per period)' })
  generate(@Req() req: any, @Body() dto: GenerateChecklistDto) {
    const userId = req.user?.id;
    return this.service.generateMonthlyChecklist(userId, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark checklist item as completed' })
  complete(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CompleteItemDto,
  ) {
    const userId = req.user?.id;
    return this.service.completeItem(userId, id, dto);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a completed checklist item' })
  reopen(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.reopenItem(userId, id);
  }
}
