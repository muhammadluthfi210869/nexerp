import { Module } from '@nestjs/common';
import { TaxTransactionsService } from './tax-transactions.service';
import { TaxTransactionsController } from './tax-transactions.controller';

@Module({
  controllers: [TaxTransactionsController],
  providers: [TaxTransactionsService],
  exports: [TaxTransactionsService],
})
export class TaxTransactionsModule {}
