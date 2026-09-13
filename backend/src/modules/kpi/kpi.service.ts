// KPI Service — WS-B (Wave 3).
// Per-orang: aggregate ActivityLog by LogActivityType within a period.
// Per-divisi: mean of per-person scores for users in the division.
// See docs/ssot/PHASE_4_PLAN.md §5 (KPI System).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import {
  Division,
  LogActivityType,
  Prisma,
} from '@prisma/client';

export interface Period {
  from?: Date;
  to?: Date;
}

export interface PersonKpiBreakdown {
  [type: string]: number;
}

export interface PersonKpi {
  userId: string;
  period: { from: string | null; to: string | null };
  total: number;
  breakdown: PersonKpiBreakdown;
  completionRate: number; // DONE / CREATE ratio, 0..1 (null-safe)
  pageViews: number;
  mutations: number; // CREATE+UPDATE+DELETE
}

export interface DivisionMetricTile {
  metricKey: string;
  label: string;
  value: number;
  source: string; // for transparency ("person:<userId>" or "dashboard:<configId>")
}

export interface DivisionKpi {
  division: Division;
  period: { from: string | null; to: string | null };
  aggregateFunction: 'MEAN' | 'MEDIAN' | 'SUM';
  metricCount: number;
  aggregateScore: number;
  metrics: DivisionMetricTile[];
  topPerformers: TopPerformer[];
  formulaNote: string; // human-readable
}

export interface TopPerformer {
  userId: string;
  fullName: string | null;
  score: number;
  total: number;
  completionRate: number;
}

const AGGREGATE_FUNCTION: 'MEAN' = 'MEAN';

@Injectable()
export class KpiService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  // Period helpers — exported as methods on the service so controller can
  // delegate and clients don't have to import from us. KISS.
  periodLast7Days(): Period {
    const to = new Date();
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from, to };
  }

  periodThisMonth(): Period {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from, to };
  }

  // computePerson — count ActivityLog rows per LogActivityType for one user.
  async computePerson(
    userId: string,
    period: Period = {},
  ): Promise<PersonKpi> {
    const where: Prisma.ActivityLogWhereInput = {
      userId,
      ...(period.from || period.to
        ? {
            createdAt: {
              ...(period.from && { gte: period.from }),
              ...(period.to && { lte: period.to }),
            },
          }
        : {}),
    };

    const grouped = await this.prisma.activityLog.groupBy({
      by: ['type'],
      where,
      _count: { _all: true },
    });

    const breakdown: PersonKpiBreakdown = {};
    let total = 0;
    let pageViews = 0;
    let mutations = 0;
    let creates = 0;
    for (const row of grouped) {
      const count = row._count._all;
      breakdown[row.type] = count;
      total += count;
      if (row.type === LogActivityType.PAGE_VIEW) pageViews += count;
      if (
        row.type === LogActivityType.CREATE ||
        row.type === LogActivityType.UPDATE ||
        row.type === LogActivityType.DELETE
      ) {
        mutations += count;
        if (row.type === LogActivityType.CREATE) creates += count;
      }
    }

    // Completion rate = DONE / CREATE. No DONE type in enum yet, so use
    // STATE_TRANSITION as proxy (covers "completed" workflow transitions).
    const stateDone = breakdown[LogActivityType.STATE_TRANSITION] ?? 0;
    const completionRate = creates === 0 ? 0 : stateDone / creates;

    return {
      userId,
      period: {
        from: period.from ? period.from.toISOString() : null,
        to: period.to ? period.to.toISOString() : null,
      },
      total,
      breakdown,
      completionRate,
      pageViews,
      mutations,
    };
  }

  // computeDivision — for MVP, no division table mapping exists yet, so
  // we aggregate per-person scores across users that match the requested
  // division via User.roles (role names contain division slug) OR via
  // ActivityLog.division (set by interceptor) — whichever is available.
  // ponytail: heuristic user→division match — when a real User.divisionId
  // column exists, swap this for a join.
  async computeDivision(
    division: Division,
    period: Period = {},
  ): Promise<DivisionKpi> {
    // Get users whose activity in the period was tagged with this division,
    // OR whose fullName includes the division label (fallback heuristic).
    // Simplest reliable approach: query distinct userIds from ActivityLog
    // where division = X within period.
    const userRows = await this.prisma.activityLog.findMany({
      where: {
        division,
        ...(period.from || period.to
          ? {
              createdAt: {
                ...(period.from && { gte: period.from }),
                ...(period.to && { lte: period.to }),
              },
            }
          : {}),
        userId: { not: null },
      },
      distinct: ['userId'],
      select: { userId: true },
    });

    const userIds = userRows
      .map((r) => r.userId)
      .filter((id): id is string => id !== null);

    if (userIds.length === 0) {
      return {
        division,
        period: {
          from: period.from ? period.from.toISOString() : null,
          to: period.to ? period.to.toISOString() : null,
        },
        aggregateFunction: AGGREGATE_FUNCTION,
        metricCount: 0,
        aggregateScore: 0,
        metrics: [],
        topPerformers: [],
        formulaNote:
          `MEAN of per-person scores (0 active users in ${division} within period). ` +
          `No dashboard metric config exists yet — see docs/ssot/PHASE_4_PLAN.md §5.`,
      };
    }

    // Compute per-person scores in parallel
    const personScores = await Promise.all(
      userIds.map(async (uid) => {
        const person = await this.computePerson(uid, period);
        return { uid, person };
      }),
    );

    // Per-person score = completionRate (0..1) — simple, stable, comparable.
    // When dashboard config exists, replace this with metric aggregation.
    const scores = personScores.map((p) => p.person.completionRate);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;

    // Build per-user metric tiles (so frontend can display breakdown)
    const metrics: DivisionMetricTile[] = personScores.map((p) => ({
      metricKey: `person:${p.uid}`,
      label: p.uid,
      value: p.person.completionRate,
      source: 'activity-log',
    }));

    // Top performers
    const userIdsToLookup = personScores.map((p) => p.uid);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIdsToLookup } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));

    const topPerformers: TopPerformer[] = personScores
      .map((p) => ({
        userId: p.uid,
        fullName: userMap.get(p.uid) ?? null,
        score: p.person.completionRate,
        total: p.person.total,
        completionRate: p.person.completionRate,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      division,
      period: {
        from: period.from ? period.from.toISOString() : null,
        to: period.to ? period.to.toISOString() : null,
      },
      aggregateFunction: AGGREGATE_FUNCTION,
      metricCount: metrics.length,
      aggregateScore: mean,
      metrics,
      topPerformers,
      formulaNote:
        `MEAN of ${metrics.length} per-person completion rates. ` +
        `No dashboard metric config exists yet — fallback to activity-log aggregation.`,
    };
  }

  // getDashboardMetrics — same as computeDivision but returns raw tiles
  // (without rolling up). Frontend uses this to render per-tile + summary.
  async getDashboardMetrics(
    division: Division,
    period: Period = {},
  ): Promise<{
    division: Division;
    metrics: DivisionMetricTile[];
    formulaNote: string;
  }> {
    const divisionKpi = await this.computeDivision(division, period);
    return {
      division,
      metrics: divisionKpi.metrics,
      formulaNote: divisionKpi.formulaNote,
    };
  }

  // topPerformers — global leaderboard across all users with activity in
  // the period. Uses activity volume to filter (top 200 then rank by score).
  async topPerformers(
    period: Period = {},
    limit = 10,
  ): Promise<TopPerformer[]> {
    const where: Prisma.ActivityLogWhereInput = {
      userId: { not: null },
      ...(period.from || period.to
        ? {
            createdAt: {
              ...(period.from && { gte: period.from }),
              ...(period.to && { lte: period.to }),
            },
          }
        : {}),
    };

    // Find candidate users by activity count (top 200 to bound work)
    const candidates = await this.prisma.activityLog.groupBy({
      by: ['userId'],
      where,
      _count: { _all: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 200,
    });

    const scores = await Promise.all(
      candidates
        .filter((c): c is typeof c & { userId: string } => c.userId !== null)
        .map(async (c) => {
          const person = await this.computePerson(c.userId, period);
          return {
            userId: c.userId,
            fullName: null as string | null,
            score: person.completionRate,
            total: person.total,
            completionRate: person.completionRate,
          };
        }),
    );

    const userIds = scores.map((s) => s.userId);
    const users = userIds.length === 0
      ? []
      : await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true },
        });
    const userMap = new Map(users.map((u) => [u.id, u.fullName]));
    for (const s of scores) {
      s.fullName = userMap.get(s.userId) ?? null;
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Convenience: pull current user from JWT, used by controller.
  async computeSelf(period: Period = {}): Promise<PersonKpi> {
    // Self is resolved by controller via req.user.sub; this is a placeholder.
    throw new Error('computeSelf requires userId — use computePerson(req.user.sub)');
  }
}