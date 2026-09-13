import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from '../dto/update-sales-order.dto';
import { SOStatus, InvoiceType, InvoiceStatus, StateEventTrigger } from '@prisma/client';

import { IdGeneratorService } from '../../system/id-generator.service';
import { StateMachineService } from '../../state-machine/state-machine.service';

@Injectable()
export class SalesOrdersService {
  private readonly logger = new Logger(SalesOrdersService.name);
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
    private stateMachine: StateMachineService,
  ) {}

  async create(dto: CreateSalesOrderDto) {
    const orderNumber = await this.idGenerator.generateId('SO');
    const so = await this.prisma.salesOrder.create({
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

    // Emit event for document automation
    this.eventEmitter.emit('sales_order.created', { salesOrderId: so.id });

    // Wave 2/A5 — record SO_CREATED transition so downstream listeners
    // (gate conditions: DP requirement, interlock rules) can react.
    // NO_DUAL_WRITE via DB unique index on (entityId, eventTrigger).
    // ponytail: emit + transition are sequential best-effort — event emit
    // is already async-fire-and-forget; transition awaits.
    await this.stateMachine.transition({
      entityType: 'SALES_ORDER',
      entityId: so.id,
      eventTrigger: StateEventTrigger.SO_CREATED,
      fromState: null,
      toState: 'DRAFT',
      reason: `SO ${so.orderNumber} created (lead ${so.leadId ?? 'n/a'})`,
      metadata: { orderNumber: so.orderNumber, totalAmount: Number(so.totalAmount) },
    });

    return so;
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

      // Emit event for document automation (Goods Requirement)
      this.eventEmitter.emit('sales_order.activated', { salesOrderId: id });
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
