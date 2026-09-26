import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { KpiService } from './kpi.service';

@ApiTags('crm')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  /** GET /crm/kpi/summary — 7 KPI tiles. */
  @Get('kpi/summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.MARKETING,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
    UserRole.DIGIMAR,
  )
  @ApiOperation({ summary: 'Get CRM KPI summary tiles and performance aggregates' })
  summary() {
    return this.kpiService.summary();
  }
}
