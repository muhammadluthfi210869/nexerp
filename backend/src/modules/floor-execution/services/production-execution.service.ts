import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateStepLogDto } from '../dto/create-step-log.dto';
import { LifecycleStatus, QCStatus, ProdStage } from '@prisma/client';

import { IdGeneratorService } from '../../system/id-generator.service';

@Injectable()
export class ProductionExecutionService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
  ) {}

  private toProdStage(stage: LifecycleStatus | string): ProdStage {
    const map: Record<string, ProdStage> = {
      MIXING: ProdStage.MIXING,
      FILLING: ProdStage.FILLING,
      PACKING: ProdStage.PACKING,
      BATCHING: ProdStage.BATCHING,
    };
    return map[String(stage)] || ProdStage.MIXING;
  }

  async executeStep(dto: CreateStepLogDto) {
    const logNumber = await this.idGenerator.generateStageId(dto.stage);
    // 1. [QC INTERLOCK]
    await this.validateQCGate(dto);

    // 2. [FEFO GUARD]
    if (dto.materialBatchNumber && dto.stage === 'MIXING') {
      await this.validateFEFO(dto);
    }

    // 3. [MATHEMATICAL LIMIT / PHYSICAL GATE]
    this.validateMassBalance(dto);

    // 4. [COSTING ENGINE]
    const { laborCost, overheadCost } = await this.calculateCosts(dto);

    // 5. [ATOMIC EXECUTION - SYNCHRONIZE BOTH PRODUCTION_LOG AND PRODUCTION_STEP_LOG]
    const log = await this.prisma.$transaction(async (tx) => {
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

      const shrinkage = Math.max(
        0,
        Number(dto.inputQty) -
          (Number(dto.goodQty) + Number(dto.rejectQty) + Number(dto.quarantineQty)),
      );

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

      const prodLog = await tx.productionLog.create({
        data: {
          logNumber,
          workOrderId: dto.workOrderId,
          planId,
          stage: dto.stage,
          inputQty: dto.inputQty,
          goodQty: dto.goodQty,
          rejectQty: dto.rejectQty,
          quarantineQty: dto.quarantineQty,
          machineId: dto.machineId,
          operatorId: dto.operatorId,
          startTime: dto.startTime ? new Date(dto.startTime) : null,
          endTime: dto.endTime ? new Date(dto.endTime) : null,
          machineParams: dto.machineParams,
          laborCost,
          overheadCost,
          notes: dto.notes,
        },
      });

      return {
        ...prodLog,
        stepLogId: stepLog?.id,
      };
    });

    // 6. [PROTOCOL: MULTI-DIVISION COMMUNICATION]
    this.emitProtocols(dto, log);

    return log;
  }

  private async validateQCGate(dto: CreateStepLogDto) {
    const stages: LifecycleStatus[] = [
      LifecycleStatus.MIXING,
      LifecycleStatus.FILLING,
      LifecycleStatus.PACKING,
    ];
    const currentIndex = stages.indexOf(dto.stage as LifecycleStatus);

    if (currentIndex > 0) {
      const prevStage = stages[currentIndex - 1];
      const prevProdStage = this.toProdStage(prevStage);
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
          `QC Interlock: Tahap ${prevStage} belum dicatat.`,
        );
      }

      if (prevStepLog.qcAudits.length === 0) {
        throw new BadRequestException(
          `QC Interlock: Tahap ${prevStage} belum lulus uji QC.`,
        );
      }
    }
  }

  private async validateFEFO(dto: CreateStepLogDto) {
    // Validate FEFO: check that the batch being used is the oldest expiring batch
    if (!dto.materialBatchNumber) return;

    const inventory = await this.prisma.materialInventory.findFirst({
      where: { internalQrCode: dto.materialBatchNumber },
    });

    if (!inventory) {
      throw new BadRequestException(
        `FEFO Validation: Batch ${dto.materialBatchNumber} tidak ditemukan di system.`,
      );
    }

    // Check if there's an older expiring batch with available stock
    if (!inventory.expDate) return; // Skip FEFO if no expiry date

    const olderBatch = await this.prisma.materialInventory.findFirst({
      where: {
        materialId: inventory.materialId,
        expDate: { not: null, lt: inventory.expDate },
        currentStock: { gt: 0 },
        qcStatus: 'GOOD',
      },
      orderBy: { expDate: 'asc' },
    });

    if (olderBatch) {
      const expStr = olderBatch.expDate
        ? olderBatch.expDate.toISOString().split('T')[0]
        : 'N/A';
      throw new BadRequestException(
        `FEFO Violation: Batch ${olderBatch.batchNumber} (exp: ${expStr}) masih tersedia dan lebih tua dari batch yang dipilih ${dto.materialBatchNumber}. Gunakan batch tertua terlebih dahulu.`,
      );
    }
  }

  private validateMassBalance(dto: CreateStepLogDto) {
    const totalOut =
      Number(dto.goodQty) + Number(dto.rejectQty) + Number(dto.quarantineQty);
    if (totalOut > Number(dto.inputQty) * 1.05) {
      throw new BadRequestException(
        `Physical Limit: Output (${totalOut}) melebihi input (${dto.inputQty}) di luar batas toleransi.`,
      );
    }
  }

  private async calculateCosts(dto: CreateStepLogDto) {
    let laborCost = 0;
    let overheadCost = 0;

    if (dto.startTime && dto.endTime) {
      const durationHours =
        (new Date(dto.endTime).getTime() - new Date(dto.startTime).getTime()) /
        (1000 * 60 * 60);

      // Machine Overhead
      if (dto.machineId) {
        const machine = await this.prisma.machine.findUnique({
          where: { id: dto.machineId },
        });
        if (machine) {
          overheadCost = Number(machine.costPerHour) * durationHours;
        }
      }

      // Labor Cost
      if (dto.operatorId) {
        const operator = await this.prisma.user.findUnique({
          where: { id: dto.operatorId },
        });
        if (operator?.laborGrade) {
          const rate = await this.prisma.laborRate.findUnique({
            where: { grade: operator.laborGrade },
          });
          if (rate) {
            laborCost = Number(rate.hourlyRate) * durationHours;
          }
        }
      }
    }

    return { laborCost, overheadCost };
  }

  private async emitProtocols(dto: CreateStepLogDto, log: any) {
    // SSE Protocol for BusDev
    this.eventEmitter.emit('production.update', {
      workOrderId: dto.workOrderId,
      stage: dto.stage,
      status: 'UPDATED',
      timestamp: new Date(),
    });

    // SSE Protocol for QC
    if (dto.stage === 'MIXING' || dto.stage === 'FILLING') {
      this.eventEmitter.emit('qc.notification', {
        type: 'SAMPLE_REQUIRED',
        workOrderId: dto.workOrderId,
        stage: dto.stage,
        logId: log.id,
      });
    }

    // Protocol for Maintenance (If reject too high)
    if (Number(dto.rejectQty) / Number(dto.inputQty) > 0.05) {
      this.eventEmitter.emit('machine.error', {
        machineId: dto.machineId,
        severity: 'WARNING',
        message: `High reject rate detected: ${((Number(dto.rejectQty) / Number(dto.inputQty)) * 100).toFixed(2)}%`,
      });
    }
  }
}
