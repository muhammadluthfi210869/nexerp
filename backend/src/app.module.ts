import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { GuestsModule } from './modules/guests/guests.module';
import { RndModule } from './modules/rnd/rnd.module';
import { CrmModule } from './modules/crm/crm.module';
import { CommercialModule } from './modules/commercial/commercial.module';
import { ScmModule } from './modules/scm/scm.module';
import { ProductionPlanningModule } from './modules/production-planning/production-planning.module';
import { FloorExecutionModule } from './modules/floor-execution/floor-execution.module';
import { QcModule } from './modules/qc/qc.module';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FinanceModule } from './modules/finance/finance.module';
import { LegalityModule } from './modules/legality/legality.module';
import { BussdevModule } from './modules/bussdev/bussdev.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { ProductionModule } from './modules/production/production.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { CreativeModule } from './modules/creative/creative.module';
import { HrModule } from './modules/hr/hr.module';
import { ExecutiveModule } from './modules/executive/executive.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ActivityStreamModule } from './modules/activity-stream/activity-stream.module';
import { SharedModule } from './shared/shared.module';
import { NotificationModule } from './modules/notification/notification.module';
import { EventsModule } from './modules/events/events.module';
import { SystemModule } from './modules/system/system.module';

import { MasterModule } from './modules/master/master.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    MarketingModule,
    GuestsModule,
    RndModule,
    CrmModule,
    CommercialModule,
    ScmModule,
    ProductionPlanningModule,
    FloorExecutionModule,
    QcModule,
    FulfillmentModule,
    AnalyticsModule,
    FinanceModule,
    LegalityModule,
    BussdevModule,
    WarehouseModule,
    ProductionModule,
    LogisticsModule,
    CreativeModule,
    HrModule,
    ExecutiveModule,
    MasterModule,
    EventEmitterModule.forRoot(),
    ActivityStreamModule,
    SharedModule,
    NotificationModule,
    EventsModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
