/**
 * Fase 3C (part 9) — Work Orders and Material Requisitions leave ProductionService.
 *
 * This service encapsulates the work order lifecycle and material requisition
 * fulfillment:
 *   - createWorkOrder: initializes work order and BOM-driven material requisitions
 *   - issueMaterial: verifies stock, decrements inventory, and issues material
 *   - flagShortage: flags material shortage and escalates WO to WAITING_PROCUREMENT
 *   - getAllRequisitions: lists material requisitions across work orders
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../../prisma/prisma/prisma.service';
import { rel } from '../../common/helpers/prisma.helper';
import { IdGeneratorService } from '../system/id-generator.service';

@Injectable()
export class ProductionWorkOrderService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  async createWorkOrder(dto: {
    leadId: string;
    targetQty: number;
    targetCompletion: string | Date;
    notes?: string;
  }) {
    if (!dto || !dto.leadId || !dto.targetQty || !dto.targetCompletion) {
      throw new BadRequestException('leadId, targetQty, and targetCompletion are required');
    }

    const targetDate = new Date(dto.targetCompletion);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid targetCompletion date format');
    }

    const woNumber = await this.idGenerator.generateId('WO');

    return this.prisma.$transaction(async (tx: any) => {
      const wo = await tx.workOrder.create({
        data: {
          woNumber,
          leadId: dto.leadId,
          targetQty: Number(dto.targetQty),
          targetCompletion: targetDate,
          stage: 'WAITING_MATERIAL',
        },
        include: {
          lead: {
            include: {
              sampleRequests: {
                include: {
                  billOfMaterials: true,
                },
              },
            },
          },
        },
      });

      // Create Material Requisitions from BOM
      const approvedSample = wo.lead?.sampleRequests?.find(
        (sr: any) => sr.stage === 'APPROVED',
      );
      const bom = approvedSample?.billOfMaterials || [];
      if (bom.length > 0) {
        for (const bomItem of bom) {
          const totalQty = Number(bomItem.quantityPerUnit) * dto.targetQty;
          await tx.materialRequisition.create({
            data: {
              workOrderId: wo.id,
              materialId: bomItem.materialId,
              qtyRequested: totalQty,
            },
          });
        }
      }

      this.eventEmitter.emit('production.work_order.created', {
        workOrderId: wo.id,
        woNumber: wo.woNumber,
        leadId: dto.leadId,
        targetQty: dto.targetQty,
      });
      this.eventEmitter.emit('activity.logged', {
        senderDivision: 'PRODUCTION',
        notes: `Work Order ${wo.woNumber} created for lead ${dto.leadId}`,
        loggedBy: 'SYSTEM:PRODUCTION',
      });

      return wo;
    });
  }

  // --- PHASE 1: WAREHOUSE COMMANDS ---
  async issueMaterial(requisitionId: string) {
    return await this.prisma
      .$transaction(async (tx: any) => {
        const requisition = await tx.materialRequisition.findUnique({
          where: { id: requisitionId },
          include: { material: true },
        });

        if (!requisition)
          throw new BadRequestException('Requisition not found');

        // Validate stock availability
        if (
          Number(requisition.material.stockQty) <
          Number(requisition.qtyRequested)
        ) {
          throw new BadRequestException({
            code: 'INSUFFICIENT_STOCK',
            message: `Stock不足: ${requisition.material.name} — tersedia ${Number(requisition.material.stockQty)} ${requisition.material.unit}, dibutuhkan ${Number(requisition.qtyRequested)}`,
          });
        }

        // Decrement stock
        await tx.materialItem.update({
          where: { id: requisition.materialId },
          data: { stockQty: { decrement: Number(requisition.qtyRequested) } },
        });

        // Log InventoryTransaction
        await tx.inventoryTransaction.create({
          data: {
            materialId: requisition.materialId,
            type: 'OUTBOUND',
            quantity: Number(requisition.qtyRequested),
            referenceNo:
              requisition.reqNumber || `REQ-${requisition.id.slice(0, 8)}`,
            notes: `ISSUED to WorkOrder ${requisition.workOrderId}`,
            performedBy: 'SYSTEM:PRODUCTION',
          },
        });

        const updated = await tx.materialRequisition.update({
          where: { id: requisitionId },
          data: {
            status: 'ISSUED',
            qtyIssued: { increment: Number(requisition.qtyRequested) },
          },
          include: { workOrder: true },
        });

        // Create a production log to notify that material is released
        await tx.productionLog.create({
          data: {
            workOrder: rel(requisition.workOrderId),
            stage: updated.workOrder.stage,
            inputQty: 0,
            goodQty: 0,
            quarantineQty: 0,
            rejectQty: 0,
            notes: `WAREHOUSE_ACTION: MATERIAL_RELEASED (${requisition.id}) — ${Number(requisition.qtyRequested)} ${requisition.material.unit} deducted`,
          },
        });

        return updated;
      })
      .then((result) => {
        this.eventEmitter.emit('production.material.issued', {
          requisitionId,
          workOrderId: result.workOrderId,
          qtyIssued: Number(result.qtyIssued),
        });
        this.eventEmitter.emit('warehouse.material.issued', {
          requisitionId,
          workOrderId: result.workOrderId,
          qtyIssued: Number(result.qtyIssued),
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Materials issued for requisition ${result.id} — stock decremented`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async flagShortage(requisitionId: string) {
    return await this.prisma
      .$transaction(async (tx: any) => {
        const requisition = await tx.materialRequisition.update({
          where: { id: requisitionId },
          data: { status: 'SHORTAGE' },
          include: { workOrder: true },
        });

        // Escalation: Update WO status to WAITING_PROCUREMENT
        await tx.workOrder.update({
          where: { id: requisition.workOrderId },
          data: { stage: 'WAITING_PROCUREMENT' },
        });

        return requisition;
      })
      .then((result) => {
        this.eventEmitter.emit('production.material.shortage', {
          requisitionId,
          workOrderId: result.workOrderId,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Material shortage flagged for requisition ${result.id}`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }


  async createRequisition(dto: {
    workOrderId?: string;
    woNumber?: string;
    materialId?: string;
    qtyRequested?: number;
    notes?: string;
  }) {
    let woId = dto.workOrderId;
    if (!woId && dto.woNumber) {
      const wo = await this.prisma.workOrder.findFirst({
        where: {
          OR: [
            { id: dto.woNumber },
            { woNumber: dto.woNumber },
          ],
        },
      });
      if (wo) woId = wo.id;
    }

    if (!woId) {
      const firstWo = await this.prisma.workOrder.findFirst();
      if (firstWo) woId = firstWo.id;
    }

    let materialId = dto.materialId;
    if (!materialId) {
      const firstMat = await this.prisma.materialItem.findFirst();
      if (firstMat) materialId = firstMat.id;
    }

    if (!materialId) {
      throw new BadRequestException('Tidak ada data material yang dapat diajukan SPB');
    }

    const reqNumber = await this.idGenerator.generateId('SPB');

    return this.prisma.materialRequisition.create({
      data: {
        reqNumber,
        workOrderId: woId,
        materialId,
        qtyRequested: dto.qtyRequested || 1,
        status: 'PENDING',
      },
      include: {
        workOrder: { include: { lead: true } },
        material: true,
      },
    });
  }

  async getAllRequisitions() {
    const reqs = await this.prisma.materialRequisition.findMany({
      include: {
        workOrder: { include: { lead: true } },
        material: true,
      },
      orderBy: { status: 'asc' },
    });
    return reqs.map((r) => ({
      ...r,
      qty_requested: Number(r.qtyRequested),
    }));
  }

}
