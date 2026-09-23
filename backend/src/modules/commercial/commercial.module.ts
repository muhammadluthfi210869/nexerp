import { Module } from '@nestjs/common';
import { SalesOrdersService } from './services/sales-orders.service';
import { InvoicesService } from './services/invoices.service';
import { PaymentsService } from './services/payments.service';
import { SalesOrdersController } from './controllers/sales-orders.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { RetentionController } from './controllers/retention.controller';

import { SalesDownPaymentsService } from './services/sales-down-payments.service';
import { SalesDownPaymentsController } from './controllers/sales-down-payments.controller';

@Module({
  providers: [SalesOrdersService, InvoicesService, PaymentsService, SalesDownPaymentsService],
  controllers: [
    SalesOrdersController,
    InvoicesController,
    PaymentsController,
    RetentionController,
    SalesDownPaymentsController,
  ],
  exports: [SalesOrdersService, InvoicesService, PaymentsService, SalesDownPaymentsService],
})
export class CommercialModule {}
