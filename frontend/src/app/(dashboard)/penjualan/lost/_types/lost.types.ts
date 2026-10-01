/**
 * Domain types & interfaces for Client Lost & Churn Analysis
 */

export type LostReasonType =
  | "PRICE_ISSUE"
  | "MOQ_TOO_HIGH"
  | "QUALITY"
  | "GHOSTING"
  | "COMPETITOR"
  | "NOT_READY"
  | "OTHER";

export interface LostProspectItem {
  id: string;
  brandName: string;
  productName: string;
  clientName: string;
  phoneNo?: string;
  bdName: string;
  estimatedValue: number;
  sampleDate: string;
  sampleStatus: string;
  lostReason: LostReasonType;
  lostNotes?: string;
}

export interface ChurnedClientItem {
  id: string;
  clientName: string;
  brandName: string;
  phoneNo?: string;
  lifetimeValue: number;
  totalOrders: number;
  lastOrderDate: string;
  inactivityMonths: number;
  lastProductOrdered: string;
  churnReason: string;
}

export type ReasonBadgeStatus = "critical" | "warning" | "neutral" | "success";

export const REASON_LABELS: Record<string, { label: string; status: ReasonBadgeStatus }> = {
  PRICE_ISSUE: { label: "HPP Terlalu Tinggi", status: "critical" },
  MOQ_TOO_HIGH: { label: "MOQ Tidak Cocok", status: "warning" },
  QUALITY: { label: "Formula Kurang Pas", status: "critical" },
  GHOSTING: { label: "Klien Hilang Kontak", status: "neutral" },
  COMPETITOR: { label: "Pindah ke Maklon Lain", status: "warning" },
  NOT_READY: { label: "Klien Belum Siap Modal", status: "neutral" },
  OTHER: { label: "Alasan Lain", status: "neutral" },
};
