import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoodsRequirementService } from '../services/goods-requirement.service';
import {
  CreateGoodsRequirementDto,
  UpdateGoodsRequirementStatusDto,
} from '../dto/goods-requirement.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('scm/goods-requirements')
@ApiBearerAuth()
@Controller('scm/goods-requirements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoodsRequirementController {
  constructor(private readonly service: GoodsRequirementService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.PRODUCTION)
  @ApiOperation({ summary: 'Create goods requirement (MRP)' })
  create(@Body() dto: CreateGoodsRequirementDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.PRODUCTION,
    UserRole.WAREHOUSE,
  )
  @ApiOperation({ summary: 'List all goods requirements' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.PRODUCTION,
    UserRole.WAREHOUSE,
  )
  @ApiOperation({ summary: 'Get goods requirement by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  @ApiOperation({ summary: 'Update goods requirement status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGoodsRequirementStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
