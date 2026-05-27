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

import { LegalityModule } from '../legality/legality.module';

@Module({
  imports: [PrismaModule, forwardRef(() => LegalityModule)],
  providers: [
    PurchaseOrdersService,
    InboundsService,
    MaterialsService,
    ScmService,
    PurchaseReturnsService,
    PurchaseInvoicesService,
    PurchasePaymentsService,
    SupplierScoreService,
  ],
  controllers: [
    PurchaseOrdersController,
    InboundsController,
    MaterialsController,
    ScmController,
    PurchaseReturnsController,
    PurchaseInvoicesController,
    PurchasePaymentsController,
  ],
  exports: [ScmService, SupplierScoreService],
})
export class ScmModule {}
