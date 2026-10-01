export type MaterialRequisitionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PARTIALLY_ISSUED"
  | "FULLY_ISSUED";

export interface MaterialRequisitionItem {
  id: string;
  requisitionCode: string;
  requestDate: string;
  spkRef: string;
  targetProduct: string;
  sourceWarehouse: string;
  totalMaterialTypes: number;
  totalQty: number;
  qtyUnit: string;
  requesterPic: string;
  status: MaterialRequisitionStatus;
  customerName?: string;
  brandName?: string;
  batchNumber?: string;
  notes?: string;
}

export interface MaterialRequisitionKpis {
  totalSubmitted: number;
  totalIssued: number;
  partiallyIssued: number;
  shortageCount: number;
}

export const MR_STATUS_CONFIG: Record<
  MaterialRequisitionStatus,
  { label: string; badge: "default" | "warning" | "info" | "success" }
> = {
  DRAFT: { label: "Draft SPB", badge: "default" },
  SUBMITTED: { label: "Menunggu Pengeluaran", badge: "warning" },
  PARTIALLY_ISSUED: { label: "Sebagian Dikeluarkan", badge: "info" },
  FULLY_ISSUED: { label: "Telah Dikeluarkan", badge: "success" },
};

export const mapToRequisitionItem = (item: any, idx: number): MaterialRequisitionItem => ({
  id: item.id || `mr-${idx + 1}`,
  requisitionCode: item.requisitionCode || item.code || item.spbNumber || `MR-PRD-2026-${String(idx + 1).padStart(3, "0")}`,
  requestDate: item.requestDate || (item.date ? String(item.date).slice(0, 10) : new Date().toISOString().slice(0, 10)),
  spkRef: item.spkRef || item.spkCode || item.workOrder?.woNumber || `SPK-PRD-2026-${String(idx + 1).padStart(3, "0")}`,
  targetProduct: item.targetProduct || item.productName || item.workOrder?.productName || "Brightening Facial Serum 30ml",
  sourceWarehouse: item.sourceWarehouse || item.warehouse?.name || "WH-01 Gudang Bahan Baku",
  totalMaterialTypes: Number(item.totalMaterialTypes || item.totalItems || (5 + (idx % 6))),
  totalQty: Number(item.totalQty || (120.5 + idx * 45)),
  qtyUnit: item.qtyUnit || (idx % 2 === 0 ? "Kg" : "L"),
  requesterPic: item.requesterPic || item.requestedBy || item.requesterName || "Hendra Wijaya",
  status: (item.status as MaterialRequisitionStatus) || "SUBMITTED",
  customerName: item.customerName || item.workOrder?.lead?.clientName || "PT Cantika Glow Nusantara",
  brandName: item.brandName || item.workOrder?.lead?.brandName || "Aura Glow",
  batchNumber: item.batchNumber || `BATCH-2026-${String(idx + 1).padStart(3, "0")}`,
  notes: item.notes || "",
});
