import { Module } from '@nestjs/common';
import { LeadCaptureController } from './lead-capture.controller';
import { LeadCaptureService } from './lead-capture.service';
import { KommoService } from './kommo.service';

@Module({
  controllers: [LeadCaptureController],
  providers: [LeadCaptureService, KommoService],
  exports: [LeadCaptureService, KommoService],
})
export class LeadCaptureModule {}