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
import { UserRole, InboundStatus } from '@prisma/client';
import { InboundsService } from '../services/inbounds.service';
import { CreateInboundDto, UpdateInboundStatusDto } from '../dto/inbound.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['purchase/goods-receipts', 'scm/inbounds'])
export class InboundsController {
  constructor(private readonly inboundsService: InboundsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.PURCHASING)
  create(@Body() dto: CreateInboundDto) {
    return this.inboundsService.create(dto);
  }

  @Post(':id/post')
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE, UserRole.PURCHASING)
  postReceipt(@Param('id') id: string) {
    return this.inboundsService.updateStatus(id, { status: InboundStatus.APPROVED });
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInboundStatusDto) {
    return this.inboundsService.updateStatus(id, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.WAREHOUSE)
  findAll() {
    return this.inboundsService.findAll();
  }

  @Post(':id/qc-validate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.QC_LAB)
  qcValidate(
    @Param('id') id: string,
    @Body() dto: { items: { inboundItemId: string; qcStatus: string }[] },
  ) {
    return this.inboundsService.qcValidate(id, dto);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING)
  reject(@Param('id') id: string, @Body() dto: { reason: string }) {
    return this.inboundsService.reject(id, dto);
  }
}
