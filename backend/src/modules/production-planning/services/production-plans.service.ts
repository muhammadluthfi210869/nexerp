import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreateProductionPlanDto,
  UpdatePlanStatusDto,
} from '../dto/production-plan.dto';
import { LifecycleStatus } from '@prisma/client';

import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class ProductionPlansService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
  ) {}

  async create(userId: string, dto: CreateProductionPlanDto) {
    const batchNo = dto.batchNo || (await this.idGenerator.generateId('BMR'));
    return this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findUnique({
        where: { id: dto.soId },
        include: {
          sample: {
            include: {
              formulas: {
                where: { status: 'PRODUCTION_LOCKED' },
                include: {
                  phases: {
                    include: { items: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!so) throw new NotFoundException('Sales order not found');

      const formula = so.sample.formulas[0];
      if (!formula) throw new Error('No final formula locked for this order.');

      // Create Planning
      const plan = await tx.productionPlan.create({
        data: {
          soId: dto.soId,
          batchNo,
          status: dto.status || 'PLANNING',
          adminId: userId,
        },
      });

      // RUMUS: (Dosage % / 100) * Berat per Unit * Qty
      const allItems = formula.phases.flatMap((p) => p.items);
      for (const item of allItems) {
        if (!item.materialId) continue; // Skip dummy materials for requisition

        const dosagePercent = Number(item.dosagePercentage);
        const weightPerUnit = Number(formula.targetYieldGram);
        const qtyOrder = Number(so.quantity);

        const totalRequirement =
          (dosagePercent / 100) * weightPerUnit * qtyOrder;

        await tx.materialRequisition.create({
          data: {
            reqNumber: await this.idGenerator.generateId('REQ'),
            woId: plan.id,
            materialId: item.materialId,
            qtyRequested: totalRequirement,
          },
        });
      }

      return plan;
    });
  }

  async findAll() {
    const plans = await this.prisma.productionPlan.findMany({
      include: {
        so: { select: { lead: { select: { clientName: true } } } },
        admin: { select: { fullName: true } },
        requisitions: { include: { material: true } },
        logs: true,
      },
      orderBy: { batchNo: 'asc' },
    });
    return plans.map((p) => ({
      ...p,
      batch_no: p.batchNo,
      stepLogs: p.logs,
    }));
  }

  async updateStatus(id: string, dto: UpdatePlanStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.productionPlan.findUnique({
        where: { id },
        include: { logs: true },
      });
      if (!plan) throw new NotFoundException('Production plan not found');

      const updated = await tx.productionPlan.update({
        where: { id },
        data: { status: dto.status },
      });

      // [INVENTORY TRIGGER: INCREASE Finished Goods]
      if (dto.status === LifecycleStatus.DONE) {
        // Calculate total yield from final logs (PACKING stage)
        const packingLogs = (plan as any).logs.filter(
          (log: any) => log.stage === 'PACKING',
        );
        const totalYield = packingLogs.reduce(
          (sum: any, log: any) => sum + Number(log.goodQty),
          0,
        );

        // Upsert Finished Good entry
        await tx.finishedGood.upsert({
          where: { woId: id },
          update: { stockQty: totalYield },
          create: {
            woId: id,
            stockQty: totalYield,
          },
        });
      }

      return updated;
    });
  }

  async issueMaterials(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.productionPlan.findUnique({
        where: { id },
        include: { requisitions: { include: { material: true } } },
      });

      if (!plan) throw new NotFoundException('Production plan not found');
      if (plan.status !== LifecycleStatus.PLANNING)
        throw new Error('Materials only issuable at PLANNING stage.');

      // 1. Critical Inventory Check (The Interlock)
      for (const req of plan.requisitions) {
        const currentStock = Number(req.material.stockQty);
        const requested = Number(req.qtyRequested);

        if (currentStock < requested) {
          /*
          if (plan.isOverridden) {
            console.warn(`[OVERRIDE] Insufficient Stock for ${req.material.name}. Proceeding due to Master Override.`);
            continue; 
          }
          */
          throw new Error(
            `Insufficient Stock: ${req.material.name} (Stock: ${currentStock}, Needs: ${requested}). Master Override required to bypass.`,
          );
        }
      }

      // 2. Issuance Loop
      for (const req of plan.requisitions) {
        // Subtract Material Stock
        await tx.materialItem.update({
          where: { id: req.materialId },
          data: { stockQty: { decrement: req.qtyRequested } },
        });

        // Update Requisition issued qty
        await tx.materialRequisition.update({
          where: { id: req.id },
          data: { qtyIssued: req.qtyRequested },
        });
      }

      // 3. Promote Status to READY
      return tx.productionPlan.update({
        where: { id },
        data: { status: LifecycleStatus.READY_TO_PRODUCE },
      });
    });
  }

  async logStep(dto: any) {
    const totalOutput =
      (Number(dto.goodQty) || 0) +
      (Number(dto.rejectQty) || 0) +
      (Number(dto.quarantineQty) || 0);
    const shrinkage = Number(dto.inputQty) - totalOutput;

    const logNumber = await this.idGenerator.generateStageId(dto.stage);

    return this.prisma.productionLog.create({
      data: {
        logNumber,
        planId: dto.woId, // Link to legacy ProductionPlan
        stage: dto.stage,
        inputQty: dto.inputQty,
        goodQty: dto.goodQty,
        rejectQty: dto.rejectQty,
        quarantineQty: dto.quarantineQty,
        shrinkageQty: shrinkage > 0 ? shrinkage : 0,
      },
    });
  }

  async apjRelease(id: string, userId: string, notes?: string) {
    return this.prisma.productionPlan.update({
      where: { id },
      data: {
        apjStatus: 'APPROVED',
        apjNotes: notes,
        apjReleasedAt: new Date(),
      },
    });
  }

  async executeReject(id: string, userId: string, data: any) {
    return this.prisma.rejectExecution.create({
      data: {
        planId: id,
        action: data.method || 'DISPOSAL', // DISPOSAL or REWORK
        evidenceUrl: data.photoUrl,
        qty: data.qty || 0,
      },
    });
  }
}
