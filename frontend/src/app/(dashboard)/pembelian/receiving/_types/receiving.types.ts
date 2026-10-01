export interface ReceiptItem {
  name: string;
  qtyActual: number;
  qcStatus: "GOOD" | "REJECT" | "PENDING" | string;
}

export interface Receipt {
  id: string;
  poId: string;
  vendor: string;
  date: string;
  status: "VERIFIED" | "PENDING" | string;
  qc: "PASSED" | "WAITING" | "FAILED" | string;
  qtyBagus: number;
  qtyReject: number;
  qtyFree: number;
  items: ReceiptItem[];
}

export interface PurchaseOrderItem {
  id?: string;
  name: string;
  qty: number;
  unit: string;
}

export interface PurchaseOrderOption {
  id: string;
  vendor: string;
  items: PurchaseOrderItem[];
}

export type ReceivingTab = "ALL" | "WAITING_QC" | "VERIFIED" | "REJECTED";

export interface CreateGRNPayload {
  poId: string;
  warehouseId?: string;
  items: Array<{
    materialId: string;
    qtyActual: number;
  }>;
}
