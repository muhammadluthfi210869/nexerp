import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { KpiController } from './controllers/kpi.controller';
import { KpiRegistryService } from './services/kpi-registry.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AnalyticsService, KpiRegistryService],
  controllers: [AnalyticsController, KpiController],
  exports: [AnalyticsService, KpiRegistryService],
})
export class AnalyticsModule {}
