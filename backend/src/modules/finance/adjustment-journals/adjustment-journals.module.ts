import { Module } from '@nestjs/common';
import { AdjustmentJournalsService } from './adjustment-journals.service';
import { AdjustmentJournalsController } from './adjustment-journals.controller';

@Module({
  controllers: [AdjustmentJournalsController],
  providers: [AdjustmentJournalsService],
  exports: [AdjustmentJournalsService],
})
export class AdjustmentJournalsModule {}
