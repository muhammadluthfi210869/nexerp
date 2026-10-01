export type AdjustmentType = "CORRECTION" | "WRITE_OFF" | "DISPOSAL" | "QC_SAMPLING";
export type AdjustmentStatus = "DRAFT" | "PENDING_APPROVAL" | "PENDING" | "APPROVED" | "REJECTED";

export interface AdjustmentItem {
  itemCode: string;
  itemName: string;
  batchLot: string;
  systemQty: number;
  actualQty: number;
  differenceQty: number;
  unit: string;
  unitHpp: number;
  varianceValuation: number;
  itemNotes?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  adjustmentDate: string;
  warehouseCode: string;
  warehouseName: string;
  adjustmentType: AdjustmentType;
  adjustmentTypeLabel: string;
  adjustmentAccountCode: string;
  adjustmentAccountName: string;
  items: AdjustmentItem[];
  totalItemsCount: number;
  totalVarianceQty: number;
  totalVarianceValuation: number;
  status: AdjustmentStatus;
  createdBy: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

export interface AdjustmentKpis {
  total: number;
  pending: number;
  approved: number;
  netVariance: number;
}

export interface AdjustmentFormData {
  warehouseCode: string;
  warehouseName: string;
  adjustmentType: AdjustmentType;
  adjustmentAccountCode: string;
  adjustmentAccountName: string;
  notes: string;
  items: AdjustmentItem[];
}

export interface CatalogItemOption {
  code: string;
  name: string;
  unit: string;
  hpp: number;
  currentStock: number;
  batch: string;
}
