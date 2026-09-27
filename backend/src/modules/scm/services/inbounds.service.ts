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
      // BUS-RULE-018: Invariant sum = qtyGood + qtyReject + qtyFree == poLine.qtyOrdered
      if (dto.poId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: dto.poId },
          include: { items: true },
        });
        if (po && po.items) {
          for (const item of dto.items) {
            const poItem = po.items.find((pi: any) => pi.materialId === item.materialId);
            if (poItem) {
              const qtyGood = item.qtyGood !== undefined ? Number(item.qtyGood) : Number(item.qtyActual);
              const qtyReject = Number(item.qtyReject || 0);
              const qtyFree = Number(item.qtyFree || 0);
              const sum = qtyGood + qtyReject + qtyFree;
              const poQty = Number(poItem.quantity);

              if (sum !== poQty) {
                throw new BadRequestException(
                  `Total qty (${sum}) tidak sama dengan qty PO (${poQty}). Mohon cek kembali.`,
                );
              }
            }
          }
        }
      }

      const inbound = await tx.warehouseInbound.create({
        data: {
          inboundNumber,
          poId: dto.poId,
          warehouseId: dto.warehouseId,
          status: InboundStatus.PENDING,
          items: {
            create: dto.items.map((item: any) => {
              const qtyGood = item.qtyGood !== undefined ? Number(item.qtyGood) : Number(item.qtyActual);
              const qtyReject = Number(item.qtyReject || 0);
              const qtyFree = Number(item.qtyFree || 0);
              const sum = qtyGood + qtyReject + qtyFree;

              return {
                materialId: item.materialId,
                qtyActual: sum,
                qtyGood,
                qtyReject,
                qtyFree,
                isQuarantine: true,
              };
            }),
          },
        },
        include: { items: { include: { material: true } }, po: true },
      });
      return inbound;
    });
  }

  async updateStatus(id: string, dto: UpdateInboundStatusDto) {
    return this.prisma.$transaction(async (tx: any) => {
      const inbound = await tx.warehouseInbound.findUnique({
        where: { id },
        include: { items: true, po: { include: { items: true } } },
      });

      if (!inbound) throw new NotFoundException('Inbound not found');
      if (inbound.status === InboundStatus.APPROVED) {
        throw new BadRequestException(
          'Inbound already approved and stock increased.',
        );
      }

      if (dto.status === InboundStatus.APPROVED) {
        // BUS-RULE-018: Real stock increases ONLY for qtyGood!
        for (const item of inbound.items) {
          const qtyGood = Number(item.qtyGood || item.qtyActual);
          if (qtyGood > 0) {
            await tx.materialItem.update({
              where: { id: item.materialId },
              data: {
                stockQty: { increment: qtyGood },
              },
            });
          }

          // Update PO item stats if linked
          if (inbound.poId) {
            const poItem = inbound.po?.items?.find((pi: any) => pi.materialId === item.materialId);
            if (poItem) {
              await tx.purchaseOrderItem.update({
                where: { id: poItem.id },
                data: {
                  qtyBagus: { increment: Number(item.qtyGood || 0) },
                  qtyReject: { increment: Number(item.qtyReject || 0) },
                  receivedQty: { increment: Number(item.qtyGood || 0) + Number(item.qtyReject || 0) + Number(item.qtyFree || 0) },
                },
              });
            }
          }
        }

        this.eventEmitter.emit('scm.inbound.approved', {
          inboundId: inbound.id,
          poId: inbound.poId,
          warehouseId: inbound.warehouseId,
          items: inbound.items.map((i: any) => ({
            materialId: i.materialId,
            qty: i.qtyActual,
            qtyGood: i.qtyGood,
            qtyReject: i.qtyReject,
            qtyFree: i.qtyFree,
          })),
        });

        // Update PO status: check if fully received or partial
        if (inbound.poId && inbound.po) {
          const po = await tx.purchaseOrder.findUnique({
            where: { id: inbound.poId },
            include: { items: true },
          });

          const allReceived = po?.items.every(
            (pi: any) => Number(pi.receivedQty) >= Number(pi.quantity),
          );

          const newPoStatus = allReceived ? 'CLOSED' : 'PARTIAL';
          await tx.purchaseOrder.update({
            where: { id: inbound.poId },
            data: { status: newPoStatus as any },
          });
        }
      }

      return tx.warehouseInbound.update({
        where: { id },
        data: { status: dto.status },
        include: { items: true, po: true },
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
