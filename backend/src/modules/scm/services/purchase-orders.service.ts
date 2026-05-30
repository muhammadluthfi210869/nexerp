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
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

    return this.prisma.purchaseOrder.create({
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
}
