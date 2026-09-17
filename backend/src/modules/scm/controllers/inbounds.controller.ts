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
import { InboundsService } from '../services/inbounds.service';
import { CreateInboundDto, UpdateInboundStatusDto } from '../dto/inbound.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scm/inbounds')
export class InboundsController {
  constructor(private readonly inboundsService: InboundsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.WAREHOUSE)
  create(@Body() dto: CreateInboundDto) {
    return this.inboundsService.create(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING) // SCM approves received items
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
