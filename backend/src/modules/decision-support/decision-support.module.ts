// Wave 4 / D3 — DecisionSupport module wiring.
//
// Pulls in Auth + ActivityLog + AlertEngine + Kpi (all already @Global
// or imported by transitive deps).

import { Module } from '@nestjs/common';
import { AlertEngineService } from './alert-engine.service';
import { DecisionSupportService } from './decision-support.service';
import { DecisionSupportController } from './decision-support.controller';
import { AuthModule } from '../auth/auth.module';
import { KpiModule } from '../kpi/kpi.module';

@Module({
  imports: [AuthModule, KpiModule],
  controllers: [DecisionSupportController],
  providers: [AlertEngineService, DecisionSupportService],
  exports: [AlertEngineService, DecisionSupportService],
})
export class DecisionSupportModule {}