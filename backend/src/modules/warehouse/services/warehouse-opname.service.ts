import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class WarehouseOpnameService {
  private readonly logger = new Logger(WarehouseOpnameService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: IdGeneratorService,
    private readonly moduleRef: ModuleRef,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getFinanceService() {
    const { FinanceService } = await import('../../finance/finance.service');
    return this.moduleRef.get(FinanceService, { strict: false });
  }

  // === Stock Opname Methods ===

  async createOpname(data: {
    warehouseId: string;
    picId: string;
    notes?: string;
    items: { materialId: string; systemQty: number; actualQty: number }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const opnameNumber = await this.idGenerator.generateId('OPN');

      const opname = await tx.stockOpname.create({
        data: {
          opnameNumber,
          warehouseId: data.warehouseId,
          picId: data.picId,
          notes: data.notes,
          items: {
            create: data.items.map((i) => ({
              materialId: i.materialId,
              systemQty: i.systemQty,
              actualQty: i.actualQty,
              difference: i.actualQty - i.systemQty,
            })),
          },
        },
        include: { items: { include: { material: true } } },
      });

      this.eventEmitter.emit('activity.logged', {
        action: 'OPNAME_CREATED',
        entityType: 'StockOpname',
        entityId: opname.id,
        detail: `Opname ${opnameNumber} created with ${data.items.length} items`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.opname.created', {
        opnameId: opname.id,
        opnameNumber,
        warehouseId: data.warehouseId,
      });

      return opname;
    });
  }

  async approveOpname(opnameId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.findUnique({
        where: { id: opnameId },
        include: { items: { include: { material: true } } },
      });

      if (!opname) throw new NotFoundException('Stock Opname not found');
      if (opname.status !== 'DRAFT')
        throw new BadRequestException('Opname already processed');

      let totalLossValue = 0;
      const items = (opname as any).items || [];
      for (const item of items) {
        const diff = Number(item.actualQty) - Number(item.systemQty);
        if (diff < 0) {
          totalLossValue += Math.abs(diff) * Number(item.material.unitPrice);
        }
      }

      // Threshold Approval: Rp 500.000
      const THRESHOLD = 500000;
      if (totalLossValue > THRESHOLD && opname.approvalStatus !== 'APPROVED') {
        await tx.stockOpname.update({
          where: { id: opnameId },
          data: {
            approvalStatus: 'WAITING',
            totalLossValue,
            notes: `${opname.notes || ''} [SYSTEM: High loss value detected. Requires management approval.]`,
          },
        });
        return { status: 'PENDING_APPROVAL', lossValue: totalLossValue };
      }

      // Execute adjustment
      for (const item of items) {
        const diff = Number(item.actualQty) - Number(item.systemQty);
        if (diff !== 0) {
          // Find first available batch for adjustment or a specific one if added to schema
          // For simplicity, adjust MaterialItem stock and create transaction
          await tx.materialItem.update({
            where: { id: item.materialId },
            data: { stockQty: { increment: diff } },
          });

          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              type: 'ADJUSTMENT',
              quantity: Math.abs(diff),
              notes: `Stock Opname ${opnameId}`,
              performedBy: userId,
            },
          });
        }
      }

      const updated = await tx.stockOpname.update({
        where: { id: opnameId },
        data: {
          status: 'COMPLETED',
          approvalStatus: 'APPROVED',
          totalLossValue,
        },
      });

      // Automated Journaling for Finance Integration (Phase 4)
      if (totalLossValue > 0) {
        const finSvc = await this.getFinanceService();
        await finSvc.createInventoryAdjustmentJournal({
          opnameId: opname.id,
          totalLossValue,
          notes: opname.notes || 'Routine Audit',
        });
      }

      this.eventEmitter.emit('activity.logged', {
        action: 'OPNAME_APPROVED',
        entityType: 'StockOpname',
        entityId: opnameId,
        detail: `Opname ${opname.opnameNumber} approved. Loss: Rp ${totalLossValue.toLocaleString()}`,
        senderDivision: 'WAREHOUSE',
      });
      this.eventEmitter.emit('warehouse.opname.approved', {
        opnameId,
        opnameNumber: opname.opnameNumber,
        totalLossValue,
      });

      return updated;
    });
  }

  async approveOpnameWithPin(opnameId: string, userId: string, pin: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { managerPin: true },
    });

    if (!manager || !manager.managerPin) {
      throw new BadRequestException('User has no escalation PIN configured.');
    }

    const isPinValid =
      manager.managerPin === pin ||
      (await bcrypt.compare(pin, manager.managerPin).catch(() => false));
    if (!isPinValid) {
      throw new BadRequestException('Invalid escalation PIN.');
    }

    // Update approval status within a transaction before calling approveOpname
    await this.prisma.$transaction(async (tx) => {
      await tx.stockOpname.update({
        where: { id: opnameId },
        data: {
          approvalStatus: 'APPROVED',
          approvedById: userId,
        },
      });
    });

    return this.approveOpname(opnameId, userId);
  }

  async getOpnames() {
    return this.prisma.stockOpname.findMany({
      include: {
        items: { include: { material: true } },
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // === Stock Adjustment Methods ===

  async getAdjustments() {
    const adjustments = await this.prisma.stockAdjustment.findMany({
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, unit: true } },
          },
        },
        warehouse: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return adjustments.map((adj) => ({
      id: adj.id,
      adjNumber: `ADJ-${adj.id.slice(0, 8).toUpperCase()}`,
      materialName: adj.items[0]?.material?.name || 'Unknown',
      type: adj.type === 'IN' ? 'CORRECTION' : 'WRITE_OFF',
      qty:
        adj.type === 'IN'
          ? Number(adj.items[0]?.qty || 0)
          : -Math.abs(Number(adj.items[0]?.qty || 0)),
      unit: adj.items[0]?.material?.unit || '',
      status: adj.notes?.includes('[APPROVED]')
        ? 'APPROVED'
        : adj.notes?.includes('[REJECTED]')
          ? 'REJECTED'
          : 'PENDING',
      warehouseName: adj.warehouse?.name || 'Unknown',
      notes: adj.notes?.replace(/\[APPROVED\]|\[REJECTED\]/g, '').trim() || '',
      date: adj.date.toISOString().split('T')[0],
    }));
  }

  async createAdjustment(data: {
    materialId: string;
    type: 'WRITE_OFF' | 'CORRECTION' | 'DISPOSAL';
    qty: number;
    warehouseId: string;
    accountId?: string;
    notes?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          type:
            data.type === 'WRITE_OFF' || data.type === 'DISPOSAL'
              ? 'OUT'
              : 'IN',
          warehouseId: data.warehouseId,
          accountId:
            data.accountId ||
            (await tx.account.findFirst())?.id ||
            '00000000-0000-0000-0000-000000000001',
          notes: data.notes || '',
          date: new Date(),
          items: {
            create: {
              materialId: data.materialId,
              qty: Math.abs(data.qty),
            },
          },
        },
        include: {
          items: {
            include: { material: { select: { name: true, unit: true } } },
          },
          warehouse: { select: { name: true } },
        },
      });

      this.eventEmitter.emit('warehouse.adjustment.created', {
        adjustmentId: adjustment.id,
        type: data.type,
        qty: Math.abs(data.qty),
        materialId: data.materialId,
      });
      this.eventEmitter.emit('activity.logged', {
        action: 'STOCK_ADJUSTMENT_CREATED',
        entityType: 'StockAdjustment',
        entityId: adjustment.id,
        detail: `Adjustment ${data.type} for ${Math.abs(data.qty)} units`,
        senderDivision: 'WAREHOUSE',
      });

      return adjustment;
    });
  }

  async approveAdjustment(id: string, status: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const adj = await tx.stockAdjustment.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!adj) throw new NotFoundException('Adjustment not found');

      const notes = adj.notes
        ? `${adj.notes} [${status === 'APPROVED' ? 'APPROVED' : 'REJECTED'}]`
        : `[${status === 'APPROVED' ? 'APPROVED' : 'REJECTED'}]`;

      const updated = await tx.stockAdjustment.update({
        where: { id },
        data: { notes },
      });

      if (status === 'APPROVED') {
        for (const item of adj.items) {
          const qtyNum = Number(item.qty);
          const qtyChange = adj.type === 'IN' ? qtyNum : -qtyNum;
          await tx.materialItem.update({
            where: { id: item.materialId },
            data: { stockQty: { increment: qtyChange } },
          });
          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              type: 'ADJUSTMENT',
              quantity: Math.abs(qtyNum),
              referenceNo: `ADJ-${id.slice(0, 8)}`,
              performedBy: userId,
              notes:
                adj.type === 'IN'
                  ? 'Stock adjustment IN (approved)'
                  : 'Stock adjustment OUT (approved)',
            },
          });
        }

        // Automated Journaling for Finance Integration (BUS-RULE-055)
        if (adj.type === 'OUT') {
          const finSvc = await this.getFinanceService();
          let totalLossValue = 0;
          for (const item of adj.items) {
            const mat = await tx.materialItem.findUnique({
              where: { id: item.materialId },
              select: { unitPrice: true },
            });
            totalLossValue += Number(item.qty) * Number(mat?.unitPrice || 0);
          }
          if (totalLossValue > 0) {
            await finSvc.createInventoryAdjustmentJournal({
              opnameId: id,
              totalLossValue,
              notes: adj.notes || 'Stock Write-Off Adjustment',
            });
          }
        }

        this.eventEmitter.emit('warehouse.stock.adjusted', {
          adjustmentId: id,
          type: adj.type,
          itemsCount: adj.items.length,
          performedBy: userId,
        });
        this.eventEmitter.emit('warehouse.adjustment.approved', {
          adjustmentId: id,
          type: adj.type,
          performedBy: userId,
        });
      }

      this.eventEmitter.emit('activity.logged', {
        action: `STOCK_ADJUSTMENT_${status}`,
        entityType: 'StockAdjustment',
        entityId: id,
        detail: `Adjustment ${status} by ${userId}`,
        senderDivision: 'WAREHOUSE',
      });

      return updated;
    });
  }
}
