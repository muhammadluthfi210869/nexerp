export interface InvoiceItemDetail {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  price: number;
  discount: number; // Diskon nominal (Rp)
  total: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  soNumber: string;
  customerName: string;
  brandName: string;
  invoiceDate: string; // Tanggal invoice custom
  dueDate: string;
  subtotal: number;
  totalDiscount: number;
  taxAmount: number; // PPN 11%
  downPaymentOffset: number; // Potongan DP yang sudah disetor
  grandTotal: number;
  paidAmount: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  arGatekeeperStatus: "HELD" | "RELEASED"; // AR Gatekeeper DO
  unpaidReason?: string; // Alasan belum lunas
  notes?: string;
  items: InvoiceItemDetail[];
  picBusDev: string;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  soNumber: string;
  customer: string;
  brand: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  discount: string;
  dpOffset: string;
  notes: string;
}
