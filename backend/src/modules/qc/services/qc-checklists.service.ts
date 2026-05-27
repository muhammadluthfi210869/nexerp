import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class QCChecklistsService {
  private checklists: Array<{
    id: string;
    title: string;
    workOrderId?: string;
    createdById: string;
    status: string;
    items: { id: string; label: string; isRequired: boolean; checked: boolean }[];
    completedItems: string[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  private counter = 0;

  constructor(private prisma: PrismaService) {}

  private generateId(): string {
    this.counter++;
    return `QCL-${Date.now()}-${this.counter}`;
  }

  async findAll(status?: string) {
    let results = this.checklists;
    if (status) {
      results = results.filter((c) => c.status === status);
    }
    return results.map((c) => ({
      ...c,
      progress:
        c.items.length > 0
          ? Math.round((c.completedItems.length / c.items.length) * 100)
          : 0,
    }));
  }

  async findCompleted() {
    return this.checklists
      .filter((c) => c.status === 'COMPLETED')
      .map((c) => ({
        ...c,
        progress: 100,
      }));
  }

  async findOne(id: string) {
    const checklist = this.checklists.find((c) => c.id === id);
    if (!checklist) throw new NotFoundException('Checklist not found');
    return {
      ...checklist,
      progress:
        checklist.items.length > 0
          ? Math.round(
              (checklist.completedItems.length / checklist.items.length) * 100,
            )
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
    const checklist = {
      id: this.generateId(),
      title: dto.title,
      workOrderId: dto.workOrderId,
      createdById: userId,
      status: 'PENDING',
      items: dto.items.map((item, idx) => ({
        id: `ITEM-${idx + 1}`,
        label: item.label,
        isRequired: item.isRequired ?? false,
        checked: false,
      })),
      completedItems: [] as string[],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.checklists.push(checklist);
    return checklist;
  }

  async update(
    id: string,
    dto: {
      status?: string;
      completedItems?: string[];
      notes?: string;
    },
  ) {
    const idx = this.checklists.findIndex((c) => c.id === id);
    if (idx === -1) throw new NotFoundException('Checklist not found');

    const checklist = this.checklists[idx];
    if (dto.status) checklist.status = dto.status;
    if (dto.completedItems) checklist.completedItems = dto.completedItems;
    if (dto.notes) checklist.notes = dto.notes;
    checklist.updatedAt = new Date();

    // Auto-complete if all required items are checked
    const requiredItems = checklist.items.filter((i) => i.isRequired);
    const allRequiredChecked = requiredItems.every((i) =>
      checklist.completedItems.includes(i.id),
    );
    if (allRequiredChecked && requiredItems.length > 0) {
      checklist.status = 'COMPLETED';
    }

    return checklist;
  }
}
