import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LegalityService } from './legality.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('legality')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LegalityController {
  constructor(private readonly legalityService: LegalityService) {}

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getDashboard() {
    return this.legalityService.getDashboardMetrics();
  }

  @Get('hki')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getHki() {
    return this.legalityService.getHkiRecords();
  }

  @Get('bpom')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getBpom() {
    return this.legalityService.getBpomRecords();
  }

  @Get('staffs')
  // Publicly accessible for form selection unblocking
  async getStaffs() {
    return this.legalityService.getStaffs();
  }

  @Post('hki')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async createHki(@Body() data: any) {
    console.log('[LegalityController] Received HKI creation request:', data);
    return this.legalityService.createHki(data);
  }

  @Patch('hki/:id/advance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async advanceHki(@Param('id') id: string) {
    return this.legalityService.advanceHkiStage(id);
  }

  @Post('bpom')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async createBpom(@Body() data: any) {
    return this.legalityService.createBpom(data);
  }

  @Patch('bpom/:id/advance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async advanceBpom(@Param('id') id: string) {
    return this.legalityService.advanceBpomStage(id);
  }

  @Get(':id/logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getLogs(@Param('id') id: string) {
    return this.legalityService.getLogs(id);
  }

  @Post('log')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async addLog(@Body() payload: any) {
    return this.legalityService.addLog(payload);
  }

  @Get('formula/:id/validate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async validateFormula(@Param('id') id: string) {
    return this.legalityService.validateFormula(id);
  }

  @Post('formula/:id/review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async reviewFormula(
    @Param('id') id: string,
    @Body()
    body: { decision: 'APPROVE' | 'MINOR_FIX' | 'REJECT'; notes?: string },
  ) {
    return this.legalityService.reviewFormula(id, body.decision, body.notes);
  }

  @Get('check-scm/:leadId')
  async checkScmGate(@Param('leadId') leadId: string) {
    return this.legalityService.checkScmGate(leadId);
  }

  @Get('check-production/:leadId')
  async checkProductionGate(@Param('leadId') leadId: string) {
    return this.legalityService.checkProductionGate(leadId);
  }

  // --- REGULATORY PIPELINE ENDPOINTS ---

  @Get('pipeline/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getPipelineStats() {
    return this.legalityService.getPipelineStats();
  }

  @Get('pipeline')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getAllPipelines(
    @Query('search') search?: string,
    @Query('stage') stage?: string,
    @Query('client') client?: string,
  ) {
    return this.legalityService.getAllPipelines({ search, stage, client });
  }

  @Get('pipeline/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getPipelineDetails(@Param('id') id: string) {
    return this.legalityService.getPipelineDetails(id);
  }

  @Patch('pipeline/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async updatePipeline(@Param('id') id: string, @Body() data: any) {
    return this.legalityService.updatePipeline(id, data);
  }

  // --- COMPLIANCE INBOX ENDPOINTS ---

  @Get('inbox/tasks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getPendingTasks() {
    return this.legalityService.getPendingTasks();
  }

  @Post('pipeline/:id/artwork-review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async submitArtworkReview(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.legalityService.submitArtworkReview(id, {
      ...data,
      reviewer: req.user?.name || 'System',
    });
  }

  @Post('pipeline/:id/pnbp-request')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async requestPNBP(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.legalityService.requestPNBP(id, {
      ...data,
      pic: req.user?.name || 'System',
    });
  }

  @Post('pipeline/:id/pnbp-pay')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE, UserRole.FINANCE)
  async payPnbp(
    @Param('id') id: string,
    @Body() body: { financeRecordId: string },
  ) {
    return this.legalityService.payPnbp(id, body.financeRecordId);
  }

  // --- CORPORATE PERMITS ---

  @Get('permits')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getPermits() {
    return this.legalityService.getPermits();
  }

  // --- MASTER INCI MANAGEMENT ---

  @Get('master-inci')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async getMasterIncis(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.legalityService.getMasterIncis({ search, category });
  }

  @Post('master-inci')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async createMasterInci(@Body() data: any) {
    return this.legalityService.createMasterInci(data);
  }

  @Patch('master-inci/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async updateMasterInci(@Param('id') id: string, @Body() data: any) {
    return this.legalityService.updateMasterInci(id, data);
  }

  @Delete('master-inci/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async deleteMasterInci(@Param('id') id: string) {
    return this.legalityService.deleteMasterInci(id);
  }

  @Post('master-inci/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async bulkImportMasterInci(@Body('data') data: any[]) {
    return this.legalityService.bulkImportMasterInci(data);
  }
}
