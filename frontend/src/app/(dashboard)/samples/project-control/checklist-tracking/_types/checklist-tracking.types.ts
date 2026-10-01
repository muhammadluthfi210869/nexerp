/**
 * Types & Constants for Checklist Tracking (Project SLA).
 */

export type DerivedStatus = "ON_TRACK" | "PENDING_APPROVAL" | "OVERDUE" | "COMPLETED";

export interface StageLog {
  id: string;
  stage: string;
  enteredAt: string;
  leftAt: string | null;
  durationDays: number | null;
  notes: string | null;
  rejectionReason: string | null;
}

export interface FormulaPhaseItem {
  id: string;
  dosagePercentage: number | string;
  materialName: string;
}

export interface FormulaPhase {
  id: string;
  prefix: string;
  customName: string | null;
  instructions: string | null;
  items: FormulaPhaseItem[];
}

export interface SampleFormula {
  id: string;
  formulaCode: string;
  version: number;
  phases: FormulaPhase[];
}

export interface SampleTrackingItem {
  id: string;
  sampleCode: string;
  customer: string;
  brand: string;
  product: string;
  packagingType: string;
  difficultyLevel: number;
  busdev: string;
  picPo: string;
  requestedAt: string;
  targetDeadline: string | null;
  stage: string;
  status: DerivedStatus;
  latestStageNotes: string | null;
}

export interface SampleTimelineDetail {
  id: string;
  formula: SampleFormula | null;
  stageLogs: StageLog[];
}

export interface ChecklistCounts {
  all: number;
  onTrack: number;
  pending: number;
  overdue: number;
}

export type TabFilter = "ALL" | DerivedStatus;

export type DnaBadgeVariant = "neutral" | "info" | "warning" | "critical" | "success" | "purple";

export const STAGE_LABEL: Record<string, string> = {
  WAITING_FINANCE: "Menunggu Pembayaran",
  QUEUE: "Dalam Antrian R&D",
  FORMULATING: "Perumusan Formula",
  LAB_TEST: "Uji Laboratorium",
  READY_TO_SHIP: "Siap Kirim Sampel",
  SHIPPED: "Sampel Dikirim",
  RECEIVED: "Sampel Diterima",
  CLIENT_REVIEW: "Review Klien",
  APPROVED: "Disetujui Klien",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export const STAGE_VARIANT: Record<string, DnaBadgeVariant> = {
  WAITING_FINANCE: "warning",
  QUEUE: "neutral",
  FORMULATING: "info",
  LAB_TEST: "info",
  READY_TO_SHIP: "purple",
  SHIPPED: "purple",
  RECEIVED: "purple",
  CLIENT_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "critical",
  CANCELLED: "critical",
};

export const STATUS_VARIANT: Record<DerivedStatus, "success" | "info" | "warning" | "critical"> = {
  ON_TRACK: "success",
  PENDING_APPROVAL: "warning",
  OVERDUE: "critical",
  COMPLETED: "info",
};

export function formatDate(value?: string | null): string {
  if (!value) return "â€”";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "â€”";
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "â€”";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "â€”";
  return d.toISOString().slice(0, 10);
}

export function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

/** Status derived ONLY from stored stage + deadline, never invented. */
export function deriveStatus(stage: string, targetDeadline: string | null): DerivedStatus {
  if (stage === "APPROVED") return "COMPLETED";
  if (stage === "REJECTED" || stage === "CANCELLED") return "OVERDUE";
  if (stage === "CLIENT_REVIEW" || stage === "WAITING_FINANCE") return "PENDING_APPROVAL";
  if (targetDeadline) {
    const due = new Date(targetDeadline);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) return "OVERDUE";
  }
  return "ON_TRACK";
}
