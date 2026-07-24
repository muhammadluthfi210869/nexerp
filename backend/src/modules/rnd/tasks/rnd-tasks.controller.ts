import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RndTasksService } from './rnd-tasks.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@ApiTags('rnd-tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rnd')
export class RndTasksController {
  constructor(private readonly rndTasksService: RndTasksService) {}

  // ═════════════════════════════════════════════════════
  // DAILY TASKS
  // ═════════════════════════════════════════════════════

  @Get('daily-tasks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get all R&D daily tasks' })
  getDailyTasks(
    @Query('pic') pic?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.rndTasksService.getDailyTasks({ pic, status, startDate, endDate });
  }

  @Get('daily-tasks/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get a single daily task' })
  getDailyTask(@Param('id') id: string) {
    return this.rndTasksService.getDailyTask(id);
  }

  @Post('daily-tasks')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Create a daily task' })
  createDailyTask(
    @Body() dto: {
      date: string;
      pic: string;
      noNpf?: string;
      projectName: string;
      category: string;
      busdev?: string;
      task?: string;
      targetSampleCount?: number;
      status?: string;
      progress?: number;
      kendala?: string;
      nextAction?: string;
      deadline?: string;
      tanggalMasuk: string;
      tanggalDone?: string;
    },
  ) {
    return this.rndTasksService.createDailyTask(dto);
  }

  @Patch('daily-tasks/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Update a daily task (partial)' })
  updateDailyTask(
    @Param('id') id: string,
    @Body() dto: {
      date?: string;
      pic?: string;
      noNpf?: string;
      projectName?: string;
      category?: string;
      busdev?: string;
      task?: string;
      targetSampleCount?: number;
      status?: string;
      progress?: number;
      kendala?: string;
      nextAction?: string;
      deadline?: string;
      tanggalMasuk?: string;
      tanggalDone?: string;
    },
  ) {
    return this.rndTasksService.updateDailyTask(id, dto);
  }

  @Delete('daily-tasks/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Delete a daily task' })
  deleteDailyTask(@Param('id') id: string) {
    return this.rndTasksService.deleteDailyTask(id);
  }

  // ═════════════════════════════════════════════════════
  // PROJECT MONITORING
  // ═════════════════════════════════════════════════════

  @Get('projects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get all R&D projects' })
  getProjects(
    @Query('pic') pic?: string,
    @Query('status') status?: string,
  ) {
    return this.rndTasksService.getProjects({ pic, status });
  }

  @Get('projects/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get a single project' })
  getProject(@Param('id') id: string) {
    return this.rndTasksService.getProject(id);
  }

  @Post('projects')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Create a project' })
  createProject(
    @Body() dto: {
      projectName: string;
      pic: string;
      client?: string;
      category?: string;
      noNpf?: string;
      busdev?: string;
      status?: string;
      startDate: string;
      deadline?: string;
      totalDays?: number;
      revisionCount?: number;
      trialCount?: number;
      notes?: string;
    },
  ) {
    return this.rndTasksService.createProject(dto);
  }

  @Patch('projects/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Update a project (partial)' })
  updateProject(
    @Param('id') id: string,
    @Body() dto: {
      projectName?: string;
      pic?: string;
      client?: string;
      category?: string;
      noNpf?: string;
      busdev?: string;
      status?: string;
      startDate?: string;
      deadline?: string;
      totalDays?: number;
      revisionCount?: number;
      trialCount?: number;
      notes?: string;
    },
  ) {
    return this.rndTasksService.updateProject(id, dto);
  }

  @Delete('projects/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Delete a project' })
  deleteProject(@Param('id') id: string) {
    return this.rndTasksService.deleteProject(id);
  }

  // ═════════════════════════════════════════════════════
  // WEEKLY PERFORMANCE
  // ═════════════════════════════════════════════════════

  @Get('weekly-performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get all R&D weekly performance records' })
  getWeeklyPerformances(@Query('pic') pic?: string) {
    return this.rndTasksService.getWeeklyPerformances({ pic });
  }

  @Get('weekly-performance/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get a single weekly performance record' })
  getWeeklyPerformance(@Param('id') id: string) {
    return this.rndTasksService.getWeeklyPerformance(id);
  }

  @Post('weekly-performance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Create a weekly performance record' })
  createWeeklyPerformance(@Body() dto: {
    pic: string;
    weekLabel: string;
    weekStart: string;
    weekEnd: string;
    totalTask?: number;
    doneCount?: number;
    delayedCount?: number;
    failedTrial?: number;
    revisionCount?: number;
    ontimePct?: number;
    trialSuccessRate?: number;
    initiativeScore?: number;
    weeklyScore?: number;
    notes?: string;
  }) {
    return this.rndTasksService.createWeeklyPerformance(dto);
  }

  @Patch('weekly-performance/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Update a weekly performance record' })
  updateWeeklyPerformance(
    @Param('id') id: string,
    @Body() dto: {
      pic?: string;
      weekLabel?: string;
      weekStart?: string;
      weekEnd?: string;
      totalTask?: number;
      doneCount?: number;
      delayedCount?: number;
      failedTrial?: number;
      revisionCount?: number;
      ontimePct?: number;
      trialSuccessRate?: number;
      initiativeScore?: number;
      weeklyScore?: number;
      notes?: string;
    },
  ) {
    return this.rndTasksService.updateWeeklyPerformance(id, dto);
  }

  @Delete('weekly-performance/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Delete a weekly performance record' })
  deleteWeeklyPerformance(@Param('id') id: string) {
    return this.rndTasksService.deleteWeeklyPerformance(id);
  }

  // ═════════════════════════════════════════════════════
  // FAILED TRIAL LEARNING
  // ═════════════════════════════════════════════════════

  @Get('failed-trials')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get all failed trial learning records' })
  getFailedTrials(@Query('pic') pic?: string) {
    return this.rndTasksService.getFailedTrials({ pic });
  }

  @Get('failed-trials/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get a single failed trial record' })
  getFailedTrial(@Param('id') id: string) {
    return this.rndTasksService.getFailedTrial(id);
  }

  @Post('failed-trials')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Create a failed trial learning record' })
  createFailedTrial(@Body() dto: {
    date: string;
    projectFormula: string;
    pic: string;
    problemSymptom: string;
    rootCause?: string;
    correctionAttempted?: string;
    solution?: string;
    finalLearning?: string;
    applicableTo?: string;
  }) {
    return this.rndTasksService.createFailedTrial(dto);
  }

  @Patch('failed-trials/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Update a failed trial record' })
  updateFailedTrial(
    @Param('id') id: string,
    @Body() dto: {
      date?: string;
      projectFormula?: string;
      pic?: string;
      problemSymptom?: string;
      rootCause?: string;
      correctionAttempted?: string;
      solution?: string;
      finalLearning?: string;
      applicableTo?: string;
    },
  ) {
    return this.rndTasksService.updateFailedTrial(id, dto);
  }

  @Delete('failed-trials/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Delete a failed trial record' })
  deleteFailedTrial(@Param('id') id: string) {
    return this.rndTasksService.deleteFailedTrial(id);
  }

  // ═════════════════════════════════════════════════════
  // HEAD R&D TRACKER
  // ═════════════════════════════════════════════════════

  @Get('head-tracker')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get all Head R&D tracker entries' })
  getHeadTrackerEntries() {
    return this.rndTasksService.getHeadTrackerEntries();
  }

  @Get('head-tracker/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get a single Head R&D tracker entry' })
  getHeadTrackerEntry(@Param('id') id: string) {
    return this.rndTasksService.getHeadTrackerEntry(id);
  }

  @Post('head-tracker')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Create a Head R&D tracker entry' })
  createHeadTrackerEntry(@Body() dto: {
    date: string;
    strategicTask?: string;
    teamSupport?: string;
    approvalGiven?: string;
    innovationConcept?: string;
    escalationHandled?: string;
    notes?: string;
  }) {
    return this.rndTasksService.createHeadTrackerEntry(dto);
  }

  @Patch('head-tracker/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Update a Head R&D tracker entry' })
  updateHeadTrackerEntry(
    @Param('id') id: string,
    @Body() dto: {
      date?: string;
      strategicTask?: string;
      teamSupport?: string;
      approvalGiven?: string;
      innovationConcept?: string;
      escalationHandled?: string;
      notes?: string;
    },
  ) {
    return this.rndTasksService.updateHeadTrackerEntry(id, dto);
  }

  @Delete('head-tracker/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Delete a Head R&D tracker entry' })
  deleteHeadTrackerEntry(@Param('id') id: string) {
    return this.rndTasksService.deleteHeadTrackerEntry(id);
  }

  // ═════════════════════════════════════════════════════
  // MONTHLY KPI
  // ═════════════════════════════════════════════════════

  @Get('monthly-kpi')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get all monthly KPI records' })
  getMonthlyKpis(
    @Query('pic') pic?: string,
    @Query('month') month?: string,
  ) {
    return this.rndTasksService.getMonthlyKpis({ pic, month });
  }

  @Get('monthly-kpi/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get a single monthly KPI record' })
  getMonthlyKpi(@Param('id') id: string) {
    return this.rndTasksService.getMonthlyKpi(id);
  }

  @Post('monthly-kpi')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Create a monthly KPI record' })
  createMonthlyKpi(@Body() dto: {
    month: string;
    pic: string;
    ontimePct?: number;
    trialSuccessRate?: number;
    revisionRate?: number;
    initiativeScore?: number;
    knowledgeContribution?: number;
    compositeScore?: number;
    grade?: string;
  }) {
    return this.rndTasksService.createMonthlyKpi(dto);
  }

  @Patch('monthly-kpi/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Update a monthly KPI record' })
  updateMonthlyKpi(
    @Param('id') id: string,
    @Body() dto: {
      month?: string;
      pic?: string;
      ontimePct?: number;
      trialSuccessRate?: number;
      revisionRate?: number;
      initiativeScore?: number;
      knowledgeContribution?: number;
      compositeScore?: number;
      grade?: string;
    },
  ) {
    return this.rndTasksService.updateMonthlyKpi(id, dto);
  }

  @Delete('monthly-kpi/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Delete a monthly KPI record' })
  deleteMonthlyKpi(@Param('id') id: string) {
    return this.rndTasksService.deleteMonthlyKpi(id);
  }

  // ═════════════════════════════════════════════════════
  // PICS (RND users)
  // ═════════════════════════════════════════════════════

  @Get('pics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get all active RND PICs from User table' })
  getPics() {
    return this.rndTasksService.getPics();
  }

  // ═════════════════════════════════════════════════════
  // ANALYTICS
  // ═════════════════════════════════════════════════════

  @Get('analytics/trends')
  @Roles(UserRole.SUPER_ADMIN, UserRole.RND)
  @ApiOperation({ summary: 'Get analytics trends from tasks & projects' })
  getAnalyticsTrends() {
    return this.rndTasksService.getAnalyticsTrends();
  }
}
