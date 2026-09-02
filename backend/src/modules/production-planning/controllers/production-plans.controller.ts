import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { ProductionPlansService } from '../services/production-plans.service';
import {
  CreateProductionPlanDto,
  UpdatePlanStatusDto,
} from '../dto/production-plan.dto';
import { CreateStepLogDto } from '../dto/step-log.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production-plans')
export class ProductionPlansController {
  constructor(private readonly plansService: ProductionPlansService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
  create(@Request() req: { user: User }, @Body() dto: CreateProductionPlanDto) {
    return this.plansService.create(req.user.id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePlanStatusDto) {
    return this.plansService.updateStatus(id, dto);
  }

  @Patch(':id/issue-materials')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.PURCHASING)
  issueMaterials(@Param('id') id: string) {
    return this.plansService.issueMaterials(id);
  }

  @Post('log-step')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP)
  logStep(@Body() dto: CreateStepLogDto) {
    return this.plansService.logStep(dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PRODUCTION_OP,
    UserRole.PURCHASING,
    UserRole.WAREHOUSE,
  )
  findAll() {
    return this.plansService.findAll();
  }
}
