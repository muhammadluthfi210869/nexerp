import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketingPrototypeController } from './prototype/marketing-prototype.controller';
import { MarketingPrototypeService } from './prototype/marketing-prototype.service';
import { CanonicalMarketingController } from './canonical/canonical-marketing.controller';
import { CanonicalMarketingService } from './canonical/canonical-marketing.service';
import { LeadCaptureModule } from '../lead-capture/lead-capture.module';
import { OmniCrmStateController } from './omni-crm/omni-crm-state.controller';
import { OmniCrmStateService } from './omni-crm/omni-crm-state.service';
import { OmniCrmConversationController } from './omni-crm/omni-crm-conversation.controller';
import { OmniCrmConversationService } from './omni-crm/omni-crm-conversation.service';
import { DreamlabRrSyncService } from './omni-crm/dreamlab-rr-sync.service';

// PRODUCTION-LIGHT bridge 2026-09-14: introduce CanonicalMarketingController
// alongside the prototype. Both serve /v1/marketing/* — prototype under the
// /v1/marketing/prototype/* prefix (legacy), canonical under /v1/marketing/*
// (SSOT contract v1.2.0 — UPPER_CASE enums, OCC, idempotency, 422 guard).
// Mgmt-task Board UI (/samples/management-task) continues to hit prototype;
// future TaskWorkspaceV2 work targets canonical.

@Module({
  imports: [PrismaModule, LeadCaptureModule],
  providers: [
    MarketingPrototypeService,
    CanonicalMarketingService,
    OmniCrmStateService,
    OmniCrmConversationService,
    DreamlabRrSyncService,
  ],
  controllers: [
    MarketingPrototypeController,
    CanonicalMarketingController,
    OmniCrmStateController,
    OmniCrmConversationController,
  ],
  exports: [MarketingPrototypeService, CanonicalMarketingService, DreamlabRrSyncService],
})
export class MarketingModule {}
