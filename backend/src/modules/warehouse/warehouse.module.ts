import { Module, forwardRef } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { FinanceModule } from '../finance/finance.module';
import { ScmModule } from '../scm/scm.module';

import { StockLedgerService } from './services/stock-ledger.service';
import { RequisitionService } from './services/requisition.service';
import { StockIntelligenceService } from './services/stock-intelligence.service';

@Module({
  imports: [PrismaModule, ScmModule, forwardRef(() => FinanceModule)],
  providers: [
    WarehouseService,
    StockLedgerService,
    RequisitionService,
    StockIntelligenceService,
  ],
  controllers: [WarehouseController],
  exports: [WarehouseService, StockLedgerService, StockIntelligenceService],
})
export class WarehouseModule {}
