import { Controller, Get, Param, Query } from '@nestjs/common';
import { DigimarService } from './digimar.service';
import { MonthQueryDto, WeeklyQueryDto } from './dto/digimar-query.dto';

@Controller('digimar')
export class DigimarController {
  constructor(private readonly digimarService: DigimarService) {}

  @Get('summary')
  getSummary() {
    return this.digimarService.getSummary();
  }

  @Get('weekly')
  getWeekly(@Query() query: WeeklyQueryDto) {
    return this.digimarService.getWeekly(query.month, query.platform);
  }

  @Get('paid-ads')
  getPaidAds(@Query() query: MonthQueryDto) {
    return this.digimarService.getPaidAds(query.month);
  }

  @Get('content')
  getContent(@Query() query: MonthQueryDto) {
    return this.digimarService.getContent(query.month);
  }

  @Get('months')
  getMonths() {
    return this.digimarService.getMonths();
  }

  @Get('all')
  getAll(@Query() query: MonthQueryDto) {
    return this.digimarService.getAll(query.month);
  }

  @Get('sheet-names')
  getSheetNames() {
    return this.digimarService.getSheetNames();
  }

  @Get('cache/invalidate')
  invalidateCache() {
    this.digimarService.invalidateCache();
    return { message: 'Cache invalidated' };
  }
}
