import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  Req,
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
import { LeadService, P07ActorContext } from './services/lead.service';
import { PipelineService } from './services/pipeline.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AdvanceLeadDto } from './dto/advance-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, SOStatus, WorkflowStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@ApiTags('bussdev')
@ApiBearerAuth()
@Controller('bussdev')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BussdevController {
  constructor(
    private readonly bussdevService: BussdevService,
    private readonly leadService: LeadService,
    private readonly pipelineService: PipelineService,
  ) {}

  @Get('pipeline-v2/audit')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pipeline audit log' })
  getPipelineV2Audit() {
    return this.pipelineService.getPipelineV2Audit();
  }

  @Get('pipeline-v2/leads')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pipeline v2 active leads' })
  getPipelineV2Leads() {
    return this.pipelineService.getPipelineV2Leads();
  }

  // P07: the ONLY source of the trusted actor context. Tenant, roles,
  // correlation and idempotency all come from the verified request, never
  // from the request payload/query.
  private trustedActor(req: any): P07ActorContext {
    const user = req?.user ?? {};
    const header = (name: string): string | undefined => {
      const raw = req?.headers?.[name];
      const value = Array.isArray(raw) ? raw[0] : raw;
      return typeof value === 'string' && value.length > 0 ? value : undefined;
    };
    return {
      userId: user.id,
      organizationId: user.organizationId || user.tenantId,
      roles: Array.isArray(user.roles) ? user.roles : [],
      correlationId: req?.correlationId || randomUUID(),
      idempotencyKey: header('idempotency-key') || header('x-idempotency-key'),
    };
  }

  @Post('lead')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new business lead' })
  createLead(@Req() req: any, @Body() dto: CreateLeadDto) {
    return this.leadService.createLead(dto, this.trustedActor(req));
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
  advanceLead(@Param('id') id: string, @Body() dto: AdvanceLeadDto, @Req() req: any) {
    // The governed path owns tenant scope, consent, idempotency and the atomic
    // audit + outbox effects. The legacy `advanceLeadStage` is not tenant-aware.
    return this.leadService.advanceLeadStageGoverned(
      id,
      dto,
      this.trustedActor(req),
    );
  }

  @Get('dashboard')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tenant-scoped sales dashboard' })
  getDashboard(
    @Req() req: any,
    @Query()
    query: {
      dateFrom?: string;
      dateTo?: string;
      owner?: string;
      source?: string;
      stage?: string;
      sla?: string;
    },
  ) {
    const actor = this.trustedActor(req);
    return this.leadService.getLeadDashboardScoped({
      organizationId: actor.organizationId,
      dateFrom: query?.dateFrom,
      dateTo: query?.dateTo,
      ownerId: query?.owner,
      source: query?.source,
      stage: query?.stage as WorkflowStatus | undefined,
      sla: query?.sla as any,
    });
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
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all leads' })
  getLeads(@Req() req: any, @Query('mine') mine?: string) {
    const actor = this.trustedActor(req);
    return this.leadService.listLeadsScoped(actor, {
      bdId: mine === 'true' ? actor.userId : undefined,
    });
  }

  @Get('leads/stuck')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getStuckLeads(@Req() req: any) {
    return this.bussdevService.getStuckLeads(
      this.trustedActor(req).organizationId,
    );
  }

  @Get('leads/group/:group')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  getLeadsByGroup(@Req() req: any, @Param('group') group: string) {
    return this.bussdevService.getLeadsByGroup(
      group as 'guest' | 'sample' | 'production' | 'ro' | 'lost',
      this.trustedActor(req).organizationId,
    );
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

  // --- LEAD CRUD ---

  @Get('lead/:id')
  @Roles(
    UserRole.COMMERCIAL,
    UserRole.SUPER_ADMIN,
    UserRole.RND,
    UserRole.FINANCE,
  )
  @ApiOperation({ summary: 'Get single lead detail' })
  getLead(@Req() req: any, @Param('id') id: string) {
    return this.leadService.getLeadByIdScoped(id, this.trustedActor(req));
  }

  @Put('lead/:id')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update (or reassign) a lead' })
  updateLead(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.leadService.updateLeadScoped(id, dto, this.trustedActor(req));
  }

  @Delete('lead/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a lead' })
  deleteLead(@Param('id') id: string) {
    return this.bussdevService.deleteLead(id);
  }

  // --- SAMPLE SALES CRUD ---

  @Post('samples')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new sample sales order' })
  createSample(
    @Body()
    dto: {
      customerId: string;
      productName: string;
      description?: string;
      qty: number;
      unitPrice: number;
      targetDeliveryDate?: string;
      notes?: string;
    },
  ) {
    return this.bussdevService.createSampleSales(dto);
  }

  // --- SAMPLE REQUEST CRUD ---

  @Post('sample-request')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create sample request (from SOT)' })
  createSampleRequest(
    @Body()
    dto: {
      leadId: string;
      productName: string;
      targetFunction?: string;
      textureReq?: string;
      colorReq?: string;
      aromaReq?: string;
      targetHpp?: number;
    },
  ) {
    return this.bussdevService.createSampleRequest(dto);
  }

  @Patch('sample-request/:id')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Update a sample request' })
  updateSampleRequest(@Param('id') id: string, @Body() dto: any) {
    return this.bussdevService.updateSampleRequest(id, dto);
  }

  @Post('approve-sample')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Approve a sample' })
  approveSample(
    @Body()
    dto: {
      sampleId: string;
      approvedBy: string;
      notes?: string;
    },
  ) {
    return this.bussdevService.approveSample(dto);
  }

  // --- SALES ORDER CRUD ---

  @Post('sales-order')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a sales order' })
  createSalesOrder(
    @Body()
    dto: {
      leadId: string;
      sampleId: string;
      totalAmount: number;
      quantity?: number;
      brandName?: string;
    },
  ) {
    return this.bussdevService.createSalesOrder(dto);
  }

  @Get('sales-orders')
  @Roles(UserRole.COMMERCIAL, UserRole.SUPER_ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'List all sales orders' })
  getSalesOrders() {
    return this.bussdevService.getSalesOrders();
  }
}
