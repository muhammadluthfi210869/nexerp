import { Controller, Get, UseGuards } from '@nestjs/common';
import { ExecutiveService } from './executive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller(['executive', 'v1/executive'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExecutiveController {
  constructor(private executiveService: ExecutiveService) {}

  @Get('metrics')
  @Roles('SUPER_ADMIN', 'HEAD_OPS', 'FINANCE', 'DIRECTOR')
  async getMetrics(): Promise<any> {
    return this.executiveService.getExecutiveMetrics();
  }

  @Get('alerts')
  @Roles('SUPER_ADMIN', 'HEAD_OPS', 'FINANCE', 'DIRECTOR')
  async getAlerts(): Promise<any> {
    return this.executiveService.getExecutiveAlerts();
  }

  @Get('audit-logs')
  @Roles('SUPER_ADMIN', 'HEAD_OPS', 'FINANCE', 'DIRECTOR')
  async getAuditLogs(): Promise<any> {
    return this.executiveService.getAuditLogs();
  }
}
