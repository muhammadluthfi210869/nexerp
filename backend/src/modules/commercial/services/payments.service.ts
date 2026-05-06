import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { InvoiceStatus, InvoiceType, SOStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: dto.invoiceId },
        include: { payments: true },
      });

      if (!invoice)
        throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);

      // Add payment
      const payment = await tx.payment.create({
        data: {
          ...dto,
          verifiedBy: userId,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        },
      });

      // Recalculate invoice status
      const totalPaid =
        invoice.payments.reduce(
          (acc, curr) => acc + Number(curr.amountPaid),
          0,
        ) + Number(dto.amountPaid);
      const amountDue = Number(invoice.amountDue);

      let newStatus: InvoiceStatus = InvoiceStatus.UNPAID;
      if (totalPaid >= amountDue) {
        newStatus = InvoiceStatus.PAID;
      } else if (totalPaid > 0) {
        newStatus = InvoiceStatus.PARTIAL;
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          status: newStatus,
          outstandingAmount: { decrement: dto.amountPaid },
        },
        include: { so: true },
      });

      // CRITICAL SWITCH: If DP is PAID, unlock Production (Active SO)
      if (
        updatedInvoice.type === InvoiceType.DP &&
        newStatus === InvoiceStatus.PAID &&
        updatedInvoice.soId
      ) {
        await tx.salesOrder.update({
          where: { id: updatedInvoice.soId },
          data: { status: SOStatus.ACTIVE },
        });
      }

      return payment;
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        invoice: { select: { soId: true, type: true } },
        verifier: { select: { fullName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
