import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';
import { CreatePurchaseInvoiceDto } from '../dto/purchase-invoice.dto';
import { InvoiceCategory, InvoiceType, InvoiceStatus } from '@prisma/client';

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreatePurchaseInvoiceDto) {
    return this.prisma.$transaction(async (tx) => {
      const inbound = await tx.warehouseInbound.findUnique({
        where: { id: dto.inboundId },
        include: {
          po: { include: { supplier: true, items: true } },
          items: true,
        },
      });

      if (!inbound) throw new NotFoundException('Inbound not found');
      if (!inbound.poId || !inbound.po)
        throw new BadRequestException('GR has no PO reference');

      const totalAmount =
        inbound.po.items?.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0,
        ) || 0;

      if (totalAmount <= 0)
        throw new BadRequestException(
          'Cannot create invoice for zero-amount PO',
        );

      const invoiceNumber = await this.idGenerator.generateId('PI');
      const dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      return tx.invoice.create({
        data: {
          invoiceNumber,
          category: InvoiceCategory.PAYABLE,
          type: InvoiceType.FINAL_PAYMENT,
          status: InvoiceStatus.UNPAID,
          amountDue: totalAmount,
          outstandingAmount: totalAmount,
          dueDate,
          poId: inbound.poId,
          supplierId: inbound.po.supplierId,
          notes: dto.notes,
        },
        include: {
          supplier: true,
          po: true,
          payments: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.invoice.findMany({
      where: { category: InvoiceCategory.PAYABLE },
      include: {
        supplier: true,
        po: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        po: { include: { items: { include: { material: true } } } },
        payments: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}
