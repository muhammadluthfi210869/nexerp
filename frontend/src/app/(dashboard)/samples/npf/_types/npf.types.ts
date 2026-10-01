/**
 * Types & Domain Constants for NPF & Sample Management (SCR-017, SCR-121, SCR-123)
 */

export interface NpfSampleRow {
  id: string;
  sampleCode: string;
  entryDate: string;
  clientName: string;
  brandName: string;
  productName: string;
  targetFunction: string;
  textureReq: string;
  aromaReq: string;
  colorReq: string;
  targetHppPrice: number;
  targetDeadline: string | null;
  formulatorPic: string;
  busdevPic: string;
  currentRevision: string;
  stage: string;
  stageLabel: string;
  courier: string;
  trackingAwb: string;
  clientFeedback: string;
}

export interface CreateNpfForm {
  leadId: string;
  clientLabel: string;
  productName: string;
  targetPrice: number;
  conceptNotes: string;
}

export type FeedbackDecision = "APPROVED" | "REJECTED";

/** Mirrors the canonical `SampleStage` enum (11 values) â€” do not invent stages. */
export const STAGE_LABEL: Record<string, string> = {
  WAITING_FINANCE: "Menunggu Verifikasi Finance",
  QUEUE: "Antrean Lab",
  FORMULATING: "Proses Formulasi Lab",
  LAB_TEST: "Uji Lab",
  READY_TO_SHIP: "Siap Dikirim",
  SHIPPED: "Sample Terkirim",
  RECEIVED: "Diterima Klien",
  CLIENT_REVIEW: "Review Klien",
  APPROVED: "Approved (Deal)",
  REJECTED: "Ditolak / Perlu Revisi",
  CANCELLED: "Dibatalkan",
};

export const STAGE_VARIANT: Record<string, string> = {
  WAITING_FINANCE: "warning",
  QUEUE: "neutral",
  FORMULATING: "indigo",
  LAB_TEST: "indigo",
  READY_TO_SHIP: "info",
  SHIPPED: "info",
  RECEIVED: "purple",
  CLIENT_REVIEW: "purple",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

/** `CLIENT_REVIEW` is the only stage whose canonical transitions accept a client decision. */
export const DECISION_STAGE = "CLIENT_REVIEW";

export const str = (v: unknown, fallback = "â€”") =>
  v === null || v === undefined || v === "" ? fallback : String(v);

export const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "â€”";

export const num = (v: unknown) => Number(v ?? 0);
