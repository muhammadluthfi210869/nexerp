import {
  Body,
  ConflictException,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { OmniCrmStateService } from './omni-crm-state.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['v1/marketing/omni-crm', 'marketing/omni-crm'])
export class OmniCrmStateController {
  constructor(private readonly service: OmniCrmStateService) {}

  @Get('state')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  async getState(@Req() req: { user: User }) {
    const row = await this.service.getOrNull(req.user.id);
    if (!row) return { state: null, version: null };
    return { state: row.state, version: row.version };
  }

  @Put('state')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MARKETING,
    UserRole.DIGIMAR,
    UserRole.COMMERCIAL,
    UserRole.DIRECTOR,
  )
  async putState(
    @Req() req: { user: User },
    @Body() body: { state: unknown; version?: number },
  ) {
    try {
      const updated = await this.service.upsert(
        req.user.id,
        body.state,
        body.version,
      );
      return { state: updated.state, version: updated.version };
    } catch (e) {
      if ((e as Error).message === 'VERSION_CONFLICT') {
        throw new ConflictException('VERSION_CONFLICT');
      }
      throw e;
    }
  }
}
