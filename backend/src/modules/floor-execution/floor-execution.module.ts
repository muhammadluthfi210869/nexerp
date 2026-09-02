import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StepLogsService } from './services/step-logs.service';
import { StepLogsController } from './controllers/step-logs.controller';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { UsersModule } from '../users/users.module';
import { ProductionExecutionService } from './services/production-execution.service';

@Module({
  imports: [PrismaModule, WarehouseModule, UsersModule],
  providers: [StepLogsService, ProductionExecutionService],
  controllers: [StepLogsController],
})
export class FloorExecutionModule {}
