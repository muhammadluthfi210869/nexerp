import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { FinanceService } from '../../finance/finance.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    // Pre-R4 hardening: route cross-domain Invoice writes through Finance.
    @Inject(forwardRef(() => FinanceService))
    private finance: FinanceService,
  ) {}

  async create(dto: CreateInvoiceDto) {
    return this.finance.createInvoice('RECEIVABLE', {
      type: dto.type,
      amountDue: dto.amountDue,
      soId: dto.soId,
    });
  }

  async findAll() {
    return this.prisma.invoice.findMany({
      where: { category: 'RECEIVABLE' },
      include: {
        so: { select: { lead: { select: { clientName: true } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { so: { include: { lead: true } }, payments: true },
    });
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`);
    return inv;
  }
}
