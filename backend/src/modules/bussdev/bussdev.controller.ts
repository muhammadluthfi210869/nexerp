import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { BussdevService } from './bussdev.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AdvanceLeadDto } from './dto/advance-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, SOStatus } from '@prisma/client';

@ApiTags('bussdev')
@ApiBearerAuth()
@Controller('bussdev')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BussdevController {
  constructor(private readonly bussdevService: BussdevService) {}

  @Post('lead')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new business lead' })
  createLead(@Body() dto: CreateLeadDto) {
    return this.bussdevService.createLead(dto);
  }

  @Patch('lead/:id/advance')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'paymentProof', maxCount: 1 },
        { name: 'spkFile', maxCount: 1 },
        { name: 'pnfFile', maxCount: 1 },
        { name: 'quotationFile', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/commercial',
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(
              null,
              `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
            );
          },
        }),
      },
    ),
  )
  @ApiOperation({ summary: 'Advance a lead to the next stage' })
  advanceLead(
    @Param('id') id: string,
    @Body() dto: AdvanceLeadDto,
    @UploadedFiles()
    files: {
      paymentProof?: Express.Multer.File[];
      spkFile?: Express.Multer.File[];
      pnfFile?: Express.Multer.File[];
      quotationFile?: Express.Multer.File[];
    },
  ) {
    return this.bussdevService.advanceLeadStage(id, dto, files);
  }

  @Get('dashboard')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getDashboard() {
    return this.bussdevService.getPageAnalytics('dashboard');
  }

  // --- STATIS ANALYTICS ROUTES (MUST BE ABOVE :group) ---

  @Get('analytics/funnel')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getFunnelAnalytics() {
    return this.bussdevService.getFunnelAnalytics();
  }

  @Get('analytics/pipeline-granular')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getGranularPipelineTable() {
    return this.bussdevService.getGranularPipelineTable();
  }

  @Get('analytics/staff-performance')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getBDPerformance() {
    return this.bussdevService.getBDPerformance();
  }

  @Get('analytics/lost-churn')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getLostChurnTable() {
    return this.bussdevService.getLostChurnTable();
  }

  // --- PARAMETERIZED ANALYTICS ---

  @Get('analytics/:group')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getPageAnalytics(
    @Param('group')
    group: 'dashboard' | 'guest' | 'sample' | 'production' | 'ro' | 'lost',
  ) {
    return this.bussdevService.getPageAnalytics(group);
  }

  // --- LEAD FETCHING ---

  @Get('leads')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get all leads' })
  getLeads() {
    return this.bussdevService.getLeads();
  }

  @Get('leads/stuck')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getStuckLeads() {
    return this.bussdevService.getStuckLeads();
  }

  @Get('leads/group/:group')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getLeadsByGroup(
    @Param('group') group: 'guest' | 'sample' | 'production' | 'ro' | 'lost',
  ) {
    return this.bussdevService.getLeadsByGroup(group);
  }

  @Get('staffs')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getStaffs() {
    return this.bussdevService.getStaffs();
  }

  // --- CLIENT SAMPLE HUB ENDPOINTS ---

  @Get('samples')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getClientSamples() {
    return this.bussdevService.getClientSamples();
  }

  @Patch('sample/:id/ship')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  shipSample(
    @Param('id') id: string,
    @Body() dto: { courierName: string; trackingNumber: string },
  ) {
    return this.bussdevService.shipSample(id, dto);
  }

  @Patch('sample/:id/feedback')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  submitFeedback(
    @Param('id') id: string,
    @Body()
    dto: { rating: number; comment: string; status: 'APPROVED' | 'REVISION' },
  ) {
    return this.bussdevService.submitSampleFeedback(id, dto);
  }

  // --- ACTIVITY LOGGING ---

  @Post('lead/:id/activity')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Log a text interaction (Chat/Call/Meeting)' })
  logActivity(
    @Param('id') id: string,
    @Body()
    dto: {
      activityType: any;
      notes: string;
      productCategory?: any;
      estimatedMoq?: number;
    },
  ) {
    return this.bussdevService.logActivity({ leadId: id, ...dto });
  }

  @Get('lead/:id/activity-stream')
  @Roles(
    UserRole.COMMERCIAL,
    UserRole.SUPER_ADMIN,
    UserRole.RND,
    UserRole.PURCHASING,
    UserRole.FINANCE,
  )
  getActivityStream(@Param('id') id: string) {
    return this.bussdevService.getActivityStream(id);
  }

  @Get('lead/:id/balance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.COMMERCIAL)
  getLeadBalance(@Param('id') id: string) {
    return this.bussdevService.getLeadBalance(id);
  }

  @Post('guest/:id/convert')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  convertGuestToLead(@Param('id') id: string) {
    return this.bussdevService.convertGuestToLead(id);
  }

  @Patch('sales-order/:id/status')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  updateSoStatus(
    @Param('id') id: string,
    @Body() dto: { status: SOStatus; loggedBy: string },
  ) {
    return this.bussdevService.updateSalesOrderStatus(
      id,
      dto.status,
      dto.loggedBy,
    );
  }

  @Patch('lead/:id/override')
  @Roles(UserRole.SUPER_ADMIN)
  emergencyOverride(
    @Param('id') id: string,
    @Body() dto: { note: string; loggedBy: string },
  ) {
    return this.bussdevService.emergencyOverride(id, dto.note, dto.loggedBy);
  }

  @Get('debug/leads')
  @Roles(UserRole.SUPER_ADMIN)
  debugLeads() {
    return this.bussdevService.getLeads();
  }

  @Post('retention-engine/:id/trigger')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  triggerRetention(@Param('id') id: string) {
    return this.bussdevService.triggerRetentionCheck(id);
  }
}
