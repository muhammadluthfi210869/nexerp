import { Module } from '@nestjs/common';
import { BussdevService } from './bussdev.service';
import { BussdevController } from './bussdev.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BussdevListener } from './bussdev.listener';

import { LeadService } from './services/lead.service';
import { PipelineService } from './services/pipeline.service';
import { RetentionService } from './services/retention.service';
import { AnalyticsService } from './services/analytics.service';
import { AuditService } from '../../platform/audit/audit.service';
import { OutboxService } from '../../platform/outbox/outbox.service';

import { ReturnsModule } from './returns/returns.module';

@Module({
  imports: [PrismaModule, ReturnsModule],
  controllers: [BussdevController],
  providers: [
    BussdevService,
    BussdevListener,
    LeadService,
    PipelineService,
    RetentionService,
    AnalyticsService,
    AuditService,
    OutboxService,
  ],
  exports: [
    BussdevService,
    LeadService,
    PipelineService,
    RetentionService,
    AnalyticsService,
  ],
})
export class BussdevModule {}
