export type WorkOrderStage =
  | "WAITING_MATERIAL"
  | "MIXING"
  | "FILLING"
  | "PACKING"
  | "QC_HOLD"
  | "FINISHED";

export type WorkOrderStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "QC_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type StageBadgeVariant =
  | "default"
  | "warning"
  | "critical"
  | "info"
  | "purple"
  | "success";

export interface StageLabelInfo {
  label: string;
  badge: StageBadgeVariant;
}

export interface WorkOrderItem {
  id: string;
  code: string;
  batchNumber: string;
  salesOrderCode: string;
  customerName: string;
  brandName: string;
  productName: string;
  category: string;
  netto: string;
  targetQty: number;
  goodQty: number;
  rejectQty: number;
  startDate: string;
  targetDate: string;
  currentStage: WorkOrderStage;
  progressPct: number;
  status: WorkOrderStatus;
  picOperator: string;
  notes: string;
}

export interface CreateWorkOrderFormData {
  soCode: string;
  customer: string;
  brand: string;
  product: string;
  category: string;
  netto: string;
  targetQty: number;
  startDate: string;
  targetDate: string;
  pic: string;
  notes: string;
}

export interface AdvanceStageFormData {
  goodQty: number;
  rejectQty: number;
  notes: string;
}

export interface WorkOrdersKpis {
  totalActive: number;
  inMixing: number;
  inFilling: number;
  inPacking: number;
  qcHoldCount: number;
  completedCount: number;
}

export const STAGE_LABELS: Record<string, StageLabelInfo> = {
  WAITING_MATERIAL: { label: "Timbang Bahan", badge: "default" },
  MIXING: { label: "1. Mixing", badge: "info" },
  FILLING: { label: "2. Filling", badge: "purple" },
  PACKING: { label: "3. Packaging", badge: "warning" },
  QC_HOLD: { label: "Karantina QC", badge: "critical" },
  FINISHED: { label: "Selesai", badge: "success" },
};

export const NEXT_STAGE_FLOW: Record<string, WorkOrderStage> = {
  WAITING_MATERIAL: "MIXING",
  MIXING: "FILLING",
  FILLING: "PACKING",
  PACKING: "QC_HOLD",
  QC_HOLD: "FINISHED",
  FINISHED: "FINISHED",
};
