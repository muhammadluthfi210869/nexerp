import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { PurchasePaymentsService } from '../services/purchase-payments.service';
import { CreatePurchasePaymentDto } from '../dto/purchase-payment.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scm/purchase-payments')
export class PurchasePaymentsController {
  constructor(private readonly service: PurchasePaymentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE)
  pay(@Body() dto: CreatePurchasePaymentDto, @Request() req: any) {
    return this.service.pay(dto, req.user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.FINANCE)
  findAll() {
    return this.service.findAll();
  }
}
