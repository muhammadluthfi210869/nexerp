// Wave 4 / D3 — Decision Support frontend types.
//
// Mirror of backend contracts. Kept here (not generated) so the
// frontend can mock-mode without backend dependency.

export type DecisionAction = "APPROVE" | "REJECT" | "DEFER";

export type DecisionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PendingItemType = "APPROVAL" | "ALERT" | "KPI_DROP";

export interface DecisionContextRef {
  entityType: string;
  entityId: string;
  label?: string;
}

export interface PendingItem {
  id: string;
  type: PendingItemType;
  severity: DecisionSeverity;
  title: string;
  description: string;
  contextRefs: DecisionContextRef[];
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  impact: string;
  basedOn: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  comparator: "lt" | "lte" | "gt" | "gte" | "eq";
  threshold: number;
  severity: DecisionSeverity;
  enabled: boolean;
  recipients: { role?: string; userId?: string; division?: string }[];
  triggerEvent: string;
}

export interface DecisionHistoryEntry {
  id: string;
  userId: string | null;
  type: string;
  method: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: {
    action?: DecisionAction;
    rationale?: string;
    recordedAt?: string;
  } | null;
  createdAt: string;
}