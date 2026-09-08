import { Module } from '@nestjs/common';
import { PeriodLocksService } from './period-locks.service';
import { PeriodLocksController } from './period-locks.controller';

@Module({
  controllers: [PeriodLocksController],
  providers: [PeriodLocksService],
  exports: [PeriodLocksService],
})
export class PeriodLocksModule {}
