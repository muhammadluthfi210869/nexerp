import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Endpoint health standar untuk health-check container/CI (era production-light
  // hidup di /health; sejak global prefix 'v1' alamatnya jadi /v1/health —
  // sama yang dipakai docker-compose healthcheck, scripts/deploy.sh, dan
  // scripts/test-deploy.sh).
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
