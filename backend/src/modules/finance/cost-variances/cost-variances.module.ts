import { Module } from '@nestjs/common';
import { CostVariancesService } from './cost-variances.service';
import { CostVariancesController } from './cost-variances.controller';

@Module({
  controllers: [CostVariancesController],
  providers: [CostVariancesService],
  exports: [CostVariancesService],
})
export class CostVariancesModule {}
