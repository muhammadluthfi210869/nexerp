import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../../prisma/prisma.module';
import { QCAuditsService } from './services/qc-audits.service';
import { QCChecklistsService } from './services/qc-checklists.service';
import { QCAuditsController } from './controllers/qc-audits.controller';
import { QCChecklistsController } from './controllers/qc-checklists.controller';
import { QCAnalyticsController } from './controllers/qc-analytics.controller';
import { QcController } from './controllers/qc.controller';

@Module({
  imports: [PrismaModule, EventEmitterModule],
  providers: [QCAuditsService, QCChecklistsService],
  controllers: [
    QcController,
    QCAuditsController,
    QCChecklistsController,
    QCAnalyticsController,
  ],
})
export class QcModule {}
