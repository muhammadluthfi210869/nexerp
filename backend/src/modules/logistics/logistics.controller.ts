import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('logistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.WAREHOUSE, UserRole.HEAD_OPS)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('deliverable')
  getDeliverableOrders() {
    return this.logisticsService.getDeliverableOrders();
  }

  @Post('deliver/:workOrderId')
  deliver(
    @Param('workOrderId') workOrderId: string,
    @Body() dto: { courierName: string; trackingNumber: string },
  ) {
    return this.logisticsService.deliver(
      workOrderId,
      dto.courierName,
      dto.trackingNumber,
    );
  }
}
