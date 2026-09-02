import { Controller, Get, Query } from '@nestjs/common';
import { StateTransitionService } from './state-transition.service';

@Controller('system')
export class SystemController {
  constructor(private stateTransition: StateTransitionService) {}

  @Get('audit-logs')
  async getAuditLogs(@Query('limit') limit: string) {
    return this.stateTransition.getAllLogs(limit ? parseInt(limit) : 100);
  }

  @Get('health')
  async getSystemHealth() {
    return {
      status: 'OPERATIONAL',
      timestamp: new Date(),
      version: '4.0.0-PROD',
      modules: [
        { name: 'PRODUCTION', status: 'ACTIVE' },
        { name: 'WAREHOUSE', status: 'ACTIVE' },
        { name: 'FINANCE', status: 'ACTIVE' },
        { name: 'SCM', status: 'ACTIVE' },
      ],
    };
  }
}
