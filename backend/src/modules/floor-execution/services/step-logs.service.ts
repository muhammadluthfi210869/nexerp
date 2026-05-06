import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateStepLogDto } from '../dto/create-step-log.dto';
import { LifecycleStatus, QCStatus } from '@prisma/client';

@Injectable()
export class StepLogsService {
  constructor(private prisma: PrismaService) {}

  private readonly stepOrder: LifecycleStatus[] = [
    LifecycleStatus.MIXING,
    LifecycleStatus.FILLING,
    LifecycleStatus.PACKING,
  ];

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

      const prevLog = await this.prisma.productionLog.findFirst({
        where: {
          workOrderId: dto.workOrderId,
          stage: prevStep,
        },
        include: { qcAudits: true },
        orderBy: { loggedAt: 'desc' },
      });

      if (!prevLog) {
        throw new BadRequestException(
          `QC Interlock: Previous stage (${prevStep}) hasn't been logged.`,
        );
      }

      const hasPassAudit = (prevLog.qcAudits as any[]).some(
        (audit) => audit.status === QCStatus.GOOD,
      );

      if (!hasPassAudit) {
        throw new BadRequestException(
          `QC Interlock: Previous stage (${prevStep}) has NO valid GOOD audit.`,
        );
      }
    }

    // 3. Create Log
    return this.prisma.productionLog.create({
      data: {
        workOrderId: dto.workOrderId,
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
  }

  async findByPlan(workOrderId: string) {
    return this.prisma.productionLog.findMany({
      where: { workOrderId },
      include: { qcAudits: true },
      orderBy: { loggedAt: 'asc' },
    });
  }
}
