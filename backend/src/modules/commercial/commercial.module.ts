import { Module, forwardRef } from '@nestjs/common';
import { SalesOrdersService } from './services/sales-orders.service';
import { SalesOrdersBatch3Service } from './services/sales-orders-batch3.service';
import { InvoicesService } from './services/invoices.service';
import { PaymentsService } from './services/payments.service';
import { SalesOrdersController } from './controllers/sales-orders.controller';
import { SalesOrdersBatch3Controller } from './controllers/sales-orders-batch3.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { RetentionController } from './controllers/retention.controller';
import { FinanceSalesOrdersReadOnlyController } from './controllers/finance-sales-orders-readonly.controller';
import { LegalityModule } from '../legality/legality.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [LegalityModule, forwardRef(() => FinanceModule)],
  providers: [SalesOrdersService, SalesOrdersBatch3Service, InvoicesService, PaymentsService],
  controllers: [
    SalesOrdersController,
    SalesOrdersBatch3Controller,
    FinanceSalesOrdersReadOnlyController,
    InvoicesController,
    PaymentsController,
    RetentionController,
  ],
  exports: [SalesOrdersService, SalesOrdersBatch3Service, InvoicesService, PaymentsService],
})
export class CommercialModule {}
