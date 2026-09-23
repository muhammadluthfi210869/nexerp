import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import {
  CreatePurchaseInvoiceDto,
  PurchaseInvoiceLineItemDto,
} from '../dto/purchase-invoice.dto';
import { InvoiceCategory, InvoiceType, InvoiceStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreatePurchaseInvoiceDto) {
    // BUS-RULE-003 / REQ-004: Invoice Date cannot be in the future
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (invoiceDate > today) {
      throw new BadRequestException('Tanggal invoice tidak boleh lebih dari hari ini.');
    }

    return this.prisma.$transaction(async (tx) => {
      let po: any = null;
      let inbound: any = null;

      const inboundId = dto.inboundId || dto.grId;
      if (inboundId) {
        inbound = await tx.warehouseInbound.findUnique({
          where: { id: inboundId },
          include: {
            po: { include: { supplier: true, items: { include: { material: true } } } },
            items: { include: { material: true } },
          },
        });
        if (!inbound) throw new NotFoundException('Inbound not found');
        po = inbound.po;
      } else if (dto.poId) {
        po = await tx.purchaseOrder.findUnique({
          where: { id: dto.poId },
          include: {
            supplier: true,
            items: { include: { material: true } },
            inbounds: { include: { items: { include: { material: true } } } },
          },
        });
        if (!po) throw new NotFoundException('Purchase Order not found');
        inbound = po.inbounds?.[0];
      }

      const vendorId = dto.vendorId || po?.supplierId;
      if (!vendorId) {
        throw new BadRequestException('Vendor wajib dipilih untuk faktur pembelian.');
      }

      const supplier = await tx.supplier.findUnique({
        where: { id: vendorId },
        include: { category: true },
      });
      if (!supplier) throw new NotFoundException('Vendor tidak ditemukan');

      // BUS-RULE-020: Vendor COA Category
      const procurementCategory =
        dto.procurementCategory ||
        (supplier.category ? supplier.category.name : 'Bahan Baku (11510)');

      // Generate invoice number FP-YYYYMM-XXXX
      const billNumber = await this.idGenerator.generateId('FP');
      const dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Determine items
      let itemsToProcess: PurchaseInvoiceLineItemDto[] = [];
      if (dto.items && dto.items.length > 0) {
        itemsToProcess = dto.items.map((i: any) => ({
          materialId: i.materialId,
          itemCode: i.itemCode || 'MAT-001',
          itemName: i.itemName || 'Material',
          qty: Number(i.qty ?? i.quantity ?? 1),
          unit: i.unit || 'pcs',
          price: Number(i.price ?? i.unitPrice ?? 0),
          discount: Number(i.discount || 0),
          rejectQty: Number(i.rejectQty || 0),
        }));
      } else if (inbound && inbound.items?.length > 0) {
        // Build items from GR
        itemsToProcess = inbound.items.map((ii: any) => {
          const poItem = po?.items?.find((pi: any) => pi.materialId === ii.materialId);
          return {
            materialId: ii.materialId,
            itemCode: ii.material?.sku || 'MAT-001',
            itemName: ii.material?.name || 'Material',
            qty: Number(ii.qtyGood || ii.qtyActual),
            unit: ii.material?.unit || 'pcs',
            price: Number(poItem?.unitPrice || 0),
            discount: 0,
            rejectQty: Number(ii.qtyReject || 0),
          };
        });
      } else if (po && po.items?.length > 0) {
        itemsToProcess = po.items.map((pi: any) => ({
          materialId: pi.materialId,
          itemCode: pi.material?.sku || 'MAT-001',
          itemName: pi.material?.name || 'Material',
          qty: Number(pi.quantity),
          unit: pi.material?.unit || 'pcs',
          price: Number(pi.unitPrice),
          discount: 0,
          rejectQty: 0,
        }));
      }

      if (itemsToProcess.length === 0) {
        throw new BadRequestException('Faktur pembelian harus memiliki minimal 1 item barang.');
      }

      // Duplicate vendor invoice number check
      if (dto.invoiceNumber) {
        const existingInvoice = await tx.bill.findFirst({
          where: {
            vendorId,
            notes: { contains: dto.invoiceNumber },
          },
        });
        if (existingInvoice) {
          throw new BadRequestException(
            `Nomor invoice vendor ${dto.invoiceNumber} sudah pernah dicatat (Duplicate Prevention).`,
          );
        }
      }

      // 4-Leg Zero-Tolerance Matching Validation (BUS-RULE-023)
      let totalQtyVariance = 0;
      let totalPriceVariance = 0;
      let hasException = false;

      if (po && po.items) {
        for (const billItem of itemsToProcess) {
          const poItem = po.items.find(
            (pi: any) =>
              pi.materialId === billItem.materialId ||
              pi.material?.sku === billItem.itemCode,
          );
          const grItem = inbound?.items?.find(
            (ii: any) =>
              ii.materialId === billItem.materialId ||
              ii.material?.sku === billItem.itemCode,
          );

          const poPrice = poItem ? Number(poItem.unitPrice) : Number(billItem.price);
          if (Number(billItem.price) > poPrice) {
            throw new BadRequestException(
              `Mismatch Harga: Harga pada faktur (${billItem.price}) melebihi harga yang disetujui pada PO (${poPrice}). Toleransi 0%.`,
            );
          }

          if (grItem) {
            const receivedGoodQty = Number(grItem.qtyGood ?? grItem.qtyActual ?? 0);
            if (Number(billItem.qty) > receivedGoodQty) {
              throw new BadRequestException(
                `Mismatch Kuantitas: Kuantitas faktur (${billItem.qty}) melebihi kuantitas penerimaan barang/QC yang lolos (${receivedGoodQty}). Toleransi 0%.`,
              );
            }
          }

          const orderedQty = poItem ? Number(poItem.quantity) : 0;
          const receivedQty = grItem ? Number(grItem.qtyGood || grItem.qtyActual) : orderedQty;
          const payableQty = Math.min(orderedQty || receivedQty, receivedQty);
          const qtyDiff = Number(billItem.qty) - payableQty;
          const priceDiff = Number(billItem.price) - poPrice;

          if (qtyDiff !== 0 || priceDiff !== 0) {
            hasException = true;
            totalQtyVariance += Math.abs(qtyDiff);
            totalPriceVariance += Math.abs(priceDiff);
          }
        }
      }

      // Compute totals
      let subtotal = 0;
      let totalDiscount = 0;
      for (const item of itemsToProcess) {
        const itemDiscount = Number(item.discount || 0);
        subtotal += Number(item.qty) * Number(item.price);
        totalDiscount += itemDiscount;
      }
      const taxableSubtotal = Math.max(0, subtotal - totalDiscount);

      // Check Down Payment application (BUS-RULE-024)
      let dpDeduction = 0;
      let appliedDpId: string | null = null;
      const targetDpId = dto.dpId || dto.downPaymentId;
      const requestedDpAmount = dto.dpAmountToApply ?? dto.downPaymentDeduction;

      if (targetDpId || (requestedDpAmount && requestedDpAmount > 0)) {
        const dp = targetDpId
          ? await tx.downPayment.findUnique({ where: { id: targetDpId } })
          : await tx.downPayment.findFirst({
              where: {
                vendorId,
                status: PaymentStatus.PAID,
                remainingAmount: { gt: 0 },
              },
              orderBy: { date: 'asc' },
            });

        if (dp && Number(dp.remainingAmount) > 0) {
          const maxApply = Number(dp.remainingAmount);
          const requestedApply = requestedDpAmount ? Number(requestedDpAmount) : maxApply;
          dpDeduction = Math.min(taxableSubtotal, Math.min(maxApply, requestedApply));
          appliedDpId = dp.id;

          const newRemaining = Number(dp.remainingAmount) - dpDeduction;
          await tx.downPayment.update({
            where: { id: dp.id },
            data: {
              remainingAmount: newRemaining,
              appliedAmount: { increment: dpDeduction },
              status: newRemaining === 0 ? PaymentStatus.PAID : dp.status,
              appliedAt: new Date(),
            },
          });
        }
      }

      const grandTotal = Math.max(0, taxableSubtotal - dpDeduction);
      const initialPaidAmount = 0;
      const paymentStatus =
        grandTotal === 0
          ? PaymentStatus.PAID
          : PaymentStatus.PENDING;

      const fullNotes = `${dto.notes || ''}${dto.invoiceNumber ? ` [Vendor Inv: ${dto.invoiceNumber}]` : ''}`.trim();

      // Create Bill in database
      const bill = await tx.bill.create({
        data: {
          billNumber,
          poNumber: po?.poNumber || null,
          vendorId,
          procurementCategory,
          invoiceDate,
          dueDate,
          subtotal,
          totalDiscount,
          taxAmount: 0,
          grandTotal,
          paidAmount: initialPaidAmount,
          paymentStatus,
          pic: dto.pic || 'Purchasing Staff',
          notes: fullNotes,
          grId: inbound?.id || null,
          organizationId: dto.organizationId,
          items: {
            create: itemsToProcess.map((item) => ({
              itemCode: item.itemCode || 'MAT-001',
              itemName: item.itemName || 'Material Item',
              qty: Number(item.qty || 0),
              unit: item.unit || 'pcs',
              price: Number(item.price || 0),
              discount: Number(item.discount || 0),
              total: Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0),
              rejectQty: Number(item.rejectQty || 0),
            })),
          },
        },
        include: {
          items: true,
          vendor: true,
        },
      });

      const matchStatus = hasException ? 'EXCEPTION' : 'MATCHED';
      const matchResult = await tx.billMatchResult.create({
        data: {
          billId: bill.id,
          matchStatus,
          qtyVariance: totalQtyVariance,
          priceVariance: totalPriceVariance,
          notes: hasException
            ? `Selisih ditemukan: Qty variance ${totalQtyVariance}, Price variance Rp ${totalPriceVariance}. Membutuhkan review manual.`
            : '4-Leg Matching sesuai persis (Zero Tolerance Pass).',
        },
      });

      // Create unified invoice mirror for cross-system queries
      try {
        await tx.invoice.create({
          data: {
            invoiceNumber: billNumber,
            category: InvoiceCategory.PAYABLE,
            type: InvoiceType.FINAL_PAYMENT,
            status:
              paymentStatus === PaymentStatus.PAID
                ? InvoiceStatus.PAID
                : InvoiceStatus.UNPAID,
            amountDue: grandTotal,
            outstandingAmount: Math.max(0, grandTotal - initialPaidAmount),
            dueDate,
            poId: po?.id || null,
            supplierId: vendorId,
            notes: dto.notes,
          },
        });
      } catch {}

      return {
        ...bill,
        subtotal: Number(bill.subtotal),
        grandTotal: Number(bill.grandTotal),
        downPaymentDeduction: dpDeduction,
        dpApplied: dpDeduction,
        matchResult: {
          id: matchResult.id,
          matchStatus: matchResult.matchStatus,
          qtyVariance: Number(matchResult.qtyVariance),
          priceVariance: Number(matchResult.priceVariance),
          notes: matchResult.notes,
          isMatched: matchStatus === 'MATCHED',
        },
      };
    });
  }

  async findAll(filter?: { status?: PaymentStatus; search?: string; organizationId?: string }) {
    const where: any = {};
    if (filter?.status) where.paymentStatus = filter.status;
    if (filter?.organizationId) where.organizationId = filter.organizationId;
    if (filter?.search) {
      where.OR = [
        { billNumber: { contains: filter.search, mode: 'insensitive' } },
        { poNumber: { contains: filter.search, mode: 'insensitive' } },
        { vendor: { name: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    const bills = await this.prisma.bill.findMany({
      where,
      include: {
        vendor: true,
        items: true,
        matchResults: { take: 1, orderBy: { matchedAt: 'desc' } },
        downPayments: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return bills.map((b) => ({
      ...b,
      subtotal: Number(b.subtotal),
      totalDiscount: Number(b.totalDiscount),
      taxAmount: Number(b.taxAmount),
      grandTotal: Number(b.grandTotal),
      paidAmount: Number(b.paidAmount),
      matchStatus: b.matchResults?.[0]?.matchStatus || 'MATCHED',
      matchResult: b.matchResults?.[0]
        ? {
            matchStatus: b.matchResults[0].matchStatus,
            qtyVariance: Number(b.matchResults[0].qtyVariance),
            priceVariance: Number(b.matchResults[0].priceVariance),
            notes: b.matchResults[0].notes,
          }
        : undefined,
    }));
  }

  async findOne(id: string) {
    const bill: any = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: true,
        allocations: { include: { payment: true } },
        downPayments: true,
        matchResults: { take: 1, orderBy: { matchedAt: 'desc' } },
      },
    });
    if (!bill) throw new NotFoundException(`Faktur Pembelian ${id} tidak ditemukan`);

    return {
      ...bill,
      subtotal: Number(bill.subtotal),
      totalDiscount: Number(bill.totalDiscount),
      taxAmount: Number(bill.taxAmount),
      grandTotal: Number(bill.grandTotal),
      paidAmount: Number(bill.paidAmount),
      matchStatus: bill.matchResults?.[0]?.matchStatus || 'MATCHED',
      matchResult: bill.matchResults?.[0]
        ? {
            matchStatus: bill.matchResults[0].matchStatus,
            qtyVariance: Number(bill.matchResults[0].qtyVariance),
            priceVariance: Number(bill.matchResults[0].priceVariance),
            notes: bill.matchResults[0].notes,
          }
        : undefined,
    };
  }

  async importExcel(rows: any[]) {
    if (!rows || rows.length === 0) {
      throw new BadRequestException('Tidak ada data faktur untuk di-import');
    }

    const results = [];
    for (const row of rows) {
      try {
        const created = await this.create({
          vendorId: row.vendorId,
          poId: row.poId,
          dueDate: row.dueDate,
          invoiceDate: row.invoiceDate,
          notes: row.notes,
          items: row.items,
        });
        results.push({ success: true, billNumber: created.billNumber });
      } catch (err: any) {
        results.push({ success: false, error: err.message, row });
      }
    }
    return results;
  }
}
