import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketingService } from './marketing/marketing.service';
import { MarketingController } from './marketing/marketing.controller';
import { MarketingPrototypeController } from './prototype/marketing-prototype.controller';
import { MarketingPrototypeService } from './prototype/marketing-prototype.service';
import { OmniCrmStateController } from './omni-crm/omni-crm-state.controller';
import { OmniCrmStateService } from './omni-crm/omni-crm-state.service';
import { MarketingTasksController } from './tasks/marketing-tasks.controller';
import { MarketingTasksService } from './tasks/marketing-tasks.service';

@Module({
  imports: [PrismaModule],
  providers: [
    MarketingService,
    MarketingPrototypeService,
    OmniCrmStateService,
    MarketingTasksService,
  ],
  controllers: [
    MarketingController,
    MarketingPrototypeController,
    OmniCrmStateController,
    MarketingTasksController,
  ],
  exports: [MarketingService, MarketingPrototypeService],
})
export class MarketingModule {}
