import { Module, forwardRef } from '@nestjs/common';
import { BussdevService } from './bussdev.service';
import { BussdevController } from './bussdev.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { BussdevListener } from './bussdev.listener';

import { ScmModule } from '../scm/scm.module';
import { LeadService } from './services/lead.service';
import { PipelineService } from './services/pipeline.service';
import { RetentionService } from './services/retention.service';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [PrismaModule, forwardRef(() => ScmModule)],
  controllers: [BussdevController],
  providers: [
    BussdevService,
    BussdevListener,
    LeadService,
    PipelineService,
    RetentionService,
    AnalyticsService,
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
