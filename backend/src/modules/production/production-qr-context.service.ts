/**
 * Fase 3C (part 8) — QR scan resolution leaves ProductionService.
 *
 * Its own service rather than a method on ProductionMachineService or
 * ProductionAuditService, because it is the only method left in this facade that
 * fans out across modules: one scan is resolved into whatever it points at —
 * a stage log (production), an inbound receipt or a material batch (warehouse),
 * a production plan, or nothing recognisable (manual mode). Three of its four
 * answers are QC intake; the fourth is a fallback. Filed under "machines" or
 * under "audit queue" it would be the odd one out in both.
 *
 * Measured before the move, not assumed:
 *
 *   lines 347-417 — one method, 71 lines, nothing interleaved
 *   `this.X` inside: prisma (4), one per branch
 *   zero references to the name anywhere else in the facade
 *   models read: productionLog, warehouseInbound, materialInventory,
 *     productionPlan
 *   read-only: no write, no transaction, no event
 *
 * production.controller.ts:174 is the only caller.
 */

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class ProductionQrContextService {
  constructor(private prisma: PrismaService) {}

  async resolveQRContext(uuid: string) {
    // 1. Check if it's a Production Log (Stage-specific: Mixing, Filling, Packing)
    const log = await this.prisma.productionLog.findUnique({
      where: { id: uuid },
      include: { workOrder: { include: { lead: true } } },
    });
    if (log) {
      return {
        type: 'PRODUCTION_QC',
        title: `QC Tahap: ${log.stage}`,
        origin: log.workOrder?.lead?.brandName || 'Internal',
        reference: log.id,
        context: 'PRODUCTION',
        stage: log.stage,
        batchNo: log.logNumber,
      };
    }

    // 2. Check if it's an Inbound Transaction
    const inbound = await this.prisma.warehouseInbound.findUnique({
      where: { id: uuid },
      include: { po: { include: { supplier: true } } },
    });
    if (inbound) {
      return {
        type: 'INBOUND_QC',
        title: 'QC Kedatangan Barang',
        origin: inbound.po?.supplier?.name || 'Unknown Supplier',
        reference: inbound.id,
        context: 'WAREHOUSE',
      };
    }

    // 3. Check if it's a Material Inventory Batch (Internal QR)
    const inventory = await this.prisma.materialInventory.findFirst({
      where: { OR: [{ id: uuid }, { internalQrCode: uuid }] },
      include: { material: true, supplier: true },
    });
    if (inventory) {
      return {
        type: 'MATERIAL_QC',
        title: `QC Material: ${inventory.material.name}`,
        origin: inventory.supplier?.name || 'Unknown',
        reference: inventory.id,
        context: 'WAREHOUSE',
        batchNumber: inventory.batchNumber,
      };
    }

    // 4. Check if it's a Production Plan (Fallback)
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id: uuid },
      include: { so: { include: { lead: true } } },
    });
    if (plan) {
      return {
        type: 'PRODUCTION_QC',
        title: `QC Produksi: ${plan.batchNo}`,
        origin: plan.so?.lead?.brandName || 'Internal Batch',
        reference: plan.id,
        context: 'PRODUCTION',
      };
    }

    // 5. Fallback/Manual Mode
    return {
      type: 'MANUAL_MODE',
      title: 'Context Not Found',
      message: 'QR Code tidak terdaftar. Masuk ke mode manual?',
    };
  }
}
