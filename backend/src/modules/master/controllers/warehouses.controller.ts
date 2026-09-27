import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WarehousesService } from '../services/warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dto/warehouse.dto';
import { WarehouseAccessDto } from '../dto/warehouse-access.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('master/warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get('active')
  async findActive() {
    return this.warehousesService.findActive();
  }

  @Get('access')
  async findAccess(@Req() req: any) {
    return this.warehousesService.findAccess(req?.user?.id);
  }

  @Post('access')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HEAD_OPS, UserRole.WAREHOUSE)
  async grantAccess(@Body() body: WarehouseAccessDto, @Req() req: any) {
    return this.warehousesService.grantAccess(body, req?.user?.id);
  }

  @Get()
  findAll() {
    return this.warehousesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HEAD_OPS, UserRole.WAREHOUSE)
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HEAD_OPS, UserRole.WAREHOUSE)
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HEAD_OPS)
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}
