export type RequisitionCategory = "BAHAN_BAKU" | "BAHAN_KEMAS" | "CONSUMABLE";

export type RequisitionStatus = "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";

export const TARGET_DIVISIONS = [
  "Ruang Mixing Produksi - Line A",
  "Ruang Mixing Produksi - Line B",
  "Line Packaging & Boxing - Line C",
  "Ruang Filling & Sealing",
  "Laboratorium R&D / Formularium",
  "Quality Control (QC Field Lab)",
  "Maintenance & Engineering",
] as const;

export interface RequisitionItem {
  id: string;
  materialCode: string;
  materialName: string;
  category: RequisitionCategory;
  requestedQty: number;
  availableStock: number;
  unit: string;
  notes?: string;
}

export interface MaterialRequisition {
  id: string;
  requisitionNumber: string;
  requestDate: string;
  fromWarehouse: string;
  toDivision: string;
  spkNumber: string;
  batchNumber?: string;
  purpose: string;
  totalItems: number;
  requestedBy: string;
  status: RequisitionStatus;
  approvalNotes?: string;
  items: RequisitionItem[];
}

export interface CartItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  category: RequisitionCategory;
  requestedQty: number;
  availableStock: number;
  unit: string;
  notes?: string;
}

export interface RequisitionKpis {
  total: number;
  pending: number;
  approved: number;
  totalItemsCount: number;
}
