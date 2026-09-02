import { Module } from '@nestjs/common';
import { SalesOrdersService } from './services/sales-orders.service';
import { InvoicesService } from './services/invoices.service';
import { PaymentsService } from './services/payments.service';
import { SalesOrdersController } from './controllers/sales-orders.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { RetentionController } from './controllers/retention.controller';

@Module({
  providers: [SalesOrdersService, InvoicesService, PaymentsService],
  controllers: [
    SalesOrdersController,
    InvoicesController,
    PaymentsController,
    RetentionController,
  ],
  exports: [SalesOrdersService, InvoicesService, PaymentsService],
})
export class CommercialModule {}
