import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        invoiceNumber: dto.id,
        category: 'RECEIVABLE',
        soId: dto.soId,
        type: dto.type,
        amountDue: dto.amountDue,
        outstandingAmount: dto.amountDue,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14 days
      },
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
