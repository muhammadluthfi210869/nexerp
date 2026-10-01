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
import { logBestEffort } from '../../../common/helpers/best-effort';
import { UserRole, POStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LegalityService))
    private legality: LegalityService,
    private idGenerator: IdGeneratorService,
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

    // Price Range SOP Check (BUS-RULE-025)
    if (items && items.length > 0) {
      for (const item of items) {
        const mat = await this.prisma.materialItem.findUnique({
          where: { id: item.materialId },
        });
        if (mat && mat.unitPrice && Number(mat.unitPrice) > 0) {
          const refPrice = Number(mat.unitPrice);
          if (Number(item.unitPrice) > refPrice * 1.10 && !dto.priceOverrideReason) {
            throw new BadRequestException(
              `Harga untuk item ${mat.name} (${item.unitPrice}) melebihi SOP 110% dari harga referensi (${refPrice}). Alasan override harga wajib diisi.`,
            );
          }
        }
      }
    }

    // Discount, Shipping & Total calculation (BUS-RULE-017)
    const subtotal =
      items?.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0) || 0;
    const discountManual = Number(dto.discountManual || dto.discount || 0);
    const discountRounding = Number(dto.discountRounding || 0);
    const totalDiscount = discountManual + discountRounding;
    const taxableSubtotal = Math.max(0, subtotal - totalDiscount);
    const taxPercent = Number(dto.taxPercent || 0);
    const tax = taxableSubtotal * (taxPercent / 100);
    const shippingCost = Number(dto.shippingCost || 0);
    const totalValue = taxableSubtotal + shippingCost + tax;

    const { totalAmount, discount, ...otherData } = poData;

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          ...otherData,
          poNumber,
          totalValue,
          discountManual,
          discountRounding,
          shippingCost,
          taxPercent,
          priceOverrideReason: dto.priceOverrideReason,
          signatureUrl: dto.signatureUrl,
          organizationId: dto.organizationId,
          prId: dto.prId,
          scmId: userId,
          status: 'DRAFT' as any,
          // BUS-RULE-016: Server-side auto read-only date today()
          createdAt: new Date(),
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
        include: {
          items: { include: { material: true } },
          supplier: true,
          purchaseRequest: true,
        },
      });

      // If created from PR, mark PR as converted
      if (dto.prId) {
        await tx.purchaseRequest.update({
          where: { id: dto.prId },
          data: { status: 'CONVERTED' as any },
        });
      }

      try {
        await tx.auditLog.create({
          data: {
            entityType: 'PurchaseOrder',
            entityId: po.id,
            action: 'CREATE',
            source: 'SCM_PROCUREMENT',
            correlationId: po.id,
            actorPermissionSnapshot: { poNumber, totalValue },
            actorUserId: userId,
            txId: randomUUID(),
          },
        });
      } catch (err) {
        logBestEffort(this.logger, 'audit:PurchaseOrder:CREATE', err);
      }

      return po;
    });
  }

  async findAll(filter?: { status?: string; search?: string; organizationId?: string }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.organizationId) where.organizationId = filter.organizationId;
    if (filter?.search) {
      where.OR = [
        { poNumber: { contains: filter.search, mode: 'insensitive' } },
        { notes: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        scm: { select: { id: true, fullName: true } },
        purchaseRequest: true,
        inbounds: { include: { items: true } },
        items: {
          include: { material: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchaseRequest: true,
        inbounds: { include: { items: true } },
        items: { include: { material: true } },
      },
    });
    if (!po) throw new NotFoundException(`PO ${id} not found`);
    return po;
  }

  async approve(id: string, user: { id: string; roles: UserRole[] }, signatureUrl?: string) {
    const po = await this.findOne(id);

    // BUS-RULE-022: Tanda tangan digital mandatory
    const finalSignature = signatureUrl || po.signatureUrl;
    if (!finalSignature) {
      throw new BadRequestException('Tanda tangan digital wajib diunggah sebelum approve PO.');
    }

    // 07_RBAC_MATRIX.yaml multi-tier approval
    const totalAmount = Number(po.totalValue);
    const roles = user.roles || [];
    const isDirectorOrSuper = roles.includes(UserRole.DIRECTOR) || roles.includes(UserRole.SUPER_ADMIN);
    const isPurchasingAdmin = roles.includes(UserRole.PURCHASING) || isDirectorOrSuper;

    if (totalAmount > 100_000_000) {
      if (!isDirectorOrSuper) {
        throw new ForbiddenException('PO dengan nilai > Rp 100.000.000 memerlukan persetujuan Direktur.');
      }
    } else if (totalAmount > 5_000_000) {
      if (!isPurchasingAdmin) {
        throw new ForbiddenException('PO dengan nilai Rp 5.000.000 - Rp 100.000.000 memerlukan persetujuan Purchasing Admin/Manager.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'APPROVED' as any,
          signatureUrl: finalSignature,
        },
        include: { items: true, supplier: true },
      });

      try {
        await tx.auditLog.create({
          data: {
            entityType: 'PurchaseOrder',
            entityId: id,
            action: 'APPROVE',
            source: 'SCM_PROCUREMENT',
            correlationId: id,
            actorPermissionSnapshot: { signatureUrl: finalSignature, totalAmount },
            actorUserId: user.id,
            txId: randomUUID(),
          },
        });
      } catch (err) {
        logBestEffort(this.logger, 'audit:PurchaseOrder:APPROVE', err);
      }

      return updated;
    });
  }

  async updateStatus(id: string, status: POStatus | string, reason?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!po) throw new NotFoundException('Purchase Order not found');

    const currentStatus = po.status as POStatus;
    const targetStatus = status as POStatus;

    if (targetStatus === POStatus.APPROVED) {
      throw new BadRequestException(
        'Status APPROVED hanya dapat diproses melalui endpoint persetujuan resmi (POST /purchase/orders/:id/approve) dengan tanda tangan digital dan validasi otorisasi.',
      );
    }

    if (currentStatus === targetStatus) {
      return po;
    }

    const terminalStates: POStatus[] = [
      POStatus.CLOSED,
      POStatus.CANCELLED,
      POStatus.REJECTED,
    ];
    if (terminalStates.includes(currentStatus)) {
      throw new BadRequestException(
        `Purchase Order sudah berstatus ${currentStatus} dan tidak dapat diubah lagi.`,
      );
    }

    const allowedTransitions: Record<string, POStatus[]> = {
      [POStatus.DRAFT]: [POStatus.PENDING, POStatus.PENDING_APPROVAL, POStatus.CANCELLED],
      [POStatus.PENDING]: [POStatus.PENDING_APPROVAL, POStatus.CANCELLED, POStatus.REJECTED],
      [POStatus.PENDING_APPROVAL]: [POStatus.REJECTED, POStatus.CANCELLED],
      [POStatus.APPROVED]: [POStatus.ORDERED, POStatus.PARTIAL, POStatus.SHIPPED, POStatus.RECEIVED, POStatus.CANCELLED],
      [POStatus.ORDERED]: [POStatus.PARTIAL, POStatus.SHIPPED, POStatus.RECEIVED, POStatus.CANCELLED],
      [POStatus.PARTIAL]: [POStatus.SHIPPED, POStatus.RECEIVED, POStatus.CANCELLED],
      [POStatus.SHIPPED]: [POStatus.RECEIVED, POStatus.PARTIAL, POStatus.RETURNED],
      [POStatus.RECEIVED]: [POStatus.CLOSED, POStatus.RETURNED],
      [POStatus.RETURNED]: [POStatus.CLOSED],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Transisi status tidak valid: dari ${currentStatus} ke ${targetStatus}.`,
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: targetStatus as any,
        notes: reason
          ? `${po.notes || ''}\n[${targetStatus}] ${reason}`.trim()
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
