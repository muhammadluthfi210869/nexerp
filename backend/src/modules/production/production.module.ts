import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionAnalyticsService } from './production-analytics.service';
import { ProductionBatchRecordService } from './production-batch-record.service';
import { ProductionPlanningService } from './production-planning.service';
import { ProductionActualsService } from './production-actuals.service';
import { ProductionExecutionService } from './production-execution.service';
import { ProductionAuditService } from './production-audit.service';
import { ProductionController } from './production.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { LegalityModule } from '../legality/legality.module';

@Module({
  imports: [PrismaModule, LegalityModule],
  providers: [ProductionService, ProductionAnalyticsService, ProductionBatchRecordService, ProductionPlanningService, ProductionActualsService, ProductionExecutionService, ProductionAuditService],
  controllers: [ProductionController],
})
export class ProductionModule {}
