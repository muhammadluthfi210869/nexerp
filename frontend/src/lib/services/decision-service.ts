// Wave 4 / D3 — Decision Support service (frontend).
//
// Mirrors lib/services/communication-service.ts pattern: mock impl for
// dev (NEXT_PUBLIC_DECISION_API_MODE!=real), http impl when =real.
//
// ponytail: minimal surface — 6 methods only. Add features (per-user
// ranking, ML rationale) when a real call needs them.

import type {
  AlertRule,
  DecisionAction,
  DecisionHistoryEntry,
  PendingItem,
  Recommendation,
} from "@/types/decision";

export interface IDecisionService {
  listPending(): Promise<PendingItem[]>;
  listQueue(opts?: { limit?: number; offset?: number }): Promise<PendingItem[]>;
  listRecommendations(): Promise<Recommendation[]>;
  resolve(input: {
    decisionId: string;
    action: DecisionAction;
    rationale: string;
  }): Promise<{ ok: true; id: string }>;
  listHistory(opts?: { limit?: number; offset?: number }): Promise<DecisionHistoryEntry[]>;
  listRules(): Promise<AlertRule[]>;
  toggleRule(ruleId: string, enabled: boolean): Promise<{ ok: boolean; id: string }>;
}

// ─── Mock data ──────────────────────────────────────────────────────────────

const MOCK_DELAY_MS = 150;
function delay<T>(value: T): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), MOCK_DELAY_MS));
}

const seedPending: PendingItem[] = [
  {
    id: "approval:po-uuid-1",
    type: "APPROVAL",
    severity: "HIGH",
    title: "PO PO-2026-0912 menunggu approval",
    description: "Diajukan 2026-09-09 (>3 hari)",
    contextRefs: [{ entityType: "PurchaseOrder", entityId: "po-uuid-1", label: "PO-2026-0912" }],
    createdAt: "2026-09-09T08:00:00Z",
  },
  {
    id: "approval:inv-uuid-2",
    type: "APPROVAL",
    severity: "CRITICAL",
    title: "Invoice INV-2026-0888 > Rp250jt",
    description: "High-value invoice belum lunas",
    contextRefs: [{ entityType: "Invoice", entityId: "inv-uuid-2", label: "INV-2026-0888" }],
    createdAt: "2026-09-08T10:00:00Z",
  },
  {
    id: "alert:low-stock",
    type: "ALERT",
    severity: "MEDIUM",
    title: "Stok Barang di Bawah Minimum",
    description: "3 material di bawah reorder point",
    contextRefs: [],
    createdAt: "2026-09-13T09:00:00Z",
  },
];

const seedRecommendations: Recommendation[] = [
  {
    id: "rec:prioritise-pending",
    title: "Prioritaskan review item HIGH/CRITICAL",
    rationale: "2 item menunggu approval/escalation dengan severity tinggi.",
    impact: "Mengurangi backlog approval >3 hari yang menurunkan SLA.",
    basedOn: ["PO PO-2026-0912", "Invoice INV-2026-0888"],
  },
];

const seedRules: AlertRule[] = [
  {
    id: "low-stock",
    name: "Stok Barang di Bawah Minimum",
    description: "MaterialItem.stockQty jatuh di bawah reorderPoint.",
    metric: "inventory.stock_below_min",
    comparator: "lt",
    threshold: 1,
    severity: "MEDIUM",
    enabled: true,
    recipients: [{ role: "PURCHASING" }, { role: "WAREHOUSE" }],
    triggerEvent: "scheduled",
  },
  {
    id: "blocked-approval",
    name: "Approval Terbuka > 3 Hari",
    description: "PurchaseOrder PENDING_APPROVAL lebih dari 3 hari.",
    metric: "approval.pending_days",
    comparator: "gt",
    threshold: 3,
    severity: "HIGH",
    enabled: true,
    recipients: [{ role: "DIRECTOR" }, { role: "FINANCE" }],
    triggerEvent: "scheduled",
  },
  {
    id: "high-value-pending",
    name: "Transaksi > 100 Juta Belum Lunas",
    description: "Invoice.amountDue > 100jt dan status bukan PAID.",
    metric: "transaction.high_value_pending",
    comparator: "gt",
    threshold: 100000000,
    severity: "CRITICAL",
    enabled: true,
    recipients: [{ role: "DIRECTOR" }, { role: "FINANCE" }],
    triggerEvent: "scheduled",
  },
];

const seedHistory: DecisionHistoryEntry[] = [
  {
    id: "hist-1",
    userId: "u-mock",
    type: "STATE_TRANSITION",
    method: null,
    entityType: "Decision",
    entityId: "po-uuid-old",
    metadata: {
      action: "APPROVE",
      rationale: "PO valid, vendor trusted.",
      recordedAt: "2026-09-10T08:00:00Z",
    },
    createdAt: "2026-09-10T08:00:00Z",
  },
];

class MockDecisionService implements IDecisionService {
  async listPending() {
    return delay(seedPending);
  }
  async listQueue() {
    return delay(seedPending.filter((p) => p.severity === "HIGH" || p.severity === "CRITICAL"));
  }
  async listRecommendations() {
    return delay(seedRecommendations);
  }
  async resolve(input: { decisionId: string; action: DecisionAction; rationale: string }) {
    void input;
    return delay({ ok: true as const, id: `${input.decisionId}:${Date.now()}` });
  }
  async listHistory() {
    return delay(seedHistory);
  }
  async listRules() {
    return delay(seedRules);
  }
  async toggleRule(ruleId: string, enabled: boolean) {
    const r = seedRules.find((x) => x.id === ruleId);
    if (r) r.enabled = enabled;
    return delay({ ok: !!r, id: ruleId });
  }
}

// ─── HTTP impl ──────────────────────────────────────────────────────────────

class HttpDecisionService implements IDecisionService {
  private baseUrl: string;
  constructor(baseUrl: string = "/api/v1/decision") {
    this.baseUrl = baseUrl;
  }

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  listPending() {
    return this.req<PendingItem[]>("/pending");
  }
  listQueue(opts: { limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams();
    if (opts.limit !== undefined) params.set("limit", String(opts.limit));
    if (opts.offset !== undefined) params.set("offset", String(opts.offset));
    const q = params.toString();
    return this.req<PendingItem[]>(`/queue${q ? `?${q}` : ""}`);
  }
  listRecommendations() {
    return this.req<Recommendation[]>("/recommendations");
  }
  async resolve(input: { decisionId: string; action: DecisionAction; rationale: string }) {
    return this.req<{ ok: true; id: string }>(`/${encodeURIComponent(input.decisionId)}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action: input.action, rationale: input.rationale }),
    });
  }
  listHistory(opts: { limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams();
    if (opts.limit !== undefined) params.set("limit", String(opts.limit));
    if (opts.offset !== undefined) params.set("offset", String(opts.offset));
    const q = params.toString();
    return this.req<DecisionHistoryEntry[]>(`/history${q ? `?${q}` : ""}`);
  }
  listRules() {
    return this.req<AlertRule[]>("/rules");
  }
  toggleRule(ruleId: string, enabled: boolean) {
    return this.req<{ ok: boolean; id: string }>(`/rules/${encodeURIComponent(ruleId)}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
  }
}

// ─── Singleton + mode switch ─────────────────────────────────────────────────

const MODE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DECISION_API_MODE) || "mock";

export const decisionService: IDecisionService =
  MODE === "real" ? new HttpDecisionService() : new MockDecisionService();

export const isDecisionMockMode = MODE !== "real";