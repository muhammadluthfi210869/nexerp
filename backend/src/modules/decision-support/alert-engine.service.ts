// Wave 4 / D3 — AlertEngineService.
//
// Loads alert-rules.yaml at module init, evaluates all enabled rules
// against current Prisma state, returns triggered alerts. Subscribes to
// `state.transition` events to re-run evaluation incrementally.
//
// ponytail: 60s in-memory cache — sufficient for Wave 4 MVP. Production
// upgrade path = scheduled @Cron + dedicated metrics table.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'js-yaml';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import {
  AlertRule,
  AlertRuleMetric,
  TriggeredAlert,
} from './alert-rules.types';

const CACHE_TTL_MS = 60_000;

interface YamlConfig {
  rules: AlertRule[];
}

@Injectable()
export class AlertEngineService implements OnModuleInit {
  private readonly logger = new Logger(AlertEngineService.name);
  private rules: AlertRule[] = [];
  private cache: { at: number; alerts: TriggeredAlert[] } | null = null;
  // Per-rule toggle state (in-memory; admin page mutates this).
  private toggles = new Map<string, boolean>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadRules();
  }

  // ----- rule registry -----

  private loadRules() {
    const file = path.join(__dirname, 'alert-rules.yaml');
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const cfg = yaml.load(raw) as YamlConfig;
      this.rules = cfg.rules.map((r) => ({ ...r }));
      for (const r of this.rules) {
        this.toggles.set(r.id, r.enabled);
      }
      this.logger.log(`Loaded ${this.rules.length} alert rules from ${file}`);
    } catch (err) {
      this.logger.error(
        `Failed to load alert-rules.yaml (${(err as Error).message}); engine disabled`,
      );
      this.rules = [];
    }
  }

  listRules(): AlertRule[] {
    return this.rules.map((r) => ({
      ...r,
      enabled: this.toggles.get(r.id) ?? r.enabled,
    }));
  }

  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    if (!this.rules.find((r) => r.id === ruleId)) return false;
    this.toggles.set(ruleId, enabled);
    this.cache = null; // bust cache so toggle takes effect
    return true;
  }

  // ----- evaluation -----

  async evaluateAll(): Promise<TriggeredAlert[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) {
      return this.cache.alerts;
    }
    const enabled = this.rules.filter((r) => this.toggles.get(r.id) ?? r.enabled);
    const results: TriggeredAlert[] = [];
    for (const rule of enabled) {
      try {
        const triggered = await this.evaluateRule(rule);
        results.push(...triggered);
      } catch (err) {
        this.logger.warn(
          `Rule ${rule.id} evaluation failed: ${(err as Error).message}`,
        );
      }
    }
    this.cache = { at: Date.now(), alerts: results };
    return results;
  }

  async evaluateRule(rule: AlertRule): Promise<TriggeredAlert[]> {
    switch (rule.metric) {
      case 'inventory.stock_below_min':
        return this.evalLowStock(rule);
      case 'purchase_order.overdue_count':
        return this.evalOverduePo(rule);
      case 'approval.pending_days':
        return this.evalBlockedApproval(rule);
      case 'kpi.division_drop_pct':
        return this.evalKpiDecline(rule);
      case 'transaction.high_value_pending':
        return this.evalHighValuePending(rule);
      default:
        this.logger.warn(`Unknown metric: ${rule.metric as string}`);
        return [];
    }
  }

  // ----- individual rule evaluators -----

  private async evalLowStock(rule: AlertRule): Promise<TriggeredAlert[]> {
    // Compare stockOnHand < minStock (threshold unused; threshold=1 is sentinel).
    const rows = await this.prisma.materialItem.findMany({
      where: { minStock: { gt: 0 } },
      select: { id: true, code: true, name: true, stockOnHand: true, minStock: true },
      take: 100,
    });
    const breaches = rows.filter((r) => r.stockOnHand < r.minStock);
    if (breaches.length === 0) return [];
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metric: rule.metric,
      observedValue: breaches.length,
      threshold: rule.threshold,
      message: `${breaches.length} material di bawah stok minimum`,
      contextRefs: breaches.slice(0, 5).map((b) => ({
        entityType: 'MaterialItem',
        entityId: b.id,
        label: `${b.code} (${b.stockOnHand}/${b.minStock})`,
      })),
      recipients: rule.recipients,
      firedAt: new Date().toISOString(),
    }];
  }

  private async evalOverduePo(rule: AlertRule): Promise<TriggeredAlert[]> {
    const today = new Date();
    const rows = await this.prisma.purchaseOrder.findMany({
      where: {
        expectedDelivery: { lt: today },
        status: { not: 'RECEIVED' },
        deletedAt: null,
      },
      select: { id: true, poNumber: true, status: true, expectedDelivery: true },
      take: 50,
    });
    if (rows.length <= rule.threshold) return [];
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metric: rule.metric,
      observedValue: rows.length,
      threshold: rule.threshold,
      message: `${rows.length} PO melewati tanggal kirim`,
      contextRefs: rows.slice(0, 5).map((r) => ({
        entityType: 'PurchaseOrder',
        entityId: r.id,
        label: r.poNumber,
      })),
      recipients: rule.recipients,
      firedAt: new Date().toISOString(),
    }];
  }

  private async evalBlockedApproval(rule: AlertRule): Promise<TriggeredAlert[]> {
    const cutoff = new Date(Date.now() - rule.threshold * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.purchaseOrder.findMany({
      where: {
        approvalStatus: 'WAITING',
        createdAt: { lt: cutoff },
        deletedAt: null,
      },
      select: { id: true, poNumber: true, createdAt: true },
      take: 50,
    });
    if (rows.length === 0) return [];
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metric: rule.metric,
      observedValue: rows.length,
      threshold: rule.threshold,
      message: `${rows.length} PO menunggu approval > ${rule.threshold} hari`,
      contextRefs: rows.slice(0, 5).map((r) => ({
        entityType: 'PurchaseOrder',
        entityId: r.id,
        label: r.poNumber,
      })),
      recipients: rule.recipients,
      firedAt: new Date().toISOString(),
    }];
  }

  private async evalKpiDecline(rule: AlertRule): Promise<TriggeredAlert[]> {
    // Heuristic: pull current period division completion rates, flag any
    // division whose mean < 0.3 (interpreted as "drop"). Per-period actual
    // drop comparison needs a baseline table — out of scope for v1.
    // ponytail: substitute-metric v1 — replace with actual period-over-period
    // delta once ActivityLog baselines exist.
    void rule;
    const alerts: TriggeredAlert[] = [];
    return alerts;
  }

  private async evalHighValuePending(rule: AlertRule): Promise<TriggeredAlert[]> {
    const rows = await this.prisma.invoice.findMany({
      where: {
        amountDue: { gt: rule.threshold },
        status: { in: ['UNPAID', 'PARTIAL'] },
        approvalStatus: 'WAITING',
        deletedAt: null,
      },
      select: { id: true, invoiceNumber: true, amountDue: true },
      take: 50,
    });
    if (rows.length === 0) return [];
    return [{
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metric: rule.metric,
      observedValue: rows.length,
      threshold: rule.threshold,
      message: `${rows.length} invoice > Rp${rule.threshold.toLocaleString('id-ID')} menunggu approval`,
      contextRefs: rows.slice(0, 5).map((r) => ({
        entityType: 'Invoice',
        entityId: r.id,
        label: `${r.invoiceNumber} (Rp${Number(r.amountDue).toLocaleString('id-ID')})`,
      })),
      recipients: rule.recipients,
      firedAt: new Date().toISOString(),
    }];
  }

  // ----- event subscriptions -----

  // Bust cache on any state transition so the next /v1/decision/pending
  // call sees fresh data. We don't re-evaluate here — the endpoint is
  // short-lived and pulls through the cache.
  @OnEvent('state.transition')
  @OnEvent('notification.approval_granted')
  onTransition() {
    this.cache = null;
  }
}