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
import { SalesOrdersBatch3Service } from '../services/sales-orders-batch3.service';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from '../dto/update-sales-order.dto';
import {
  Batch3CreateSODto,
  Batch3AmendSODto,
} from '../dto/batch3-sales-order.dto';
import { LegalityBatch3Service } from '../../legality/legality-batch3.service';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commercial/sales-orders')
export class SalesOrdersController {
  constructor(
    private readonly soService: SalesOrdersService,
    private readonly soBatch3: SalesOrdersBatch3Service,
    private readonly legalityBatch3: LegalityBatch3Service,
    private readonly prisma: PrismaService,
  ) {}

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

  /**
   * Finance-facing alias for the canonical Sales Order list.
   *
   * Mirrors the shape FinanceService.getSalesOrders() returns (with
   * `isPaymentVerified` / `paymentVerifiedAt` / `paymentProofUrl`
   * derived from the lead's activities) so the `/finance/sales-orders`
   * frontend page can consume it directly. This keeps the production
   * route working without depending on the broken Creative / Warehouse
   * modules that FinanceModule pulls in.
   */
  @Get('finance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  async listForFinance() {
    const orders = await this.prisma.salesOrder.findMany({
      include: {
        lead: {
          include: {
            pic: true,
            activities: {
              where: {
                activityType: { in: ['SAMPLE_PAYMENT', 'DOWN_PAYMENT'] },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((so: any) => {
      const paymentActivity = so.lead?.activities?.find(
        (a: any) =>
          a.activityType === 'DOWN_PAYMENT' ||
          a.activityType === 'SAMPLE_PAYMENT',
      );
      return {
        ...so,
        isPaymentVerified: paymentActivity?.isValidated || false,
        paymentVerifiedAt: paymentActivity?.createdAt || null,
        paymentProofUrl: paymentActivity?.fileUrl || null,
      };
    });
  }

  // ─── CANONICAL BATCH-3 SALES ORDER ENDPOINTS ──────────────────────
  // These are the production contract for Batch 4 SCM / procurement
  // handoffs. The legacy `/commercial/sales-orders/batch3/...` prefix
  // remains as a thin alias for backwards compatibility and existing
  // test coverage.

  /**
   * Create SO with formula pinning + idempotency key.
   * Replaces POST /commercial/sales-orders/batch3.
   */
  @Post('v3')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  createV3(@Body() dto: Batch3CreateSODto, @Req() req: { user: { id: string } }) {
    return this.soBatch3.createWithFormulaPinning(dto, req.user.id);
  }

  /**
   * Probe SO eligibility before submit.
   */
  @Get('readiness/:leadId/:sampleId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.COMPLIANCE)
  readiness(@Param('leadId') leadId: string, @Param('sampleId') sampleId: string) {
    return this.legalityBatch3.getReadinessForLead(leadId, sampleId);
  }

  /**
   * Commit the SO (post-creation snapshot).
   */
  @Post('v3/:id/commit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  commitV3(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.soBatch3.commit(id, req.user.id);
  }

  /**
   * Amend a committed SO with reason.
   */
  @Post('v3/:id/amend')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  amendV3(
    @Param('id') id: string,
    @Body() dto: Batch3AmendSODto,
    @Req() req: { user: { id: string } },
  ) {
    return this.soBatch3.amend(id, dto, req.user.id);
  }

  /**
   * Full SO history (header + amendments + formula pin).
   */
  @Get('v3/:id/history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  historyV3(@Param('id') id: string) {
    return this.soBatch3.getHistory(id);
  }

  /**
   * Batch 4 handoff contract — what SCM / Procurement consume.
   */
  @Get('v3/:id/handoff')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL, UserRole.FINANCE)
  handoffV3(@Param('id') id: string) {
    return this.soBatch3.getHandoffContract(id);
  }
}
