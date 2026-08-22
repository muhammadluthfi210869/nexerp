import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { RegStage } from '@prisma/client';
import { LegalityBatch3Service } from './legality-batch3.service';

/**
 * BATCH 3 — Legalitas operational endpoints.
 *
 * Mounted at /legality/batch3. Distinct prefix from the legacy HKI/BPOM
 * endpoints so we don't collide with the existing LegalityController.
 *
 * Authorization:
 *   - intake: triggered by R&D event (no HTTP endpoint — listener-only).
 *   - advance / readiness: SUPER_ADMIN + COMPLIANCE.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('legality/batch3')
export class LegalityBatch3Controller {
  constructor(private readonly batch3: LegalityBatch3Service) {}

  @Get('readiness/:leadId/:sampleId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.COMPLIANCE, UserRole.RND)
  async getReadiness(
    @Param('leadId') leadId: string,
    @Param('sampleId') sampleId: string,
  ) {
    return this.batch3.getReadinessForLead(leadId, sampleId);
  }

  @Post('pipeline/:id/advance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async advance(
    @Param('id') id: string,
    @Body() body: { targetStage: RegStage; reason?: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.batch3.advancePipelineStage(
      id,
      body.targetStage,
      req.user.id,
      body.reason,
    );
  }

  @Post('intake/:sampleId')
  // Manual intake endpoint — useful for batch correction.
  // R&D event-driven intake is the normal path.
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE, UserRole.RND)
  async manualIntake(
    @Param('sampleId') sampleId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.batch3.intakeForCompletedSample(sampleId, req.user.id);
  }
}
