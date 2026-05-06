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
import { RouteAliasController } from './controllers/route-alias.controller';
import { PurchaseReturnsService } from './services/purchase-returns.service';

import { LegalityModule } from '../legality/legality.module';

@Module({
  imports: [PrismaModule, forwardRef(() => LegalityModule)],
  providers: [
    PurchaseOrdersService,
    InboundsService,
    MaterialsService,
    ScmService,
    PurchaseReturnsService,
  ],
  controllers: [
    PurchaseOrdersController,
    InboundsController,
    MaterialsController,
    ScmController,
    PurchaseReturnsController,
    RouteAliasController,
  ],
  exports: [ScmService],
})
export class ScmModule {}
