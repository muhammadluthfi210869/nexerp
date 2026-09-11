import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { vendorId?: string; status?: PaymentStatus }) {
    return this.prisma.bill.findMany({
      where: filter,
      include: {
        vendor: { select: { id: true, name: true } },
        lineItems: true,
        billAllocations: { include: { payment: true } },
      },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        vendor: true,
        lineItems: true,
        billAllocations: { include: { payment: true } },
      },
    });
    if (!bill) throw new NotFoundException(`Bill ${id} not found`);
    return bill;
  }

  /**
   * Create a vendor bill (DRAFT).
   * Auto-generates billNumber FP-YYMM-XXXXX.
   * Calculates grandTotal from line items if not provided.
   */
  async create(
    _userId: string,
    dto: {
      poNumber?: string;
      vendorId: string;
      procurementCategory: string;
      invoiceDate?: string;
      dueDate: string;
      notes?: string;
      pic: string;
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
    const vendor = await this.prisma.supplier.findUnique({
      where: { id: dto.vendorId },
    });
    if (!vendor) throw new NotFoundException(`Vendor ${dto.vendorId} not found`);

    if (dto.lineItems.length === 0) {
      throw new BadRequestException(`Bill must have at least one line item`);
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = dto.lineItems.map((item) => {
      const lineTotal = item.qty * item.price - (item.discount || 0);
      subtotal += lineTotal;
      return { ...item, discount: item.discount || 0, total: lineTotal };
    });
    // Tax 11% (PPN) for now - real impl: configurable per vendor
    const taxAmount = subtotal * 0.11;
    const grandTotal = subtotal + taxAmount;

    // Generate billNumber FP-YYMM-XXXXX
    const now = new Date(dto.invoiceDate || Date.now());
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.bill.count({
      where: { billNumber: { startsWith: `FP-${yymm}-` } },
    });
    const billNumber = `FP-${yymm}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.bill.create({
      data: {
        billNumber,
        poNumber: dto.poNumber,
        vendorId: dto.vendorId,
        procurementCategory: dto.procurementCategory,
        invoiceDate: now,
        dueDate: new Date(dto.dueDate),
        subtotal,
        taxAmount,
        grandTotal,
        notes: dto.notes,
        pic: dto.pic,
        lineItems: { create: processedItems },
        paymentStatus: PaymentStatus.PENDING,
      },
      include: { lineItems: true, vendor: true },
    });
  }

  /**
   * Post bill — mark as ready for payment.
   * Creates journal entry: Dr. Expense (per category) / Cr. AP.
   * Sets postedAt timestamp.
   */
  async post(userId: string, id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: { lineItems: true, vendor: true },
    });
    if (!bill) throw new NotFoundException(`Bill ${id} not found`);
    if (bill.postedAt) {
      throw new BadRequestException(`Bill already posted.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.bill.update({
        where: { id },
        data: {
          postedAt: new Date(),
          notes: `${bill.notes || ''} [posted by ${userId}]`.trim(),
        },
      });

      // Journal: Dr. Expense / Cr. AP (2101)
      // Use procurementCategory as COA hint; real impl: lookup category COA mapping
      const apAcc = await tx.account.findFirst({ where: { code: '2101' } });
      const expenseAcc = await tx.account.findFirst({
        where: { code: bill.procurementCategory.match(/\d+/)?.[0] || '5000' },
      });
      if (apAcc && expenseAcc) {
        await tx.journalEntry.create({
          data: {
            date: new Date(),
            reference: `BILL-POST-${bill.billNumber}`,
            description: `Bill ${bill.billNumber} from ${bill.vendor.name}`,
            poId: undefined as any, // TODO: link to PO if exists
            sourceDocumentType: 'PURCHASE_ORDER' as any,
            lines: {
              create: [
                { accountId: expenseAcc.id, debit: Number(bill.subtotal), credit: 0 },
                { accountId: apAcc.id, debit: 0, credit: Number(bill.grandTotal) },
              ],
            },
          },
        });
      }

      return updated;
    });
  }

  /**
   * Cancel bill (only if not yet paid).
   */
  async cancel(userId: string, id: string, reason: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException(`Bill ${id} not found`);
    if (Number(bill.paidAmount) > 0) {
      throw new BadRequestException(
        `Cannot cancel bill with paidAmount ${bill.paidAmount}. Reverse payment first.`,
      );
    }

    return this.prisma.bill.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
        notes: `${bill.notes || ''}\n[CANCELLED by ${userId}] ${reason}`.trim(),
      },
    });
  }
}
