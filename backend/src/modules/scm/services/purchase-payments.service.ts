import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreatePurchasePaymentDto } from '../dto/purchase-payment.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class PurchasePaymentsService {
  constructor(private prisma: PrismaService) {}

  async pay(dto: CreatePurchasePaymentDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: dto.invoiceId },
      });

      if (!invoice) throw new NotFoundException('Invoice not found');

      const outstanding = Number(invoice.outstandingAmount);
      if (outstanding <= 0)
        throw new BadRequestException('Invoice already fully paid');
      if (dto.amount > outstanding)
        throw new BadRequestException('Payment exceeds outstanding balance');

      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          verifiedBy: userId,
          amountPaid: dto.amount,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          receivingAccountId: dto.receivingAccountId,
        },
      });

      const newOutstanding = outstanding - dto.amount;
      const newStatus =
        newOutstanding <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          outstandingAmount: newOutstanding,
          status: newStatus,
          ...(newStatus === InvoiceStatus.PAID ? { paidAt: new Date() } : {}),
        },
      });

      return tx.payment.findUnique({
        where: { id: payment.id },
        include: {
          invoice: { include: { supplier: true } },
          verifier: { select: { fullName: true } },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        invoice: { include: { supplier: true } },
        verifier: { select: { fullName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
