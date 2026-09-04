import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LeadCaptureModule } from '../lead-capture/lead-capture.module';
import { MarketingService } from './marketing/marketing.service';
import { MarketingController } from './marketing/marketing.controller';
import { MarketingPrototypeController } from './prototype/marketing-prototype.controller';
import { MarketingPrototypeService } from './prototype/marketing-prototype.service';
import { OmniCrmStateController } from './omni-crm/omni-crm-state.controller';
import { OmniCrmStateService } from './omni-crm/omni-crm-state.service';
import { OmniCrmConversationController } from './omni-crm/omni-crm-conversation.controller';
import { OmniCrmConversationService } from './omni-crm/omni-crm-conversation.service';
import { MarketingTasksController } from './tasks/marketing-tasks.controller';
import { MarketingTasksService } from './tasks/marketing-tasks.service';
import { MarketingPostsController } from './posts/marketing-posts.controller';
import { MarketingPostsService } from './posts/marketing-posts.service';
import { CampaignOkrsController } from './posts/campaign-okrs.controller';
import { CampaignOkrsService } from './posts/campaign-okrs.service';
import { MetaGraphService } from './meta/meta-graph.service';
import { MetaGraphController } from './meta/meta-graph.controller';

@Module({
  imports: [PrismaModule, LeadCaptureModule],
  providers: [
    MarketingService,
    MarketingPrototypeService,
    OmniCrmStateService,
    OmniCrmConversationService,
    MarketingTasksService,
    MarketingPostsService,
    CampaignOkrsService,
    MetaGraphService,
  ],
  controllers: [
    MarketingController,
    MarketingPrototypeController,
    OmniCrmStateController,
    OmniCrmConversationController,
    MarketingTasksController,
    MarketingPostsController,
    CampaignOkrsController,
    MetaGraphController,
  ],
  exports: [MarketingService, MarketingPrototypeService, MarketingPostsService, CampaignOkrsService],
})
export class MarketingModule {}
