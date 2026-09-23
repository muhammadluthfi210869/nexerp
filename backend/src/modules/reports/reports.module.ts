import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { FinancialReportsService } from './services/financial-reports.service';
import { OperationalReportsService } from './services/operational-reports.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [FinancialReportsService, OperationalReportsService],
  exports: [FinancialReportsService, OperationalReportsService],
})
export class ReportsModule {}
