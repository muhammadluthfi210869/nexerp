import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class WarehouseTransferService {
  private readonly logger = new Logger(WarehouseTransferService.name);

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

  async assertWarehouseAccess(
    userId: string,
    warehouseId: string,
    permission: 'canRead' | 'canWrite' | 'canApprove' = 'canWrite',
  ) {
    if (!userId || !warehouseId) return true;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    if (
      user &&
      (user.roles.includes('SUPER_ADMIN' as any) ||
        user.roles.includes('ADMIN' as any))
    ) {
      return true;
    }

    const access = await this.prisma.warehouseAccess.findUnique({
      where: {
        userId_warehouseId: {
          userId,
          warehouseId,
        },
      },
    });

    if (!access || !access[permission]) {
      throw new ForbiddenException('WAREHOUSE_ACCESS_DENIED');
    }
    return true;
  }

  async createTransferOrder(data: {
    sourceWarehouseId: string;
    destWarehouseId: string;
    items: { materialId: string; qty: number }[];
    notes?: string;
    createdById?: string;
  }) {
    if (data.sourceWarehouseId === data.destWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouse cannot be the same.',
      );
    }

    if (data.createdById) {
      await this.assertWarehouseAccess(
        data.createdById,
        data.sourceWarehouseId,
        'canWrite',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Validate stock availability at source
      for (const item of data.items) {
        const material = await tx.materialItem.findUnique({
          where: { id: item.materialId },
          select: { stockQty: true, name: true },
        });
        if (!material)
          throw new NotFoundException(`Material ${item.materialId} not found`);
        if (Number(material.stockQty) < item.qty) {
          throw new BadRequestException(
            `Insufficient stock for ${material.name} at source warehouse. Available: ${material.stockQty}, Requested: ${item.qty}`,
          );
        }
      }

      // Generate transfer number
      const transferNumber = await this.idGenerator.generateId('TRF');

      const transfer = await tx.transferOrder.create({
        data: {
          transferNumber,
          sourceWarehouseId: data.sourceWarehouseId,
          destWarehouseId: data.destWarehouseId,
          notes: data.notes,
          createdById: data.createdById,
          status: 'PENDING',
          items: {
            create: data.items.map((i) => ({
              materialId: i.materialId,
              qty: i.qty,
            })),
          },
        },
        include: { items: { include: { material: true } } },
      });

      this.eventEmitter.emit('activity.logged', {
        action: 'TRANSFER_ORDER_CREATED',
        entityType: 'TransferOrder',
        entityId: transfer.id,
        detail: `Transfer ${transferNumber} from warehouse ${data.sourceWarehouseId} to ${data.destWarehouseId}`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.transfer.created', {
        transferId: transfer.id,
        transferNumber,
        itemsCount: data.items.length,
      });

      return transfer;
    });
  }

  async executeTransferOrder(transferId: string, userId: string) {
    const transferCheck = await this.prisma.transferOrder.findUnique({
      where: { id: transferId },
      select: { destWarehouseId: true, sourceWarehouseId: true },
    });
    if (transferCheck && userId) {
      await this.assertWarehouseAccess(
        userId,
        transferCheck.destWarehouseId,
        'canWrite',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.transferOrder.findUnique({
        where: { id: transferId },
        include: { items: { include: { material: true } } },
      });

      if (!transfer) throw new NotFoundException('Transfer Order not found');
      if (transfer.status !== 'PENDING')
        throw new BadRequestException('Transfer already processed');

      for (const item of transfer.items) {
        // Deduct from source using FEFO batch
        let remainingQty = Number(item.qty);
        const sourceBatches = await tx.materialInventory.findMany({
          where: {
            materialId: item.materialId,
            currentStock: { gt: 0 },
            qcStatus: 'GOOD',
          },
          orderBy: [{ expDate: 'asc' }, { lastRestock: 'asc' }],
        });

        for (const batch of sourceBatches) {
          if (remainingQty <= 0) break;
          const deductQty = Math.min(remainingQty, Number(batch.currentStock));
          await tx.materialInventory.update({
            where: { id: batch.id },
            data: { currentStock: { decrement: deductQty } },
          });
          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              inventoryId: batch.id,
              type: 'INTERNAL_MOVE',
              quantity: deductQty,
              referenceNo: transfer.transferNumber,
              warehouseId: transfer.sourceWarehouseId,
              performedBy: userId,
              notes: `TRANSFER_OUT to ${transfer.destWarehouseId} | Batch: ${batch.batchNumber}`,
            },
          });
          remainingQty -= deductQty;
        }

        if (remainingQty > 0) {
          const available = Number(item.qty) - remainingQty;
          throw new BadRequestException(
            `Stok sumber tidak mencukupi untuk bahan ID ${item.materialId}. Diminta: ${Number(item.qty)}, Tersedia: ${available}`,
          );
        }

        // Increment at destination (create new batch record)
        const sysSup = await this.getOrCreateSystemSupplier(tx);
        const destBatch = await tx.materialInventory.create({
          data: {
            materialId: item.materialId,
            supplierId: sysSup.id,
            batchNumber: `TRF-${transfer.transferNumber.slice(0, 8)}-${item.materialId.slice(0, 4)}`,
            currentStock: Number(item.qty),
            qcStatus: 'GOOD',
            notes: `Transferred from ${transfer.sourceWarehouseId}`,
            receivingDate: new Date(),
          },
        });
        await tx.inventoryTransaction.create({
          data: {
            materialId: item.materialId,
            inventoryId: destBatch.id,
            type: 'INTERNAL_MOVE',
            quantity: Number(item.qty),
            referenceNo: transfer.transferNumber,
            warehouseId: transfer.destWarehouseId,
            performedBy: userId,
            notes: `TRANSFER_IN from ${transfer.sourceWarehouseId}`,
          },
        });

        // ponytail: Inter-warehouse move retains company-wide stockQty invariance.
        // No change needed for global MaterialItem.stockQty.
      }

      const updated = await tx.transferOrder.update({
        where: { id: transferId },
        data: { status: 'COMPLETED' },
      });

      this.eventEmitter.emit('activity.logged', {
        action: 'TRANSFER_ORDER_EXECUTED',
        entityType: 'TransferOrder',
        entityId: transferId,
        detail: `Transfer ${transfer.transferNumber} executed by ${userId}`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.transfer.executed', {
        transferId,
        transferNumber: transfer.transferNumber,
      });

      return updated;
    });
  }

  async getTransferOrders() {
    return this.prisma.transferOrder.findMany({
      include: {
        items: { include: { material: true } },
        sourceWarehouse: true,
        destWarehouse: true,
      },
      orderBy: { date: 'desc' },
    });
  }
}
