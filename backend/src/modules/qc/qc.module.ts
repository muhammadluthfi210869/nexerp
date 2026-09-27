import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../../prisma/prisma.module';
import { QCAuditsService } from './services/qc-audits.service';
import { QCChecklistsService } from './services/qc-checklists.service';
import { QcReleaseService } from './services/qc-release.service';
import { QcTraceabilityService } from './services/qc-traceability.service';
import { QCAuditsController } from './controllers/qc-audits.controller';
import { QCChecklistsController } from './controllers/qc-checklists.controller';
import { QCAnalyticsController } from './controllers/qc-analytics.controller';
import { QcController } from './controllers/qc.controller';

@Module({
  imports: [PrismaModule, EventEmitterModule],
  providers: [
    QCAuditsService,
    QCChecklistsService,
    QcReleaseService,
    QcTraceabilityService,
  ],
  controllers: [
    QcController,
    QCAuditsController,
    QCChecklistsController,
    QCAnalyticsController,
  ],
  exports: [QCAuditsService, QcReleaseService, QcTraceabilityService],
})
export class QcModule {}
