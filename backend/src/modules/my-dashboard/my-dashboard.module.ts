import { Module } from '@nestjs/common';
import { MyDashboardController } from './my-dashboard.controller';
import { MyDashboardService } from './my-dashboard.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MyDashboardController],
  providers: [MyDashboardService],
})
export class MyDashboardModule {}
