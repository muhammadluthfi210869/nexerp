/**
 * production-batch-record.service.ts — Fase 3C (part 3).
 *
 * The batch-record cluster, extracted from ProductionService. Cut on domain
 * cohesion rather than mutability: these seven methods read, write, and emit,
 * and what makes them a seam is that they own one model family
 * (`productionPlan`-as-batch-record) and reach nothing else in the class.
 *
 * Measured before the move, not assumed:
 *   lines 1853-2219 — seven methods, contiguous
 *   `this.X` inside the block: prisma (13), eventEmitter (2), logger (1)
 *   no moved name is referenced anywhere else in the facade (0, all seven)
 *   the only real caller is production.controller.ts (7 call sites)
 *
 * `eventEmitter` is the one deliberate breach of the analytics slice's
 * "prisma and nothing else" rule, and it is legitimate: these methods publish
 * domain events, which is how this codebase already decouples modules. A
 * service that could not emit would have to stay fused to the facade.
 *
 * ProductionService keeps seven thin delegators so the seven controller routes
 * and six test modules did not have to change because a file was split.
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { LifecycleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { logBestEffort } from '../../common/helpers/best-effort';

@Injectable()
export class ProductionBatchRecordService {
  private readonly logger = new Logger(ProductionBatchRecordService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getBatchRecordDetail(batchNo: string) {
    const plan = await this.prisma.productionPlan.findFirst({
      where: { batchNo },
      include: {
        so: { include: { lead: true } },
        workOrders: {
          include: {
            schedules: {
              include: {
                stepDetails: { include: { material: true } },
                machine: true,
              },
            },
            logs: { orderBy: { loggedAt: 'desc' } },
            requisitions: { include: { material: true } },
          },
        },
        logs: { orderBy: { loggedAt: 'desc' } },
      },
    });
    if (!plan) throw new NotFoundException(`Batch record ${batchNo} not found`);
    return {
      ...plan,
      status: plan.apjSignatureUrl || plan.status,
    };
  }

  async createBatchRecord(dto: any, user: any) {
    const salesOrderId = dto.salesOrderId || dto.sales_order_id || dto.soId;
    if (!salesOrderId) {
      throw new BadRequestException({
        code: 'SALES_ORDER_REQUIRED',
        message: 'sales_order_id bridge is required (BUS-RULE-028)',
      });
    }

    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { lead: true },
    });
    if (!so) {
      throw new BadRequestException(`Sales order ${salesOrderId} not found`);
    }

    const batchNo =
      dto.batchNo ||
      `BMR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 4).toUpperCase()}`;

    const formulaId =
      dto.formulaId || dto.formulationId || dto.formulation_id || null;

    let adminId = user?.id;
    if (!adminId) {
      const defaultUser = await this.prisma.user.findFirst();
      adminId = defaultUser?.id;
    }

    const plan = await this.prisma.productionPlan.create({
      data: {
        batchNo,
        soId: salesOrderId,
        adminId,
        formulaId,
        status: 'PLANNING' as any,
        apjSignatureUrl: 'PLANNING',
        apjNotes: dto.note || dto.notes || null,
      },
      include: {
        so: { include: { lead: true } },
        formula: true,
        workOrders: true,
      },
    });

    const workOrderId = dto.workOrderId || dto.work_order_id;
    if (workOrderId) {
      try {
        await this.prisma.workOrder.update({
          where: { id: workOrderId },
          data: { planId: plan.id },
        });
      } catch (err) {
        // The batch record above is committed; linking it back to the work
        // order is best-effort. A work order that silently keeps pointing at an
        // old plan is exactly the kind of desync nobody can find later.
        logBestEffort(this.logger, 'production:work-order-plan-link', err);
      }
    }

    this.eventEmitter.emit('production.batch_record.created', {
      batchRecordId: plan.id,
      batchNo: plan.batchNo,
      salesOrderId,
      actorId: user?.id,
    });

    return {
      data: {
        ...plan,
        status: plan.apjSignatureUrl || plan.status,
      },
    };
  }

  async getBatchRecord(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const plan = await this.prisma.productionPlan.findFirst({
      where: isUuid ? { OR: [{ id }, { batchNo: id }] } : { batchNo: id },
      include: {
        so: { include: { lead: true } },
        formula: true,
        workOrders: {
          include: {
            schedules: {
              include: {
                stepDetails: { include: { material: true } },
                machine: true,
              },
            },
            logs: { orderBy: { loggedAt: 'desc' } },
            requisitions: { include: { material: true } },
          },
        },
        logs: { orderBy: { loggedAt: 'desc' } },
      },
    });
    if (!plan) throw new NotFoundException(`Batch record ${id} not found`);
    return {
      data: {
        ...plan,
        status: plan.apjSignatureUrl || plan.status,
      },
    };
  }

  async updateBatchRecord(id: string, dto: any, user: any) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const plan = await this.prisma.productionPlan.findFirst({
      where: isUuid ? { OR: [{ id }, { batchNo: id }] } : { batchNo: id },
    });
    if (!plan) throw new NotFoundException(`Batch record ${id} not found`);

    const updated = await this.prisma.productionPlan.update({
      where: { id: plan.id },
      data: {
        apjNotes:
          dto.note !== undefined
            ? dto.note
            : dto.notes !== undefined
              ? dto.notes
              : plan.apjNotes,
        formulaId: dto.formulaId || dto.formulationId || plan.formulaId,
      },
      include: { so: true, formula: true, workOrders: true },
    });
    return {
      data: {
        ...updated,
        status: updated.apjSignatureUrl || updated.status,
      },
    };
  }

  async deleteBatchRecord(id: string, user: any) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const plan = await this.prisma.productionPlan.findFirst({
      where: isUuid ? { OR: [{ id }, { batchNo: id }] } : { batchNo: id },
    });
    if (!plan) throw new NotFoundException(`Batch record ${id} not found`);

    await this.prisma.productionPlan.delete({ where: { id: plan.id } });
    return { success: true };
  }

  async transitionBatchRecord(
    id: string,
    toStatus: string,
    user: any,
    notes?: string,
  ) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    const plan = await this.prisma.productionPlan.findFirst({
      where: isUuid ? { OR: [{ id }, { batchNo: id }] } : { batchNo: id },
      include: {
        formula: true,
        workOrders: {
          include: {
            schedules: true,
          },
        },
      },
    });

    if (!plan) throw new NotFoundException(`Batch record ${id} not found`);

    const currentStatus =
      plan.apjSignatureUrl || (plan.status as string) || 'PLANNING';
    const normalizedTarget = toStatus?.toUpperCase();

    // Map allowable transitions per 03_WORKFLOW_STATE_MACHINE.yaml:
    // DRAFT (PLANNING) -> APPROVED -> LOCKED -> IN_PROGRESS -> COMPLETED
    const validTransitions: Record<string, string[]> = {
      PLANNING: ['APPROVED'],
      DRAFT: ['APPROVED'],
      APPROVED: ['LOCKED'],
      LOCKED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(normalizedTarget)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Tidak bisa transisi status dari ${currentStatus} ke ${normalizedTarget}. Harus berurutan: DRAFT -> APPROVED -> LOCKED -> IN_PROGRESS -> COMPLETED.`,
      });
    }

    // Preconditions
    if (normalizedTarget === 'APPROVED') {
      if (!plan.formulaId && !plan.formula) {
        throw new BadRequestException({
          code: 'FORMULA_REQUIRED',
          message:
            'Batch Record wajib terhubung dengan formula sebelum di-approve.',
        });
      }
    } else if (normalizedTarget === 'LOCKED') {
      const totalSchedules = plan.workOrders.reduce(
        (sum, wo) => sum + wo.schedules.length,
        0,
      );
      if (totalSchedules === 0) {
        throw new BadRequestException({
          code: 'SCHEDULES_REQUIRED',
          message:
            'Seluruh jadwal (Mixing/Filling/Packaging) wajib dibuat sebelum batch di-lock.',
        });
      }
    } else if (normalizedTarget === 'COMPLETED') {
      const allSchedules = plan.workOrders.flatMap((wo) => wo.schedules);
      const packagingSchedule = allSchedules.find(
        (s) =>
          (s.stage as string) === 'PACKAGING' ||
          (s.stage as string) === 'PACKING',
      );
      if (!packagingSchedule || packagingSchedule.status !== 'COMPLETED') {
        throw new BadRequestException({
          code: 'PACKAGING_NOT_COMPLETED',
          message:
            'Tahap Packaging wajib berstatus COMPLETED sebelum Batch Record dapat diselesaikan.',
        });
      }
    }

    let dbLifecycleStatus: LifecycleStatus = plan.status;
    let dbApjStatus = plan.apjStatus;

    if (normalizedTarget === 'APPROVED') {
      dbApjStatus = 'APPROVED' as any;
      dbLifecycleStatus = 'READY_TO_PRODUCE' as any;
    } else if (normalizedTarget === 'LOCKED') {
      dbLifecycleStatus = 'READY_TO_PRODUCE' as any;
    } else if (normalizedTarget === 'IN_PROGRESS') {
      dbLifecycleStatus = 'MIXING' as any;
    } else if (normalizedTarget === 'COMPLETED') {
      dbLifecycleStatus = 'FINISHED_GOODS' as any;
    } else if (normalizedTarget === 'PLANNING' || normalizedTarget === 'DRAFT') {
      dbLifecycleStatus = 'PLANNING' as any;
    }

    try {
      const updated = await this.prisma.productionPlan.update({
        where: { id: plan.id },
        data: {
          status: dbLifecycleStatus,
          apjStatus: dbApjStatus,
          apjSignatureUrl: normalizedTarget,
          apjNotes: notes || plan.apjNotes,
        },
        include: {
          so: { include: { lead: true } },
          formula: true,
          workOrders: { include: { schedules: true } },
        },
      });

      this.eventEmitter.emit('production.batch_record.transitioned', {
        batchRecordId: plan.id,
        fromStatus: currentStatus,
        toStatus: normalizedTarget,
        actorId: user?.id,
      });

      return {
        data: {
          ...updated,
          status: normalizedTarget,
        },
      };
    } catch (err: any) {
      console.error('transitionBatchRecord update failed:', err);
      throw err;
    }
  }

  async getBatchRecords() {
    const plans = await this.prisma.productionPlan.findMany({
      include: {
        so: { include: { lead: true } },
        workOrders: {
          include: {
            schedules: {
              include: {
                stepDetails: { include: { material: true } },
                machine: true,
              },
            },
            logs: { orderBy: { loggedAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { apjReleasedAt: 'desc' },
    });
    return plans.map((p) => ({
      id: p.id,
      batchNo: p.batchNo,
      targetQty: p.workOrders.reduce((s, wo) => s + wo.targetQty, 0),
      stage: p.status,
      createdAt: p.apjReleasedAt || p.so?.createdAt,
      lead: p.so?.lead
        ? {
            brandName: p.so.lead.brandName,
            productInterest: p.so.lead.productInterest,
            clientName: p.so.lead.clientName,
          }
        : null,
      schedules: p.workOrders.flatMap((wo) =>
        wo.schedules.map((sch) => ({
          id: sch.id,
          stage: sch.stage,
          scheduleNumber: sch.scheduleNumber,
          targetQty: sch.targetQty,
          resultQty: sch.resultQty,
          machine: sch.machine ? { name: sch.machine.name } : null,
          stepDetails: sch.stepDetails.map((det) => ({
            id: det.id,
            qtyTheoretical: Number(det.qtyTheoretical),
            qtyActual: det.qtyActual ? Number(det.qtyActual) : null,
            material: det.material ? { name: det.material.name } : null,
          })),
        })),
      ),
    }));
  }
}
