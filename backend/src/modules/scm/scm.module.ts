import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PurchaseOrdersService } from './services/purchase-orders.service';
import { InboundsService } from './services/inbounds.service';
import { MaterialsService } from './services/materials.service';
import { ScmService } from './services/scm.service';
import { PurchaseOrdersController } from './controllers/purchase-orders.controller';
import { InboundsController } from './controllers/inbounds.controller';
import { MaterialsController } from './controllers/materials.controller';
import { ScmController } from './controllers/scm.controller';
import { PurchaseReturnsController } from './controllers/purchase-returns.controller';
import { PurchaseReturnsService } from './services/purchase-returns.service';
import { PurchaseInvoicesService } from './services/purchase-invoices.service';
import { PurchaseInvoicesController } from './controllers/purchase-invoices.controller';
import { PurchasePaymentsService } from './services/purchase-payments.service';
import { SupplierScoreService } from './services/supplier-score.service';
import { PurchasePaymentsController } from './controllers/purchase-payments.controller';
import { GoodsRequirementService } from './services/goods-requirement.service';
import { GoodsRequirementController } from './controllers/goods-requirement.controller';
import { SalesOrderProcurementChangeListener } from './services/sales-order-procurement-change.listener';
import { ScmPlanningService } from './services/scm-planning.service';
import { ScmPlanningController } from './controllers/scm-planning.controller';

import { LegalityModule } from '../legality/legality.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [PrismaModule, forwardRef(() => LegalityModule), forwardRef(() => FinanceModule)],
  providers: [
    PurchaseOrdersService,
    InboundsService,
    MaterialsService,
    ScmService,
    PurchaseReturnsService,
    PurchaseInvoicesService,
    PurchasePaymentsService,
    SupplierScoreService,
    GoodsRequirementService,
    SalesOrderProcurementChangeListener,
    ScmPlanningService,
  ],
  controllers: [
    PurchaseOrdersController,
    InboundsController,
    MaterialsController,
    ScmController,
    PurchaseReturnsController,
    PurchaseInvoicesController,
    PurchasePaymentsController,
    GoodsRequirementController,
    ScmPlanningController,
  ],
  exports: [ScmService, SupplierScoreService],
})
export class ScmModule {}
