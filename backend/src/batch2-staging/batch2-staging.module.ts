import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { BussdevModule } from '../modules/bussdev/bussdev.module';
import { RndModule } from '../modules/rnd/rnd.module';
import { LegalityModule } from '../modules/legality/legality.module';
import { ScmModule } from '../modules/scm/scm.module';
import { CommercialModule } from '../modules/commercial/commercial.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { MasterModule } from '../modules/master/master.module';
import { WarehouseModule } from '../modules/warehouse/warehouse.module';
import { SystemCoreModule } from './system-core.module';
import { ProductionModule } from '../modules/production/production.module';
import { ProductionPlanningModule } from '../modules/production-planning/production-planning.module';
import { QcModule } from '../modules/qc/qc.module';
import { FulfillmentModule } from '../modules/fulfillment/fulfillment.module';

/**
 * Batch-2/3 Vertical-Slice Staging Module.
 *
 * This is NOT the full application. It intentionally imports ONLY the real
 * production modules required to execute the Batch 2/3 Golden Flow:
 *   BusDev -> NPF/Sample handoff -> R&D Inbox -> Accept -> Formula
 *   -> Legalitas intake/advance -> Sales Order with formula pinning
 *   -> SO commit -> SO amendment (post-commit history) -> Batch 4 contract
 *
 * It deliberately EXCLUDES the pre-existing broken modules
 * (Creative / HR / Warehouse) that prevent the monolithic AppModule from
 * compiling. Those remain documented as a separate FULL-APPLICATION-BOOT
 * defect and are not patched here.
 *
 * All business logic is the REAL production code (controllers, services,
 * DTOs, guards, JWT auth, PrismaService, EventEmitter). No mocks.
 */
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    SystemCoreModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    ScmModule,
    LegalityModule,
    BussdevModule,
    RndModule,
    CommercialModule,
    NotificationModule,
    // Batch 4's inherited-PR form reads the existing warehouse and supplier
    // masters.  Include their real guarded controllers in the scoped runtime.
    MasterModule,
    // Batch 5: canonical stock and warehouse surfaces use the real module.
    WarehouseModule,
    ProductionModule,
    ProductionPlanningModule,
    QcModule,
    FulfillmentModule,
  ],
})
export class Batch2StagingModule {}
