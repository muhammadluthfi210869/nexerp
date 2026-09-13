// Wave 4 / D3 — AlertRules engine types.
//
// Rules-based alerting (NOT ML). Each rule evaluates against current
// system state and emits a severity-classified alert when triggered.
//
// ponytail: heuristic rules engine — upgrade path to scheduled cron +
// per-user feed ranking is documented in D3 docs.

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertComparator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq';

export type AlertRuleMetric =
  | 'purchase_order.overdue_count'
  | 'approval.pending_days'
  | 'inventory.stock_below_min'
  | 'kpi.division_drop_pct'
  | 'transaction.high_value_pending';

export interface AlertRuleRecipient {
  /** Role name (matches UserRole enum) — fans out to all active users with role. */
  role?: string;
  /** Specific user id. */
  userId?: string;
  /** Division slug — fans out to all active users with that division on activity-log. */
  division?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: AlertRuleMetric;
  comparator: AlertComparator;
  /** Numeric threshold; semantics depend on metric (days, count, %, IDR). */
  threshold: number;
  severity: AlertSeverity;
  recipients: AlertRuleRecipient[];
  /** Event that triggers evaluation: cron-keyword 'scheduled' or any state-machine event. */
  triggerEvent: 'scheduled' | string;
  enabled: boolean;
}

export interface TriggeredAlert {
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  metric: AlertRuleMetric;
  observedValue: number;
  threshold: number;
  message: string;
  contextRefs: { entityType: string; entityId: string; label?: string }[];
  recipients: AlertRuleRecipient[];
  firedAt: string;
}