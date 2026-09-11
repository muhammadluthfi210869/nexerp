import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { LogActivityType, Prisma } from '@prisma/client';

export interface LogInput {
  userId?: string | null;
  division?: Prisma.ActivityLogCreateInput['division'];
  type: LogActivityType;
  method?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  path?: string | null;
  status?: number | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(input: LogInput): Promise<void> {
    // ponytail: sync INSERT is acceptable for WS-D v1 — async queue can
    // be added when write volume measurably degrades request latency.
    await this.prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        division: input.division ?? null,
        type: input.type,
        method: input.method ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        path: input.path ?? null,
        status: input.status ?? null,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async findForUser(
    userId: string,
    opts: {
      from?: Date;
      to?: Date;
      type?: LogActivityType;
      entityType?: string;
      entityId?: string;
      limit?: number;
    },
  ) {
    const { from, to, type, entityType, entityId, limit = 50 } = opts;
    return this.prisma.activityLog.findMany({
      where: {
        userId,
        ...(from || to
          ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }
          : {}),
        ...(type && { type }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Retention: purge rows older than `retentionDays` (default 90).
  // Scheduled via @nestjs/schedule; called from retention task.
  async purgeOlderThan(retentionDays = 90): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await this.prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }
}