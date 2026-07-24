import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketingService } from './marketing/marketing.service';
import { MarketingController } from './marketing/marketing.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MarketingPrototypeController } from './prototype/marketing-prototype.controller';
import { MarketingPrototypeService } from './prototype/marketing-prototype.service';

// ⚠️ PRODUCTION-LIGHT: FinanceModule dihapus dari imports
// karena MarketingService sudah tidak menggunakan FinanceService.
// Lihat PRODUCTION_LIGHT.md untuk detail.

@Module({
  imports: [PrismaModule],
  providers: [MarketingService, MarketingPrototypeService],
  controllers: [MarketingController, MarketingPrototypeController],
  exports: [MarketingService, MarketingPrototypeService],
})
export class MarketingModule {}
