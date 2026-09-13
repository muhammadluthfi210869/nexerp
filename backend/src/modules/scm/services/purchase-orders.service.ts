import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreatePurchaseOrderDto } from '../dto/create-po.dto';

import { LegalityService } from '../../legality/legality.service';

import { IdGeneratorService } from '../../system/id-generator.service';
import { StateEventTrigger, UserRole } from '@prisma/client';
import { StateMachineService } from '../../state-machine/state-machine.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LegalityService))
    private legality: LegalityService,
    private idGenerator: IdGeneratorService,
    private stateMachine: StateMachineService,
  ) {}

  async create(userId: string, dto: CreatePurchaseOrderDto) {
    const poNumber = await this.idGenerator.generateId('PO');
    const {
      items,
      escalationPin,
      escalationReason,
      warehouseId,
      dueDate,
      ...poData
    } = dto;

    // 0. SOFT-BLOCK GATE: Vendor Watchlist
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });

    if (supplier?.isBlacklisted) {
      if (!escalationPin || !escalationReason) {
        throw new ForbiddenException(
          'VENDOR DALAM PENGAWASAN QC. Lanjutkan dengan persetujuan Manajer (PIN dibutuhkan).',
        );
      }

      // Verify PIN using bcrypt
      const managers = await this.prisma.user.findMany({
        where: {
          roles: {
            hasSome: [
              UserRole.HEAD_OPS,
              UserRole.DIRECTOR,
              UserRole.SUPER_ADMIN,
            ],
          },
          managerPin: { not: null },
        },
      });

      const managerResults = await Promise.all(
        managers.map((m) =>
          bcrypt
            .compare(escalationPin, m.managerPin!)
            .then((match) => ({ manager: m, match })),
        ),
      );
      const manager = managerResults.find((r) => r.match)?.manager;

      if (!manager) {
        throw new ForbiddenException('PIN Manajer tidak valid.');
      }

      // Record Escalation (Non-blocking)
      try {
        await this.prisma.auditEscalation.create({
          data: {
            type: 'VENDOR_BLACKLIST_PO',
            referenceId: poNumber,
            reason: escalationReason,
            approvedBy: { connect: { id: manager.id } },
          },
        });
      } catch (err: any) {
        Logger.warn(
          `[AuditEscalation] Failed to record: ${err?.message || err}`,
          'PurchaseOrdersService',
        );
      }
    }

    // 1. SMART-GATE: Artwork Approval for Packaging
    if (dto.leadId && items && items.length > 0) {
      const packagingItems = await this.prisma.materialItem.findMany({
        where: {
          id: { in: items.map((i) => i.materialId) },
          type: 'PACKAGING',
        },
      });

      if (packagingItems.length > 0) {
        const gate = await this.legality.checkScmGate(dto.leadId);
        if (!gate.allowed) {
          throw new ForbiddenException(gate.reason);
        }
      }
    }

    const { totalAmount, ...otherData } = poData;

    const created = await this.prisma.purchaseOrder.create({
      data: {
        ...otherData,
        poNumber,
        totalValue: totalAmount || 0,
        scmId: userId,
        status: 'DRAFT' as any,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estArrival: dto.estArrival ? new Date(dto.estArrival) : undefined,
        items: items
          ? {
              create: items.map((i) => ({
                materialId: i.materialId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                totalPrice: Number(i.quantity) * Number(i.unitPrice),
              })),
            }
          : undefined,
      },
    });

    // Wave 2/A5 — record PO_CREATED transition so downstream listeners
    // (gate conditions: vendor black-list, artwork approval, etc) can react.
    // NO_DUAL_WRITE via DB unique index on (entityId, eventTrigger).
    await this.stateMachine.transition({
      entityType: 'PURCHASE_ORDER',
      entityId: created.id,
      eventTrigger: StateEventTrigger.PO_CREATED,
      fromState: null,
      toState: 'DRAFT',
      userId,
      reason: `PO ${created.poNumber} created for supplier ${created.supplierId}`,
      metadata: { poNumber: created.poNumber, totalValue: Number(created.totalValue) },
    });

    return created;
  }

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        scm: { select: { id: true, fullName: true } },
        inbounds: { include: { items: true } },
        items: {
          include: { material: true },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, inbounds: { include: { items: true } } },
    });
    if (!po) throw new NotFoundException(`PO ${id} not found`);
    return po;
  }

  async updateStatus(id: string, status: string, reason?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!po) throw new NotFoundException('Purchase Order not found');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: status as any,
        notes: reason
          ? `${po.notes || ''}\n[${status}] ${reason}`.trim()
          : undefined,
      },
    });
  }

  async createDownPayment(poId: string, amount: number, notes?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) throw new NotFoundException('Purchase Order not found');

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: `DP-PUR-${po.poNumber}`,
        category: 'PAYABLE',
        type: 'DP',
        poId: po.id,
        amountDue: amount,
        outstandingAmount: amount,
        notes: notes || `Down Payment for ${po.poNumber}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      },
    });
  }

  // Item 46+47: Calculate rounding discount based on packing size
  // discountRounding = (qtyRounded - qty) * price
  calculateRounding(qty: number, packingSize: number, price: number): number {
    if (packingSize <= 0) return 0;
    const qtyRounded = Math.ceil(qty / packingSize) * packingSize;
    const rounding = qtyRounded - qty;
    return rounding * price;
  }

  // Item 39: Update product-supplier history when PO is approved
  async updateProductSupplierHistory(poId: string): Promise<void> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true, supplier: true },
    });
    if (!po || po.status !== 'APPROVED') return;

    for (const item of po.items) {
      const qty = Number(item.quantity);
      await this.prisma.productSupplierHistory.upsert({
        where: {
          productId_supplierId: {
            productId: item.materialId,
            supplierId: po.supplierId!,
          },
        },
        create: {
          productId: item.materialId,
          supplierId: po.supplierId!,
          firstSeenAt: new Date(),
          lastPurchaseAt: new Date(),
          totalQtyPurchased: qty,
        },
        update: {
          lastPurchaseAt: new Date(),
          totalQtyPurchased: { increment: qty },
        },
      });
    }
  }

  // Item 71: Get default source (PO or STOCK) based on stock availability
  async getDefaultSource(
    materialId: string,
    qtyNeeded: number,
    warehouseId?: string,
  ): Promise<'PO' | 'STOCK'> {
    const where: any = {
      materialId,
      currentStock: { gt: 0 },
      qcStatus: 'GOOD',
    };
    if (warehouseId) {
      where.location = { warehouseId };
    }
    const inventories = await this.prisma.materialInventory.findMany({ where });
    const totalStock = inventories.reduce(
      (sum, inv) => sum + Number(inv.currentStock),
      0,
    );
    return totalStock >= qtyNeeded ? 'STOCK' : 'PO';
  }

  // Item 71: Validate source selection and check stock availability
  async validateSourceSelection(
    materialId: string,
    qty: number,
    source: string,
    warehouseId?: string,
  ): Promise<{ valid: boolean; error?: string }> {
    if (source !== 'STOCK') return { valid: true };

    const where: any = {
      materialId,
      currentStock: { gt: 0 },
      qcStatus: 'GOOD',
    };
    if (warehouseId) {
      where.location = { warehouseId };
    }
    const inventories = await this.prisma.materialInventory.findMany({ where });
    const totalStock = inventories.reduce(
      (sum, inv) => sum + Number(inv.currentStock),
      0,
    );

    if (totalStock < qty) {
      return {
        valid: false,
        error: `Stok tidak cukup untuk material ini. Tersedia: ${totalStock}, Butuh: ${qty}`,
      };
    }
    return { valid: true };
  }

  // Item 72: Recalculate HPP for a product based on recent approved POs
  async recalcHpp(materialId: string): Promise<number | null> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await this.prisma.purchaseOrderItem.aggregate({
      where: {
        materialId,
        po: {
          status: 'APPROVED',
          updatedAt: { gte: ninetyDaysAgo },
        },
      },
      _sum: { totalPrice: true },
      _count: true,
    });

    // Note: This uses totalPrice which includes qty * unitPrice
    // For proper HPP we need qtyBagus, but since we don't have that field yet,
    // we use the item-level data
    const approvedItems = await this.prisma.purchaseOrderItem.findMany({
      where: {
        materialId,
        po: { status: 'APPROVED', updatedAt: { gte: ninetyDaysAgo } },
      },
      include: { po: true },
    });

    let totalQty = 0;
    let totalValue = 0;
    for (const item of approvedItems) {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      totalQty += qty;
      totalValue += qty * price;
    }

    if (totalQty === 0) {
      await this.prisma.materialItem.update({
        where: { id: materialId },
        data: { autoCalculatedHpp: null },
      });
      return null;
    }

    const autoCalculatedHpp = totalValue / totalQty;
    await this.prisma.materialItem.update({
      where: { id: materialId },
      data: { autoCalculatedHpp },
    });
    return autoCalculatedHpp;
  }

  // Item 72: Get HPP breakdown for a product
  async getHppBreakdown(materialId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const items = await this.prisma.purchaseOrderItem.findMany({
      where: {
        materialId,
        po: { status: 'APPROVED', updatedAt: { gte: ninetyDaysAgo } },
      },
      include: {
        po: { select: { poNumber: true, updatedAt: true, supplier: true } },
      },
      orderBy: { po: { updatedAt: 'desc' } },
    });

    const product = await this.prisma.materialItem.findUnique({
      where: { id: materialId },
      select: { autoCalculatedHpp: true, manualOverrideHpp: true },
    });

    let totalQty = 0;
    let totalValue = 0;
    const breakdown = items.map((item) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const value = qty * price;
      totalQty += qty;
      totalValue += value;
      return {
        poNumber: item.po.poNumber,
        date: item.po.updatedAt,
        supplier: item.po.supplier?.name,
        qty,
        unitPrice: price,
        value,
      };
    });

    return {
      materialId,
      autoCalculatedHpp: product?.autoCalculatedHpp,
      manualOverrideHpp: product?.manualOverrideHpp,
      effectiveHpp: product?.manualOverrideHpp ?? product?.autoCalculatedHpp,
      breakdown,
      summary: {
        totalQty,
        totalValue,
        averageHpp: totalQty > 0 ? totalValue / totalQty : null,
      },
    };
  }
}
