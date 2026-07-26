import { Module } from '@nestjs/common';
import { WaWebhookController } from './wa-webhook.controller';
import { WaWebhookService } from './wa-webhook.service';
import { LeadCaptureModule } from '../lead-capture/lead-capture.module';

@Module({
  imports: [LeadCaptureModule],
  controllers: [WaWebhookController],
  providers: [WaWebhookService],
})
export class WaWebhookModule {}