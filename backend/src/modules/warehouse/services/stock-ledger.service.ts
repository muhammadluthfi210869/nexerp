import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class StockLedgerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Records a stock movement and updates the cache.
   * This is the "Golden Thread" of inventory integrity.
   */
  async recordMovement(
    tx: any,
    data: {
      materialId: string;
      type: 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'RETURN' | 'DISPOSAL';
      quantity: number;
      referenceNo?: string;
      notes?: string;
      warehouseId?: string;
      inventoryId?: string; // Link to specific batch
      unitValueAtTransaction?: number;
      performedBy?: string;
    },
  ) {
    const {
      materialId,
      type,
      quantity,
      referenceNo,
      notes,
      warehouseId,
      inventoryId,
      unitValueAtTransaction,
      performedBy,
    } = data;

    // 1. Log the transaction
    const transaction = await tx.inventoryTransaction.create({
      data: {
        materialId,
        type,
        quantity,
        referenceNo,
        notes,
        warehouseId,
        inventoryId,
        unitValueAtTransaction,
        performedBy: performedBy || 'SYSTEM_LEDGER',
      },
    });

    // 2. Update specific batch if provided
    if (inventoryId) {
      const adjustment = ['INBOUND', 'ADJUSTMENT', 'RETURN'].includes(type)
        ? quantity
        : -quantity;
      await tx.materialInventory.update({
        where: { id: inventoryId },
        data: { currentStock: { increment: adjustment } },
      });
    }

    // 3. Update MaterialItem global cache
    const globalAdjustment = ['INBOUND', 'ADJUSTMENT', 'RETURN'].includes(type)
      ? quantity
      : -quantity;
    await tx.materialItem.update({
      where: { id: materialId },
      data: { stockQty: { increment: globalAdjustment } },
    });

    return transaction;
  }
}
