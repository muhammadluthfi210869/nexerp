import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { PeriodLocksService } from './period-locks.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LockPeriodDto, UnlockPeriodDto } from './dto/period-locks.dto';

@ApiTags('finance/period-locks')
@ApiBearerAuth()
@Controller('finance/period-locks')
export class PeriodLocksController {
  constructor(private service: PeriodLocksService) {}

  @Get()
  @ApiOperation({ summary: 'List all period locks' })
  findAll() {
    return this.service.findAll();
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if a specific period is locked' })
  async check(@Query('period') period: string) {
    const isLocked = await this.service.isPeriodLocked(new Date(period));
    return { period, isLocked };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get period lock by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('lock')
  @ApiOperation({ summary: 'Lock a period (monthly accounting close)' })
  lock(@Req() req: any, @Body() dto: LockPeriodDto) {
    const userId = req.user?.id;
    return this.service.lock(userId, new Date(dto.period), dto.notes);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Unlock a period (admin override)' })
  unlock(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UnlockPeriodDto,
  ) {
    const userId = req.user?.id;
    return this.service.unlock(userId, id, dto.reason);
  }
}
