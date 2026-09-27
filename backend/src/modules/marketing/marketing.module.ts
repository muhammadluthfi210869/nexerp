import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LeadCaptureModule } from '../lead-capture/lead-capture.module';
import { MarketingService } from './marketing/marketing.service';
import { MarketingController } from './marketing/marketing.controller';
import { OmniCrmStateController } from './omni-crm/omni-crm-state.controller';
import { OmniCrmStateService } from './omni-crm/omni-crm-state.service';
import { OmniCrmConversationController } from './omni-crm/omni-crm-conversation.controller';
import { OmniCrmConversationService } from './omni-crm/omni-crm-conversation.service';
import { SocialPlannerController } from './social-planner/social-planner.controller';
import { SocialPlannerService } from './social-planner/social-planner.service';
import { DreamlabRrSyncService } from './omni-crm/dreamlab-rr-sync.service';
import { CanonicalMarketingController } from './canonical/canonical-marketing.controller';
import { CanonicalMarketingService } from './canonical/canonical-marketing.service';
import { LandingTrackerController } from './landing-tracker.controller';
import { LandingTrackerService } from './landing-tracker.service';
import { VercelTrackerController } from './vercel-tracker.controller';
import { VercelTrackerService } from './vercel-tracker.service';
import { MarketingCommandController } from './marketing-command.controller';

@Module({
  imports: [PrismaModule, LeadCaptureModule],
  providers: [
    MarketingService,
    OmniCrmStateService,
    OmniCrmConversationService,
    DreamlabRrSyncService,
    SocialPlannerService,
    CanonicalMarketingService,
    LandingTrackerService,
    VercelTrackerService,
  ],
  controllers: [
    MarketingController,
    MarketingCommandController,
    OmniCrmStateController,
    OmniCrmConversationController,
    SocialPlannerController,
    CanonicalMarketingController,
    LandingTrackerController,
    VercelTrackerController,
  ],
  exports: [
    MarketingService,
    SocialPlannerService,
    DreamlabRrSyncService,
    CanonicalMarketingService,
    LandingTrackerService,
    VercelTrackerService,
  ],
})
export class MarketingModule {}
