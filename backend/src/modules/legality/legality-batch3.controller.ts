import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, RegStage, LegalApplicability, RegType } from '@prisma/client';
import { LegalityBatch3Service } from './legality-batch3.service';

/**
 * BATCH 3 (corrected) — Legalitas operational endpoints.
 *
 * Mounted at /legality/batch3. Distinct prefix from the legacy HKI/BPOM
 * endpoints so we don't collide with the existing LegalityController.
 *
 * Authorization:
 *   - intake: triggered by R&D event (no HTTP endpoint — listener-only).
 *   - advance: SUPER_ADMIN + COMPLIANCE.
 *   - readiness probe: SUPER_ADMIN + COMMERCIAL + COMPLIANCE + RND.
 *   - applicability set / manual intake: SUPER_ADMIN + COMPLIANCE (+ RND for manual intake).
 *
 * Applicability:
 *   - The PATCH endpoint is the canonical way to record an explicit
 *     REQUIRED / NOT_APPLICABLE decision on a sample. UNKNOWN is the
 *     default and blocks the SO gate until this endpoint is called.
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE, UserRole.RND)
  async manualIntake(
    @Param('sampleId') sampleId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.batch3.intakeForCompletedSample(sampleId, req.user.id);
  }

  @Patch('sample/:sampleId/applicability')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE)
  async setApplicability(
    @Param('sampleId') sampleId: string,
    @Body() body: { applicability: LegalApplicability; legalType?: RegType },
    @Req() req: { user: { id: string } },
  ) {
    const updated = await this.batch3.setApplicability(
      sampleId,
      body.applicability,
      body.legalType,
      req.user.id,
    );
    // If the caller flipped to REQUIRED, attempt intake immediately so the
    // pipeline exists for downstream readiness probes.
    if (body.applicability === 'REQUIRED') {
      await this.batch3.intakeForCompletedSample(sampleId, req.user.id, {
        applicability: body.applicability,
        legalType: body.legalType,
      });
    }
    return updated;
  }
}
