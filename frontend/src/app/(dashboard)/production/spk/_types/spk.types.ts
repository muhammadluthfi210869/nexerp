export type SpkStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "RELEASED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface SpkItem {
  id: string;
  spkCode: string;
  issueDate: string;
  soNumber: string;
  customerName: string;
  brandName: string;
  productName: string;
  category: string;
  orderQty: number;
  unit: string;
  machineLine: string;
  supervisor: string;
  status: SpkStatus;
  targetDate: string;
  notes?: string;
  batchNumber?: string;
  formulaCode?: string;
}

export interface SpkKpis {
  totalSpk: number;
  inProgressCount: number;
  pendingReleaseCount: number;
  completedCount: number;
}

export const SPK_STATUS_CONFIG: Record<
  SpkStatus,
  { label: string; badge: "default" | "warning" | "info" | "success" | "danger" }
> = {
  DRAFT: { label: "Draft SPK", badge: "default" },
  PENDING_APPROVAL: { label: "Menunggu Rilis", badge: "warning" },
  RELEASED: { label: "Rilis Produksi", badge: "info" },
  IN_PROGRESS: { label: "Dalam Produksi", badge: "warning" },
  COMPLETED: { label: "Selesai", badge: "success" },
  CANCELLED: { label: "Dibatalkan", badge: "danger" },
};

export const mapWorkOrderToSpk = (item: any, idx: number): SpkItem => ({
  id: item.id || `spk-${idx + 1}`,
  spkCode: item.woNumber || item.spkCode || `SPK-PRD-2026-${String(idx + 1).padStart(3, "0")}`,
  issueDate: item.createdAt ? String(item.createdAt).slice(0, 10) : (item.issueDate || new Date().toISOString().slice(0, 10)),
  soNumber: item.salesOrder?.soNumber || item.soNumber || item.lead?.soNumber || `SO-2026-${String(idx + 101).padStart(3, "0")}`,
  customerName: item.lead?.clientName || item.customerName || "PT Cantika Glow Nusantara",
  brandName: item.lead?.brandName || item.brandName || "Aura Glow",
  productName: item.productName || item.lead?.productInterest || "Brightening Facial Serum 30ml",
  category: item.category || "Skincare",
  orderQty: Number(item.targetQty || item.orderQty || item.quantity) || 5000,
  unit: item.unit || "Pcs",
  machineLine: item.machine?.name || item.machineLine || "Line Filling 01 / Mixer 500L",
  supervisor: item.supervisor?.name || item.supervisor || "Bambang Sutrisno",
  status: (item.status as SpkStatus) || "RELEASED",
  targetDate: item.targetDate ? String(item.targetDate).slice(0, 10) : new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  notes: item.notes || "",
  batchNumber: item.batchNumber || `BATCH-2026-${String(idx + 1).padStart(3, "0")}`,
  formulaCode: item.formulaCode || `FOR-SKN-2026-0${idx + 1}`,
});
