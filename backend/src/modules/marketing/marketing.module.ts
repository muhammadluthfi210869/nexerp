import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketingService } from './marketing/marketing.service';
import { MarketingController } from './marketing/marketing.controller';
import { FinanceModule } from '../finance/finance.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MarketingPrototypeController } from './prototype/marketing-prototype.controller';
import { MarketingPrototypeService } from './prototype/marketing-prototype.service';

@Module({
  imports: [PrismaModule, FinanceModule],
  providers: [MarketingService, MarketingPrototypeService],
  controllers: [MarketingController, MarketingPrototypeController],
  exports: [MarketingService, MarketingPrototypeService],
})
export class MarketingModule {}
