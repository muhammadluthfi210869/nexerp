import { Module } from '@nestjs/common';
import { CostAllocationsService } from './cost-allocations.service';
import { CostAllocationsController } from './cost-allocations.controller';

@Module({
  controllers: [CostAllocationsController],
  providers: [CostAllocationsService],
  exports: [CostAllocationsService],
})
export class CostAllocationsModule {}
