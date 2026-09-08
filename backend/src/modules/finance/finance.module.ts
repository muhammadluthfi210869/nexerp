import { Module, forwardRef } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ValuationService } from './valuation.service';
import { CashService } from './cash.service';

import { ScmModule } from '../scm/scm.module';
import { CreativeModule } from '../creative/creative.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

// Sprint 1 entity modules
import { BillsModule } from './bills/bills.module';
import { BillLineItemsModule } from './bill-line-items/bill-line-items.module';
import { DownPaymentsModule } from './down-payments/down-payments.module';
import { APPaymentsModule } from './ap-payments/ap-payments.module';
import { SalesInvoicesModule } from './sales-invoices/sales-invoices.module';
import { SalesInvoiceLineItemsModule } from './sales-invoice-line-items/sales-invoice-line-items.module';
import { ARReceiptsModule } from './ar-receipts/ar-receipts.module';
import { SampleFeesModule } from './sample-fees/sample-fees.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { BankTransactionsModule } from './bank-transactions/bank-transactions.module';
import { BankReconciliationsModule } from './bank-reconciliations/bank-reconciliations.module';
import { TaxTransactionsModule } from './tax-transactions/tax-transactions.module';
import { FixedAssetsModule } from './fixed-assets/fixed-assets.module';
import { DepreciationSchedulesModule } from './depreciation-schedules/depreciation-schedules.module';
import { AssetTransfersModule } from './asset-transfers/asset-transfers.module';
import { AssetDisposalsModule } from './asset-disposals/asset-disposals.module';
import { IntangibleAssetsModule } from './intangible-assets/intangible-assets.module';
import { PeriodLocksModule } from './period-locks/period-locks.module';
import { ClosingChecklistsModule } from './closing-checklists/closing-checklists.module';
import { AdjustmentJournalsModule } from './adjustment-journals/adjustment-journals.module';
import { JobOrderCostingsModule } from './job-order-costings/job-order-costings.module';
import { CostVariancesModule } from './cost-variances/cost-variances.module';
import { ProductProfitabilitiesModule } from './product-profitabilities/product-profitabilities.module';
import { CostAllocationsModule } from './cost-allocations/cost-allocations.module';
import { ClientEscrowsModule } from './client-escrows/client-escrows.module';
import { InventoryOwnershipsModule } from './inventory-ownerships/inventory-ownerships.module';
import { BillMatchResultsModule } from './bill-match-results/bill-match-results.module';

@Module({
  imports: [
    PrismaModule,
    ScmModule,
    CreativeModule,
    forwardRef(() => WarehouseModule),
    // Sprint 1 entity modules
    BillsModule,
    BillLineItemsModule,
    DownPaymentsModule,
    APPaymentsModule,
    SalesInvoicesModule,
    SalesInvoiceLineItemsModule,
    ARReceiptsModule,
    SampleFeesModule,
    BankAccountsModule,
    BankTransactionsModule,
    BankReconciliationsModule,
    TaxTransactionsModule,
    FixedAssetsModule,
    DepreciationSchedulesModule,
    AssetTransfersModule,
    AssetDisposalsModule,
    IntangibleAssetsModule,
    PeriodLocksModule,
    ClosingChecklistsModule,
    AdjustmentJournalsModule,
    JobOrderCostingsModule,
    CostVariancesModule,
    ProductProfitabilitiesModule,
    CostAllocationsModule,
    ClientEscrowsModule,
    InventoryOwnershipsModule,
    BillMatchResultsModule,
  ],
  providers: [FinanceService, ValuationService, CashService],
  controllers: [FinanceController],
  exports: [
    FinanceService,
    CashService,
    // Sprint 1 entity exports
    BillsModule,
    BillLineItemsModule,
    DownPaymentsModule,
    APPaymentsModule,
    SalesInvoicesModule,
    SalesInvoiceLineItemsModule,
    ARReceiptsModule,
    SampleFeesModule,
    BankAccountsModule,
    BankTransactionsModule,
    BankReconciliationsModule,
    TaxTransactionsModule,
    FixedAssetsModule,
    DepreciationSchedulesModule,
    AssetTransfersModule,
    AssetDisposalsModule,
    IntangibleAssetsModule,
    PeriodLocksModule,
    ClosingChecklistsModule,
    AdjustmentJournalsModule,
    JobOrderCostingsModule,
    CostVariancesModule,
    ProductProfitabilitiesModule,
    CostAllocationsModule,
    ClientEscrowsModule,
    InventoryOwnershipsModule,
    BillMatchResultsModule,
  ],
})
export class FinanceModule {}
