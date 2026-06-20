import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentAutomationService } from './services/document-automation.service';
import { PdfEngineService } from './services/pdf-engine.service';
import { DocumentAutomationController } from './controllers/document-automation.controller';
import { SystemModule } from '../system/system.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [SystemModule, EventEmitterModule, ScheduleModule.forRoot()],
  providers: [DocumentAutomationService, PdfEngineService],
  controllers: [DocumentAutomationController],
  exports: [DocumentAutomationService, PdfEngineService],
})
export class DocumentAutomationModule {}
