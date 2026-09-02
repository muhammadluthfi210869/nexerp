import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class MarketingTasksService {
  constructor(private prisma: PrismaService) {}

  async list(filter: { status?: string; assigneeId?: string; ownerId?: string } = {}) {
    return this.prisma.marketingTask.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.assigneeId ? { assigneeId: filter.assigneeId } : {}),
        ...(filter.ownerId ? { ownerId: filter.ownerId } : {}),
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(data: {
    ownerId: string;
    assigneeId?: string | null;
    title: string;
    description?: string | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
  }) {
    return this.prisma.marketingTask.create({
      data: {
        ownerId: data.ownerId,
        assigneeId: data.assigneeId ?? null,
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? 'OPEN',
        priority: data.priority ?? 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }

  async update(id: string, data: Partial<{
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigneeId: string | null;
    dueDate: string | null;
  }>) {
    const existing = await this.prisma.marketingTask.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');
    return this.prisma.marketingTask.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.marketingTask.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');
    await this.prisma.marketingTask.delete({ where: { id } });
    return { ok: true };
  }
}
