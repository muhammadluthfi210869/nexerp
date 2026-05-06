import { Module, forwardRef } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { FinanceModule } from '../finance/finance.module';
import { ScmModule } from '../scm/scm.module';

import { StockLedgerService } from './services/stock-ledger.service';

@Module({
  imports: [PrismaModule, ScmModule, forwardRef(() => FinanceModule)],
  providers: [WarehouseService, StockLedgerService],
  controllers: [WarehouseController],
  exports: [WarehouseService, StockLedgerService],
})
export class WarehouseModule {}
