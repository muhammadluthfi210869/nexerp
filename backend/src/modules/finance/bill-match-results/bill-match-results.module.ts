import { Module } from '@nestjs/common';
import { BillMatchResultsService } from './bill-match-results.service';
import { BillMatchResultsController } from './bill-match-results.controller';

@Module({
  controllers: [BillMatchResultsController],
  providers: [BillMatchResultsService],
  exports: [BillMatchResultsService],
})
export class BillMatchResultsModule {}
