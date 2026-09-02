import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarketingPrototypeController } from './prototype/marketing-prototype.controller';
import { MarketingPrototypeService } from './prototype/marketing-prototype.service';

// ⚠️ PRODUCTION-LIGHT: Hanya menyisakan prototype module
// untuk Management Task. MarketingService, LandingTracker,
// VercelTracker di-archive. Lihat PRODUCTION_LIGHT.md.

@Module({
  imports: [PrismaModule],
  providers: [MarketingPrototypeService],
  controllers: [MarketingPrototypeController],
  exports: [MarketingPrototypeService],
})
export class MarketingModule {}
