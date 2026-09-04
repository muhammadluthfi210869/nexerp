import { Module } from '@nestjs/common';
import { LeadCaptureController } from './lead-capture.controller';
import { LeadCaptureService } from './lead-capture.service';
import { KommoService } from './kommo.service';
import { KommoAutoSyncService } from './kommo-auto-sync.service';
import { AutoGreetService } from './auto-greet.service';
import { OutboundCounterService } from './outbound-counter.service';

@Module({
  controllers: [LeadCaptureController],
  providers: [LeadCaptureService, KommoService, KommoAutoSyncService, AutoGreetService, OutboundCounterService],
  exports: [LeadCaptureService, KommoService, AutoGreetService, OutboundCounterService],
})
export class LeadCaptureModule {}
