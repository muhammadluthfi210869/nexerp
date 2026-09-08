import { Module } from '@nestjs/common';
import { BillLineItemsService } from './bill-line-items.service';
import { BillLineItemsController } from './bill-line-items.controller';

@Module({
  controllers: [BillLineItemsController],
  providers: [BillLineItemsService],
  exports: [BillLineItemsService],
})
export class BillLineItemsModule {}
