/**
 * Sample Sales â€” Domain Types & Schemas
 *
 * Types for Sample Orders, Status mappings, Form data, and Drawer/Modal operations.
 */

export type SampleOrderStatus = "PENDING" | "PROCESS" | "SHIPPED" | "COMPLETED" | "CANCELLED";

export interface SampleOrder {
  id: string;
  code: string;
  createdAt: string;
  customerName: string;
  brandName?: string;
  productName: string;
  physicalForm?: string;
  volumeNetto?: string;
  color?: string;
  fragrance?: string;
  benefitClaims?: string;
  formulator?: string;
  qty: number;
  unitPrice: number;
  sampleFeeOffset?: number;
  status: SampleOrderStatus;
  targetDate?: string;
  notes?: string;
}

export type SampleBadgeVariant = "warning" | "info" | "purple" | "success" | "critical";

export const statusBadgeMap: Record<SampleOrderStatus | string, SampleBadgeVariant> = {
  PENDING: "warning",
  PROCESS: "info",
  SHIPPED: "purple",
  COMPLETED: "success",
  CANCELLED: "critical",
};

export const statusLabelMap: Record<SampleOrderStatus | string, string> = {
  PENDING: "Menunggu Lab",
  PROCESS: "Formulasi Lab",
  SHIPPED: "Kirim ke Klien",
  COMPLETED: "Approved Klien",
  CANCELLED: "Ditolak / Batal",
};

export interface SampleFormData {
  customer: string;
  brand: string;
  product: string;
  form: string;
  netto: string;
  color: string;
  fragrance: string;
  claims: string;
  qty: string;
  price: string;
  notes: string;
}

export const initialSampleFormData: SampleFormData = {
  customer: "",
  brand: "",
  product: "",
  form: "Serum",
  netto: "30 ml",
  color: "Bening kekuningan",
  fragrance: "Floral Lembut",
  claims: "Brightening, Hydrating, UV Guard",
  qty: "2",
  price: "250000",
  notes: "",
};
