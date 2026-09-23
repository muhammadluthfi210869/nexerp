import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExecutiveService } from './executive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExecutiveController {
  constructor(private executiveService: ExecutiveService) {}

  @Get(['executive/metrics', 'dashboards/metrics'])
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
  )
  async getMetrics(): Promise<any> {
    return this.executiveService.getExecutiveMetrics();
  }

  @Get(['dashboards/executive', 'executive/dashboard'])
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
  )
  async getExecutiveDashboard(@Query('period') period?: string): Promise<any> {
    return this.executiveService.getExecutiveDashboard(period);
  }

  @Get(['executive/alerts', 'dashboards/alerts'])
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
  )
  async getAlerts(): Promise<any> {
    return this.executiveService.getExecutiveAlerts();
  }

  @Get('executive/audit-logs')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.IT_SYS,
  )
  async getAuditLogs(): Promise<any> {
    return this.executiveService.getAuditLogs();
  }
}
