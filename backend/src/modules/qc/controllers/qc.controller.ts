import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { QCAuditsService } from '../services/qc-audits.service';

@ApiTags('qc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc')
export class QcController {
  constructor(private readonly qcService: QCAuditsService) {}

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
}
