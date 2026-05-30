import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MyDashboardService } from './my-dashboard.service';

@Controller('my-dashboard')
@UseGuards(JwtAuthGuard)
export class MyDashboardController {
  constructor(private readonly service: MyDashboardService) {}

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.service.getPersonalStats(req.user.id);
  }
}
