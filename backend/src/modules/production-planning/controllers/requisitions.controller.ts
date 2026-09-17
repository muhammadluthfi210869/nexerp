import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { RequisitionsService } from '../services/requisitions.service';
import {
  CreateRequisitionDto,
  IssueRequisitionDto,
} from '../dto/requisition.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('material-requisitions')
export class RequisitionsController {
  constructor(private readonly requisitionsService: RequisitionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP) // Production requests materials
  create(@Body() dto: CreateRequisitionDto) {
    return this.requisitionsService.create(dto);
  }

  @Patch(':id/issue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE) // Warehouse issues and reduces stock
  issue(@Param('id') id: string, @Body() dto: IssueRequisitionDto) {
    return this.requisitionsService.issue(id, dto);
  }

  @Get('aggregated')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  async getAggregated() {
    return this.requisitionsService.getAggregatedRequisitions();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PRODUCTION_OP, UserRole.WAREHOUSE)
  findAll() {
    return this.requisitionsService.findAll();
  }
}
