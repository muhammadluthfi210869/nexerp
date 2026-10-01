export interface ReturnItem {
  id: string;
  itemCode: string;
  itemName: string;
  qtyReturned: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  rejectReason: string;
}

export type CompensationType = "POTONG_TAGIHAN" | "GANTI_BARANG" | "REFUND_DANA";

export type PurchaseReturnStatus = "DRAFT" | "WAITING_APPROVAL" | "COMPLETED" | "CANCELLED";

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  returnDate: string;
  poNumber: string;
  grnNumber: string;
  vendorName: string;
  vendorCode: string;
  compensationType: CompensationType;
  totalQty: number;
  totalAmount: number;
  // Mirrors the backend `PurchaseReturnStatus` enum (purchase-return.dto.ts) exactly. There is
  // no APPROVED and no REJECTED state on the server; the old UI vocabulary invented both and
  // rendered DRAFT/CANCELLED rows as "Disetujui Vendor".
  status: PurchaseReturnStatus;
  pic: string;
  notes?: string;
  items: ReturnItem[];
}

export interface AvailableInboundItem {
  materialId?: string;
  itemCode: string;
  itemName: string;
  qtyReceived: number;
  unit: string;
  unitPrice: number;
}

export interface AvailableInbound {
  id: string;
  grnNumber: string;
  poNumber: string;
  vendorName: string;
  vendorId?: string;
  warehouseId?: string;
  items: AvailableInboundItem[];
}

export interface PurchaseReturnKpis {
  total: number;
  totalValue: number;
  pending: number;
  approved: number;
}
