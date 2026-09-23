import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { SalesDownPaymentsService } from '../services/sales-down-payments.service';
import { CreateSalesDpDto } from '../dto/create-sales-dp.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commercial/down-payments')
export class SalesDownPaymentsController {
  constructor(private readonly dpService: SalesDownPaymentsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  create(@Body() dto: CreateSalesDpDto, @Req() req: any) {
    return this.dpService.create(dto, req.user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  findAll(@Query() query: { category?: string; soId?: string }) {
    return this.dpService.findAll(query);
  }
}
