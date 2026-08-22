import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { SalesOrdersBatch3Service } from '../services/sales-orders-batch3.service';
import { Batch3CreateSODto, Batch3AmendSODto } from '../dto/batch3-sales-order.dto';
import { LegalityBatch3Service } from '../../legality/legality-batch3.service';

/**
 * BATCH 3 — Sales Order operational endpoints.
 *
 * Mounted at /commercial/sales-orders/batch3.
 *
 * Authorization:
 *   - create / commit: COMMERCIAL + SUPER_ADMIN
 *   - amend: COMMERCIAL + SUPER_ADMIN (FINANCE can read history only)
 *   - getHistory / getHandoffContract: COMMERCIAL + FINANCE + SUPER_ADMIN
 *   - readiness probe: open to COMMERCIAL so the UI can decide before submit
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commercial/sales-orders/batch3')
export class SalesOrdersBatch3Controller {
  constructor(
    private readonly so: SalesOrdersBatch3Service,
    private readonly legality: LegalityBatch3Service,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  create(@Body() dto: Batch3CreateSODto, @Req() req: { user: { id: string } }) {
    return this.so.createWithFormulaPinning(dto, req.user.id);
  }

  @Get('readiness/:leadId/:sampleId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.COMPLIANCE)
  readiness(@Param('leadId') leadId: string, @Param('sampleId') sampleId: string) {
    return this.legality.getReadinessForLead(leadId, sampleId);
  }

  @Post(':id/commit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  commit(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.so.commit(id, req.user.id);
  }

  @Post(':id/amend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  amend(
    @Param('id') id: string,
    @Body() dto: Batch3AmendSODto,
    @Req() req: { user: { id: string } },
  ) {
    return this.so.amend(id, dto, req.user.id);
  }

  @Get(':id/history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  history(@Param('id') id: string) {
    return this.so.getHistory(id);
  }

  @Get(':id/handoff')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  handoff(@Param('id') id: string) {
    return this.so.getHandoffContract(id);
  }
}
