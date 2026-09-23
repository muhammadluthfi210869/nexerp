import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { InvoiceStatus, InvoiceType, SOStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePaymentDto) {
    const { coaId, pph23Deduction, ...paymentData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: dto.invoiceId },
        include: { payments: true },
      });

      if (!invoice)
        throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);

      const pph23 = Number(pph23Deduction || 0);
      const currentOutstanding = Number(invoice.outstandingAmount);

      // BUS-RULE-007: Potongan PPh 23 tidak boleh melebihi sisa tagihan faktur
      if (pph23 > currentOutstanding) {
        throw new BadRequestException(
          'PPH23_EXCEEDS_INVOICE: Potongan PPh 23 melebihi sisa tagihan faktur.',
        );
      }

      // BUS-RULE-015: Customer overpayment handling
      const effectivePaid = Number(dto.amountPaid) + pph23;
      const overpayment = Math.max(0, effectivePaid - currentOutstanding);
      const arSettled = Math.min(effectivePaid, currentOutstanding);
      const newOutstanding = Math.max(0, currentOutstanding - effectivePaid);

      // Add payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amountPaid: dto.amountPaid,
          verifiedBy: userId,
          receivingAccountId: coaId,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        },
      });

      let newStatus: InvoiceStatus = InvoiceStatus.UNPAID;
      if (newOutstanding === 0) {
        newStatus = InvoiceStatus.PAID;
      } else if (newOutstanding < Number(invoice.amountDue)) {
        newStatus = InvoiceStatus.PARTIAL;
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          status: newStatus,
          outstandingAmount: newOutstanding,
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

      // Double-entry accounting journal
      if (invoice.category === 'RECEIVABLE') {
        const cashAcc =
          (coaId ? await tx.account.findUnique({ where: { id: coaId } }) : null) ||
          (await tx.account.findFirst({ where: { code: '1101' } }));
        const arAcc = await tx.account.findFirst({ where: { code: '1103' } });
        const pph23Acc = await tx.account.findFirst({ where: { code: '1108' } });
        const advAcc = await tx.account.findFirst({ where: { code: '2102' } });

        const journalLines: any[] = [];
        if (cashAcc) {
          journalLines.push({ accountId: cashAcc.id, debit: dto.amountPaid, credit: 0 });
        }
        if (pph23 > 0 && pph23Acc) {
          journalLines.push({ accountId: pph23Acc.id, debit: pph23, credit: 0 });
        }
        if (arAcc) {
          journalLines.push({ accountId: arAcc.id, debit: 0, credit: arSettled });
        }
        if (overpayment > 0 && advAcc) {
          journalLines.push({ accountId: advAcc.id, debit: 0, credit: overpayment });
        }

        if (journalLines.length > 0) {
          await tx.journalEntry.create({
            data: {
              date: new Date(dto.paymentDate || Date.now()),
              reference: `PAY-${invoice.invoiceNumber}`,
              description: `Penerimaan Pembayaran Piutang ${invoice.invoiceNumber}`,
              soId: invoice.soId,
              sourceDocumentType: 'PAYMENT',
              lines: { create: journalLines },
            },
          });
        }
      } else {
        // Payable journal: Dr. Hutang Usaha / Cr. Kas
        const apAcc = await tx.account.findFirst({ where: { code: '2101' } });
        const cashAcc =
          (coaId ? await tx.account.findUnique({ where: { id: coaId } }) : null) ||
          (await tx.account.findFirst({ where: { code: '1101' } }));
        if (apAcc && cashAcc) {
          await tx.journalEntry.create({
            data: {
              date: new Date(dto.paymentDate || Date.now()),
              reference: `PAY-${invoice.invoiceNumber}`,
              description: `Pembayaran Hutang ${invoice.invoiceNumber}`,
              poId: invoice.poId,
              sourceDocumentType: 'PAYMENT',
              lines: {
                create: [
                  { accountId: apAcc.id, debit: dto.amountPaid, credit: 0 },
                  { accountId: cashAcc.id, debit: 0, credit: dto.amountPaid },
                ],
              },
            },
          });
        }
      }

      return {
        ...payment,
        effectivePaid,
        arSettled,
        overpayment,
        pph23Deduction: pph23,
        invoiceStatus: newStatus,
        outstandingAmount: newOutstanding,
      };
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
