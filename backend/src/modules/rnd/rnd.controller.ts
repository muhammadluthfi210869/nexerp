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

import { RndService } from './rnd.service';
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
  createSample(@Body() dto: CreateSampleRequestDto) {
    return this.rndService.createSample(dto);
  }

  @Patch('sample/:id/advance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  advanceSample(@Param('id') id: string, @Body() dto: AdvanceSampleDto) {
    return this.rndService.advanceSampleStage(id, dto);
  }

  @Post('sample/:id/accept')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  acceptSample(@Param('id') id: string, @Req() req: any) {
    return this.rndService.acceptSample(id, req?.user?.id);
  }

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get R&D dashboard metrics' })
  getDashboard() {
    return this.rndService.getDashboardMetrics();
  }

  @Get('samples')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getSamples() {
    return this.rndService.getSamples();
  }

  @Get('samples/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getSample(@Param('id') id: string) {
    return this.rndService.getSample(id);
  }

  @Get('inbox')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getInbox() {
    return this.rndService.getInboxSamples();
  }

  @Get('staffs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getStaffs() {
    return this.rndService.getStaffs();
  }

  @Patch('sample/:id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  assignPIC(@Param('id') id: string, @Body('picId') picId: string) {
    return this.rndService.assignPIC(id, picId);
  }

  @Get('samples/:id/versions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getVersions(@Param('id') id: string) {
    return this.rndService.getVersions(id);
  }

  @Get('samples/:id/feedback')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getFeedback(@Param('id') id: string) {
    return this.rndService.getFeedback(id);
  }

  @Get('revisions')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get active revisions (NOT_STARTED + IN_PROGRESS)' })
  getRevisions() {
    return this.rndService.getRevisions();
  }

  @Get('revisions/history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get completed revision history' })
  getRevisionHistory() {
    return this.rndService.getRevisionHistory();
  }

  @Post('revision/:id/start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Start a revision (set IN_PROGRESS)' })
  startRevision(@Param('id') id: string) {
    return this.rndService.startRevision(id);
  }

  @Post('revision/:id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Complete a revision (set DONE)' })
  completeRevision(@Param('id') id: string) {
    return this.rndService.completeRevision(id);
  }

  @Get('lab-test-results')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({
    summary: 'Get all lab test results (supports ?type=stability)',
  })
  getAllLabTestResults(@Query('type') type?: string) {
    return this.rndService.getAllLabTestResults(type);
  }

  @Get('lab-test-results/:formulaId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  getLabTestResults(@Param('formulaId') formulaId: string) {
    return this.rndService.getLabTestResults(formulaId);
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
  ) {
    return this.rndService.setQcParameters(formulaId, dto);
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
  ) {
    return this.rndService.createLabTestResult(dto);
  }

  @Get('formulas')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'List all formulas' })
  getFormulas() {
    return this.rndService.getFormulas();
  }

  @Get('pipeline')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get R&D pipeline (all samples with phases)' })
  getPipeline() {
    return this.rndService.getPipeline();
  }
}
