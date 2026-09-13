// Wave 4 / D3 — DecisionSupport REST controller.
//
// 5 endpoints mounted at /v1/decision/*:
//   GET    /pending             — current user's pending items
//   GET    /queue               — director's org-wide queue (paginated)
//   POST   /:id/resolve         — record decision (APPROVE/REJECT/DEFER)
//   GET    /history             — user's decision audit trail
//   GET    /recommendations     — heuristic recommendations
//   GET    /rules               — list alert rules (admin)
//
// All routes require JWT auth. Director / SUPER_ADMIN role gates /queue
// + /rules (per Wave 3 RBAC pattern).

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { DecisionSupportService, DecisionAction } from './decision-support.service';
import { AlertEngineService } from './alert-engine.service';
import type { Request as ExpressRequest } from 'express';

interface AuthedUser {
  sub: string;
  email: string;
  roles: string[];
}

@ApiTags('decision')
@ApiBearerAuth()
@Controller(['decision', 'v1/decision'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class DecisionSupportController {
  constructor(
    private readonly svc: DecisionSupportService,
    private readonly alerts: AlertEngineService,
  ) {}

  @Get('pending')
  async pending(@Request() req: ExpressRequest) {
    const user = req.user as unknown as AuthedUser;
    return this.svc.getPendingForUser(user.sub);
  }

  @Get('queue')
  @Roles(UserRole.DIRECTOR, UserRole.SUPER_ADMIN, UserRole.HEAD_OPS)
  async queue(
    @Query() query: { limit?: string; offset?: string },
  ) {
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    return this.svc.getQueue({
      limit: Number.isFinite(limit) ? Math.min(200, Math.max(1, limit)) : 50,
      offset: Number.isFinite(offset) ? Math.max(0, offset) : 0,
    });
  }

  @Post(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() body: { action: DecisionAction; rationale: string },
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as unknown as AuthedUser;
    return this.svc.recordDecision(id, body.action, body.rationale ?? '', user.sub);
  }

  @Get('history')
  async history(
    @Query() query: { limit?: string; offset?: string },
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as unknown as AuthedUser;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    return this.svc.getHistory(user.sub, {
      limit: Number.isFinite(limit) ? Math.min(200, Math.max(1, limit)) : 50,
      offset: Number.isFinite(offset) ? Math.max(0, offset) : 0,
    });
  }

  @Get('recommendations')
  async recommendations(@Request() req: ExpressRequest) {
    const user = req.user as unknown as AuthedUser;
    return this.svc.getRecommendations(user.sub);
  }

  @Get('rules')
  @Roles(UserRole.DIRECTOR, UserRole.SUPER_ADMIN, UserRole.HEAD_OPS)
  listRules() {
    return this.alerts.listRules();
  }

  @Patch('rules/:id/toggle')
  @Roles(UserRole.DIRECTOR, UserRole.SUPER_ADMIN, UserRole.HEAD_OPS)
  toggleRule(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    const ok = this.alerts.setRuleEnabled(id, !!body.enabled);
    return { ok, id, enabled: !!body.enabled };
  }
}