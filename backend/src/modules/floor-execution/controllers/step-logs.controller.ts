import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { StepLogsService } from '../services/step-logs.service';
import { ProductionExecutionService } from '../services/production-execution.service';
import { CreateStepLogDto } from '../dto/create-step-log.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production/step-logs')
export class StepLogsController {
  constructor(
    private readonly stepLogsService: StepLogsService,
    private readonly executionService: ProductionExecutionService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
  create(@Body() dto: CreateStepLogDto) {
    return this.executionService.executeStep(dto);
  }

  @Get('wo/:woId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP, UserRole.QC_LAB)
  findByPlan(@Param('woId') woId: string) {
    return this.stepLogsService.findByPlan(woId);
  }
}
