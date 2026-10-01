import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentAutomationService } from './services/document-automation.service';
import { PdfEngineService } from './services/pdf-engine.service';
import { DocumentAutomationController } from './controllers/document-automation.controller';
import { SystemModule } from '../system/system.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DocumentDraftGeneratorService } from './services/document-draft-generator.service';

@Module({
  imports: [SystemModule, EventEmitterModule, ScheduleModule.forRoot()],
  providers: [
    DocumentAutomationService,
    PdfEngineService,
    DocumentDraftGeneratorService,
  ],
  controllers: [DocumentAutomationController],
  exports: [
    DocumentAutomationService,
    PdfEngineService,
    DocumentDraftGeneratorService,
  ],
})
export class DocumentAutomationModule {}
