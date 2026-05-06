import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post('daily-ads')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  createDailyAds(@Body() data: any) {
    return this.marketingService.createDailyAds(data);
  }

  @Post('weekly-organic')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  createWeeklyOrganic(@Body() data: any) {
    return this.marketingService.createWeeklyOrganic(data);
  }

  @Post('content-asset')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  createContentAsset(@Body() data: any) {
    return this.marketingService.createContentAsset(data);
  }

  @Get('budget-audit')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  getBudgetAudit(@Query('start') start?: string, @Query('end') end?: string) {
    const startDate = start
      ? new Date(start)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = end ? new Date(end) : new Date();
    return this.marketingService.getBudgetAudit(startDate, endDate);
  }

  @Get('platform-performance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  getPlatformPerformance(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start
      ? new Date(start)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = end ? new Date(end) : new Date();
    return this.marketingService.getPlatformPerformance(startDate, endDate);
  }

  @Get('logs/ads')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async getAdsLogs() {
    return this.marketingService.getDailyAdsLogs();
  }

  @Patch('ads/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async updateAds(@Param('id') id: string, @Body() data: any) {
    return this.marketingService.updateDailyAds(id, data);
  }

  @Delete('ads/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async deleteAds(@Param('id') id: string) {
    return this.marketingService.deleteDailyAds(id);
  }

  @Get('logs/organic')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async getOrganicLogs() {
    return this.marketingService.getWeeklyOrganicLogs();
  }

  @Patch('organic/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async updateOrganic(@Param('id') id: string, @Body() data: any) {
    return this.marketingService.updateWeeklyOrganic(id, data);
  }

  @Delete('organic/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  async deleteOrganic(@Param('id') id: string) {
    return this.marketingService.deleteWeeklyOrganic(id);
  }

  @Get('logs-content')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  getContentLogs() {
    return this.marketingService.getContentAssetLogs();
  }

  @Get('analytics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  getAnalytics(@Query('start') start?: string, @Query('end') end?: string) {
    // Default to April 2026 as per the project's simulation cycle
    const defaultYear = 2026;
    const defaultMonth = 3; // April (0-indexed)

    const firstDayOfMonth = new Date(defaultYear, defaultMonth, 1);
    const lastDayOfMonth = new Date(
      defaultYear,
      defaultMonth + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const startDate = start ? new Date(start) : firstDayOfMonth;
    const endDate = end ? new Date(end) : lastDayOfMonth;

    return this.marketingService.getDashboardAnalytics(startDate, endDate);
  }

  @Get('organic-analytics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  getOrganicAnalytics(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const defaultYear = 2026;
    const defaultMonth = 3;
    const firstDayOfMonth = new Date(defaultYear, defaultMonth, 1);
    const lastDayOfMonth = new Date(
      defaultYear,
      defaultMonth + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const startDate = start ? new Date(start) : firstDayOfMonth;
    const endDate = end ? new Date(end) : lastDayOfMonth;
    return this.marketingService.getOrganicAnalytics(startDate, endDate);
  }

  @Get('acquisition-hub')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  getAcquisitionHub(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = Number(month);
    const y = Number(year);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);
    return this.marketingService.getAcquisitionHub(startDate, endDate, m, y);
  }

  @Get('funnel-efficiency')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  getFunnelEfficiency(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = Number(month);
    const y = Number(year);
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);
    return this.marketingService.getFunnelEfficiency(startDate, endDate);
  }

  @Get('content-performance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
  )
  getContentPerformance(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.marketingService.getContentPerformance(
      Number(month),
      Number(year),
    );
  }

  @Get('realized-roi')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.MARKETING)
  getRealizedROI(@Query('month') month: string, @Query('year') year: string) {
    return this.marketingService.getRealizedROI(Number(month), Number(year));
  }

  @Get('sample-efficiency')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.MARKETING,
    UserRole.COMMERCIAL,
    UserRole.PPIC,
  )
  getSampleEfficiency() {
    return this.marketingService.getSampleEfficiency();
  }

  @Post('targets')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  setTarget(@Body() data: any) {
    return this.marketingService.setMonthlyTarget(data);
  }

  @Post('audit-ads')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  auditAds(
    @Body() data: { id: string; isAudited: boolean; notes?: string },
    @Query('userId') userId: string,
  ) {
    return this.marketingService.auditDailyAds(data.id, data.isAudited, userId);
  }

  @Get('targets')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.COMMERCIAL)
  getTarget(@Query('month') month: string, @Query('year') year: string) {
    return this.marketingService.getMonthlyTarget(Number(month), Number(year));
  }

  @Get('comparison')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING, UserRole.DIGIMAR)
  getComparison(
    @Query('date') date: string,
    @Query('type') type: 'ADS' | 'ORGANIC',
  ) {
    return this.marketingService.getComparisonData(date, type);
  }
}
