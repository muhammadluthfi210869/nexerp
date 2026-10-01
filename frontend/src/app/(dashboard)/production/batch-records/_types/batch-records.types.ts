export type BatchRecordStatus =
  | "PENDING_QC"
  | "IN_TESTING"
  | "PASSED_RELEASED"
  | "QUARANTINED"
  | "REJECTED";

export interface BatchRecordItem {
  id: string;
  batchRecordCode: string;
  spkRef: string;
  formulaRef: string;
  productName: string;
  batchSizeKg: number;
  formulatorPic: string;
  startDate: string;
  yieldPct: number;
  qcReleaseStatus: BatchRecordStatus;
  customerName?: string;
  brandName?: string;
  targetPcs?: number;
  notes?: string;
}

export interface BatchRecordKpis {
  totalRecords: number;
  pendingQcCount: number;
  releasedCount: number;
  avgYieldPct: number;
}

export const BMR_STATUS_CONFIG: Record<
  BatchRecordStatus,
  { label: string; badge: "default" | "warning" | "info" | "success" | "danger" }
> = {
  PENDING_QC: { label: "Menunggu QC", badge: "warning" },
  IN_TESTING: { label: "Uji Laboratorium", badge: "info" },
  PASSED_RELEASED: { label: "Lolos Release", badge: "success" },
  QUARANTINED: { label: "Karantina", badge: "default" },
  REJECTED: { label: "Ditolak / Afkir", badge: "danger" },
};

export const mapToBatchRecordItem = (item: any, idx: number): BatchRecordItem => {
  const statusRaw = item.status || "PENDING";
  let qcStatus: BatchRecordStatus = "PENDING_QC";
  if (statusRaw === "COMPLETED" || statusRaw === "RELEASED" || statusRaw === "LOCKED" || statusRaw === "APPROVED") {
    qcStatus = "PASSED_RELEASED";
  } else if (statusRaw === "IN_PROGRESS" || statusRaw === "TESTING" || statusRaw === "PROCESS") {
    qcStatus = "IN_TESTING";
  } else if (statusRaw === "QUARANTINED" || statusRaw === "HOLD") {
    qcStatus = "QUARANTINED";
  } else if (statusRaw === "REJECTED") {
    qcStatus = "REJECTED";
  }

  return {
    id: item.id || `bmr-${idx + 1}`,
    batchRecordCode: item.batchNo || item.batchRecordCode || item.code || `BMR-2026-03-${String(idx + 1).padStart(3, "0")}`,
    spkRef: item.workOrder?.woNumber || item.spkCode || item.spkRef || `SPK-PRD-2026-${String(idx + 1).padStart(3, "0")}`,
    formulaRef: item.formula?.code || item.formulaCode || item.formulaRef || `FOR-SKN-2026-0${(idx % 5) + 1} v${(idx % 3) + 1}`,
    productName: item.productName || item.lead?.productInterest || item.workOrder?.productName || "Brightening Facial Serum 30ml",
    batchSizeKg: Number(item.batchSizeKg || item.baseResultKg || item.targetQtyKg || item.batchSize || 250),
    formulatorPic: item.formulator || item.creatorName || item.apjName || "apt. Siti Nurhaliza",
    startDate: item.createdAt ? String(item.createdAt).slice(0, 10) : (item.startDate || new Date().toISOString().slice(0, 10)),
    yieldPct: Number(item.yieldPct || item.yieldPercentage || (97.5 + (idx % 3) * 0.8)),
    qcReleaseStatus: qcStatus,
    customerName: item.lead?.clientName || item.customerName || "PT Cantika Glow Nusantara",
    brandName: item.lead?.brandName || item.brandName || "Aura Glow",
    targetPcs: Number(item.targetQtyPcs || item.orderQty || 5000),
    notes: item.apjNotes || item.notes || "",
  };
};
