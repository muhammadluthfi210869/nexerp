import { Module, forwardRef } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ValuationService } from './valuation.service';

import { ScmModule } from '../scm/scm.module';
import { CreativeModule } from '../creative/creative.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

@Module({
  imports: [
    PrismaModule,
    ScmModule,
    CreativeModule,
    forwardRef(() => WarehouseModule),
  ],
  providers: [FinanceService, ValuationService],
  controllers: [FinanceController],
  exports: [FinanceService],
})
export class FinanceModule {}
