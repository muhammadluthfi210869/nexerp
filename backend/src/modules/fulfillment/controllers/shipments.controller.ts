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
import { ShipmentsService } from '../services/shipments.service';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from '../dto/shipment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fulfillment/shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE)
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentsService.create(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateShipmentStatusDto) {
    return this.shipmentsService.updateStatus(id, dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.WAREHOUSE,
    UserRole.COMMERCIAL,
  )
  findAll() {
    return this.shipmentsService.findAll();
  }
}
