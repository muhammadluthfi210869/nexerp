import { Module } from '@nestjs/common';
import { LeadCaptureController } from './lead-capture.controller';
import { LeadCaptureService } from './lead-capture.service';
import { KommoService } from './kommo.service';
import { KommoAutoSyncService } from './kommo-auto-sync.service';
import { OutboundCounterService } from './outbound-counter.service';

@Module({
  controllers: [LeadCaptureController],
  providers: [LeadCaptureService, KommoService, KommoAutoSyncService, OutboundCounterService],
  exports: [LeadCaptureService, KommoService, OutboundCounterService],
})
export class LeadCaptureModule {}
