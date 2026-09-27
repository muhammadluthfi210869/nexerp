import { Module } from '@nestjs/common';
import { ExecutiveService } from './executive.service';
import { ExecutiveController } from './executive.controller';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [PrismaModule, FinanceModule],
  providers: [ExecutiveService, ReportsService],
  controllers: [ExecutiveController, ReportsController],
  exports: [ExecutiveService, ReportsService],
})
export class ExecutiveModule {}
