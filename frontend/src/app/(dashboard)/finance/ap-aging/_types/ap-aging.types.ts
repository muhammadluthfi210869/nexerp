export type ApAgingStatusDueDate = "H-3" | "H-7" | "OVERDUE" | "NORMAL";

export type ApAgingBucket = "Current" | "1-30" | "31-60" | ">60";

export interface ApAgingItem {
  id: string;
  vendor: string;
  invoiceNo: string;
  invoiceDate: string;
  deadline: string;
  statusDueDate: ApAgingStatusDueDate;
  daysOverdue: number;
  amount: number;
  bucket: ApAgingBucket;
}

export interface ApAgingDateRange {
  start: string;
  end: string;
}

export interface ApAgingKpis {
  totalOutstanding: number;
  countH3: number;
  countH7: number;
  overdueCount: number;
  totalInvoices: number;
  realTimeBankBalance: number;
}
