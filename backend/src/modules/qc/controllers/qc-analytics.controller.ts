import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { QCAuditsService } from '../services/qc-audits.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc/analytics')
export class QCAnalyticsController {
  constructor(private readonly qcService: QCAuditsService) {}

  @Get('defect-pareto')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.DIRECTOR)
  getDefectPareto(@Query('from') from?: string, @Query('to') to?: string) {
    return this.qcService.getDefectPareto(from, to);
  }

  @Get('supplier-quality')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.SCM)
  getSupplierQuality(@Query('from') from?: string, @Query('to') to?: string) {
    return this.qcService.getSupplierQuality(from, to);
  }

  @Get('funnel-degradation/:planId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.DIRECTOR)
  getFunnelDegradation(@Param('planId') planId: string) {
    return this.qcService.getFunnelDegradation(planId);
  }

  @Get('vendor-watchlist')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.SCM, UserRole.DIRECTOR)
  getVendorWatchlist() {
    return this.qcService.getVendorWatchlist();
  }

  @Get('rework-hold-log')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.PRODUCTION_OP)
  getReworkHoldLog() {
    return this.qcService.getReworkHoldLog();
  }
}
