import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActivityLogService } from './activity-log.service';
import { LogActivityDto } from './dto/log-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import type { Request as ExpressRequest } from 'express';

interface AuthedUser {
  sub: string;
  email: string;
  roles: string[];
}

@Controller('activity-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Post('log')
  log(@Body() dto: LogActivityDto, @Request() req: ExpressRequest) {
    const user = req.user as unknown as AuthedUser;
    return this.service.log({
      userId: user.sub,
      type: dto.type,
      method: dto.method,
      entityType: dto.entityType,
      entityId: dto.entityId,
      path: dto.path ?? req.originalUrl,
      metadata: dto.metadata ?? null,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get('me')
  me(@Query() query: QueryActivityDto, @Request() req: ExpressRequest) {
    const user = req.user as unknown as AuthedUser;
    return this.service.findForUser(user.sub, query);
  }

  @Get('user/:userId')
  @Roles('SUPER_ADMIN', 'DIRECTOR', 'HEAD_OPS')
  userActivity(
    @Param('userId') userId: string,
    @Query() query: QueryActivityDto,
  ) {
    return this.service.findForUser(userId, query);
  }
}