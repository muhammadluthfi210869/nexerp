import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductionPlansService } from './services/production-plans.service';
import { RequisitionsService } from './services/requisitions.service';
import { ProductionPlansController } from './controllers/production-plans.controller';
import { RequisitionsController } from './controllers/requisitions.controller';

@Module({
  imports: [PrismaModule],
  providers: [ProductionPlansService, RequisitionsService],
  controllers: [ProductionPlansController, RequisitionsController],
})
export class ProductionPlanningModule {}
