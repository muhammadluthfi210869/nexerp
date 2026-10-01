export type ReconciliationStatus = "RECONCILED" | "UNRECONCILED" | "PENDING";
export type ApprovalStatus = "APPROVED" | "PENDING" | "REJECTED" | "POSTED";

export interface CashInItem {
  id: string;
  code: string;
  date: string;
  account: string;
  category: string;
  from: string;
  reference?: string;
  amount: number;
  reconciliationStatus: ReconciliationStatus;
  approvalStatus: ApprovalStatus;
  description: string;
  status: "POSTED" | "DRAFT";
}

export interface CashInFormData {
  date: string;
  account: string;
  description: string;
  from: string;
  coaRevenue: string;
  memo: string;
  amount: string;
}

export interface CashInDateRange {
  start: string;
  end: string;
}

export type CashInStatusTab = "ALL" | "POSTED" | "DRAFT" | string;
