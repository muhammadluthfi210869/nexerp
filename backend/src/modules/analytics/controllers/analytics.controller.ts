import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from '../services/analytics.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('executive')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE,
    UserRole.COMMERCIAL,
    UserRole.DIGIMAR,
  )
  getExecutiveKPIs() {
    return this.analyticsService.getExecutiveKPIs();
  }

  @Get('trends')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE,
    UserRole.COMMERCIAL,
    UserRole.DIGIMAR,
  )
  getTrends() {
    return this.analyticsService.getTrends();
  }

  @Get('products')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE,
    UserRole.COMMERCIAL,
    UserRole.DIGIMAR,
  )
  getProductPerformance() {
    return this.analyticsService.getProductPerformance();
  }

  @Get('social')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE,
    UserRole.COMMERCIAL,
    UserRole.DIGIMAR,
  )
  getSocialAnalytics() {
    return this.analyticsService.getSocialAnalytics();
  }
}
