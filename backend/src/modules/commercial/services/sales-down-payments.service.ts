import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../system/id-generator.service';
import { CreateSalesDpDto } from '../dto/create-sales-dp.dto';
import { SOStatus, InvoiceType, InvoiceStatus } from '@prisma/client';

@Injectable()
export class SalesDownPaymentsService {
  private readonly logger = new Logger(SalesDownPaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateSalesDpDto, user?: any) {
    // BUS-RULE-004: DP category is mandatory
    if (!dto.category || !['SAMPLE', 'LEGALITAS', 'PRODUKSI'].includes(dto.category)) {
      throw new BadRequestException(
        'DP_CATEGORY_REQUIRED: Kategori DP wajib dipilih (Sample / Legalitas / Produksi).',
      );
    }

    const dpNumber = await this.idGenerator.generateId('DPJ');

    const result = await this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findUnique({
        where: { id: dto.soId },
        include: {
          lead: true,
          sample: true,
          invoices: {
            where: { type: InvoiceType.DP },
            include: { payments: true },
          },
        },
      });

      if (!so) {
        throw new NotFoundException(`Sales Order ${dto.soId} not found`);
      }

      let sampleFeeOffsetAmount = 0;
      let matchedSampleFee: any = null;

      // BUS-RULE-008: Sample Fee Offset ke DP Produksi
      if (dto.applySampleFeeOffset) {
        if (dto.category !== 'PRODUKSI') {
          throw new BadRequestException(
            'SAMPLE_FEE_OFFSET_INVALID_CATEGORY: Offset Sample Fee hanya berlaku untuk kategori PRODUKSI.',
          );
        }

        // Check if sample fee exists for this customer or lead ID
        const candidateCustomerIds = [so.leadId].filter(Boolean) as string[];
        const sampleFee = await tx.sampleFee.findFirst({
          where: {
            OR: [
              ...(dto.sampleFeeId ? [{ id: dto.sampleFeeId }] : []),
              { customerId: { in: candidateCustomerIds } },
            ],
          },
        });

        if (sampleFee) {
          if (sampleFee.offsetToDPId) {
            throw new BadRequestException(
              'SAMPLE_FEE_ALREADY_OFFSET: Sample Fee sudah di-offset ke DP Produksi. Tidak bisa dipakai dua kali.',
            );
          }

          sampleFeeOffsetAmount = Number(sampleFee.amount || 0);
          matchedSampleFee = sampleFee;

          this.logger.log(
            `[OFFSET] Sample Fee Rp ${sampleFeeOffsetAmount} applied to SO ${so.id}`,
          );
        }
      }

      const effectiveTotalDp = Number(dto.amount) + sampleFeeOffsetAmount;
      const minimumRequiredDp = Number(so.totalAmount) * 0.5;

      // BUS-RULE-002: DP Penjualan minimum 50%
      if (dto.category === 'PRODUKSI' && effectiveTotalDp < minimumRequiredDp) {
        throw new BadRequestException(
          `DP_MINIMUM_NOT_MET: DP minimum 50% belum tercapai. Saat ini: Rp ${effectiveTotalDp} dari Rp ${so.totalAmount} (minimum Rp ${minimumRequiredDp}).`,
        );
      }

      // Create Invoice representing the Down Payment
      const dpInvoice = await tx.invoice.create({
        data: {
          invoiceNumber: dpNumber,
          category: 'RECEIVABLE',
          soId: so.id,
          type: InvoiceType.DP,
          amountDue: effectiveTotalDp,
          outstandingAmount: 0,
          status: InvoiceStatus.PAID,
          dueDate: new Date(),
        },
      });

      if (matchedSampleFee) {
        await tx.sampleFee.update({
          where: { id: matchedSampleFee.id },
          data: { offsetToDPId: dpInvoice.id },
        });
      }

      // Record Payment
      const verifierId = user?.id || (await tx.user.findFirst())?.id;
      if (verifierId) {
        await tx.payment.create({
          data: {
            invoiceId: dpInvoice.id,
            amountPaid: effectiveTotalDp,
            verifiedBy: verifierId,
            paymentDate: new Date(),
          },
        });
      }

      // Advance SO status to ACTIVE (DP_PAID)
      const updatedSo = await tx.salesOrder.update({
        where: { id: so.id },
        data: {
          status: SOStatus.ACTIVE,
        },
      });

      return {
        id: dpInvoice.id,
        dpNumber,
        category: dto.category,
        amountPaid: dto.amount,
        sampleFeeOffset: sampleFeeOffsetAmount,
        totalDpReceived: effectiveTotalDp,
        soId: so.id,
        orderNumber: so.orderNumber,
        salesOrderStatus: updatedSo.status,
      };
    });

    this.logger.log(
      `[DP RECEIVED] SO ${result.soId} activated with DP ${dpNumber} totaling Rp ${result.totalDpReceived}`,
    );

    this.eventEmitter.emit('sales_down_payment.recorded', {
      dpNumber,
      soId: result.soId,
      amount: result.totalDpReceived,
      category: dto.category,
      sampleFeeOffset: result.sampleFeeOffset,
    });

    this.eventEmitter.emit('sales_order.activated', {
      salesOrderId: result.soId,
      orderNumber: result.orderNumber,
    });

    return result;
  }

  async findAll(query?: { category?: string; soId?: string }) {
    const where: any = {
      category: 'RECEIVABLE',
      type: InvoiceType.DP,
    };

    if (query?.soId) {
      where.soId = query.soId;
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        so: {
          include: {
            lead: { select: { clientName: true, brandName: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      code: inv.invoiceNumber,
      date: inv.createdAt,
      customerName: inv.so?.lead?.clientName || 'N/A',
      brandName: inv.so?.lead?.brandName || inv.so?.brandName || 'N/A',
      refNumber: inv.so?.orderNumber || 'N/A',
      amount: Number(inv.amountDue),
      status: inv.status,
      soId: inv.soId,
    }));
  }
}
