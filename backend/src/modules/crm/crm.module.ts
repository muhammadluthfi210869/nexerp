import { Module } from '@nestjs/common';
import { LostDealsService } from './lost-deals/lost-deals.service';
import { LostDealsController } from './lost-deals/lost-deals.controller';
import { LeadsService } from './leads/leads.service';
import { LeadsController } from './leads/leads.controller';
import { GuestbookService } from './guestbook/guestbook.service';
import { GuestbookController } from './guestbook/guestbook.controller';
import { KpiService } from './kpi/kpi.service';
import { KpiController } from './kpi/kpi.controller';
import { BusDevsController } from './busdevs/busdevs.controller';
import { LeadSvcWebhookController } from './ingest/lead-svc-webhook.controller';
import { ActivityStreamModule } from '../activity-stream/activity-stream.module';

@Module({
  imports: [ActivityStreamModule],
  providers: [
    LostDealsService,
    LeadsService,
    GuestbookService,
    KpiService,
  ],
  controllers: [
    LostDealsController,
    LeadsController,
    GuestbookController,
    KpiController,
    BusDevsController,
    LeadSvcWebhookController,
  ],
})
export class CrmModule {}
