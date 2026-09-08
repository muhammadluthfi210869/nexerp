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
@Module({
  imports: [PrismaModule, LeadCaptureModule],
  providers: [
    MarketingService,
    MarketingPrototypeService,
    OmniCrmStateService,
    OmniCrmConversationService,
  ],
  controllers: [
    MarketingController,
    MarketingPrototypeController,
    OmniCrmStateController,
    OmniCrmConversationController,
  ],
  exports: [MarketingService, MarketingPrototypeService],
})
export class MarketingModule {}
