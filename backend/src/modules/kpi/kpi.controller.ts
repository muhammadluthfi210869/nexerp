// KpiController — WS-B (Wave 3).
// Mounted at /kpi and /v1/kpi (mirror CrmController pattern).
// 5 endpoints: person/me, person/:userId, division/:divisionId,
// division/:divisionId/metrics, leaderboard.

import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { KpiService } from './kpi.service';
import type { Request as ExpressRequest } from 'express';
import { Division, UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';

interface AuthedUser {
  sub: string;
  email: string;
  roles: string[];
}

@ApiTags('kpi')
@ApiBearerAuth()
@Controller(['kpi', 'v1/kpi'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(private readonly kpi: KpiService) {}

  private parsePeriod(q: { from?: string; to?: string }): {
    from?: Date;
    to?: Date;
  } {
    const period: { from?: Date; to?: Date } = {};
    if (q.from) period.from = new Date(q.from);
    if (q.to) period.to = new Date(q.to);
    return period;
  }

  @Get('person/me')
  me(
    @Query() query: { from?: string; to?: string },
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as unknown as AuthedUser;
    return this.kpi.computePerson(user.sub, this.parsePeriod(query));
  }

  @Get('person/:userId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.DIRECTOR,
    UserRole.HR,
  )
  person(
    @Param('userId') userId: string,
    @Query() query: { from?: string; to?: string },
  ) {
    return this.kpi.computePerson(userId, this.parsePeriod(query));
  }

  @Get('division/:divisionId')
  division(
    @Param('divisionId') divisionId: string,
    @Query() query: { from?: string; to?: string },
  ) {
    const division = divisionId as Division;
    return this.kpi.computeDivision(division, this.parsePeriod(query));
  }

  @Get('division/:divisionId/metrics')
  divisionMetrics(
    @Param('divisionId') divisionId: string,
    @Query() query: { from?: string; to?: string },
  ) {
    const division = divisionId as Division;
    return this.kpi.getDashboardMetrics(division, this.parsePeriod(query));
  }

  @Get('leaderboard')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.HEAD_OPS,
    UserRole.DIRECTOR,
    UserRole.HR,
  )
  leaderboard(
    @Query() query: { from?: string; to?: string; limit?: string },
  ) {
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit ?? '10', 10) || 10),
    );
    return this.kpi.topPerformers(this.parsePeriod(query), limit);
  }
}