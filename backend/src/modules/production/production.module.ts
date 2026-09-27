import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionAnalyticsService } from './production-analytics.service';
import { ProductionBatchRecordService } from './production-batch-record.service';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionActualsService } from './production-actuals.service';
import { ProductionExecutionService } from './production-execution.service';
import { ProductionAuditService } from './production-audit.service';
import { ProductionMachineService } from './production-machine.service';
import { ProductionQrContextService } from './production-qr-context.service';
import { ProductionWorkOrderService } from './production-work-order.service';
import { ProductionController } from './production.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { LegalityModule } from '../legality/legality.module';

@Module({
  imports: [PrismaModule, LegalityModule],
  providers: [ProductionService, ProductionAnalyticsService, ProductionBatchRecordService, ProductionPlanningService, ProductionActualsService, ProductionExecutionService, ProductionAuditService, ProductionMachineService, ProductionQrContextService, ProductionWorkOrderService],
  controllers: [ProductionController],
})
export class ProductionModule {}
