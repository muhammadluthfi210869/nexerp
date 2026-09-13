import { Module } from '@nestjs/common';
import { BankTransactionsService } from './bank-transactions.service';
import { BankTransactionsController } from './bank-transactions.controller';
import { StateMachineModule } from '../../state-machine/state-machine.module';

@Module({
  imports: [StateMachineModule],
  controllers: [BankTransactionsController],
  providers: [BankTransactionsService],
  exports: [BankTransactionsService],
})
export class BankTransactionsModule {}
