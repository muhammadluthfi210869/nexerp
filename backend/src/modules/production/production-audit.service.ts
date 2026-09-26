/**
 * Fase 3C (part 7) — the QC audit queue leaves ProductionService.
 *
 * The six slices before this one were cut on mutability (analytics), on one
 * record type (batch records), on deciding when work happens (planning), on
 * recording an outcome (actuals), and on the floor itself (execution). This one
 * is cut on *the decision a supervisor makes*: what is waiting to be inspected,
 * the write that closes that inspection, and the one-line stage calculator that
 * says where the batch goes afterwards.
 *
 * Measured before the move, not assumed:
 *
 *   lines 292-398 — three methods, contiguous, nothing interleaved
 *   `this.X` inside the block: prisma (4), calculateNextStage (1, moving)
 *   zero references to any of the three names anywhere else in the facade
 *   `calculateNextStage` is private and has no caller outside the block, so it
 *     gets no delegator on the facade — it leaves entirely
 *   one `this.prisma.$transaction`, in `submitAudit`: it writes the audit row
 *     and the log status together, or neither
 *
 * This is the first extracted service that needs **one** collaborator. No event
 * emitter, no id generator, no logger: the block neither emits nor logs.
 *
 * The facade stays, for the same reason as the previous six slices: the
 * controller routes and six test modules should not have to change because a
 * file was split.
 */

import { Injectable, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class ProductionAuditService {
  constructor(private prisma: PrismaService) {}

  async getPendingAudits() {
    const logs = await this.prisma.productionLog.findMany({
      where: {
        OR: [
          { quarantineQty: { gt: 0 } },
          { notes: { contains: 'QC_REQUIRED' } },
        ],
      },
      include: {
        workOrder: { include: { lead: true } },
      },
      orderBy: { loggedAt: 'desc' },
    });

    const workOrderIds = logs
      .map((l) => l.workOrderId)
      .filter((id): id is string => id !== null);
    const workOrders = await this.prisma.workOrder.findMany({
      where: { id: { in: workOrderIds } },
      select: { id: true, planId: true },
    });
    const planIds = [
      ...new Set(
        workOrders
          .map((wo) => wo.planId)
          .filter((id): id is string => id !== null),
      ),
    ];
    const stepLogs = await this.prisma.productionStepLog.findMany({
      where: { woId: { in: planIds } },
      include: { qcAudits: { take: 1 } },
    });

    const auditedPlanIds = new Set(
      stepLogs.filter((sl) => sl.qcAudits.length > 0).map((sl) => sl.woId),
    );
    const auditedWoIds = new Set(
      workOrders
        .filter((wo) => wo.planId && auditedPlanIds.has(wo.planId))
        .map((wo) => wo.id),
    );

    return logs.filter(
      (l) => l.workOrderId && !auditedWoIds.has(l.workOrderId),
    );
  }

  async submitAudit(
    logId: string,
    auditorId: string,
    status: any,
    notes: string,
  ) {
    return await this.prisma.$transaction(async (tx: any) => {
      const log = await tx.productionLog.findUnique({
        where: { id: logId },
      });

      if (!log) throw new BadRequestException('Log entry not found');

      // Create Audit Record
      const audit = await tx.qCAudit.create({
        data: {
          stepLogId: logId,
          qcId: auditorId, // In reality, use user from JWT
          status,
          notes,
        },
      });

      // DECISION LOGIC:
      // If PASS and in PENDING_QC, move WO forward
      const wo = await tx.workOrder.findUnique({
        where: { id: log.workOrderId },
      });
      if (wo.stage === 'PENDING_QC') {
        if (status === 'GOOD') {
          // Determine next stage
          const next = this.calculateNextStage(log.stage);
          await tx.workOrder.update({
            where: { id: log.workOrderId },
            data: { stage: next },
          });
        } else if (status === 'REJECT') {
          await tx.workOrder.update({
            where: { id: log.workOrderId },
            data: { stage: 'REWORK' },
          });
        }
      }

      return audit;
    });
  }

  private calculateNextStage(currentLogStage: string): any {
    switch (currentLogStage) {
      case 'MIXING':
        return 'FILLING';
      case 'FILLING':
        return 'PACKING';
      case 'PACKING':
        return 'FINISHED_GOODS';
      default:
        return 'FINISHED_GOODS';
    }
  }
}
