import { Module } from '@nestjs/common';
import { TaxTransactionsService } from './tax-transactions.service';
import { TaxTransactionsController } from './tax-transactions.controller';
import { StateMachineModule } from '../../state-machine/state-machine.module';

@Module({
  imports: [StateMachineModule],
  controllers: [TaxTransactionsController],
  providers: [TaxTransactionsService],
  exports: [TaxTransactionsService],
})
export class TaxTransactionsModule {}
