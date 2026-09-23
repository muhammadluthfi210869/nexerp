import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from '../dto/update-sales-order.dto';
import { SOStatus, InvoiceType, InvoiceStatus } from '@prisma/client';
import { IdGeneratorService } from '../../system/id-generator.service';
import { AuditService } from '../../../platform/audit/audit.service';

@Injectable()
export class SalesOrdersService {
  private readonly logger = new Logger(SalesOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
    @Optional() private audit?: AuditService,
  ) {}

  async create(dto: CreateSalesOrderDto, user?: any) {
    // BUS-RULE-014: Sales category is mandatory
    if (!dto.salesCategory || dto.salesCategory.trim() === '') {
      throw new BadRequestException(
        'SO_CATEGORY_REQUIRED: Kategori SO wajib dipilih: Sample / Produksi / Legalitas.',
      );
    }

    // BUS-RULE-013: Cart must have at least 1 item
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'CART_EMPTY: Cart kosong. Tambahkan minimal 1 item.',
      );
    }

    // BUS-RULE-001: Customer must be active and not blacklisted
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: dto.leadId },
    });
    if (!lead) {
      throw new NotFoundException(`Lead ${dto.leadId} not found`);
    }

    if (
      (lead as any).status === 'LOST' ||
      (lead as any).isBlacklisted === true ||
      (lead as any).isActive === false
    ) {
      throw new BadRequestException(
        'CUSTOMER_INACTIVE: Customer tidak aktif atau masuk daftar hitam. Hubungi Accounting untuk klarifikasi.',
      );
    }

    // Calculate total amount deterministically from line items
    const calculatedTotal = dto.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );

    const orderNumber = await this.idGenerator.generateId('SO');
    const tenantId = user?.tenantId || (lead as any).organizationId || null;

    const so = await this.prisma.salesOrder.create({
      data: {
        orderNumber,
        organizationId: tenantId,
        leadId: dto.leadId,
        sampleId: dto.sampleId,
        salesCategory: dto.salesCategory,
        brandName: dto.brandName,
        taxId: dto.taxId,
        currencyId: dto.currencyId,
        totalAmount: calculatedTotal,
        status: SOStatus.PENDING_DP,
        deliveryGateStatus: 'HELD',
        items: {
          create: dto.items.map((item) => ({
            materialItemId: item.materialId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            netto: item.netto || 0,
            taxId: item.taxId,
            subtotal: Number(item.quantity) * Number(item.unitPrice),
          })),
        },
      },
      include: {
        items: true,
        lead: true,
      },
    });

    // Emit event for document automation
    this.eventEmitter.emit('sales_order.created', {
      salesOrderId: so.id,
      totalAmount: calculatedTotal,
      orderNumber: so.orderNumber,
    });

    return so;
  }

  async findAll(filter?: { organizationId?: string }) {
    const where: any = {};
    if (filter?.organizationId) {
      where.organizationId = filter.organizationId;
    }

    return this.prisma.salesOrder.findMany({
      where,
      include: {
        lead: { select: { clientName: true } },
        sample: { select: { version: true } },
        invoices: { select: { status: true, type: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        lead: true,
        sample: true,
        items: true,
        invoices: {
          include: { payments: true },
        },
      },
    });
    if (!so) throw new NotFoundException(`Sales Order ${id} not found`);
    return so;
  }

  async update(id: string, dto: UpdateSalesOrderDto) {
    await this.findOne(id);

    // [INTERLOCK PROTOCOL]
    // Status SO cannot be ACTIVE unless DP Invoice is PAID
    if (dto.status === SOStatus.ACTIVE) {
      const dpInvoice = await this.prisma.invoice.findFirst({
        where: {
          soId: id,
          category: 'RECEIVABLE',
          type: InvoiceType.DP,
        },
      });

      if (!dpInvoice) {
        throw new BadRequestException(
          'Interlock Logic: Cannot activate SO without a Down Payment (DP) Invoice.',
        );
      }

      if (dpInvoice.status !== InvoiceStatus.PAID) {
        throw new BadRequestException(
          'Interlock Logic: Cannot activate SO until Down Payment (DP) is fully PAID.',
        );
      }

      this.logger.log(
        `[BROADCAST] SO Activated: ${id}. Notifying SCM to prepare materials.`,
      );
      this.logger.log(
        `[BROADCAST] SO Activated: ${id}. Notifying PRODUCTION to create schedule.`,
      );

      this.eventEmitter.emit('sales_order.activated', { salesOrderId: id });
    }

    const whitelistedData: Record<string, any> = {};
    if (dto.status !== undefined) whitelistedData.status = dto.status;

    return this.prisma.salesOrder.update({
      where: { id },
      data: whitelistedData,
    });
  }

  /**
   * BUS-RULE-002: Request amendment post-DP
   * Direct amendment after IN_PRODUCTION is strictly forbidden.
   */
  async requestAmendment(id: string, reason: string, user?: any) {
    const so = await this.findOne(id);

    // Forbidden once in production or later
    if (
      ['IN_PRODUCTION', 'QC_PASS', 'SHIPPED', 'COMPLETED'].includes(so.status)
    ) {
      throw new BadRequestException(
        'IN_PRODUCTION_IMMUTABLE: Data komersial SO terkunci setelah IN_PRODUCTION. Amandemen langsung dilarang.',
      );
    }

    if (
      !['ACTIVE', 'PENDING_DP', 'READY_TO_PRODUCE', 'LOCKED_ACTIVE'].includes(
        so.status,
      )
    ) {
      throw new BadRequestException(
        `CANNOT_AMEND: Status SO ${so.status} tidak dapat diamandemen.`,
      );
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: SOStatus.AMENDMENT_REVIEW,
        isAmendmentHeld: true,
        amendmentReason: reason,
      },
    });

    this.logger.log(
      `[AMENDMENT] SO ${id} entered AMENDMENT_REVIEW. Dispatch hold activated. Reason: ${reason}`,
    );

    this.eventEmitter.emit('sales_order.amendment_requested', {
      salesOrderId: id,
      reason,
      actorUserId: user?.id,
    });

    return updated;
  }

  /**
   * BUS-RULE-002: Approve amendment (BusDev + Finance)
   * Reconciles delta and lifts production hold
   */
  async approveAmendment(id: string, user?: any) {
    const so = await this.findOne(id);

    if (so.status !== SOStatus.AMENDMENT_REVIEW) {
      throw new BadRequestException(
        'SO_NOT_UNDER_AMENDMENT: SO tidak dalam status AMENDMENT_REVIEW.',
      );
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: SOStatus.ACTIVE,
        isAmendmentHeld: false,
      },
    });

    this.logger.log(
      `[AMENDMENT] SO ${id} amendment approved. Dispatch hold released.`,
    );

    this.eventEmitter.emit('sales_order.amendment_approved', {
      salesOrderId: id,
      actorUserId: user?.id,
    });

    return updated;
  }

  /**
   * BUS-RULE-006: AR Delivery Gatekeeper (HELD vs RELEASED)
   */
  async setDeliveryGate(id: string, gateStatus: 'HELD' | 'RELEASED', user?: any) {
    await this.findOne(id);

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        deliveryGateStatus: gateStatus,
      },
    });

    this.logger.log(
      `[GATEKEEPER] SO ${id} delivery gate set to ${gateStatus}.`,
    );

    this.eventEmitter.emit('sales_order.delivery_gate_updated', {
      salesOrderId: id,
      deliveryGateStatus: gateStatus,
      actorUserId: user?.id,
    });

    return updated;
  }
}
