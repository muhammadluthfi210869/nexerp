import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { LogisticsService } from './logistics.service';

@Controller('logistics')
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
