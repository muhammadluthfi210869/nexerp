export interface ApBill {
  id: string;
  billNumber: string;
  vendorName: string;
  vendorCode: string;
  poNumber: string;
  invoiceDate: string;
  dueDate: string;
  daysToDue: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  availableDebitNote: number;
  availableDp: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
}

export interface BankBalance {
  accountCode: string;
  accountName: string;
  accountNumber: string;
  balance: number;
}

export interface PaymentKpiData {
  totalUnpaid: number;
  overdueCount: number;
  overdueAmount: number;
  dueH3Count: number;
  dueH7Count: number;
}

export type ApAgingTab = "ALL" | "OVERDUE" | "H3" | "H7" | "REGULAR";
