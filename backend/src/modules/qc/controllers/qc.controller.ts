import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { QCAuditsService } from '../services/qc-audits.service';
import {
  QcReleaseService,
  ExecuteReleaseDto,
  PartialDispositionDto,
  RetestDto,
} from '../services/qc-release.service';
import { QcTraceabilityService } from '../services/qc-traceability.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@ApiTags('qc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc')
export class QcController {
  constructor(
    private readonly qcService: QCAuditsService,
    private readonly releaseService: QcReleaseService,
    private readonly traceabilityService: QcTraceabilityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get QC dashboard stats' })
  getDashboard() {
    return this.qcService.getDashboard();
  }

  @Get('workbench')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  @ApiOperation({ summary: 'Get QC workbench (quarantine audits)' })
  getWorkbench() {
    return this.qcService.getWorkbench();
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  @ApiOperation({
    summary:
      'Submit QC audit (alias for POST /qc/audits with snake_case support)',
  })
  async createLegacy(
    @Request() req: { user: User },
    @Body() dto: { step_log_id: string; status: string; notes?: string },
  ) {
    const statusMap: Record<string, string> = {
      PASS: 'GOOD',
      FAIL: 'REJECT',
    };
    return this.qcService.create(req.user.id, {
      stepLogId: dto.step_log_id,
      status: (statusMap[dto.status?.toUpperCase()] || dto.status) as any,
      notes: dto.notes,
    });
  }

  @Get('report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get QC audit report' })
  async getReport() {
    const audits = await this.prisma.qCAudit.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return audits;
  }

  @Get('analytics/reject-analysis')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get reject analysis' })
  async getRejectAnalysis() {
    const rejects = await this.prisma.qCAudit.findMany({
      where: { status: 'REJECT' },
      orderBy: { createdAt: 'desc' },
    });
    return rejects;
  }

  // --- QC & APJ Release (BUS-RULE-047) ---

  @Post('release')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.APJ, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Release quarantined stock to AVAILABLE' })
  executeRelease(
    @Request() req: { user: User },
    @Body() dto: ExecuteReleaseDto,
  ) {
    return this.releaseService.executeRelease(
      { id: req.user.id, roles: req.user.roles, fullName: req.user.fullName },
      dto,
    );
  }

  @Get('release/batches')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.APJ, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get batches eligible for or already released' })
  getReleaseBatches() {
    return this.releaseService.getReleaseBatches();
  }

  // --- Partial Dispositions & Retest ---

  @Post('disposition/partial')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.APJ, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Execute partial disposition (Pass, Rework, Scrap)' })
  executePartialDisposition(
    @Request() req: { user: User },
    @Body() dto: PartialDispositionDto,
  ) {
    return this.releaseService.executePartialDisposition(
      { id: req.user.id, roles: req.user.roles },
      dto,
    );
  }

  @Post('audits/:id/retest')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Execute retest audit for a rework or held batch' })
  executeRetest(
    @Param('id') id: string,
    @Request() req: { user: User },
    @Body() dto: RetestDto,
  ) {
    return this.releaseService.executeRetest(id, { id: req.user.id, roles: req.user.roles }, dto);
  }

  // --- Bidirectional Recall Traceability ---

  @Get('traceability/backward/:batchNumber')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.QC_LAB,
    UserRole.DIRECTOR,
    UserRole.PRODUCTION,
    UserRole.SCM,
  )
  @ApiOperation({ summary: 'Backward traceability tree (FG -> Stages -> Raw Material lots)' })
  getBackwardTraceability(@Param('batchNumber') batchNumber: string) {
    return this.traceabilityService.getBackwardTraceability(batchNumber);
  }

  @Get('traceability/forward/:materialBatch')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.QC_LAB,
    UserRole.DIRECTOR,
    UserRole.PRODUCTION,
    UserRole.SCM,
  )
  @ApiOperation({ summary: 'Forward recall traceability (Material Lot -> Affected Batches & Deliveries)' })
  getForwardRecallTraceability(@Param('materialBatch') materialBatch: string) {
    return this.traceabilityService.getForwardRecallTraceability(materialBatch);
  }
}
