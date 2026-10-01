import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class FinanceCogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Post production costs when a production schedule/stage is completed.
   */
  @OnEvent('production.schedule_completed')
  async handleProductionScheduleFinished(payload: { scheduleId: string }) {
    console.log(
      `[FINANCE_LEDGER] Posting production costs for schedule: ${payload.scheduleId}`,
    );

    const schedule = await this.prisma.productionSchedule.findUnique({
      where: { id: payload.scheduleId },
      include: {
        stepDetails: { include: { material: true } },
        workOrder: true,
      },
    });

    if (!schedule) return;

    // Calculate actual cost based on material consumption
    const totalCost = schedule.stepDetails.reduce((sum, detail) => {
      return (
        sum + Number(detail.qtyActual) * Number(detail.material.unitPrice || 0)
      );
    }, 0);

    if (totalCost <= 0) return;

    // Accounts:
    // 1302 = WIP, fallback 1153/1401
    // 1151 = Raw Materials, fallback 1300
    const wipAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1302' }, { code: '1153' }, { code: '1401' }] },
    });
    const rmAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1151' }, { code: '1300' }] },
    });

    if (wipAcc && rmAcc) {
      await this.prisma.journalEntry.create({
        data: {
          date: new Date(),
          reference: `PROD-COST-${schedule.scheduleNumber}`,
          description: `Production Cost Posting: ${schedule.stage} for WO ${schedule.workOrder.woNumber}`,
          sourceDocumentType: 'PRODUCTION_PLAN',
          planId: schedule.workOrder.planId,
          lines: {
            create: [
              { accountId: wipAcc.id, debit: totalCost, credit: 0 },
              { accountId: rmAcc.id, debit: 0, credit: totalCost },
            ],
          },
        },
      });

      console.log(
        `[FINANCE_LEDGER] Successfully posted production cost: Rp ${totalCost.toLocaleString()}`,
      );
    }
  }

  /**
   * Auto HPP Posting when production QC final is passed.
   */
  @OnEvent('production.qc_final_passed')
  async handleProductionPassed(payload: {
    workOrderId: string;
    loggedBy: string;
  }) {
    console.log(`[HPP_AUTOMATOR] Triggered for WO: ${payload.workOrderId}`);

    const wo = await this.prisma.workOrder.findUnique({
      where: { id: payload.workOrderId },
      include: {
        lead: {
          include: {
            sampleRequests: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                billOfMaterials: {
                  include: { material: true },
                },
              },
            },
          },
        },
      },
    });

    if (!wo || !wo.lead?.sampleRequests?.[0]) return;

    const latestSample = wo.lead.sampleRequests[0];
    let totalHpp = 0;
    for (const bom of latestSample.billOfMaterials) {
      const material = bom.material;
      const price = Number(material.unitPrice || 0);
      const qty = Number(bom.quantityPerUnit);
      totalHpp += price * qty;
    }

    const finalTotalHpp = totalHpp * wo.targetQty;

    // Accounts:
    // 1303 = Finished Goods (fallback 1154, 1400)
    // 1302 = WIP (fallback 1153, 1401)
    const fgAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1303' }, { code: '1154' }, { code: '1400' }] },
    });
    const wipAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1302' }, { code: '1153' }, { code: '1401' }] },
    });

    if (fgAcc && wipAcc && totalHpp > 0) {
      await this.prisma.journalEntry.create({
        data: {
          date: new Date(),
          reference: `HPP-AUTO-${wo.woNumber}`,
          description: `Auto HPP Posting for ${wo.woNumber}`,
          lines: {
            create: [
              { accountId: fgAcc.id, debit: finalTotalHpp, credit: 0 },
              { accountId: wipAcc.id, debit: 0, credit: finalTotalHpp },
            ],
          },
        },
      });

      console.log(
        `[HPP_AUTOMATOR] Successfully posted HPP: ${finalTotalHpp} for WO: ${wo.woNumber}`,
      );
    }
  }

  /**
   * Calculate COGS for a Work Order from BOM estimates and actual consumption.
   */
  async calculateCogs(workOrderId: string): Promise<{
    workOrderId: string;
    totalMaterialCost: number;
    estimatedCogs: number;
    actualCogs: number;
    details: {
      woNumber: string;
      targetQty: number;
      schedulesCount: number;
    };
  }> {
    const wo = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        schedules: {
          include: {
            stepDetails: {
              include: { material: true },
            },
          },
        },
        lead: {
          include: {
            sampleRequests: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                billOfMaterials: {
                  include: { material: true },
                },
              },
            },
          },
        },
      },
    });

    if (!wo) throw new NotFoundException(`Work Order ${workOrderId} not found`);

    // Calculate actual cost from production schedules
    let totalActualCost = 0;
    for (const schedule of wo.schedules || []) {
      for (const detail of schedule.stepDetails || []) {
        totalActualCost +=
          Number(detail.qtyActual || 0) *
          Number(detail.material?.unitPrice || 0);
      }
    }

    // Calculate BOM estimated cost
    let bomUnitCost = 0;
    const latestSample = wo.lead?.sampleRequests?.[0];
    if (latestSample?.billOfMaterials) {
      for (const bom of latestSample.billOfMaterials) {
        bomUnitCost +=
          Number(bom.quantityPerUnit || 0) *
          Number(bom.material?.unitPrice || 0);
      }
    }
    const estimatedTotalCost = bomUnitCost * (wo.targetQty || 1);

    return {
      workOrderId: wo.id,
      totalMaterialCost: totalActualCost,
      estimatedCogs: estimatedTotalCost,
      actualCogs: totalActualCost > 0 ? totalActualCost : estimatedTotalCost,
      details: {
        woNumber: wo.woNumber,
        targetQty: wo.targetQty,
        schedulesCount: wo.schedules?.length || 0,
      },
    };
  }

  /**
   * Calculate payable amount for a PO based on QC-confirmed quantity.
   */
  async calculatePayable(poId: string): Promise<{
    payableAmount: number;
    breakdown: {
      subtotal: number;
      discountManual: number;
      discountRounding: number;
      shippingCost: number;
      rejectAmount: number;
    };
  }> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: { include: { material: true } },
      },
    });

    if (!po) throw new NotFoundException('Purchase Order not found');

    const discountManual = po.discountManual || 0;
    const discountRounding = po.discountRounding || 0;
    const shippingCost = po.shippingCost || 0;

    let subtotal = 0;
    let rejectAmount = 0;

    for (const item of po.items) {
      const qty =
        Number(item.qtyBagus) > 0
          ? Number(item.qtyBagus)
          : Number(item.quantity);
      const itemTotal = qty * Number(item.unitPrice);
      const rejectTotal = Number(item.qtyReject) * Number(item.unitPrice);
      subtotal += itemTotal;
      rejectAmount += rejectTotal;
    }

    const payableAmount =
      subtotal - discountManual - discountRounding + shippingCost;

    return {
      payableAmount: Math.max(0, payableAmount),
      breakdown: {
        subtotal,
        discountManual,
        discountRounding,
        shippingCost,
        rejectAmount,
      },
    };
  }

  /**
   * Create inventory adjustment journal for stock opname losses.
   */
  async createInventoryAdjustmentJournal(data: {
    opnameId: string;
    totalLossValue: number;
    notes: string;
  }) {
    let inventoryAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '1151' }, { code: '1300' }] },
    });
    if (!inventoryAcc) {
      inventoryAcc = await this.prisma.account.create({
        data: {
          code: '1151',
          name: 'Persediaan Bahan Baku',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          reportGroup: 'CURRENT_ASSET',
        },
      });
    }

    let lossAcc = await this.prisma.account.findFirst({
      where: { OR: [{ code: '6232' }, { code: '5001' }] },
    });
    if (!lossAcc) {
      lossAcc = await this.prisma.account.create({
        data: {
          code: '6232',
          name: 'Beban Operasional - Selisih Stok',
          type: 'EXPENSE',
          normalBalance: 'DEBIT',
          reportGroup: 'OPEX',
        },
      });
    }

    return this.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: `OPNAME-${data.opnameId.slice(0, 8)}`,
        description: `Inventory Adjustment: ${data.notes}`,
        lines: {
          create: [
            { accountId: lossAcc.id, debit: data.totalLossValue, credit: 0 },
            {
              accountId: inventoryAcc.id,
              debit: 0,
              credit: data.totalLossValue,
            },
          ],
        },
      },
    });
  }

  /**
   * Get all job order costings.
   */
  async getJobOrderCostings(filter?: { closed?: boolean }) {
    const where: any = {};
    if (filter?.closed !== undefined) {
      if (filter.closed) where.closedAt = { not: null };
      else where.closedAt = null;
    }
    return this.prisma.jobOrderCosting.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    });
  }

  /**
   * Find single job order costing.
   */
  async getJobOrderCosting(id: string) {
    const job = await this.prisma.jobOrderCosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job order costing ${id} not found`);
    return job;
  }

  /**
   * Record HPP for a new job order.
   */
  async createJobOrderCosting(
    userId: string,
    dto: {
      jobOrderNumber: string;
      description?: string;
      totalCost: number;
      totalRevenue?: number;
    },
  ) {
    if (dto.totalCost <= 0) {
      throw new BadRequestException('totalCost must be > 0');
    }
    const existing = await this.prisma.jobOrderCosting.findUnique({
      where: { jobOrderNumber: dto.jobOrderNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Job order ${dto.jobOrderNumber} already exists`,
      );
    }

    return this.prisma.jobOrderCosting.create({
      data: {
        jobOrderNumber: dto.jobOrderNumber,
        description: dto.description,
        totalCost: dto.totalCost,
        totalRevenue: dto.totalRevenue || 0,
      },
    });
  }

  /**
   * Add revenue or correct costs for a job order.
   */
  async updateTotalsJobOrderCosting(
    userId: string,
    id: string,
    dto: {
      totalCost?: number;
      totalRevenue?: number;
    },
  ) {
    const job = await this.prisma.jobOrderCosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job order costing ${id} not found`);
    if (job.closedAt) {
      throw new BadRequestException('Job order already closed. Reopen first.');
    }
    return this.prisma.jobOrderCosting.update({
      where: { id },
      data: {
        totalCost: dto.totalCost,
        totalRevenue: dto.totalRevenue,
      },
    });
  }

  /**
   * Close a job order costing.
   */
  async closeJobOrderCosting(firstArg: string, secondArg?: string) {
    const id = secondArg || firstArg;
    const job = await this.prisma.jobOrderCosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job order costing ${id} not found`);
    if (job.closedAt) throw new BadRequestException('Already closed');
    return this.prisma.jobOrderCosting.update({
      where: { id },
      data: { closedAt: new Date() },
    });
  }

  /**
   * Reopen a closed job order costing.
   */
  async reopenJobOrderCosting(firstArg: string, secondArg?: string) {
    const id = secondArg || firstArg;
    const job = await this.prisma.jobOrderCosting.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job order costing ${id} not found`);
    if (!job.closedAt) throw new BadRequestException('Not closed');
    return this.prisma.jobOrderCosting.update({
      where: { id },
      data: { closedAt: null },
    });
  }

  /**
   * Get profitability summary for a single job order costing.
   */
  async getJobOrderCostingProfitability(id: string) {
    const job = await this.getJobOrderCosting(id);
    const cost = Number(job.totalCost);
    const revenue = Number(job.totalRevenue);
    const profit = revenue - cost;
    const margin =
      revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;
    return {
      jobOrderNumber: job.jobOrderNumber,
      description: job.description,
      totalCost: cost,
      totalRevenue: revenue,
      profit,
      marginPercent: margin,
      closed: Boolean(job.closedAt),
      recordedAt: job.recordedAt,
      closedAt: job.closedAt,
    };
  }
}
