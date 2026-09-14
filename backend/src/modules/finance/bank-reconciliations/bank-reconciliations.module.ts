import { Module } from '@nestjs/common';
import { BankReconciliationsService } from './bank-reconciliations.service';
import { BankReconciliationsController } from './bank-reconciliations.controller';

@Module({
  controllers: [BankReconciliationsController],
  providers: [BankReconciliationsService],
  exports: [BankReconciliationsService],
})
export class BankReconciliationsModule {}
