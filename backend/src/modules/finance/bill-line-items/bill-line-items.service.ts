import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

/**
 * BillLineItem = child rows of vendor bills (managed independently).
 * Mainly for line-level updates after bill creation (qty/price corrections, rejectQty).
 */
@Injectable()
export class BillLineItemsService {
  constructor(private prisma: PrismaService) {}

  async findAllByBill(billId: string) {
    return this.prisma.billLineItem.findMany({
      where: { billId },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.billLineItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Bill line item ${id} not found`);
    return item;
  }

  /**
   * Add a new line item to an existing bill (DRAFT only).
   * Auto-recomputes bill subtotal + grand total + tax.
   */
  async addItem(_userId: string, billId: string, dto: {
    itemCode: string;
    itemName: string;
    qty: number;
    unit: string;
    price: number;
    discount?: number;
  }) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: { items: true },
    });
    if (!bill) throw new NotFoundException(`Bill ${billId} not found`);
    if (bill.postedAt) {
      throw new BadRequestException(`Cannot edit items on posted bill. Reverse bill first.`);
    }

    const lineTotal = dto.qty * dto.price - (dto.discount || 0);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.billLineItem.create({
        data: {
          billId,
          itemCode: dto.itemCode,
          itemName: dto.itemName,
          qty: dto.qty,
          unit: dto.unit,
          price: dto.price,
          discount: dto.discount || 0,
          total: lineTotal,
        },
      });

      // Recompute bill totals
      await this.recomputeBillTotals(tx, billId);

      return item;
    });
  }

  /**
   * Update a line item (qty, price, discount, rejectQty).
   * Recomputes line total and bill totals.
   */
  async updateItem(_userId: string, id: string, dto: {
    qty?: number;
    price?: number;
    discount?: number;
    rejectQty?: number;
  }) {
    const item = await this.prisma.billLineItem.findUnique({
      where: { id },
      include: { bill: true },
    });
    if (!item) throw new NotFoundException(`Bill line item ${id} not found`);
    if (item.bill.postedAt) {
      throw new BadRequestException(`Cannot edit items on posted bill`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = dto.qty !== undefined || dto.price !== undefined || dto.discount !== undefined
        ? {
            ...item,
            qty: dto.qty ?? Number(item.qty),
            price: dto.price ?? Number(item.price),
            discount: dto.discount ?? Number(item.discount),
          }
        : item;
      const newTotal = Number(updated.qty) * Number(updated.price) - Number(updated.discount);

      const result = await tx.billLineItem.update({
        where: { id },
        data: {
          qty: dto.qty,
          price: dto.price,
          discount: dto.discount,
          rejectQty: dto.rejectQty,
          total: dto.qty !== undefined || dto.price !== undefined || dto.discount !== undefined
            ? newTotal
            : undefined,
        },
      });

      if (dto.qty !== undefined || dto.price !== undefined || dto.discount !== undefined) {
        await this.recomputeBillTotals(tx, item.billId);
      }

      return result;
    });
  }

  /**
   * Remove a line item and recompute bill totals.
   */
  async removeItem(_userId: string, id: string) {
    const item = await this.prisma.billLineItem.findUnique({
      where: { id },
      include: { bill: true },
    });
    if (!item) throw new NotFoundException(`Bill line item ${id} not found`);
    if (item.bill.postedAt) {
      throw new BadRequestException(`Cannot edit items on posted bill`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.billLineItem.delete({ where: { id } });
      await this.recomputeBillTotals(tx, item.billId);
      return { removed: id, billId: item.billId };
    });
  }

  private async recomputeBillTotals(tx: any, billId: string) {
    const items = await tx.billLineItem.findMany({ where: { billId } });
    const subtotal = items.reduce((s: number, i: { total: any }) => s + Number(i.total), 0);
    const totalDiscount = items.reduce((s: number, i: { discount: any }) => s + Number(i.discount), 0);
    const taxAmount = subtotal * 0.11;
    const grandTotal = subtotal + taxAmount;
    await tx.bill.update({
      where: { id: billId },
      data: { subtotal, totalDiscount, taxAmount, grandTotal },
    });
  }
}
