import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class ClosingChecklistsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter?: { period?: string; department?: string; completed?: boolean }) {
    const where: any = {};
    if (filter?.period) {
      const periodStart = new Date(filter.period);
      const periodEnd = new Date(filter.period);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      where.period = { gte: periodStart, lt: periodEnd };
    }
    if (filter?.department) where.department = filter.department;
    if (filter?.completed !== undefined) where.completed = filter.completed;

    return this.prisma.closingChecklist.findMany({
      where,
      orderBy: [{ department: 'asc' }, { item: 'asc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.closingChecklist.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Closing checklist item ${id} not found`);
    return item;
  }

  /**
   * Generate standard monthly close checklist for a given period.
   * Creates 1 row per (department, item) combo from a template.
   */
  async generateMonthlyChecklist(_userId: string, dto: { period: string }) {
    const period = new Date(dto.period);
    if (isNaN(period.getTime())) {
      throw new BadRequestException('Invalid period (use YYYY-MM-DD format)');
    }

    // Standard ERP closing checklist template
    const template = [
      { department: 'Finance', item: 'Reconcile all bank accounts', category: 'Reconciliation' },
      { department: 'Finance', item: 'Post all AP payments', category: 'AP' },
      { department: 'Finance', item: 'Post all AR receipts', category: 'AR' },
      { department: 'Finance', item: 'Record PPN payable / receivable', category: 'Tax' },
      { department: 'Finance', item: 'Run depreciation schedule', category: 'FixedAssets' },
      { department: 'Finance', item: 'Post adjusting journals (accruals, deferrals)', category: 'Adjustments' },
      { department: 'Finance', item: 'Review trial balance', category: 'Review' },
      { department: 'Finance', item: 'Generate financial statements', category: 'Reporting' },
      { department: 'Finance', item: 'Lock GL period', category: 'Close' },
      { department: 'Sales', item: 'Confirm all sales invoices posted', category: 'AR' },
      { department: 'Sales', item: 'Confirm all collections received', category: 'AR' },
      { department: 'Procurement', item: 'Confirm all purchase bills posted', category: 'AP' },
      { department: 'Procurement', item: 'Confirm all supplier payments made', category: 'AP' },
      { department: 'Warehouse', item: 'Stock opname for high-value items', category: 'Inventory' },
      { department: 'Warehouse', item: 'Reconcile inventory GL vs warehouse', category: 'Inventory' },
      { department: 'Production', item: 'Close all open production orders', category: 'Production' },
      { department: 'Production', item: 'Record WIP variance', category: 'Production' },
      { department: 'HR', item: 'Post payroll accrual', category: 'HR' },
    ];

    // Idempotent: only create if no existing for this period
    const existing = await this.prisma.closingChecklist.count({
      where: {
        period: {
          gte: new Date(period.getFullYear(), period.getMonth(), 1),
          lt: new Date(period.getFullYear(), period.getMonth() + 1, 1),
        },
      },
    });
    if (existing > 0) {
      throw new BadRequestException(`Closing checklist for ${dto.period} already generated`);
    }

    return this.prisma.$transaction(async (tx) => {
      const periodStart = new Date(period.getFullYear(), period.getMonth(), 1);
      return tx.closingChecklist.createMany({
        data: template.map((t) => ({
          period: periodStart,
          department: t.department,
          item: t.item,
          category: t.category,
        })),
      });
    });
  }

  /**
   * Mark a checklist item as completed.
   */
  async completeItem(userId: string, id: string, dto: { notes?: string }) {
    const item = await this.prisma.closingChecklist.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Closing checklist item ${id} not found`);
    if (item.completed) {
      throw new BadRequestException('Already completed');
    }

    return this.prisma.closingChecklist.update({
      where: { id },
      data: {
        completed: true,
        completedBy: userId,
        completedAt: new Date(),
        notes: dto.notes,
      },
    });
  }

  /**
   * Reopen a completed item (admin correction).
   */
  async reopenItem(_userId: string, id: string) {
    const item = await this.prisma.closingChecklist.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Closing checklist item ${id} not found`);
    if (!item.completed) {
      throw new BadRequestException('Not completed');
    }
    return this.prisma.closingChecklist.update({
      where: { id },
      data: {
        completed: false,
        completedBy: null,
        completedAt: null,
      },
    });
  }

  /**
   * Get progress summary: per department completion %.
   */
  async getProgress(period: string) {
    const periodStart = new Date(period);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const items = await this.prisma.closingChecklist.findMany({
      where: {
        period: { gte: periodStart, lt: periodEnd },
      },
    });

    const byDept = items.reduce<Record<string, { total: number; done: number }>>((acc, it) => {
      acc[it.department] ??= { total: 0, done: 0 };
      acc[it.department].total++;
      if (it.completed) acc[it.department].done++;
      return acc;
    }, {});

    const total = items.length;
    const done = items.filter((i) => i.completed).length;

    return {
      period,
      overall: {
        total,
        done,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
        readyToClose: total > 0 && done === total,
      },
      byDepartment: Object.entries(byDept).map(([dept, stat]) => ({
        department: dept,
        ...stat,
        percent: stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0,
      })),
    };
  }
}
