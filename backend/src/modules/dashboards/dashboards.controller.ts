import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { DashboardsService } from './dashboards.service';

@ApiTags('dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}


  @Get('executive')
  @ApiOperation({ summary: 'Executive dashboard rollup' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getExecutiveDashboard() {
    return this.dashboardsService.getExecutiveDashboard();
  }

  @Get('finance')
  @ApiOperation({ summary: 'Finance dashboard rollup' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getFinanceDashboard() {
    return this.dashboardsService.getFinanceDashboard();
  }

  @Get('busdev')
  @ApiOperation({ summary: 'BusDev commercial pipeline dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getBusdevDashboard() {
    return this.dashboardsService.getBusdevDashboard();
  }

  @Get('production')
  @ApiOperation({ summary: 'Production floor & planning dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getProductionDashboard() {
    return this.dashboardsService.getProductionDashboard();
  }

  @Get('warehouse')
  @ApiOperation({ summary: 'Warehouse inventory dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getWarehouseDashboard() {
    return this.dashboardsService.getWarehouseDashboard();
  }

  @Get('qc')
  @ApiOperation({ summary: 'Quality control dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getQcDashboard() {
    return this.dashboardsService.getQcDashboard();
  }

  @Get('rnd')
  @ApiOperation({ summary: 'R&D sample and formula dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getRndDashboard() {
    return this.dashboardsService.getRndDashboard();
  }

  @Get('marketing')
  @ApiOperation({ summary: 'Marketing acquisition dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.DIGIMAR, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getMarketingDashboard() {
    return this.dashboardsService.getMarketingDashboard();
  }

  @Get('hr')
  @ApiOperation({ summary: 'HR personnel dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getHrDashboard() {
    return this.dashboardsService.getHrDashboard();
  }

  @Get('legality')
  @ApiOperation({ summary: 'Legality permits dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getLegalityDashboard() {
    return this.dashboardsService.getLegalityDashboard();
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Notification workload dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.ADMIN)
  getNotificationsDashboard() {
    return this.dashboardsService.getNotificationsDashboard();
  }

  @Get('procurement')
  @ApiOperation({ summary: 'Procurement SCM dashboard' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCM, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getProcurementDashboard() {
    return this.dashboardsService.getProcurementDashboard();
  }

  @Get('system-errors')
  @ApiOperation({ summary: 'System errors / Sentry summary (admin)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS)
  getSystemErrorsDashboard() {
    return this.dashboardsService.getSystemErrorsDashboard();
  }
}
