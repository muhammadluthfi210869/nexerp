export type CashOutReconciliationStatus = "RECONCILED" | "UNRECONCILED" | "PENDING";
export type CashOutApprovalStatus = "APPROVED" | "PENDING" | "REJECTED" | "POSTED";

export interface CashOutItem {
  id: string;
  code: string;
  date: string;
  account: string;
  category: string;
  to: string;
  billNo: string;
  amount: number;
  reconciliationStatus: CashOutReconciliationStatus;
  approvalStatus: CashOutApprovalStatus;
  description: string;
  status: "POSTED" | "DRAFT";
}

export interface CashOutFormData {
  date: string;
  description: string;
  account: string;
  to: string;
  billNo: string;
  coaExpense: string;
  amount: string;
  entryNotes: string;
}

export interface CashOutDateRange {
  start: string;
  end: string;
}

export type CashOutStatusTab = "ALL" | "POSTED" | "DRAFT" | string;
