// Wave 4 / D3 — DecisionSupportService.
//
// Aggregates pending decisions for a user (overdue approvals, blocked
// escalations, KPI drops affecting their division) and emits lightweight
// heuristic recommendations based on currently-fired alerts + KPI trends.
//
// "Decision" itself is not a new entity — we persist to ActivityLog
// (entityType="Decision"). This is the audit trail + history.
//
// ponytail: rules-based recommendations — NOT ML. Upgrade path to a
// contextual bandit or LLM is documented in D3 docs.

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { AlertEngineService } from './alert-engine.service';
import { KpiService } from '../kpi/kpi.service';
import { LogActivityType, Division, UserRole } from '@prisma/client';
import type { TriggeredAlert } from './alert-rules.types';

export type DecisionAction = 'APPROVE' | 'REJECT' | 'DEFER';

export interface PendingItem {
  id: string;
  type: 'APPROVAL' | 'ALERT' | 'KPI_DROP';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  contextRefs: { entityType: string; entityId: string; label?: string }[];
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  impact: string;
  basedOn: string[];
}

export interface DecisionRecord {
  id: string;
  decisionId: string;
  action: DecisionAction;
  rationale: string;
  decidedById: string;
  decidedAt: string;
}

const HIGH_VALUE_IDR = 100_000_000;

@Injectable()
export class DecisionSupportService {
  private readonly logger = new Logger(DecisionSupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
    private readonly alertEngine: AlertEngineService,
    private readonly kpiService: KpiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ----- pending items -----

  async getPendingForUser(userId: string): Promise<PendingItem[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roles: true, fullName: true },
    });
    if (!user) return [];

    const roles = user.roles as UserRole[];
    const isDirectorish = roles.some((r) =>
      ([UserRole.DIRECTOR, UserRole.SUPER_ADMIN, UserRole.HEAD_OPS] as UserRole[]).includes(r),
    );

    const items: PendingItem[] = [];

    // 1. PO in PENDING_APPROVAL older than 3 days
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const staleApprovals = await this.prisma.purchaseOrder.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        createdAt: { lt: cutoff },
        deletedAt: null,
      },
      select: { id: true, poNumber: true, createdAt: true },
      take: 25,
    });
    for (const po of staleApprovals) {
      items.push({
        id: `approval:${po.id}`,
        type: 'APPROVAL',
        severity: 'HIGH',
        title: `PO ${po.poNumber} menunggu approval`,
        description: `Diajukan ${po.createdAt.toISOString().slice(0, 10)} (>3 hari)`,
        contextRefs: [{ entityType: 'PurchaseOrder', entityId: po.id, label: po.poNumber }],
        createdAt: po.createdAt.toISOString(),
      });
    }

    // 2. High-value unpaid invoices (director / finance only)
    if (isDirectorish || roles.includes(UserRole.FINANCE)) {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          amountDue: { gt: HIGH_VALUE_IDR },
          status: { in: ['UNPAID', 'PARTIAL'] },
          deletedAt: null,
        },
        select: { id: true, invoiceNumber: true, amountDue: true, createdAt: true },
        take: 25,
      });
      for (const inv of invoices) {
        items.push({
          id: `approval:${inv.id}`,
          type: 'APPROVAL',
          severity: 'CRITICAL',
          title: `Invoice ${inv.invoiceNumber} > Rp${(Number(inv.amountDue) / 1_000_000).toFixed(0)}jt`,
          description: 'High-value invoice belum lunas',
          contextRefs: [{ entityType: 'Invoice', entityId: inv.id, label: inv.invoiceNumber }],
          createdAt: inv.createdAt.toISOString(),
        });
      }
    }

    // 3. Active alerts (filtered by user's roles)
    const alerts = await this.alertEngine.evaluateAll();
    const userRoles = new Set<string>(roles);
    for (const a of alerts) {
      const matched = a.recipients.some(
        (r) => r.role && userRoles.has(r.role),
      );
      if (!matched && !isDirectorish) continue;
      items.push({
        id: `alert:${a.ruleId}`,
        type: 'ALERT',
        severity: a.severity,
        title: a.ruleName,
        description: a.message,
        contextRefs: a.contextRefs,
        createdAt: a.firedAt,
      });
    }

    // Sort HIGH/CRITICAL first
    const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return items.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  }

  // ----- queue (director view) -----

  async getQueue(opts: { limit?: number; offset?: number } = {}): Promise<PendingItem[]> {
    const { limit = 50, offset = 0 } = opts;
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const items: PendingItem[] = [];

    const staleApprovals = await this.prisma.purchaseOrder.findMany({
      where: { status: 'PENDING_APPROVAL', createdAt: { lt: cutoff }, deletedAt: null },
      select: { id: true, poNumber: true, createdAt: true, totalValue: true },
      orderBy: { createdAt: 'asc' },
      take: Math.min(limit, 200),
      skip: offset,
    });
    for (const po of staleApprovals) {
      items.push({
        id: `queue:approval:${po.id}`,
        type: 'APPROVAL',
        severity: 'HIGH',
        title: `PO ${po.poNumber}`,
        description: `Stale approval >3 hari`,
        contextRefs: [{ entityType: 'PurchaseOrder', entityId: po.id }],
        createdAt: po.createdAt.toISOString(),
      });
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        amountDue: { gt: HIGH_VALUE_IDR },
        status: { in: ['UNPAID', 'PARTIAL'] },
        deletedAt: null,
      },
      select: { id: true, invoiceNumber: true, amountDue: true, createdAt: true },
      orderBy: { amountDue: 'desc' },
      take: Math.min(limit, 200),
    });
    for (const inv of invoices) {
      items.push({
        id: `queue:invoice:${inv.id}`,
        type: 'APPROVAL',
        severity: 'CRITICAL',
        title: `Invoice ${inv.invoiceNumber}`,
        description: `Rp${(Number(inv.amountDue) / 1_000_000).toFixed(0)}jt belum lunas`,
        contextRefs: [{ entityType: 'Invoice', entityId: inv.id }],
        createdAt: inv.createdAt.toISOString(),
      });
    }

    return items;
  }

  // ----- recommendations -----

  async getRecommendations(userId: string): Promise<Recommendation[]> {
    const pending = await this.getPendingForUser(userId);
    const recs: Recommendation[] = [];

    // Rule: HIGH/CRITICAL pending approvals → recommend prioritise review
    const criticals = pending.filter((p) => p.severity === 'CRITICAL' || p.severity === 'HIGH');
    if (criticals.length >= 3) {
      recs.push({
        id: 'rec:prioritise-pending',
        title: 'Prioritaskan review item HIGH/CRITICAL',
        rationale: `${criticals.length} item menunggu approval/escalation dengan severity tinggi.`,
        impact: 'Mengurangi backlog approval >3 hari yang menurunkan SLA.',
        basedOn: criticals.slice(0, 3).map((c) => c.title),
      });
    }

    // Rule: low-stock alert + overdue-po → recommend PO placement
    const alerts = await this.alertEngine.evaluateAll();
    const lowStock = alerts.find((a: TriggeredAlert) => a.ruleId === 'low-stock');
    const overdue = alerts.find((a: TriggeredAlert) => a.ruleId === 'overdue-po');
    if (lowStock && overdue) {
      recs.push({
        id: 'rec:batch-po',
        title: 'Batch PO untuk stok minimum + vendor terlambat',
        rationale: `${lowStock.contextRefs.length} material di bawah minStock dan ${overdue.contextRefs.length} PO terlambat.`,
        impact: 'Mempercepat siklus restock dan menurunkan risiko stockout produksi.',
        basedOn: [lowStock.ruleName, overdue.ruleName],
      });
    }

    // Rule: KPI division drop (only meaningful when computeDivision returned data)
    const divisions: Division[] = [
      Division.FINANCE,
      Division.PRODUCTION,
      Division.SCM,
      Division.RND,
    ];
    for (const div of divisions) {
      try {
        const k = await this.kpiService.computeDivision(div, this.kpiService.periodLast7Days());
        if (k.aggregateScore < 0.2 && k.metricCount > 0) {
          recs.push({
            id: `rec:kpi-${div}`,
            title: `Tinjau performa divisi ${div}`,
            rationale: `Aggregate score ${(k.aggregateScore * 100).toFixed(1)}% dari ${k.metricCount} anggota.`,
            impact: 'Memungkinkan intervensi dini sebelum quarter close.',
            basedOn: [`KPI ${div}`, 'ActivityLog aggregation'],
          });
        }
      } catch (err) {
        this.logger.debug(`KPI ${div} recompute skipped: ${(err as Error).message}`);
      }
    }

    return recs;
  }

  // ----- record decision (audit trail via ActivityLog) -----

  async recordDecision(
    decisionId: string,
    action: DecisionAction,
    rationale: string,
    actorId: string,
  ): Promise<DecisionRecord> {
    await this.activityLog.log({
      userId: actorId,
      type: LogActivityType.STATE_TRANSITION,
      entityType: 'Decision',
      entityId: decisionId,
      metadata: { action, rationale, recordedAt: new Date().toISOString() },
    });

    this.eventEmitter.emit('decision.recorded', {
      decisionId,
      action,
      rationale,
      actorId,
      recordedAt: new Date().toISOString(),
    });

    return {
      id: `${decisionId}:${action}:${Date.now()}`,
      decisionId,
      action,
      rationale,
      decidedById: actorId,
      decidedAt: new Date().toISOString(),
    };
  }

  // ----- history -----

  async getHistory(
    actorId: string,
    opts: { limit?: number; offset?: number } = {},
  ) {
    const { limit = 50, offset = 0 } = opts;
    return this.prisma.activityLog.findMany({
      where: { userId: actorId, entityType: 'Decision' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      skip: offset,
    });
  }
}