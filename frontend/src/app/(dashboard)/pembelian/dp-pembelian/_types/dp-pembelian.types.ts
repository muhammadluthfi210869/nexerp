export type PurchaseDpStatus = "PENDING_APPROVAL" | "PAID" | "ALLOCATED" | "VOID";

export interface PurchaseDp {
  id: string;
  dpNumber: string;
  dpDate: string;
  poNumber: string;
  vendorName: string;
  vendorCode: string;
  totalPoAmount: number;
  dpPercentage: number;
  dpAmount: number;
  paymentAccount: string;
  referenceNumber?: string;
  status: PurchaseDpStatus;
  allocatedBillNumber?: string;
  notes?: string;
  pic: string;
}

export interface ActivePoOption {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorCode: string;
  vendorId?: string;
  totalAmount: number;
}

export interface DpPembelianKpis {
  total: number;
  totalPaid: number;
  unallocated: number;
  pending: number;
}

export const CASH_BANK_ACCOUNTS = [
  "110201 - Bank BCA Operasional (A/C 731-0129-33)",
  "110202 - Bank Mandiri Operasional (A/C 137-00-9812-1)",
  "110101 - Kas Kecil Kantor (Petty Cash)",
  "110203 - Bank BNI Payroll & AP (A/C 098-1123-99)",
];
