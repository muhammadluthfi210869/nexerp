import { Controller, Get, Post, Param, Query, Req } from '@nestjs/common';
import { DepreciationSchedulesService } from './depreciation-schedules.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('finance/depreciation-schedules')
@ApiBearerAuth()
@Controller('finance/depreciation-schedules')
export class DepreciationSchedulesController {
  constructor(private service: DepreciationSchedulesService) {}

  @Get()
  @ApiOperation({
    summary: 'List depreciation entries (filter by asset, date range)',
  })
  findAll(
    @Query('assetId') assetId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({
      assetId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('calculate/:assetId')
  @ApiOperation({ summary: 'Calculate monthly depreciation amount for an asset' })
  calculate(@Param('assetId') assetId: string) {
    return this.service.calculateMonthly(assetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get depreciation entry by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('generate/:assetId')
  @ApiOperation({ summary: 'Generate full depreciation schedule for an asset (idempotent)' })
  generate(@Param('assetId') assetId: string) {
    return this.service.generate(assetId);
  }

  @Post(':id/post-journal')
  @ApiOperation({ summary: 'Post a depreciation entry to GL (creates journal entry)' })
  postJournal(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.postJournal(userId, id);
  }
}
