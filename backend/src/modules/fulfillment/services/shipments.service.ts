import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from '../dto/shipment.dto';
import { ShipStatus, SOStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateShipmentDto) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: dto.soId },
    });

    if (!so) {
      throw new NotFoundException(`Sales Order ${dto.soId} not found`);
    }

    // BUS-RULE-006: AR Delivery Gatekeeper (HELD vs RELEASED)
    if (so.deliveryGateStatus === 'HELD') {
      throw new BadRequestException(
        'DELIVERY_GATE_HELD: Surat Jalan belum bisa dicetak. Finance masih menahan faktur (status HELD — pelunasan belum masuk).',
      );
    }

    const shipment = await this.prisma.shipment.create({
      data: {
        ...dto,
        status: ShipStatus.SHIPPED,
        shippedAt: new Date(),
      },
    });

    // Advance SO to SHIPPED
    await this.prisma.salesOrder.update({
      where: { id: so.id },
      data: { status: SOStatus.SHIPPED },
    });

    this.logger.log(
      `[SHIPMENT DISPATCHED] Surat Jalan ${shipment.id} created for SO ${so.id}. SO marked SHIPPED.`,
    );

    return shipment;
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

      // When confirmed delivered, advance SO to COMPLETED if all fulfilled
      if (dto.status === ShipStatus.DELIVERED && shipment.soId) {
        await tx.salesOrder.update({
          where: { id: shipment.soId },
          data: { status: SOStatus.COMPLETED },
        });
      }

      return updated;
    });
  }

  async findAll() {
    return this.prisma.shipment.findMany({
      include: {
        so: {
          select: {
            orderNumber: true,
            deliveryGateStatus: true,
            lead: { select: { clientName: true } },
          },
        },
        items: {
          include: {
            material: { select: { name: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }
}
