import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { PaymentStatus, StateEventTrigger } from '@prisma/client';
import { FinanceGateHelper } from '../../../common/helpers/gate.helper';
import { StateMachineService } from '../../state-machine/state-machine.service';

@Injectable()
export class SalesInvoicesService {
  constructor(
    private prisma: PrismaService,
    private gate: FinanceGateHelper,
    private stateMachine: StateMachineService,
  ) {}

  async findAll(filter?: { customerId?: string; status?: PaymentStatus }) {
    return this.prisma.salesInvoice.findMany({
      where: filter,
      include: {
        customer: { select: { id: true, name: true } },
        lineItems: true,
        receipts: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const inv = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: true,
        receipts: true,
      },
    });
    if (!inv) throw new NotFoundException(`Sales invoice ${id} not found`);
    return inv;
  }

  /**
   * Create a customer sales invoice (DRAFT).
   * Auto-generates invoiceNumber SI-YYMM-XXXXX.
   */
  async create(
    _userId: string,
    dto: {
      customerId: string;
      invoiceDate?: string;
      dueDate: string;
      notes?: string;
      lineItems: Array<{
        itemCode: string;
        itemName: string;
        qty: number;
        unit: string;
        price: number;
        discount?: number;
      }>;
    },
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

    if (dto.lineItems.length === 0) {
      throw new BadRequestException(`Sales invoice must have at least one line item`);
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = dto.lineItems.map((item) => {
      const lineTotal = item.qty * item.price - (item.discount || 0);
      subtotal += lineTotal;
      return { ...item, discount: item.discount || 0, total: lineTotal };
    });
    // Tax 11% (PPN) for now
    const taxAmount = subtotal * 0.11;
    const totalAmount = subtotal + taxAmount;

    // Generate invoiceNumber SI-YYMM-XXXXX
    const now = new Date(dto.invoiceDate || Date.now());
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.salesInvoice.count({
      where: { invoiceNumber: { startsWith: `SI-${yymm}-` } },
    });
    const invoiceNumber = `SI-${yymm}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.salesInvoice.create({
      data: {
        invoiceNumber,
        customerId: dto.customerId,
        invoiceDate: now,
        dueDate: new Date(dto.dueDate),
        subtotal,
        taxAmount,
        totalAmount,
        notes: dto.notes,
        lineItems: { create: processedItems },
        paymentStatus: PaymentStatus.PENDING,
        deliveryStatus: 'PENDING',
      },
      include: { lineItems: true, customer: true },
    });
  }

  /**
   * Post sales invoice — ready for customer payment.
   * Creates journal: Dr. AR / Cr. Revenue.
   */
  async post(userId: string, id: string) {
    const inv = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: { lineItems: true, customer: true },
    });
    if (!inv) throw new NotFoundException(`Sales invoice ${id} not found`);

    // Gate: period must be open
    await this.gate.assertPeriodOpen(new Date(), 'SALES-INVOICE-POST');
    if (inv.postedAt) {
      throw new BadRequestException(`Sales invoice already posted.`);
    }

    // Wave 2/A5 — record INVOICE_ISSUED transition BEFORE entity update so
    // activity-log captures the attempt. NO_DUAL_WRITE via DB unique index.
    await this.stateMachine.transition({
      entityType: 'SALES_INVOICE',
      entityId: id,
      eventTrigger: StateEventTrigger.INVOICE_ISSUED,
      fromState: 'DRAFT',
      toState: 'ISSUED',
      userId,
      reason: `Sales invoice ${inv.invoiceNumber} to ${inv.customer.name}`,
      metadata: {
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        totalAmount: Number(inv.totalAmount),
      },
    });

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.salesInvoice.update({
        where: { id },
        data: {
          postedAt: new Date(),
          notes: `${inv.notes || ''} [posted by ${userId}]`.trim(),
        },
      });

      // Journal: Dr. AR (1201) / Cr. Revenue (4001)
      const arAcc = await tx.account.findFirst({ where: { code: '1201' } });
      const revAcc = await tx.account.findFirst({ where: { code: '4001' } });
      if (arAcc && revAcc) {
        await tx.journalEntry.create({
          data: {
            date: new Date(),
            reference: `SI-POST-${inv.invoiceNumber}`,
            description: `Sales invoice ${inv.invoiceNumber} to ${inv.customer.name}`,
            sourceDocumentType: 'SALES_ORDER' as any,
            lines: {
              create: [
                { accountId: arAcc.id, debit: Number(inv.totalAmount), credit: 0 },
                { accountId: revAcc.id, debit: 0, credit: Number(inv.subtotal) },
              ],
            },
          },
        });
      }

      return updated;
    });
  }

  /**
   * Cancel sales invoice (only if not yet paid).
   */
  async cancel(userId: string, id: string, reason: string) {
    const inv = await this.prisma.salesInvoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException(`Sales invoice ${id} not found`);
    if (Number(inv.paidAmount) > 0) {
      throw new BadRequestException(
        `Cannot cancel invoice with paidAmount ${inv.paidAmount}. Reverse receipt first.`,
      );
    }

    return this.prisma.salesInvoice.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
        notes: `${inv.notes || ''}\n[CANCELLED by ${userId}] ${reason}`.trim(),
      },
    });
  }
}
