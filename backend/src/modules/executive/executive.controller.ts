import { Controller, Get, UseGuards } from '@nestjs/common';
import { ExecutiveService } from './executive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('executive')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExecutiveController {
  constructor(private executiveService: ExecutiveService) {}

  @Get('metrics')
  @Roles('SUPER_ADMIN', 'HEAD_OPS', 'FINANCE')
  async getMetrics() {
    return this.executiveService.getExecutiveMetrics();
  }

  @Get('alerts')
  @Roles('SUPER_ADMIN', 'HEAD_OPS', 'FINANCE')
  async getAlerts() {
    return this.executiveService.getExecutiveAlerts();
  }
}
