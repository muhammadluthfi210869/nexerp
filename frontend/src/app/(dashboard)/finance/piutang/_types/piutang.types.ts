export interface Invoice {
  id: string;
  customer: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
  source: string;
}

export interface Bill {
  id: string;
  vendor: string;
  date: string;
  dueDate: string;
  total: number;
  status: string;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   AR Hub row shapes â€” mapped 1:1 from live endpoints.
   `pelanggan` / `kode_faktur` / `sisa` are the keys the collection modal reads.
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export interface ArInvoiceRow {
  id: string;
  kode_faktur: string;
  kode_so: string;
  ref: string;
  tanggal: string;
  pelanggan: string;
  produk?: string;
  grand_total: number;
  dibayar: number;
  sisa: number;
  status: string;
}

export interface ArReturnRow {
  id: string;
  no_retur: string;
  pelanggan: string;
  brand: string;
  tanggal: string;
  jumlah_item: number;
  status: string;
  catatan: string;
}

export interface SalesOrderLeadPic {
  name?: string;
}

export interface SalesOrderLead {
  clientName?: string;
  brandName?: string;
  productInterest?: string;
  pic?: SalesOrderLeadPic;
}

export interface SalesOrderRow {
  id: string | number;
  orderNumber?: string;
  totalAmount?: number | string;
  quantity?: number;
  status?: string;
  isPaymentVerified?: boolean;
  paymentVerifiedAt?: string;
  paymentProofUrl?: string | null;
  lead?: SalesOrderLead;
}

export type PiutangTabId = "faktur-jual" | "faktur-beli" | "sales-orders" | "ar-hub";
export type ArHubSubTabId = "products" | "samples" | "returns";
