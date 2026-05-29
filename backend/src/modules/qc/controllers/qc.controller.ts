import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { QCAuditsService } from '../services/qc-audits.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@ApiTags('qc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc')
export class QcController {
  constructor(
    private readonly qcService: QCAuditsService,
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
    const audits = await this.prisma.qcAudit.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return audits;
  }

  @Get('analytics/reject-analysis')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Get reject analysis' })
  async getRejectAnalysis() {
    const rejects = await this.prisma.qcAudit.findMany({
      where: { status: 'REJECT' },
      orderBy: { createdAt: 'desc' },
    });
    return rejects;
  }
}
