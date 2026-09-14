import { Module } from '@nestjs/common';
import { JobOrderCostingsService } from './job-order-costings.service';
import { JobOrderCostingsController } from './job-order-costings.controller';

@Module({
  controllers: [JobOrderCostingsController],
  providers: [JobOrderCostingsService],
  exports: [JobOrderCostingsService],
})
export class JobOrderCostingsModule {}
