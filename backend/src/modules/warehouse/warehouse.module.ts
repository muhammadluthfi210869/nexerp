import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ScmModule } from '../scm/scm.module';

import { StockLedgerService } from './services/stock-ledger.service';
import { RequisitionService } from './services/requisition.service';
import { StockIntelligenceService } from './services/stock-intelligence.service';

@Module({
  // Finance is resolved lazily by WarehouseService only when a finance action
  // actually needs it. Keeping this operational module independent allows the
  // receiving/warehouse vertical slice to boot without unrelated Creative/HR debt.
  imports: [PrismaModule, ScmModule],
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
