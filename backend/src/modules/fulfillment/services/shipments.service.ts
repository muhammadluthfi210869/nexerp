import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from '../dto/shipment.dto';
import { ShipStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateShipmentDto) {
    const id = `SJ-${Date.now().toString().slice(-6)}`; // Simple generated ID
    return this.prisma.shipment.create({
      data: {
        id,
        ...dto,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateShipmentStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id },
        include: { so: true },
      });
      if (!shipment) throw new NotFoundException('Shipment not found');

      const updated = await tx.shipment.update({
        where: { id },
        data: {
          status: dto.status,
          deliveredAt:
            dto.status === ShipStatus.DELIVERED ? new Date() : undefined,
          shippedAt: dto.status === ShipStatus.SHIPPED ? new Date() : undefined,
        },
      });

      // [INVENTORY TRIGGER: DECREASE Finished Goods stock]
      // [RETENTION TRIGGER: Predict Repeat Order]
      if (dto.status === ShipStatus.DELIVERED) {
        // Find related Finished Good from the SO (SalesOrder -> BaseDesign/NPF -> WorkOrder)
        const workOrders = await tx.productionPlan.findMany({
          where: { soId: shipment.soId },
        });

        for (const wo of workOrders) {
          // Decrease stock for the related finished good
          await tx.finishedGood.updateMany({
            where: { woId: wo.id },
            data: {
              stockQty: { decrement: 1 },
            },
          });
        }

        // RETENTION ENGINE: estDepletionDate = deliveredAt + 60 days
        const sixtyDaysLater = new Date();
        sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);

        await tx.retentionEngine.upsert({
          where: { leadId: shipment.so.leadId },
          update: { estDepletionDate: sixtyDaysLater },
          create: {
            leadId: shipment.so.leadId,
            estDepletionDate: sixtyDaysLater,
          },
        });
      }

      return updated;
    });
  }

  async findAll() {
    return this.prisma.shipment.findMany({
      include: {
        so: { include: { lead: true } },
        logistics: { select: { fullName: true } },
      },
    });
  }
}
