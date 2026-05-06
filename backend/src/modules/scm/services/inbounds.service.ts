import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateInboundDto, UpdateInboundStatusDto } from '../dto/inbound.dto';
import { InboundStatus, POStatus } from '@prisma/client';

import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class InboundsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateInboundDto) {
    const inboundNumber = await this.idGenerator.generateId('GRN');

    return this.prisma.$transaction(async (tx: any) => {
      const inbound = await tx.warehouseInbound.create({
        data: {
          inboundNumber,
          poId: dto.poId,
          warehouseId: dto.warehouseId,
          status: InboundStatus.PENDING,
          items: {
            create: dto.items.map((item: any) => ({
              materialId: item.materialId,
              qtyActual: item.qtyActual,
              isQuarantine: true,
            })),
          },
        },
        include: { items: true },
      });
      return inbound;
    });
  }

  async updateStatus(id: string, dto: UpdateInboundStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const inbound = await tx.warehouseInbound.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!inbound) throw new NotFoundException('Inbound not found');
      if (inbound.status === InboundStatus.APPROVED) {
        throw new BadRequestException(
          'Inbound already approved and stock increased.',
        );
      }

      // [QC GATE] — validate QC before approving inbound
      if (dto.status === InboundStatus.APPROVED) {
        // Check that no items are still in quarantine for this inbound
        const quarantinedItems = await tx.materialInventory.findMany({
          where: {
            materialId: { in: inbound.items.map((i) => i.materialId) },
            qcStatus: 'QUARANTINE',
          },
        });
        if (quarantinedItems.length > 0) {
          throw new BadRequestException(
            `QC Gate: ${quarantinedItems.length} item(s) masih berstatus QUARANTINE. Lakukan inspeksi QC terlebih dahulu.`,
          );
        }

        this.eventEmitter.emit('warehouse.inbound.approved', {
          inboundId: inbound.id,
          poId: inbound.poId,
          warehouseId: inbound.warehouseId,
          items: inbound.items.map((i) => ({
            materialId: i.materialId,
            qty: i.qtyActual,
          })),
        });

        // Auto update PO status to RECEIVED
        if (inbound.poId) {
          const po = await tx.purchaseOrder.update({
            where: { id: inbound.poId },
            data: { status: POStatus.RECEIVED },
          });

          this.eventEmitter.emit('PO_RECEIVED_ON_TIME', {
            employeeId: po?.scmId,
            referenceId: inbound.poId,
            metadata: { poNumber: po?.poNumber, inboundId: id },
          });
        }
      }

      return tx.warehouseInbound.update({
        where: { id },
        data: { status: dto.status },
      });
    });
  }

  async findAll() {
    return this.prisma.warehouseInbound.findMany({
      include: {
        po: true,
        items: {
          include: { material: { select: { name: true, unit: true } } },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async qcValidate(
    id: string,
    dto: { items: { inboundItemId: string; qcStatus: string }[] },
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const inbound = await tx.warehouseInbound.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!inbound) throw new NotFoundException('Inbound not found');

      for (const item of dto.items) {
        const inboundItem = inbound.items.find(
          (i) => i.id === item.inboundItemId,
        );
        if (!inboundItem)
          throw new NotFoundException(
            `Inbound item ${item.inboundItemId} not found`,
          );

        const existing = await tx.materialInventory.findFirst({
          where: { materialId: inboundItem.materialId },
          orderBy: { lastRestock: 'desc' },
        });
        if (existing) {
          await tx.materialInventory.update({
            where: { id: existing.id },
            data: { qcStatus: item.qcStatus as any },
          });
        }
      }

      return { success: true };
    });

    this.eventEmitter.emit('scm.inbound.qc_validated', {
      inboundId: id,
      items: dto.items,
      loggedBy: 'SYSTEM:SCM',
    });

    this.eventEmitter.emit('activity.logged', {
      senderDivision: 'SCM',
      notes: `QC validated inbound ${id} with ${dto.items.length} items`,
      loggedBy: 'SYSTEM:SCM',
    });

    return result;
  }

  async reject(id: string, dto: { reason: string }) {
    const inbound = await this.prisma.warehouseInbound.findUnique({
      where: { id },
    });
    if (!inbound) throw new NotFoundException('Inbound not found');

    return this.prisma.warehouseInbound.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
