import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class SalesInvoiceLineItemsService {
  constructor(private prisma: PrismaService) {}

  async findAllByInvoice(invoiceId: string) {
    return this.prisma.salesInvoiceLineItem.findMany({
      where: { invoiceId },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.salesInvoiceLineItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Sales invoice line item ${id} not found`);
    return item;
  }

  async addItem(_userId: string, invoiceId: string, dto: {
    itemCode: string;
    itemName: string;
    qty: number;
    unit: string;
    price: number;
    discount?: number;
  }) {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true },
    });
    if (!invoice) throw new NotFoundException(`Sales invoice ${invoiceId} not found`);
    if (invoice.postedAt) {
      throw new BadRequestException('Cannot edit line items on posted invoice');
    }

    const lineTotal = dto.qty * dto.price - (dto.discount || 0);
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.salesInvoiceLineItem.create({
        data: {
          invoiceId,
          itemCode: dto.itemCode,
          itemName: dto.itemName,
          qty: dto.qty,
          unit: dto.unit,
          price: dto.price,
          discount: dto.discount || 0,
          total: lineTotal,
        },
      });
      await this.recomputeInvoiceTotals(tx, invoiceId);
      return item;
    });
  }

  async updateItem(_userId: string, id: string, dto: {
    qty?: number;
    price?: number;
    discount?: number;
  }) {
    const item = await this.prisma.salesInvoiceLineItem.findUnique({
      where: { id },
      include: { invoice: true },
    });
    if (!item) throw new NotFoundException(`Sales invoice line item ${id} not found`);
    if (item.invoice.postedAt) {
      throw new BadRequestException('Cannot edit line items on posted invoice');
    }

    return this.prisma.$transaction(async (tx) => {
      const newQty = dto.qty ?? Number(item.qty);
      const newPrice = dto.price ?? Number(item.price);
      const newDiscount = dto.discount ?? Number(item.discount);
      const newTotal = newQty * newPrice - newDiscount;

      const result = await tx.salesInvoiceLineItem.update({
        where: { id },
        data: { qty: dto.qty, price: dto.price, discount: dto.discount, total: newTotal },
      });
      await this.recomputeInvoiceTotals(tx, item.invoiceId);
      return result;
    });
  }

  async removeItem(_userId: string, id: string) {
    const item = await this.prisma.salesInvoiceLineItem.findUnique({
      where: { id },
      include: { invoice: true },
    });
    if (!item) throw new NotFoundException(`Sales invoice line item ${id} not found`);
    if (item.invoice.postedAt) {
      throw new BadRequestException('Cannot edit line items on posted invoice');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.salesInvoiceLineItem.delete({ where: { id } });
      await this.recomputeInvoiceTotals(tx, item.invoiceId);
      return { removed: id, invoiceId: item.invoiceId };
    });
  }

  private async recomputeInvoiceTotals(tx: any, invoiceId: string) {
    const items = await tx.salesInvoiceLineItem.findMany({ where: { invoiceId } });
    const subtotal = items.reduce((s: number, i: { total: any }) => s + Number(i.total), 0);
    const taxAmount = subtotal * 0.11;
    const totalAmount = subtotal + taxAmount;
    await tx.salesInvoice.update({
      where: { id: invoiceId },
      data: { subtotal, taxAmount, totalAmount },
    });
  }
}
