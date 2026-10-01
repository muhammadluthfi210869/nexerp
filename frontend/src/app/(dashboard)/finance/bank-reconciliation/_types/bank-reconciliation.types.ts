export interface BankStatementLine {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = credit/inflow, negative = debit/outflow
  matched: boolean;
  systemTxId?: string;
}

export interface SystemTransaction {
  id: string;
  date: string;
  docNo: string;
  description: string;
  amount: number;
  matched: boolean;
}

export interface BankAccountItem {
  id: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  accountCode?: string;
  currentBalance?: number | string;
  glAccountId?: string;
  [key: string]: any;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface BankAccountTab {
  id: string;
  label: string;
}

export type ReconStatus = "RECONCILED" | "UNBALANCED" | "IN_PROGRESS";

export interface ReconciliationSessionItem {
  id: string;
  reconNo: string;
  period: string;
  bankName: string;
  accountNumber: string;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  unmatchedCount: number;
  reconStatus: ReconStatus;
}
