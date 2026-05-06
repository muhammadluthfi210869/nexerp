import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MaterialsService } from '../services/materials.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateMaterialDto, UpdateMaterialDto } from '../dto/material.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scm/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.RND,
    UserRole.COMMERCIAL,
  )
  findAll() {
    return this.materialsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.RND)
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  remove(@Param('id') id: string) {
    return this.materialsService.softDelete(id);
  }
}
