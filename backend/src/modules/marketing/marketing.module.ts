import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketingService } from './marketing/marketing.service';
import { MarketingController } from './marketing/marketing.controller';
import { FinanceModule } from '../finance/finance.module';
// Pre-R4 hardening: the marketing prototype (filesystem-backed mock task
// manager) is paused per architecture spec §17. We keep the files in the
// repo so historical references still typecheck, but the controllers and
// providers are no longer wired into the Nest module graph. To resume
// the prototype, restore the imports below plus the providers/controllers
// entries.
import { LandingTrackerController } from './landing-tracker.controller';
import { LandingTrackerService } from './landing-tracker.service';
import { VercelTrackerController } from './vercel-tracker.controller';
import { VercelTrackerService } from './vercel-tracker.service';

// Stubs that keep TS happy if any other module imports the prototype
// symbols. They are inert (no providers) so the controller endpoints
// do not register.
export { MarketingPrototypeController } from './prototype/marketing-prototype.controller';
export { MarketingPrototypeService } from './prototype/marketing-prototype.service';

@Module({
  imports: [PrismaModule, FinanceModule],
  providers: [MarketingService, LandingTrackerService, VercelTrackerService],
  controllers: [MarketingController, LandingTrackerController, VercelTrackerController],
  exports: [MarketingService],
})
export class MarketingModule {}