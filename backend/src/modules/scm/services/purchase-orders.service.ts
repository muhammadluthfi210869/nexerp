import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreatePurchaseOrderDto } from '../dto/create-po.dto';

import { LegalityService } from '../../legality/legality.service';

import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LegalityService))
    private legality: LegalityService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(userId: string, dto: CreatePurchaseOrderDto) {
    const poNumber = await this.idGenerator.generateId('PO');
    const { items, escalationPin, escalationReason, ...poData } = dto;

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

      // Verify PIN (In real app, compare with hashed PIN in DB)
      const manager = await this.prisma.user.findFirst({
        where: { managerPin: escalationPin },
      });

      if (!manager) {
        throw new ForbiddenException('PIN Manajer tidak valid.');
      }

      // Record Escalation (Non-blocking)
      await this.prisma.auditEscalation
        .create({
          data: {
            type: 'VENDOR_BLACKLIST_PO',
            referenceId: dto.id,
            reason: escalationReason,
            approvedBy: { connect: { id: manager.id } },
          },
        })
        .catch((err) => {
          console.error('[AuditEscalation] Failed to record:', err.message);
        });
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

    return this.prisma.purchaseOrder.create({
      data: {
        ...otherData,
        poNumber,
        totalValue: totalAmount || 0,
        scmId: userId,
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
  }

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        scm: { select: { fullName: true } },
        inbounds: { include: { items: true } },
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
}
