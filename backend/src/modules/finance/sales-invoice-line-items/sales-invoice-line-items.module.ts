import { Module } from '@nestjs/common';
import { SalesInvoiceLineItemsService } from './sales-invoice-line-items.service';
import { SalesInvoiceLineItemsController } from './sales-invoice-line-items.controller';

@Module({
  controllers: [SalesInvoiceLineItemsController],
  providers: [SalesInvoiceLineItemsService],
  exports: [SalesInvoiceLineItemsService],
})
export class SalesInvoiceLineItemsModule {}
