import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('ar-aging')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.COMMERCIAL,
    UserRole.ADMIN,
  )
  async getArAging(
    @Query('asOfDate') asOfDate?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.reportsService.getArAging(
      asOfDate ? new Date(asOfDate) : undefined,
      customerId,
    );
  }

  @Get('ap-aging')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.PURCHASING,
    UserRole.ADMIN,
  )
  async getApAging(
    @Query('asOfDate') asOfDate?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.reportsService.getApAging(
      asOfDate ? new Date(asOfDate) : undefined,
      supplierId,
    );
  }

  @Get('sales-summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.COMMERCIAL,
    UserRole.ADMIN,
  )
  async getSalesSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.reportsService.getSalesSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      customerId,
    );
  }

  @Get('stock-valuation')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.WAREHOUSE,
    UserRole.ADMIN,
  )
  async getStockValuation(@Query('warehouseId') warehouseId?: string) {
    return this.reportsService.getStockValuation(warehouseId);
  }

  @Get('profit-loss')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
  )
  async getProfitLoss(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getProfitLoss(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('balance-sheet')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
  )
  async getBalanceSheet(@Query('date') date?: string) {
    return this.reportsService.getBalanceSheet(date ? new Date(date) : undefined);
  }

  @Get('trial-balance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
  )
  async getTrialBalance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getTrialBalance(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('cash-flow')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
  )
  async getCashFlow(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCashFlow(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
