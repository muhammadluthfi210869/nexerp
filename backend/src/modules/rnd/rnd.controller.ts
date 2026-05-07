import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { RndService } from './rnd.service';
import { CreateSampleRequestDto } from './dto/create-sample-request.dto';
import { AdvanceSampleDto } from './dto/advance-sample-request.dto';

@ApiTags('rnd')
@ApiBearerAuth()
@Controller('rnd')
export class RndController {
  constructor(private readonly rndService: RndService) {}

  @Post('samples')
  @ApiOperation({ summary: 'Create a new sample request' })
  createSample(@Body() dto: CreateSampleRequestDto) {
    return this.rndService.createSample(dto);
  }

  @Patch('sample/:id/advance')
  advanceSample(@Param('id') id: string, @Body() dto: AdvanceSampleDto) {
    return this.rndService.advanceSampleStage(id, dto);
  }

  @Post('sample/:id/accept')
  acceptSample(@Param('id') id: string) {
    return this.rndService.acceptSample(id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get R&D dashboard metrics' })
  getDashboard() {
    return this.rndService.getDashboardMetrics();
  }

  @Get('samples')
  getSamples() {
    return this.rndService.getSamples();
  }

  @Get('samples/:id')
  getSample(@Param('id') id: string) {
    return this.rndService.getSample(id);
  }

  @Get('inbox')
  getInbox() {
    return this.rndService.getInboxSamples();
  }

  @Get('staffs')
  getStaffs() {
    return this.rndService.getStaffs();
  }

  @Patch('sample/:id/assign')
  assignPIC(@Param('id') id: string, @Body('picId') picId: string) {
    return this.rndService.assignPIC(id, picId);
  }

  @Get('samples/:id/versions')
  getVersions(@Param('id') id: string) {
    return this.rndService.getVersions(id);
  }

  @Get('samples/:id/feedback')
  getFeedback(@Param('id') id: string) {
    return this.rndService.getFeedback(id);
  }

  @Get('lab-test-results')
  @ApiOperation({
    summary: 'Get all lab test results (supports ?type=stability)',
  })
  getAllLabTestResults(@Query('type') type?: string) {
    return this.rndService.getAllLabTestResults(type);
  }

  @Get('lab-test-results/:formulaId')
  getLabTestResults(@Param('formulaId') formulaId: string) {
    return this.rndService.getLabTestResults(formulaId);
  }

  @Post('lab-test-results')
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
}
