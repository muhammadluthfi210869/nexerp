export interface BillItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  price: number;
  discountRp: number;
  total: number;
  rejectQty?: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  poNumber: string;
  vendorName: string;
  procurementCategory: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  totalDiscountRp: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dpDeduction: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  unpaidReason?: string;
  notes?: string;
  items: BillItemDetail[];
  pic: string;
}

export interface InvoiceKpis {
  totalCount: number;
  totalGrand: number;
  totalUnpaid: number;
  paidCount: number;
}

export interface PendingInbound {
  id: string;
  inboundNumber: string; // Kode GR
  poNumber: string;
  poId?: string;
  vendorName: string;
  vendorId?: string;
  warehouseName?: string;
  receivedAt: string;
  status: string;
  totalEstimated: number;
  itemCount: number;
  items: Array<{
    materialName: string;
    qtyReceived: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface SupplierOption {
  value: string;
  label: string;
}

export const PROCUREMENT_CATEGORIES = [
  "Bahan Baku (110401)",
  "Bahan Kemas (110402)",
  "Reagen & Bahan Lab (510201)",
  "Perlengkapan Produksi & Sanitasi (510301)",
  "Jasa Maklon Eksternal (510401)",
] as const;

export const IMPORT_HEADERS = "vendor,invoice number,due date,item,qty,unit,price,notes";
