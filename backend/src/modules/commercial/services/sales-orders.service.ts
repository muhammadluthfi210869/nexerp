import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from '../dto/update-sales-order.dto';
import { SOStatus, InvoiceType, InvoiceStatus } from '@prisma/client';

import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class SalesOrdersService {
  private readonly logger = new Logger(SalesOrdersService.name);
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateSalesOrderDto) {
    const orderNumber = await this.idGenerator.generateId('SO');
    return this.prisma.salesOrder.create({
      data: {
        orderNumber,
        leadId: dto.leadId,
        sampleId: dto.sampleId,
        salesCategory: dto.salesCategory,
        brandName: dto.brandName,
        taxId: dto.taxId,
        currencyId: dto.currencyId,
        totalAmount: dto.totalAmount,
        items: {
          create: dto.items.map((item) => ({
            materialItemId: item.materialId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            netto: item.netto || 0,
            taxId: item.taxId,
            subtotal: Number(item.quantity) * Number(item.unitPrice),
          })),
        },
      },
    });
  }

  async findAll() {
    return this.prisma.salesOrder.findMany({
      include: {
        lead: { select: { clientName: true } },
        sample: { select: { version: true } },
        invoices: { select: { status: true, type: true } },
      },
    });
  }

  async findOne(id: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        lead: true,
        sample: true,
        invoices: {
          include: { payments: true },
        },
      },
    });
    if (!so) throw new NotFoundException(`Sales Order ${id} not found`);
    return so;
  }

  async update(id: string, dto: UpdateSalesOrderDto) {
    await this.findOne(id);

    // [INTERLOCK PROTOCOL]
    // Status SO cannot be ACTIVE unless DP Invoice is PAID
    if (dto.status === SOStatus.ACTIVE) {
      const dpInvoice = await this.prisma.invoice.findFirst({
        where: {
          soId: id,
          category: 'RECEIVABLE',
          type: InvoiceType.DP,
        },
      });

      if (!dpInvoice) {
        throw new BadRequestException(
          'Interlock Logic: Cannot activate SO without a Down Payment (DP) Invoice.',
        );
      }

      if (dpInvoice.status !== InvoiceStatus.PAID) {
        throw new BadRequestException(
          'Interlock Logic: Cannot activate SO until Down Payment (DP) is fully PAID.',
        );
      }

      // [BROADCAST NOTIFICATION]
      // Simulating notification to SCM and Production departments
      this.logger.log(
        `[BROADCAST] SO Activated: ${id}. Notifying SCM to prepare materials.`,
      );
      this.logger.log(
        `[BROADCAST] SO Activated: ${id}. Notifying PRODUCTION to create schedule.`,
      );
    }

    // Whitelist: only allow specific fields to prevent mass assignment
    const whitelistedData: Record<string, any> = {};
    if (dto.status !== undefined) whitelistedData.status = dto.status;

    return this.prisma.salesOrder.update({
      where: { id },
      data: whitelistedData,
    });
  }
}
