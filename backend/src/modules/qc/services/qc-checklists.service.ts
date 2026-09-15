import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

// Legacy §3: 9-kategori kronologis per SO Checklist.
// Order matters — Box → Label → Desain → Formula → BPOM → Mixing →
// Filling → Packing → Delivery reflects the production lifecycle.
// ponytail: enum-like. Trade-off: hardcoded list (no DB-level category
// table) means changing the sequence needs a deploy. Acceptable since
// the sequence is a regulatory workflow, not a user-configurable setting.
export const CHECKLIST_CATEGORIES = [
  { id: 'BOX', label: 'Box / Kemasan', order: 1, gate: 'G1' },
  { id: 'LABEL', label: 'Label / Stiker', order: 2, gate: 'G1' },
  { id: 'DESAIN', label: 'Desain / Artwork', order: 3, gate: 'G1' },
  { id: 'FORMULA', label: 'Formula / Komposisi', order: 4, gate: 'G1' },
  { id: 'BPOM', label: 'BPOM / Regulasi', order: 5, gate: 'G2' },
  { id: 'MIXING', label: 'Mixing (Ruahan)', order: 6, gate: 'G2' },
  { id: 'FILLING', label: 'Filling (Primer)', order: 7, gate: 'G2' },
  { id: 'PACKING', label: 'Packing (Sekunder)', order: 8, gate: 'G3' },
  { id: 'DELIVERY', label: 'Delivery / DO', order: 9, gate: 'G3' },
] as const;

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
      salesOrderId?: string;
      items?: { label: string; isRequired?: boolean }[];
    },
  ) {
    // Legacy: 1 SO = 1 Checklist. If salesOrderId given and no custom items,
    // default to the 9-kategori kronologis (Box→Label→...→Delivery).
    const useLegacyCategories =
      dto.salesOrderId && (!dto.items || dto.items.length === 0);
    const items = useLegacyCategories
      ? CHECKLIST_CATEGORIES.map((cat) => ({
          id: cat.id,
          label: cat.label,
          order: cat.order,
          gate: cat.gate,
          isRequired: true,
          checked: false,
        }))
      : (dto.items ?? []).map((item, idx) => ({
          id: `ITEM-${idx + 1}`,
          label: item.label,
          isRequired: item.isRequired ?? false,
          checked: false,
        }));

    return this.prisma.qCChecklist.create({
      data: {
        title: dto.title,
        workOrderId: dto.workOrderId,
        salesOrderId: dto.salesOrderId,
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
