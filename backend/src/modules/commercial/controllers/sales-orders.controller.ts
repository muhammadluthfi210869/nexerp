import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { SalesOrdersService } from '../services/sales-orders.service';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from '../dto/update-sales-order.dto';
import { AmendSalesOrderDto, SetDeliveryGateDto } from '../dto/amend-sales-order.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commercial/sales-orders')
export class SalesOrdersController {
  constructor(private readonly soService: SalesOrdersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  create(@Body() dto: CreateSalesOrderDto, @Req() req: any) {
    return this.soService.create(dto, req.user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  findAll(@Req() req: any) {
    return this.soService.findAll({ organizationId: req.user?.tenantId });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  findOne(@Param('id') id: string) {
    return this.soService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    return this.soService.update(id, dto);
  }

  @Post(':id/amend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  amend(
    @Param('id') id: string,
    @Body() dto: AmendSalesOrderDto,
    @Req() req: any,
  ) {
    return this.soService.requestAmendment(id, dto.reason, req.user);
  }

  @Post(':id/approve-amendment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  approveAmendment(@Param('id') id: string, @Req() req: any) {
    return this.soService.approveAmendment(id, req.user);
  }

  @Post(':id/delivery-gate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  setDeliveryGate(
    @Param('id') id: string,
    @Body() dto: SetDeliveryGateDto,
    @Req() req: any,
  ) {
    return this.soService.setDeliveryGate(id, dto.status, req.user);
  }
}
