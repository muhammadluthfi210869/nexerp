import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class QCChecklistsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    const where = status ? { status } : {};
    const checklists = await this.prisma.qCChecklist.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { id: true, fullName: true } } },
    });
    return checklists.map((c) => {
      const items = (c.items as any[]) || [];
      const completed = (c.completedItems as string[]) || [];
      return {
        ...c,
        progress:
          items.length > 0
            ? Math.round((completed.length / items.length) * 100)
            : 0,
      };
    });
  }

  async findCompleted() {
    return this.findAll('COMPLETED');
  }

  async findOne(id: string) {
    const checklist = await this.prisma.qCChecklist.findUnique({
      where: { id },
      include: { creator: { select: { id: true, fullName: true } } },
    });
    if (!checklist) throw new NotFoundException('Checklist not found');
    const items = (checklist.items as any[]) || [];
    const completed = (checklist.completedItems as string[]) || [];
    return {
      ...checklist,
      progress:
        items.length > 0
          ? Math.round((completed.length / items.length) * 100)
          : 0,
    };
  }

  async create(
    userId: string,
    dto: {
      title: string;
      workOrderId?: string;
      items: { label: string; isRequired?: boolean }[];
    },
  ) {
    const items = dto.items.map((item, idx) => ({
      id: `ITEM-${idx + 1}`,
      label: item.label,
      isRequired: item.isRequired ?? false,
      checked: false,
    }));

    return this.prisma.qCChecklist.create({
      data: {
        title: dto.title,
        workOrderId: dto.workOrderId,
        createdById: userId,
        status: 'PENDING',
        items,
        completedItems: [],
      },
    });
  }

  async update(
    id: string,
    dto: {
      status?: string;
      completedItems?: string[];
      notes?: string;
    },
  ) {
    const existing = await this.prisma.qCChecklist.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Checklist not found');

    const data: any = { ...dto };

    // Auto-complete if all required items are checked
    if (dto.completedItems) {
      const items = (existing.items as any[]) || [];
      const requiredItems = items.filter((i: any) => i.isRequired);
      const allRequiredChecked = requiredItems.every((i: any) =>
        dto.completedItems!.includes(i.id),
      );
      if (allRequiredChecked && requiredItems.length > 0) {
        data.status = 'COMPLETED';
      }
    }

    return this.prisma.qCChecklist.update({
      where: { id },
      data,
    });
  }
}
