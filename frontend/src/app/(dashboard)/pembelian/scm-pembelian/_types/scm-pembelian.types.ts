export type POItemCategory = "Bahan Baku" | "Kemas Primer" | "Kemas Sekunder" | "Perlengkapan";
export type SupplierCategory = "Bahan Baku" | "Bahan Kemas" | "Bahan Pembantu";
export type PaymentStatus = "UNPAID" | "DP_PAID" | "PAID";
export type ReceivingStatus = "PENDING_INBOUND" | "PARTIAL_RECEIVED" | "FULLY_RECEIVED";

export interface POItemDetail {
  id: string;
  materialCode: string;
  materialName: string;
  category: POItemCategory;
  orderedQty: number;
  goodQty: number;     // Pilar 1: Bagus (Real Stok / Bayar)
  rejectQty: number;   // Pilar 2: Reject (Tidak Bayar / Retur)
  freeQty: number;     // Pilar 3: Free / Bonus (HPP Rp 0)
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrderRecord {
  id: string;
  poCode: string;
  date: string;
  supplierName: string;
  supplierCategory: SupplierCategory;
  warehouseTarget: string;
  deadlineDate: string;
  creatorName: string;
  creatorSignatureUrl?: string;
  isSignedDigitally: boolean;
  subtotalAmount: number;
  discountRp: number;
  shippingCostRp: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  receivingStatus: ReceivingStatus;
  items: POItemDetail[];
  notes?: string;
}

export interface ScmKpiMetrics {
  totalPoValue: number;
  totalPoCount: number;
  pendingInboundCount: number;
  fullyReceivedCount: number;
  partialReceivedCount: number;
}
