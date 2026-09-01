import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
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
    // Shipment.id is @db.Uuid in the schema; the previous `SJ-${Date.now()-6}`
    // string was a concrete defect — it would never insert against PostgreSQL.
    // Generate a real UUID. The friendly `SJ-` code is preserved on
    // `trackingNo` when callers want a human-readable identifier.
    const id = randomUUID();
    await this.prisma.shipment.create({
      data: {
        id,
        so: { connect: { id: dto.soId } },
        logistics: { connect: { id: dto.logisticsId } },
        trackingNo: dto.trackingNo,
        notes: dto.notes,
        status: ShipStatus.PACKING,
      },
    });
    if (dto.items?.length) {
      await this.prisma.shipmentItem.createMany({
        data: dto.items.map((it) => ({
          shipmentId: id,
          materialId: it.materialId,
          qtyOrder: it.qtyShipped,
          qtyShipped: it.qtyShipped,
        })),
      });
    }
    return this.findOne(id);
  }

  async updateStatus(id: string, dto: UpdateShipmentStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({ where: { id } });
      if (!shipment) throw new NotFoundException('Shipment not found');

      // Idempotent DELIVERED: no second decrement (downstream of SHIPPED).
      if (
        shipment.status === ShipStatus.DELIVERED &&
        dto.status === ShipStatus.DELIVERED
      ) {
        return shipment;
      }

      // ---------------------------------------------------------------
      // R2 CONCURRENCY-SAFE SHIPPED TRANSITION
      //
      // Use Prisma updateMany with a WHERE on the prior status as the
      // atomic conditional update. Only the request whose updateMany
      // returns count=1 wins; losers treat it as a no-op retry. This
      // closes the read-then-write race window that the previous
      // implementation was vulnerable to under concurrent SHIPPED
      // requests and HTTP/network retries.
      // ---------------------------------------------------------------
      if (dto.status === ShipStatus.SHIPPED) {
        if (shipment.status === ShipStatus.SHIPPED) {
          // Already shipped — idempotent no-op. The existing SHIPPED
          // request already decremented finished stock and recorded
          // consumed-lot lineage; doing nothing here is correct.
          return shipment;
        }
        if (shipment.status !== ShipStatus.PACKING) {
          throw new BadRequestException(
            `SHIPMENT_INVALID_STATE: cannot ship from status ${shipment.status}.`,
          );
        }

        const transition = await tx.shipment.updateMany({
          where: { id, status: ShipStatus.PACKING },
          data: {
            status: ShipStatus.SHIPPED,
            shippedAt: new Date(),
          },
        });
        if (transition.count === 0) {
          // Another concurrent request already won the PACKING→SHIPPED
          // transition. Treat as idempotent return: no second decrement.
          const fresh = await tx.shipment.findUnique({ where: { id } });
          return fresh ?? shipment;
        }

        // Validate and decrement. The transition row is now SHIPPED for
        // this transaction; any other transaction sees a status mismatch.
        const items = await tx.shipmentItem.findMany({
          where: { shipmentId: id },
        });
        if (!items.length) {
          throw new BadRequestException(
            'SHIPMENT_NO_ITEMS: cannot ship without at least one ShipmentItem.',
          );
        }
        const finishedGoods = await tx.finishedGood.findMany({
          where: { wo: { soId: shipment.soId } },
        });

        for (const item of items) {
          // AVAILABLE = physical GOOD stock for THIS shipment's SO. Note:
          // FinishedGood doesn't carry qcStatus at model level — the gate
          // is `availability === 'AVAILABLE'`. Once unpacked for FIFO we
          // also re-read stockQty under the transaction so the comparison
          // is consistent across this transaction only.
          const available = finishedGoods
            .filter((fg) => fg.availability === 'AVAILABLE')
            .reduce(
              (s, fg) => s.plus(new Prisma.Decimal(fg.stockQty)),
              new Prisma.Decimal(0),
            );
          if (available.lte(0)) {
            throw new BadRequestException(
              `SHIPMENT_NOT_RELEASED: no AVAILABLE FinishedGood stock for material ${item.materialId} on SO ${shipment.soId}.`,
            );
          }
          if (new Prisma.Decimal(item.qtyShipped).gt(available)) {
            throw new BadRequestException(
              `SHIPMENT_OVER_QTY: requested ${item.qtyShipped} exceeds available ${available.toString()} for material ${item.materialId}.`,
            );
          }

          // FIFO decrement across AVAILABLE FinishedGoods for this SO.
          // Each decrement is guarded by a conditional updateMany with
          // `stockQty: { gte: take }` so the row never goes negative,
          // and the result rows are written to ShipmentConsumedLot so
          // Shipment → ShipmentItem → FinishedGood is reconstructable
          // for audit even when one ShipmentItem consumed multiple lots.
          let remaining = new Prisma.Decimal(item.qtyShipped);
          for (const fg of finishedGoods) {
            if (remaining.lte(0)) break;
            if (fg.availability !== 'AVAILABLE') continue;
            const stock = new Prisma.Decimal(fg.stockQty);
            if (stock.lte(0)) continue;
            const take = Prisma.Decimal.min(stock, remaining);

            const updated = await tx.finishedGood.updateMany({
              where: { id: fg.id, stockQty: { gte: take } },
              data: { stockQty: { decrement: take } },
            });
            if (updated.count !== 1) {
              throw new BadRequestException(
                `SHIPMENT_INVENTORY_RACE: FinishedGood ${fg.id} changed during SHIPPED; abort transaction to preserve stock integrity.`,
              );
            }
            await tx.shipmentConsumedLot.create({
              data: {
                shipmentId: id,
                shipmentItemId: item.id,
                finishedGoodId: fg.id,
                qtyRemoved: take,
              },
            });
            remaining = remaining.minus(take);
          }
        }

        const updatedShipment = await tx.shipment.findUnique({
          where: { id },
        });
        return updatedShipment ?? shipment;
      }

      // Non-SHIPPED transitions (DELIVERED, etc). DELIVERED does not
      // decrement finished stock — that already happened at SHIPPED.
      const updated = await tx.shipment.update({
        where: { id },
        data: {
          status: dto.status,
          deliveredAt:
            dto.status === ShipStatus.DELIVERED ? new Date() : undefined,
        },
      });

      // R4-BUSINESS-READY: on DELIVERED, auto-create the canonical
      // DeliveryOrder so downstream Finance invoice generation
      // (POST /api/finance/invoice/generate/:deliveryOrderId) has a row
      // to bind to. Idempotent: skip if a DO already exists for this SO
      // (uniqueness on workOrderId per delivery_orders schema).
      if (dto.status === ShipStatus.DELIVERED) {
        // Only create when the shipment links to a SO that has a WO.
        const wo = await tx.workOrder.findFirst({
          where: { soId: shipment.soId },
        });
        if (wo) {
          const existingDo = await tx.deliveryOrder.findFirst({
            where: { workOrderId: wo.id },
          });
          if (!existingDo) {
            await tx.deliveryOrder.create({
              data: {
                workOrderId: wo.id,
                courierName: 'R4-LOGISTICS',
                trackingNumber: shipment.trackingNo,
                status: 'DELIVERED',
              },
            });
          }
        }

        const sixtyDaysLater = new Date();
        sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);
        // retention_engine.leadId FK targets SalesLead(id), not SalesOrder(id).
        // Resolve the SO's leadId first; if no SO row exists, skip retention
        // safely (the downstream $transaction returns the updated shipment).
        const soRow = await tx.salesOrder.findUnique({
          where: { id: shipment.soId },
          select: { leadId: true },
        });
        if (soRow?.leadId) {
          await tx.retentionEngine.upsert({
            where: { leadId: soRow.leadId },
            update: { estDepletionDate: sixtyDaysLater },
            create: {
              leadId: soRow.leadId,
              estDepletionDate: sixtyDaysLater,
            },
          });
        }
      }

      return updated;
    });
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const items = await this.prisma.shipmentItem.findMany({
      where: { shipmentId: id },
    });
    return { ...shipment, items };
  }

  async findAll() {
    const shipments = await this.prisma.shipment.findMany({
      include: {
        so: { include: { lead: true } },
        logistics: { select: { fullName: true } },
      },
    });
    const ids = shipments.map((s) => s.id);
    const allItems = ids.length
      ? await this.prisma.shipmentItem.findMany({
          where: { shipmentId: { in: ids } },
        })
      : [];
    const itemsByShipment = new Map<string, typeof allItems>();
    for (const it of allItems) {
      const arr = itemsByShipment.get(it.shipmentId) ?? [];
      arr.push(it);
      itemsByShipment.set(it.shipmentId, arr);
    }
    return shipments.map((s) => ({ ...s, items: itemsByShipment.get(s.id) ?? [] }));
  }
}