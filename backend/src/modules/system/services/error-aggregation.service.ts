import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { Logger } from '../../../common/services/logger.service';

export interface ErrorSummary {
  totalErrors: number;
  criticalErrors: number;
  byRoute: { route: string; count: number }[];
  byLevel: { level: string; count: number }[];
  recentErrors: any[];
}

@Injectable()
export class ErrorAggregationService {
  private readonly logger = new Logger('ErrorAggregation');

  constructor(private prisma: PrismaService) {}

  async ingest(error: {
    level: string;
    message: string;
    stack?: string;
    digest?: string;
    componentName?: string;
    route: string;
    userId?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    const fingerprint = this.generateFingerprint(
      error.message,
      error.route,
      error.componentName,
    );

    const existing = await this.prisma.errorLog.findFirst({
      where: {
        message: { contains: error.message.slice(0, 100) },
        route: error.route,
        resolvedAt: null,
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    if (
      existing &&
      fingerprint ===
        this.generateFingerprint(
          existing.message,
          existing.route,
          existing.componentName,
        )
    ) {
      await this.prisma.errorLog.update({
        where: { id: existing.id },
        data: {
          count: existing.count + 1,
          lastSeenAt: new Date(),
          stack: error.stack,
          digest: error.digest,
          metadata: (error.metadata as any) || undefined,
        },
      });
    } else {
      await this.prisma.errorLog.create({
        data: {
          level: error.level,
          message: error.message,
          stack: error.stack?.slice(0, 5000),
          digest: error.digest,
          componentName: error.componentName,
          route: error.route,
          userId: error.userId,
          userAgent: error.userAgent,
          metadata: (error.metadata as any) || undefined,
        },
      });
    }
  }

  private generateFingerprint(
    message: string,
    route?: string,
    componentName?: string | null,
  ): string {
    const normalized = message
      .replace(/\d+/g, 'N')
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        'UUID',
      )
      .slice(0, 80);
    return `${normalized}|${route || ''}|${componentName || ''}`;
  }

  async getSummary(hours = 24): Promise<ErrorSummary> {
    const since = new Date(Date.now() - hours * 3600000);

    const [allErrors, criticalErrors, byRoute, byLevel, recentErrors] =
      await Promise.all([
        this.prisma.errorLog.count({ where: { lastSeenAt: { gte: since } } }),
        this.prisma.errorLog.count({
          where: { level: 'fatal', lastSeenAt: { gte: since } },
        }),
        this.prisma.errorLog.groupBy({
          by: ['route'],
          where: { lastSeenAt: { gte: since } },
          _count: true,
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        this.prisma.errorLog.groupBy({
          by: ['level'],
          where: { lastSeenAt: { gte: since } },
          _count: true,
        }),
        this.prisma.errorLog.findMany({
          where: { lastSeenAt: { gte: since } },
          orderBy: { lastSeenAt: 'desc' },
          take: 50,
          select: {
            id: true,
            level: true,
            message: true,
            componentName: true,
            route: true,
            count: true,
            firstSeenAt: true,
            lastSeenAt: true,
            digest: true,
          },
        }),
      ]);

    return {
      totalErrors: allErrors,
      criticalErrors,
      byRoute: byRoute.map((r: { route: string; _count: number }) => ({
        route: r.route,
        count: r._count,
      })),
      byLevel: byLevel.map((l: { level: string; _count: number }) => ({
        level: l.level,
        count: l._count,
      })),
      recentErrors,
    };
  }

  async resolveError(id: string, userId?: string) {
    return this.prisma.errorLog.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedById: userId,
      },
    });
  }

  async getTimeline(hours = 24) {
    const since = new Date(Date.now() - hours * 3600000);
    const errors = await this.prisma.errorLog.findMany({
      where: { firstSeenAt: { gte: since } },
      select: { firstSeenAt: true, level: true },
      orderBy: { firstSeenAt: 'asc' },
    });

    const intervals = 24;
    const bucketMs = (hours * 3600000) / intervals;

    const buckets = Array.from({ length: intervals }, (_, i) => ({
      hour: new Date(since.getTime() + i * bucketMs).toISOString(),
      error: 0,
      warning: 0,
      fatal: 0,
    }));

    for (const err of errors) {
      const idx = Math.floor(
        (new Date(err.firstSeenAt).getTime() - since.getTime()) / bucketMs,
      );
      if (idx >= 0 && idx < intervals) {
        if (err.level === 'fatal') buckets[idx].fatal++;
        else if (err.level === 'error') buckets[idx].error++;
        else buckets[idx].warning++;
      }
    }

    return buckets;
  }
}
