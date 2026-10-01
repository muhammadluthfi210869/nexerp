import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { LifecycleStatus, QCStatus, ProdStage } from '@prisma/client';

@Injectable()
export class StepLogsService {
  constructor(private prisma: PrismaService) {}

  private readonly stepOrder: LifecycleStatus[] = [
    LifecycleStatus.MIXING,
    LifecycleStatus.FILLING,
    LifecycleStatus.PACKING,
  ];

  private toProdStage(stage: LifecycleStatus | string): ProdStage {
    const map: Record<string, ProdStage> = {
      MIXING: ProdStage.MIXING,
      FILLING: ProdStage.FILLING,
      PACKING: ProdStage.PACKING,
      BATCHING: ProdStage.BATCHING,
    };
    return map[String(stage)] || ProdStage.MIXING;
  }

  async create(dto: any) {
    // 1. [HARDENING: MASS BALANCE TOLERANCE]
    const totalOut =
      Number(dto.goodQty) + Number(dto.rejectQty) + Number(dto.quarantineQty);
    const difference = Number(dto.inputQty) - totalOut;
    const tolerancePercent = 0.01;
    const maxShrinkage = Number(dto.inputQty) * tolerancePercent;

    if (difference < -0.0001) {
      throw new BadRequestException(
        `Mass Balance Error: Output total (${totalOut}) exceeds Input (${dto.inputQty}). Unexpected gain.`,
      );
    }

    if (difference > maxShrinkage) {
      throw new BadRequestException(
        `Mass Balance Error: Difference (${difference}) exceeds 1% tolerance (${maxShrinkage}). Shrinkage too high.`,
      );
    }

    const shrinkage = Math.max(0, difference);

    // 2. [QC INTERLOCK]
    const currentStepIndex = this.stepOrder.indexOf(dto.stage);
    if (currentStepIndex > 0) {
      const prevStep = this.stepOrder[currentStepIndex - 1];
      const prevProdStage = this.toProdStage(prevStep);

      const prevStepLog = await this.prisma.productionStepLog.findFirst({
        where: {
          wo: { workOrders: { some: { id: dto.workOrderId } } },
          stage: prevProdStage,
        },
        include: { qcAudits: { where: { status: QCStatus.GOOD }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      });

      if (!prevStepLog) {
        throw new BadRequestException(
          `QC Interlock: Previous stage (${prevStep}) hasn't been logged.`,
        );
      }

      if (prevStepLog.qcAudits.length === 0) {
        throw new BadRequestException(
          `QC Interlock: Previous stage (${prevStep}) has NO valid GOOD audit.`,
        );
      }
    }

    // 3. Atomically synchronize ProductionPlan, ProductionStepLog, and ProductionLog
    return this.prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.findUnique({
        where: { id: dto.workOrderId },
      });

      let planId = wo?.planId;
      if (!planId && wo) {
        const so = await tx.salesOrder.findFirst({
          where: { leadId: wo.leadId },
        });
        const admin = await tx.user.findFirst();
        if (so && admin) {
          const batchNo = `BMR-${wo.woNumber.replace(/[^A-Za-z0-9]/g, '').slice(-8)}-${Date.now().toString().slice(-4)}`;
          const newPlan = await tx.productionPlan.create({
            data: {
              soId: so.id,
              adminId: admin.id,
              batchNo,
              status: LifecycleStatus.MIXING,
            },
          });
          planId = newPlan.id;
          await tx.workOrder.update({
            where: { id: wo.id },
            data: { planId },
          });
        }
      }

      let stepLog: any = null;
      if (planId) {
        stepLog = await tx.productionStepLog.create({
          data: {
            woId: planId,
            stage: this.toProdStage(dto.stage),
            inputQty: dto.inputQty,
            qtyResult: dto.goodQty,
            qtyReject: dto.rejectQty,
            qtyQuarantine: dto.quarantineQty,
            shrinkageQty: shrinkage,
          },
        });
      }

      const log = await tx.productionLog.create({
        data: {
          workOrderId: dto.workOrderId,
          planId,
          stage: dto.stage,
          inputQty: dto.inputQty,
          goodQty: dto.goodQty,
          rejectQty: dto.rejectQty,
          quarantineQty: dto.quarantineQty,
          shrinkageQty: shrinkage,
          notes: dto.notes,
          loggedAt: new Date(),
        },
      });

      return {
        ...log,
        stepLogId: stepLog?.id,
      };
    });
  }

  async findByPlan(workOrderId: string) {
    return this.prisma.productionStepLog.findMany({
      where: {
        wo: { workOrders: { some: { id: workOrderId } } },
      },
      include: { qcAudits: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
