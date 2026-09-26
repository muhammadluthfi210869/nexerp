import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionAnalyticsService } from './production-analytics.service';
import { ProductionController } from './production.controller';
import { PrismaModule } from '../../prisma/prisma.module';

import { LegalityModule } from '../legality/legality.module';

@Module({
  imports: [PrismaModule, LegalityModule],
  providers: [ProductionService, ProductionAnalyticsService],
  controllers: [ProductionController],
})
export class ProductionModule {}
