import { Module } from '@nestjs/common';
import { DepreciationSchedulesService } from './depreciation-schedules.service';
import { DepreciationSchedulesController } from './depreciation-schedules.controller';

@Module({
  controllers: [DepreciationSchedulesController],
  providers: [DepreciationSchedulesService],
  exports: [DepreciationSchedulesService],
})
export class DepreciationSchedulesModule {}
