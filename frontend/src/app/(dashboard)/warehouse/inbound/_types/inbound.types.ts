export type InboundQcStatus = "PASSED" | "PARTIAL_REJECT" | "FAILED" | "PENDING_TEST";
export type InboundGrnStatus = "PENDING_QC" | "APPROVED" | "HAS_REJECT" | "REJECTED";

export interface GrnItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyGood: number; // 3 Pilar: Kuantitas Bagus (Masuk Real Stok & Bayar Faktur)
  qtyReject: number; // 3 Pilar: Kuantitas Reject (Klaim Retur / Debit Note)
  qtyFree: number; // 3 Pilar: Kuantitas Free (Bonus HPP Rp 0)
  unit: string;
  batchNumber: string;
  expiryDate?: string;
  qcStatus: InboundQcStatus;
  rejectReason?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  receiveDate: string;
  poNumber: string;
  deliveryOrderNo: string; // No Surat Jalan Supplier
  vendorName: string;
  vendorCode: string;
  warehouseName: string;
  totalQtyGood: number;
  totalQtyReject: number;
  totalQtyFree: number;
  status: InboundGrnStatus;
  receivedBy: string;
  qcInspector: string;
  notes?: string;
  items: GrnItemDetail[];
}

export interface InboundKpis {
  totalGrn: number;
  totalGood: number;
  totalReject: number;
  totalFree: number;
  pendingQc: number;
}
