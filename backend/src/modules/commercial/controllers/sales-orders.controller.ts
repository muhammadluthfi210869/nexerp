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
import { SalesOrdersService } from '../services/sales-orders.service';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from '../dto/update-sales-order.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commercial/sales-orders')
export class SalesOrdersController {
  constructor(private readonly soService: SalesOrdersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  create(@Body() dto: CreateSalesOrderDto) {
    return this.soService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  findAll() {
    return this.soService.findAll();
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    return this.soService.update(id, dto);
  }
}
