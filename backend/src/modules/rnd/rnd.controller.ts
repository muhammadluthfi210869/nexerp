import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { RndService, rndActorFromRequest } from './rnd.service';
import { CreateSampleRequestDto } from './dto/create-sample-request.dto';
import { AdvanceSampleDto } from './dto/advance-sample-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('rnd')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rnd')
export class RndController {
  constructor(private readonly rndService: RndService) {}

  @Post('samples')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Create a new sample request' })
  createSample(@Body() dto: CreateSampleRequestDto, @Req() req: any) {
    return this.rndService.createSample(dto, rndActorFromRequest(req));
  }

  @Patch('sample/:id/advance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  advanceSample(
    @Param('id') id: string,
    @Body() dto: AdvanceSampleDto,
    @Req() req: any,
  ) {
    return this.rndService.advanceSampleStage(id, dto, rndActorFromRequest(req));
  }

  @Post('sample/:id/accept')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  acceptSample(@Param('id') id: string, @Req() req: any) {
    return this.rndService.acceptSample(
      id,
      req?.user?.id,
      rndActorFromRequest(req),
    );
  }

  // ---------------------------------------------------------------------------
  // Sample-fee gate (BUS-RULE-107 / DEC-2026-09-20-051).
  // R&D hands the fee to Finance; ONLY Finance may verify or reject it.
  // ---------------------------------------------------------------------------

  @Post('sample/:id/request-payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Hand the sample fee to Finance for verification' })
  requestSamplePayment(
    @Param('id') id: string,
    @Body() body: { paymentProofUrl?: string },
    @Req() req: any,
  ) {
    return this.rndService.requestSamplePayment(
      id,
      req?.user?.id,
      body?.paymentProofUrl,
      rndActorFromRequest(req),
    );
  }

  @Post('sample/:id/verify-payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  @ApiOperation({
    summary: 'Finance confirms the sample fee was received (releases formulation)',
  })
  verifySamplePayment(
    @Param('id') id: string,
    @Body() body: { note?: string; paymentProofUrl?: string },
    @Req() req: any,
  ) {
    return this.rndService.verifySamplePayment(
      id,
      req?.user?.id,
      body?.note,
      body?.paymentProofUrl,
      rndActorFromRequest(req),
    );
  }

  @Post('sample/:id/reject-payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Finance records that the sample fee was not received' })
  rejectSamplePayment(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.rndService.rejectSamplePayment(
      id,
      req?.user?.id,
      body?.reason,
      rndActorFromRequest(req),
    );
  }

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get R&D dashboard metrics' })
  getDashboard(@Req() req: any) {
    return this.rndService.getDashboardMetrics(rndActorFromRequest(req));
  }

  @Get('samples')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getSamples(@Req() req: any) {
    return this.rndService.getSamples(rndActorFromRequest(req));
  }

  @Get('samples/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getSample(@Param('id') id: string, @Req() req: any) {
    return this.rndService.getSample(id, rndActorFromRequest(req));
  }

  @Get('inbox')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getInbox(@Req() req: any) {
    return this.rndService.getInboxSamples(rndActorFromRequest(req));
  }

  @Get('staffs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getStaffs() {
    return this.rndService.getStaffs();
  }

  @Patch('sample/:id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  assignPIC(
    @Param('id') id: string,
    @Body('picId') picId: string,
    @Req() req: any,
  ) {
    return this.rndService.assignPIC(id, picId, rndActorFromRequest(req));
  }

  @Get('samples/:id/versions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getVersions(@Param('id') id: string, @Req() req: any) {
    return this.rndService.getVersions(id, rndActorFromRequest(req));
  }

  @Get('samples/:id/feedback')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getFeedback(@Param('id') id: string, @Req() req: any) {
    return this.rndService.getFeedback(id, rndActorFromRequest(req));
  }

  @Get('revisions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get active revisions (NOT_STARTED + IN_PROGRESS)' })
  getRevisions(@Req() req: any) {
    return this.rndService.getRevisions(rndActorFromRequest(req));
  }

  @Get('revisions/history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get completed revision history' })
  getRevisionHistory(@Req() req: any) {
    return this.rndService.getRevisionHistory(rndActorFromRequest(req));
  }

  @Post('revision/:id/start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Start a revision (set IN_PROGRESS)' })
  startRevision(@Param('id') id: string, @Req() req: any) {
    return this.rndService.startRevision(id, rndActorFromRequest(req));
  }

  @Post('revision/:id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Complete a revision (set DONE)' })
  completeRevision(@Param('id') id: string, @Req() req: any) {
    return this.rndService.completeRevision(id, rndActorFromRequest(req));
  }

  @Get('lab-test-results')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({
    summary: 'Get all lab test results (supports ?type=stability)',
  })
  getAllLabTestResults(@Query('type') type?: string, @Req() req?: any) {
    return this.rndService.getAllLabTestResults(type, rndActorFromRequest(req));
  }

  @Get('lab-test-results/:formulaId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getLabTestResults(@Param('formulaId') formulaId: string, @Req() req: any) {
    return this.rndService.getLabTestResults(formulaId, rndActorFromRequest(req));
  }

  @Post('qc-parameters/:formulaId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Set QC target parameters for a formula' })
  async setQcParameters(
    @Param('formulaId') formulaId: string,
    @Body()
    dto: {
      targetPh?: string;
      targetViscosity?: string;
      targetColor?: string;
      targetAroma?: string;
      appearance?: string;
    },
    @Req() req: any,
  ) {
    return this.rndService.setQcParameters(
      formulaId,
      dto,
      rndActorFromRequest(req),
    );
  }

  @Post('lab-test-results')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  createLabTestResult(
    @Body()
    dto: {
      formulaId: string;
      testerId: string;
      actualPh?: string;
      actualViscosity?: string;
      actualDensity?: string;
      colorResult?: string;
      aromaResult?: string;
      textureResult?: string;
      stability40C?: string;
      stabilityRT?: string;
      stability4C?: string;
      notes?: string;
    },
    @Req() req: any,
  ) {
    return this.rndService.createLabTestResult(dto, rndActorFromRequest(req));
  }

  // `GET rnd/formulas` used to be declared here too. `RndModule.controllers`
  // lists FormulasController before RndController, so Express answered the path
  // from `rnd/formulas/formulas.controller.ts` and this handler could never run.
  // The formulas module owns that path; this controller owns `rnd/pipeline` and
  // the rest of the R&D surface.

  @Get('pipeline')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get R&D pipeline (all samples with phases)' })
  getPipeline(@Req() req: any) {
    return this.rndService.getPipeline(rndActorFromRequest(req));
  }
}
