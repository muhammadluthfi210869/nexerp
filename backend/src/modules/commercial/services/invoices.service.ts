import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceStatus, InvoiceType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateInvoiceDto) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: dto.soId },
      include: { lead: true },
    });

    if (!so) {
      throw new NotFoundException(`Sales Order ${dto.soId} not found`);
    }

    // BUS-RULE-003: Custom invoice date cannot be in the future
    let invoiceDate = new Date();
    if (dto.invoiceDate) {
      const parsedDate = new Date(dto.invoiceDate);
      const now = new Date();
      if (parsedDate.getTime() > now.getTime() + 1000) {
        throw new BadRequestException(
          'INVOICE_DATE_FUTURE: Tanggal invoice tidak boleh lebih dari hari ini.',
        );
      }
      invoiceDate = parsedDate;
    }

    // BUS-RULE-005: Credit limit check saat faktur submit
    if (dto.type === InvoiceType.FINAL_PAYMENT) {
      const openInvoices = await this.prisma.invoice.findMany({
        where: {
          so: { leadId: so.leadId },
          category: 'RECEIVABLE',
          status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
        },
      });

      const currentOutstandingAr = openInvoices.reduce(
        (sum, inv) => sum + Number(inv.outstandingAmount),
        0,
      );
      const projectedAr = currentOutstandingAr + Number(dto.amountDue);

      const customerCreditLimit = (so.lead as any)?.creditLimit
        ? Number((so.lead as any).creditLimit)
        : 0;

      if (
        customerCreditLimit > 0 &&
        projectedAr > customerCreditLimit &&
        !dto.overrideCreditLimit
      ) {
        throw new BadRequestException(
          `CREDIT_LIMIT_EXCEEDED: Total AR (termasuk faktur baru Rp ${dto.amountDue}) mencapai Rp ${projectedAr}, melebihi credit limit customer Rp ${customerCreditLimit}. Butuh approval Finance Controller.`,
        );
      }
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: dto.id,
        category: 'RECEIVABLE',
        soId: dto.soId,
        type: dto.type,
        amountDue: dto.amountDue,
        outstandingAmount: dto.amountDue,
        createdAt: invoiceDate,
        dueDate: new Date(invoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000), // Default 14 days
      },
    });

    this.eventEmitter.emit('invoice.created', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amountDue: invoice.amountDue,
      soId: so.id,
    });

    return invoice;
  }

  async findAll() {
    return this.prisma.invoice.findMany({
      where: { category: 'RECEIVABLE' },
      include: {
        so: {
          select: {
            orderNumber: true,
            deliveryGateStatus: true,
            lead: { select: { clientName: true, brandName: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        so: {
          include: { lead: true },
        },
        payments: true,
      },
    });
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`);
    return inv;
  }

  /**
   * BUS-RULE-006: AR Delivery Gatekeeper
   * Releases delivery gate for the linked Sales Order
   */
  async releaseDelivery(id: string, user?: any) {
    const invoice = await this.findOne(id);

    if (invoice.soId) {
      await this.prisma.salesOrder.update({
        where: { id: invoice.soId },
        data: { deliveryGateStatus: 'RELEASED' },
      });

      this.logger.log(
        `[DELIVERY RELEASE] Delivery gate released for SO ${invoice.soId} via invoice ${id}`,
      );

      this.eventEmitter.emit('invoice.delivery_released', {
        invoiceId: id,
        soId: invoice.soId,
        actorUserId: user?.id,
      });
    }

    return {
      invoiceId: id,
      soId: invoice.soId,
      deliveryGateStatus: 'RELEASED',
    };
  }

  /**
   * BUS-RULE-012: Posted invoice immutability
   * Mutating a posted/paid invoice is prohibited.
   */
  async update(id: string, dto: { amountDue?: number; notes?: string }) {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(
        'POSTED_INVOICE_IMMUTABLE: Faktur Posted tidak bisa diedit. Buat Credit Note untuk retur.',
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.amountDue !== undefined ? { amountDue: dto.amountDue } : {}),
      },
    });
  }
}
