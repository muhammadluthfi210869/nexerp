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

@Controller('master/warehouses')
@UseGuards(JwtAuthGuard)
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
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}
