import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './common/config/env.validation';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { GuestsModule } from './modules/guests/guests.module';
import { RndModule } from './modules/rnd/rnd.module';
import { DigimarModule } from './modules/digimar/digimar.module';
import { LeadCaptureModule } from './modules/lead-capture/lead-capture.module';
import { WaWebhookModule } from './modules/wa-webhook/wa-webhook.module';
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
import { ScheduleModule } from '@nestjs/schedule';
import { ActivityStreamModule } from './modules/activity-stream/activity-stream.module';
import { SharedModule } from './shared/shared.module';
import { NotificationModule } from './modules/notification/notification.module';
import { EventsModule } from './modules/events/events.module';
import { SystemModule } from './modules/system/system.module';
import { DocumentAutomationModule } from './modules/document-automation/document-automation.module';
import { TodoModule } from './modules/todo/todo.module';

import { ActivityLogModule } from './modules/activity-log/activity-log.module';

import { StateMachineModule } from './modules/state-machine/state-machine.module';
import { KpiModule } from './modules/kpi/kpi.module';

import { MasterModule } from './modules/master/master.module';
import { MyDashboardModule } from './modules/my-dashboard/my-dashboard.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { DecisionSupportModule } from './modules/decision-support/decision-support.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // Fail-fast env validation: app won't boot with missing/invalid config
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),

    // Rate limiting (default: 100 req/min/IP — override via env THROTTLE_LIMIT)
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          ttl: 60_000,
          limit: cfg.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    CommonModule,
    UsersModule,
    AuthModule,
    MarketingModule,
    GuestsModule,
    RndModule,
    DigimarModule,
    LeadCaptureModule,
    WaWebhookModule,
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
    MyDashboardModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ActivityStreamModule,
    SharedModule,
    NotificationModule,
    EventsModule,
    SystemModule,
    DocumentAutomationModule,
    TodoModule,
    ActivityLogModule,
    StateMachineModule,
    KpiModule,
    CommunicationModule,
    DecisionSupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation ID to all routes
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
