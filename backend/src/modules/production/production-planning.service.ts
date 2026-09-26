/**
 * production-planning.service.ts — Fase 3C (part 4).
 *
 * The planning cluster, extracted from ProductionService. This is the only
 * place in the production module that decides *when* work happens: it creates
 * batch schedules, reschedules them, checks material readiness, dispatches work
 * orders, and derives a work order from a sales order.
 *
 * Measured before the move, not assumed:
 *   lines 883-1391 — six methods, contiguous, nothing interleaved
 *   `this.X` inside the block: prisma (6), eventEmitter (5), idGenerator (1)
 *   zero references to any of the six names elsewhere in the facade
 *   zero calls from the block to another ProductionService method
 *
 * The block reaches the database mostly through `tx` inside `$transaction`
 * (four of them), not through `this.prisma` — which is why `this.prisma`
 * counts six while the models touched number ten. The transaction client is a
 * parameter of the callback, so it needs no injection; only the outer
 * `$transaction` does.
 *
 * ProductionService keeps six thin delegators, so controller routes and the
 * test modules that build a ProductionService did not have to change because a
 * file was split.
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { rel } from '../../common/helpers/prisma.helper';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../system/id-generator.service';

@Injectable()
export class ProductionPlanningService {
  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createBatchSchedule(dto: {
    workOrderId: string;
    machineId: string;
    stage: string;
    startTime: string;
    endTime: string;
    targetQty: number;
    upscalePercent?: number;
    notes?: string;
    formulaDetails?: {
      materialId: string;
      concentration?: number;
      qtyTheoretical: number;
      category?: string;
    }[];
  }) {
    return this.prisma
      .$transaction(async (tx: any) => {
        const machine = await tx.machine.findUnique({
          where: { id: dto.machineId },
        });
        if (!machine) throw new NotFoundException('Machine not found');

        // P12 Capacity Check
        if (Number(machine.capacityPerBatch) > 0 && dto.targetQty > Number(machine.capacityPerBatch)) {
          throw new BadRequestException(
            `MACHINE_CAPACITY_EXCEEDED: Target quantity (${dto.targetQty}) exceeds machine capacity (${machine.capacityPerBatch})`,
          );
        }

        const newStart = new Date(dto.startTime);
        const newEnd = new Date(dto.endTime);
        if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
          throw new BadRequestException('Invalid startTime or endTime format');
        }
        if (newStart >= newEnd) {
          throw new BadRequestException('Schedule startTime must be before endTime');
        }

        // P12 Collision Interlock (Reject overlapping time slots on same active machine)
        const overlapping = await tx.productionSchedule.findFirst({
          where: {
            machineId: dto.machineId,
            status: { not: 'CANCELLED' },
            startTime: { lt: newEnd },
            endTime: { gt: newStart },
          },
        });
        if (overlapping) {
          throw new ConflictException(
            `SCHEDULE_COLLISION: Machine is already booked from ${overlapping.startTime.toISOString()} to ${overlapping.endTime.toISOString()} (Schedule ${overlapping.scheduleNumber})`,
          );
        }

        // P12 Stage Precedence Enforcement (MIXING -> FILLING -> PACKAGING)
        const stageOrder = ['MIXING', 'FILLING', 'PACKAGING'];
        const currentStageIndex = stageOrder.indexOf(dto.stage);
        if (currentStageIndex > 0) {
          const immediatePrevStage = stageOrder[currentStageIndex - 1];
          const prevSchedule = await tx.productionSchedule.findFirst({
            where: {
              workOrderId: dto.workOrderId,
              stage: immediatePrevStage as any,
              status: { not: 'CANCELLED' },
            },
            orderBy: { endTime: 'desc' },
          });
          if (!prevSchedule) {
            throw new BadRequestException(
              `STAGE_ORDER_VIOLATION: Cannot schedule ${dto.stage} before ${immediatePrevStage} schedule exists.`,
            );
          }
          if (new Date(prevSchedule.endTime) > newStart) {
            throw new BadRequestException(
              `STAGE_ORDER_VIOLATION: ${dto.stage} cannot start before ${immediatePrevStage} finishes (${prevSchedule.endTime.toISOString()}).`,
            );
          }
        }

        const scheduleNumber = await this.idGenerator.generateId('SCH');

        // Upscale Intelligence
        let upscaleResult = null;
        if (dto.upscalePercent && dto.targetQty) {
          upscaleResult = dto.targetQty * (1 + dto.upscalePercent / 100);
        }

        const schedule = await tx.productionSchedule.create({
          data: {
            scheduleNumber,
            workOrder: rel(dto.workOrderId),
            machine: rel(dto.machineId),
            stage: dto.stage as any,
            startTime: newStart,
            endTime: newEnd,
            targetQty: dto.targetQty,
            upscalePercent: dto.upscalePercent,
            upscaleResult,
            notes: dto.notes,
            status: 'SCHEDULED',
          },
        });

        // Create formula/component details if provided
        if (dto.formulaDetails && dto.formulaDetails.length > 0) {
          for (const detail of dto.formulaDetails) {
            // Fetch material stock for availability
            const material = await tx.materialItem.findUnique({
              where: { id: detail.materialId },
              select: { stockQty: true, code: true },
            });

            await tx.productionStepDetail.create({
              data: {
                scheduleId: schedule.id,
                materialId: detail.materialId,
                materialCode: material?.code || null,
                concentration: detail.concentration,
                qtyTheoretical: detail.qtyTheoretical,
                qtyAvailable: material ? Number(material.stockQty) : 0,
                category: detail.category || 'RAW',
              },
            });
          }
        }

        return tx.productionSchedule.findUnique({
          where: { id: schedule.id },
          include: {
            stepDetails: { include: { material: true } },
            machine: true,
            workOrder: { include: { lead: true } },
          },
        });
      })
      .then((result) => {
        this.eventEmitter.emit('production.schedule.created', {
          scheduleId: result.id,
          scheduleNumber: result.scheduleNumber,
          workOrderId: result.workOrderId,
          stage: result.stage,
          targetQty: result.targetQty,
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Schedule ${result.scheduleNumber} created for WO ${result.workOrderId}`,
          loggedBy: 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async rescheduleBatchSchedule(
    scheduleId: string,
    dto: { startTime: string; endTime: string; reason: string; machineId?: string },
    user?: any,
  ) {
    if (!dto.reason || dto.reason.trim() === '') {
      throw new BadRequestException('Reschedule reason is mandatory');
    }
    const newStart = new Date(dto.startTime);
    const newEnd = new Date(dto.endTime);
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      throw new BadRequestException('Invalid startTime or endTime format');
    }
    if (newStart >= newEnd) {
      throw new BadRequestException('Schedule startTime must be before endTime');
    }

    return this.prisma
      .$transaction(async (tx: any) => {
        const existing = await tx.productionSchedule.findUnique({
          where: { id: scheduleId },
          include: { machine: true },
        });
        if (!existing) throw new NotFoundException('Schedule not found');
        const targetMachineId = dto.machineId || existing.machineId;

        // Check collision excluding current schedule
        const collision = await tx.productionSchedule.findFirst({
          where: {
            id: { not: scheduleId },
            machineId: targetMachineId,
            status: { not: 'CANCELLED' },
            startTime: { lt: newEnd },
            endTime: { gt: newStart },
          },
        });
        if (collision) {
          throw new ConflictException(
            `SCHEDULE_COLLISION: Machine is already booked during requested window (Schedule ${collision.scheduleNumber})`,
          );
        }

        const updated = await tx.productionSchedule.update({
          where: { id: scheduleId },
          data: {
            startTime: newStart,
            endTime: newEnd,
            machineId: targetMachineId,
            notes: existing.notes
              ? `${existing.notes} | Rescheduled: ${dto.reason}`
              : `Rescheduled: ${dto.reason}`,
          },
          include: { machine: true, workOrder: true },
        });

        return updated;
      })
      .then((result) => {
        this.eventEmitter.emit('production.schedule.rescheduled', {
          scheduleId: result.id,
          scheduleNumber: result.scheduleNumber,
          newStart,
          newEnd,
          reason: dto.reason,
          actorId: user?.id || 'SYSTEM',
        });
        this.eventEmitter.emit('activity.logged', {
          senderDivision: 'PRODUCTION',
          notes: `Schedule ${result.scheduleNumber} rescheduled: ${dto.reason}`,
          loggedBy: user?.fullName || 'SYSTEM:PRODUCTION',
        });
        return result;
      });
  }

  async dispatchWorkOrder(workOrderId: string, user?: any) {
    return this.prisma
      .$transaction(async (tx: any) => {
        const wo = await tx.workOrder.findUnique({
          where: { id: workOrderId },
          include: { requisitions: true, schedules: true },
        });
        if (!wo) throw new NotFoundException('Work Order not found');

        // Check if already dispatched (Idempotent response)
        if (
          wo.stage === 'READY_TO_PRODUCE' ||
          wo.stage === 'MIXING' ||
          wo.stage === 'FILLING' ||
          wo.stage === 'PACKING'
        ) {
          return {
            workOrderId: wo.id,
            woNumber: wo.woNumber,
            stage: wo.stage,
            dispatched: true,
            message: 'Work order already dispatched (idempotent)',
            requisitionsCount: wo.requisitions.length,
          };
        }

        // Transition WorkOrder stage to READY_TO_PRODUCE
        const updated = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            stage: 'READY_TO_PRODUCE',
          },
        });

        return {
          workOrderId: updated.id,
          woNumber: updated.woNumber,
          stage: updated.stage,
          dispatched: true,
          message: 'Work order successfully dispatched to production floor',
          requisitionsCount: wo.requisitions.length,
        };
      })
      .then((res) => {
        this.eventEmitter.emit('production.workorder.dispatched', {
          workOrderId: res.workOrderId,
          woNumber: res.woNumber,
          dispatchedBy: user?.id || 'SYSTEM',
        });
        return res;
      });
  }

  async checkMaterialReadiness(workOrderId: string) {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        requisitions: {
          include: {
            material: true,
          },
        },
        schedules: {
          include: {
            stepDetails: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    });
    if (!wo) throw new NotFoundException('Work Order not found');

    const shortages: Array<{
      materialId: string;
      materialCode: string;
      materialName: string;
      qtyRequired: number;
      qtyAvailable: number;
      deficit: number;
    }> = [];

    let totalRequired = 0;
    let totalAvailableSatisfied = 0;

    const requirementsMap = new Map<
      string,
      { code: string; name: string; qty: number; stock: number }
    >();

    for (const req of wo.requisitions) {
      const matId = req.materialId;
      const code = req.material?.code || 'UNKNOWN';
      const name = req.material?.name || 'UNKNOWN';
      const stock = Number(req.material?.stockQty || 0);
      const qty = Number(req.qtyRequested);
      const current = requirementsMap.get(matId) || { code, name, qty: 0, stock };
      current.qty += qty;
      requirementsMap.set(matId, current);
    }

    for (const sched of wo.schedules) {
      for (const detail of sched.stepDetails) {
        const matId = detail.materialId;
        const code = detail.materialCode || detail.material?.code || 'UNKNOWN';
        const name = detail.material?.name || 'UNKNOWN';
        const stock = Number(detail.material?.stockQty || 0);
        const qty = Number(detail.qtyTheoretical);
        const current = requirementsMap.get(matId) || { code, name, qty: 0, stock };
        if (!wo.requisitions.some((r: any) => r.materialId === matId)) {
          current.qty += qty;
        }
        requirementsMap.set(matId, current);
      }
    }

    for (const [matId, data] of requirementsMap.entries()) {
      totalRequired += data.qty;
      if (data.stock < data.qty) {
        const deficit = data.qty - data.stock;
        shortages.push({
          materialId: matId,
          materialCode: data.code,
          materialName: data.name,
          qtyRequired: data.qty,
          qtyAvailable: data.stock,
          deficit,
        });
        totalAvailableSatisfied += Math.max(0, data.stock);
      } else {
        totalAvailableSatisfied += data.qty;
      }
    }

    const readinessPercent =
      totalRequired > 0
        ? Math.round((totalAvailableSatisfied / totalRequired) * 100)
        : 100;
    const isReady = shortages.length === 0;

    return {
      workOrderId: wo.id,
      woNumber: wo.woNumber,
      readinessPercent,
      isReady,
      totalItems: requirementsMap.size,
      shortagesCount: shortages.length,
      shortages,
    };
  }

  async createWorkOrderFromSO(
    dto: { salesOrderId: string; targetCompletion?: string },
    user?: any,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const so = await tx.salesOrder.findUnique({
        where: { id: dto.salesOrderId },
        include: {
          sample: {
            include: {
              formulas: {
                where: {
                  status: {
                    in: ['PRODUCTION_LOCKED', 'SAMPLE_LOCKED'],
                  },
                },
                include: {
                  phases: {
                    include: { items: true },
                  },
                },
              },
            },
          },
          lead: true,
        },
      });
      if (!so) throw new NotFoundException('Sales Order not found');

      const validStatuses = [
        'ACTIVE',
        'READY_TO_PRODUCE',
        'LOCKED_ACTIVE',
        'IN_PRODUCTION',
        'DP_PAID',
        'READY_PROD',
        'APPROVED',
      ];
      if (!validStatuses.includes(so.status as string)) {
        throw new BadRequestException(
          `Cannot create Work Order for SO with status ${so.status}. DP must be paid.`,
        );
      }

      const formula = so.sample?.formulas?.[0];
      const now = new Date();
      const period = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const woNumber = `WO-${period}-${suffix}`;
      const targetQty = Number(so.quantity || 1000);
      const targetCompletion = dto.targetCompletion
        ? new Date(dto.targetCompletion)
        : new Date(Date.now() + 7 * 24 * 3600 * 1000);

      const workOrder = await tx.workOrder.create({
        data: {
          woNumber,
          leadId: so.leadId || so.lead?.id,
          targetQty,
          targetCompletion,
          stage: 'WAITING_MATERIAL',
        },
      });

      let adminUserId = user?.id;
      if (!adminUserId) {
        const anyUser = await tx.user.findFirst();
        adminUserId = anyUser?.id;
      }

      const batchNo = `BMR-${period}-${suffix}`;
      const plan = await tx.productionPlan.create({
        data: {
          soId: so.id,
          adminId: adminUserId,
          batchNo,
          status: 'PLANNING',
        },
      });

      await tx.workOrder.update({
        where: { id: workOrder.id },
        data: { planId: plan.id },
      });

      if (formula?.phases) {
        const allItems = formula.phases.flatMap((p: any) => p.items);
        let reqIdx = 1;
        for (const item of allItems) {
          if (!item.materialId) continue;
          const dosagePercent = Number(item.dosagePercentage || 0);
          const weightPerUnit = Number(formula.targetYieldGram || 100);
          const totalReq = (dosagePercent / 100) * weightPerUnit * targetQty;

          await tx.materialRequisition.create({
            data: {
              reqNumber: `REQ-${period}-${suffix}-${String(reqIdx++).padStart(3, '0')}`,
              workOrderId: workOrder.id,
              woId: plan.id,
              materialId: item.materialId,
              qtyRequested: totalReq,
              status: 'PENDING',
            },
          });
        }
      }

      return tx.workOrder.findUnique({
        where: { id: workOrder.id },
        include: {
          requisitions: { include: { material: true } },
          lead: true,
          plan: true,
        },
      });
    });
  }

  async getSchedulesByStage(stage?: string) {
    return this.prisma.productionSchedule.findMany({
      where: stage ? { stage: stage as any } : {},
      include: {
        stepDetails: { include: { material: true } },
        machine: true,
        workOrder: { include: { lead: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }
}
