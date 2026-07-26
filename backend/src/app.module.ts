import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { RndModule } from './modules/rnd/rnd.module';
import { DigimarModule } from './modules/digimar/digimar.module';
import { LeadCaptureModule } from './modules/lead-capture/lead-capture.module';
import { WaWebhookModule } from './modules/wa-webhook/wa-webhook.module';
// import { HrModule } from './modules/hr/hr.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from './shared/shared.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// ──────────────────────────────────────────────────
// 🟢 PRODUCTION-LIGHT: Modul di bawah di-comment karena
//    tidak dipakai untuk MVP RND + DigiMar + HR.
//    Lihat PRODUCTION_LIGHT.md untuk cara mengembalikan.
// ──────────────────────────────────────────────────
// import { GuestsModule } from './modules/guests/guests.module';
// import { CrmModule } from './modules/crm/crm.module';
// import { CommercialModule } from './modules/commercial/commercial.module';
// import { ScmModule } from './modules/scm/scm.module';
// import { ProductionPlanningModule } from './modules/production-planning/production-planning.module';
// import { FloorExecutionModule } from './modules/floor-execution/floor-execution.module';
// import { QcModule } from './modules/qc/qc.module';
// import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { FinanceModule } from './modules/finance/finance.module';
// import { LegalityModule } from './modules/legality/legality.module';
// import { BussdevModule } from './modules/bussdev/bussdev.module';
// import { WarehouseModule } from './modules/warehouse/warehouse.module';
// import { ProductionModule } from './modules/production/production.module';
// import { LogisticsModule } from './modules/logistics/logistics.module';
// import { CreativeModule } from './modules/creative/creative.module';
// import { ExecutiveModule } from './modules/executive/executive.module';
// import { ActivityStreamModule } from './modules/activity-stream/activity-stream.module';
// import { NotificationModule } from './modules/notification/notification.module';
// import { EventsModule } from './modules/events/events.module';
// import { SystemModule } from './modules/system/system.module';
// import { DocumentAutomationModule } from './modules/document-automation/document-automation.module';
// import { MasterModule } from './modules/master/master.module';
// import { MyDashboardModule } from './modules/my-dashboard/my-dashboard.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    // ── Core / Wajib ──
    PrismaModule,
    UsersModule,
    AuthModule,
    SharedModule,

    // ── Aktif (Prioritas) ──
    MarketingModule,
    RndModule,
    DigimarModule,
    LeadCaptureModule,
    WaWebhookModule,
    // HrModule,

    // ── Global ──
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),

    // ── Di-comment (tidak dipakai untuk MVP) ──
    // GuestsModule,
    // CrmModule,
    // CommercialModule,
    // ScmModule,
    // ProductionPlanningModule,
    // FloorExecutionModule,
    // QcModule,
    // FulfillmentModule,
    // AnalyticsModule,
    // FinanceModule,
    // LegalityModule,
    // BussdevModule,
    // WarehouseModule,
    // ProductionModule,
    // LogisticsModule,
    // CreativeModule,
    // ExecutiveModule,
    // MasterModule,
    // MyDashboardModule,
    // ActivityStreamModule,
    // NotificationModule,
    // EventsModule,
    // SystemModule,
    // DocumentAutomationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
