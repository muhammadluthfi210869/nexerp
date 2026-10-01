import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class WarehouseInboundService {
  private readonly logger = new Logger(WarehouseInboundService.name);

  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async getOrCreateSystemSupplier(tx: any) {
    let sup = await tx.supplier.findFirst({
      where: { name: 'System Default' },
    });
    if (!sup)
      sup = await tx.supplier.create({
        data: { name: 'System Default', performanceScore: 0 },
      });
    return sup;
  }

  async receiveGoods(data: {
    materialId: string;
    supplierId?: string;
    batchNumber: string;
    quantity: number;
    purchasePrice?: number;
    expDate?: Date;
    locationId?: string;
    notes?: string;
    performedBy?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const mat = await tx.materialItem.findUnique({
        where: { id: data.materialId },
        select: { stockQty: true, unitPrice: true },
      });
      const lastValuation = await tx.materialValuation.findFirst({
        where: { materialId: data.materialId },
        orderBy: { date: 'desc' },
      });

      const oldStock = Number(mat?.stockQty || 0);
      const oldMAP = Number(
        lastValuation?.movingAveragePrice || mat?.unitPrice || 0,
      );
      const newPrice = data.purchasePrice || oldMAP;
      const newQty = data.quantity;

      // Moving Average Price: ((oldStock * oldMAP) + (newQty * newPrice)) / (oldStock + newQty)
      const totalOldValue = oldStock * oldMAP;
      const totalNewValue = newQty * newPrice;
      const newMAP =
        oldStock + newQty > 0
          ? (totalOldValue + totalNewValue) / (oldStock + newQty)
          : newPrice;

      const effectiveSupplierId =
        data.supplierId || (await this.getOrCreateSystemSupplier(tx)).id;

      const inventory = await tx.materialInventory.create({
        data: {
          materialId: data.materialId,
          supplierId: effectiveSupplierId,
          batchNumber: data.batchNumber,
          currentStock: data.quantity,
          expDate: data.expDate ? new Date(data.expDate) : null,
          locationId: data.locationId,
          qcStatus: 'QUARANTINE',
          notes: data.notes,
          receivingDate: new Date(),
        },
      });

      // 3. Create MaterialValuation with new MAP
      await tx.materialValuation.create({
        data: {
          materialId: data.materialId,
          movingAveragePrice: newMAP,
          lastPurchasePrice: newPrice,
          totalQty: oldStock + newQty,
          totalValue: (oldStock + newQty) * newMAP,
          referenceNo: data.notes || `INBOUND-${inventory.batchNumber}`,
        },
      });

      // 4. Log the transaction with MAP snapshot
      await tx.inventoryTransaction.create({
        data: {
          materialId: data.materialId,
          inventoryId: inventory.id,
          type: 'INBOUND',
          quantity: data.quantity,
          notes: data.notes,
          destLocId: data.locationId,
          performedBy: data.performedBy,
          unitValueAtTransaction: newMAP,
        },
      });

      // 5. Update MaterialItem cache
      await tx.materialItem.update({
        where: { id: data.materialId },
        data: { stockQty: { increment: data.quantity } },
      });

      return inventory;
    });
  }

  async getInbounds() {
    return this.prisma.warehouseInbound.findMany({
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true } },
          },
        },
        po: {
          select: {
            id: true,
            poNumber: true,
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async createInbound(data: {
    poId?: string;
    warehouseId?: string;
    receivedAt?: string;
    items: {
      materialId: string;
      quantity: number;
      batchNumber: string;
      expiryDate?: string;
    }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Items inbound cannot be empty');
    }
    for (const item of data.items) {
      if (!item.batchNumber || !item.expiryDate) {
        throw new BadRequestException(
          'Nomor Batch Supplier dan Expired Date wajib diisi.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      let warehouseId = data.warehouseId;
      if (!warehouseId) {
        const firstWh = await tx.warehouse.findFirst({
          select: { id: true },
          where: { status: 'ACTIVE' },
        });
        warehouseId = firstWh?.id || '00000000-0000-0000-0000-000000000000';
      }
      const inboundNumber = await this.idGenerator.generateId('GRN');
      const inbound = await tx.warehouseInbound.create({
        data: {
          inboundNumber,
          poId: data.poId,
          status: 'PENDING',
          receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
          warehouseId,
          items: {
            create: data.items.map((item) => ({
              materialId: item.materialId,
              qtyActual: item.quantity,
              isQuarantine: true,
              qcStatus: 'QUARANTINE',
            })),
          },
        },
        include: {
          items: {
            include: { material: { select: { name: true, unit: true } } },
          },
          po: { select: { poNumber: true } },
        },
      });

      let fallbackSupplier = await tx.supplier.findFirst({
        where: { name: 'System Default' },
      });
      if (!fallbackSupplier) {
        fallbackSupplier = await tx.supplier.create({
          data: { name: 'System Default', performanceScore: 0 },
        });
      }

      // Seed quarantined batches for each item with supplier batch number & expiry
      for (const item of data.items) {
        await tx.materialInventory.create({
          data: {
            materialId: item.materialId,
            supplierId: fallbackSupplier.id,
            batchNumber: item.batchNumber,
            currentStock: item.quantity,
            qcStatus: 'QUARANTINE',
            expDate: item.expiryDate ? new Date(item.expiryDate) : null,
            receivingDate: data.receivedAt ? new Date(data.receivedAt) : new Date(),
            notes: `GRN:${inboundNumber}:${item.materialId}`,
          },
        });
      }

      this.eventEmitter.emit('activity.logged', {
        action: 'WAREHOUSE_INBOUND',
        entityType: 'Inbound',
        entityId: inbound.id,
        detail: `Inbound ${inboundNumber} created with ${data.items.length} items (ALL QUARANTINE)`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.inbound.received', {
        inboundId: inbound.id,
        inboundNumber,
        poId: data.poId,
        itemsCount: data.items.length,
      });

      return inbound;
    });
  }

  async releaseFromQuarantine(inboundId: string, performedBy?: string) {
    return this.prisma.$transaction(async (tx) => {
      const inbound = await tx.warehouseInbound.findUnique({
        where: { id: inboundId },
        include: {
          items: { include: { material: { select: { unitPrice: true } } } },
        },
      });
      if (!inbound) throw new NotFoundException('Inbound not found');
      if (inbound.status !== 'PENDING')
        throw new BadRequestException('Inbound already processed');

      // Get or create a fallback supplier
      let fallbackSupplier = await tx.supplier.findFirst({
        where: { name: 'System Default' },
      });
      if (!fallbackSupplier) {
        fallbackSupplier = await tx.supplier.create({
          data: { name: 'System Default', performanceScore: 0 },
        });
      }

      // Sum qtyBagus / qtyReject from inbound items per material for PO update
      const qtyByMaterial = new Map<
        string,
        { bagus: number; reject: number }
      >();
      for (const item of inbound.items) {
        const isReject = item.qcStatus === 'REJECT';
        const good = isReject ? 0 : Number(item.qtyActual);
        const reject = isReject ? Number(item.qtyActual) : 0;
        const cur = qtyByMaterial.get(item.materialId) ?? {
          bagus: 0,
          reject: 0,
        };
        qtyByMaterial.set(item.materialId, {
          bagus: cur.bagus + good,
          reject: cur.reject + reject,
        });
      }

      for (const item of inbound.items) {
        // Look for existing quarantined batch created during inbound
        const existingBatch = await tx.materialInventory.findFirst({
          where: {
            materialId: item.materialId,
            notes: { contains: `GRN:${inbound.inboundNumber}` },
            qcStatus: 'QUARANTINE',
          },
        });

        let batchId: string;
        if (existingBatch) {
          const updatedBatch = await tx.materialInventory.update({
            where: { id: existingBatch.id },
            data: {
              qcStatus: 'GOOD',
              notes: `${existingBatch.notes} [QC_RELEASED]`,
            },
          });
          batchId = updatedBatch.id;
        } else {
          const batchNumber = `BATCH-${inbound.inboundNumber.slice(0, 8)}-${item.id.slice(0, 4)}`;
          const batch = await tx.materialInventory.create({
            data: {
              materialId: item.materialId,
              supplierId: fallbackSupplier.id,
              batchNumber,
              currentStock: item.qtyActual,
              qcStatus: 'GOOD',
              notes: `Released from quarantine via GRN ${inbound.inboundNumber}`,
              receivingDate: new Date(),
            },
          });
          batchId = batch.id;
        }

        await tx.materialItem.update({
          where: { id: item.materialId },
          data: { stockQty: { increment: item.qtyActual } },
        });

        await tx.inventoryTransaction.create({
          data: {
            materialId: item.materialId,
            inventoryId: batchId,
            type: 'INBOUND',
            quantity: item.qtyActual,
            referenceNo: inbound.inboundNumber,
            performedBy: performedBy || 'QC_INSPECTOR',
            unitValueAtTransaction: item.material.unitPrice,
            notes: `QC Release to AVAILABLE via GRN ${inbound.inboundNumber}`,
          },
        });
      }

      // 3-pilar gudang integration: populate POItem.qtyBagus/qtyReject from
      // released inbound. This drives finance.calculatePayable() so supplier
      // payable only counts goods QC-confirmed as Bagus.
      // ponytail: simple aggregate — assumes inbound item materialId maps to
      // exactly one POItem. If a single inbound can partially fill multiple
      // POs (split deliveries), this needs POItem lookup by poId+materialId.
      if (inbound.poId) {
        for (const [materialId, qty] of qtyByMaterial) {
          await tx.purchaseOrderItem.updateMany({
            where: { poId: inbound.poId, materialId },
            data: {
              qtyBagus: { increment: qty.bagus },
              qtyReject: { increment: qty.reject },
            },
          });
        }
      }

      const updated = await tx.warehouseInbound.update({
        where: { id: inboundId },
        data: { status: 'APPROVED' },
      });

      this.eventEmitter.emit('activity.logged', {
        action: 'QUARANTINE_RELEASED',
        entityType: 'Inbound',
        entityId: inboundId,
        detail: `Inbound ${inbound.inboundNumber} released from quarantine`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.inbound.approved', {
        inboundId,
        inboundNumber: inbound.inboundNumber,
        itemsCount: inbound.items.length,
      });

      return {
        ...updated,
        releasedCount: inbound.items.length,
      };
    });
  }

  @OnEvent('scm.inbound.received')
  async handleScmInboundReceived(payload: {
    inboundId: string;
    poNumber: string;
    itemsCount: number;
  }) {
    this.logger.log(
      `[WAREHOUSE] SCM inbound received: ${payload.poNumber} (${payload.itemsCount} items)`,
    );
  }
}
