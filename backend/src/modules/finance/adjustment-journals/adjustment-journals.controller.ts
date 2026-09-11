import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { AdjustmentJournalsService } from './adjustment-journals.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAdjustmentJournalDto } from './dto/adjustment-journals.dto';

@ApiTags('finance/adjustment-journals')
@ApiBearerAuth()
@Controller('finance/adjustment-journals')
export class AdjustmentJournalsController {
  constructor(private service: AdjustmentJournalsService) {}

  @Get()
  @ApiOperation({ summary: 'List adjustment journals (filter by period, fully approved)' })
  findAll(
    @Query('period') period?: string,
    @Query('approvedBy') approvedBy?: string,
  ) {
    return this.service.findAll({ period, approvedBy });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get adjustment journal by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get approval progress (prepared/reviewed/approved)' })
  progress(@Param('id') id: string) {
    return this.service.getProgress(id);
  }

  @Post()
  @ApiOperation({ summary: 'Draft a new adjustment journal (PREPARED)' })
  create(@Req() req: any, @Body() dto: CreateAdjustmentJournalDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Review the draft (REVIEWED — SoD: different user from preparer)' })
  review(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.review(userId, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve the reviewed journal (APPROVED — full SoD chain)' })
  approve(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.approve(userId, id);
  }
}
