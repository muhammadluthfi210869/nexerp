// Gate status derivation — mirror of GATE_CONTROLLED_TRANSITIONS in
// backend/src/modules/system/state-transition.service.ts (do NOT import from backend).
// 3 gates × 3 statuses = 9 states.

import type { DnaGate, DnaGateStatus } from "@/components/dna/DnaGateIndicator";

type Stage = string;

// From→To pairs controlled by gates, ordered by chronological progress.
const GATE_TRANSITIONS: Record<DnaGate, Array<{ from: Stage; to: Stage }>> = {
  G1: [{ from: "WAITING_FINANCE", to: "QUEUE" }],
  G2: [
    { from: "SPK_SIGNED", to: "DP_PAID" },
    { from: "PENDING_DP", to: "LOCKED_ACTIVE" },
  ],
  G3: [{ from: "READY_TO_SHIP", to: "WON_DEAL" }],
};

// Stages that indicate an aborted / failed lifecycle — gate is BLOCKED.
const TERMINAL_BLOCKED = new Set<string>([
  "CANCELLED",
  "REJECTED",
  "LOST",
  "ABORTED",
]);

const STAGE_ORDER: Stage[] = [
  // SalesLead stages
  "NEW_LEAD",
  "CONTACTED",
  "FOLLOW_UP_1",
  "FOLLOW_UP_2",
  "FOLLOW_UP_3",
  "NEGOTIATION",
  "SAMPLE_REQUESTED",
  "WAITING_FINANCE_APPROVAL",
  "SAMPLE_SENT",
  "SAMPLE_APPROVED",
  "SPK_SIGNED",
  "DP_PAID",
  "PRODUCTION_PLAN",
  "READY_TO_SHIP",
  "WON_DEAL",
  // SampleStage
  "WAITING_FINANCE",
  "QUEUE",
  "FORMULATING",
  "LAB_TEST",
  "SHIPPED",
  "RECEIVED",
  "CLIENT_REVIEW",
  "APPROVED",
  // SOStatus
  "PENDING_DP",
  "ACTIVE",
  "LOCKED_ACTIVE",
  "READY_TO_PRODUCE",
  "COMPLETED",
  "DELIVERED",
  "CLOSED",
];

const STAGE_RANK = new Map<Stage, number>(STAGE_ORDER.map((s, i) => [s, i]));
const rank = (s: Stage) => STAGE_RANK.get(s) ?? -1;

export function deriveGateStatus(
  leadStatus: Stage | null | undefined,
  gate: DnaGate,
): DnaGateStatus {
  if (!leadStatus) return "PENDING";
  if (TERMINAL_BLOCKED.has(leadStatus)) return "BLOCKED";

  const transitions = GATE_TRANSITIONS[gate];
  // Check if leadStatus matches the from or to of any controlled transition.
  for (const t of transitions) {
    // Past the from-state → gate has been passed.
    if (rank(leadStatus) >= rank(t.from) && rank(t.from) !== -1) {
      return "PASSED";
    }
    // Sitting exactly on the from-state → awaiting verification.
    if (leadStatus === t.from) {
      return "PENDING";
    }
  }

  // Also: if status equals or is beyond the to-state (e.g. DP_PAID already),
  // the gate is definitely PASSED.
  for (const t of transitions) {
    if (rank(leadStatus) >= rank(t.to) && rank(t.to) !== -1) {
      return "PASSED";
    }
  }

  return "PENDING";
}

export function gateLabel(gate: DnaGate): string {
  return gate; // full name via DnaGateLabel[gate] in components
}

export function gateStatusToVariant(
  status: DnaGateStatus,
): "success" | "warning" | "critical" {
  return status === "PASSED"
    ? "success"
    : status === "PENDING"
      ? "warning"
      : "critical";
}