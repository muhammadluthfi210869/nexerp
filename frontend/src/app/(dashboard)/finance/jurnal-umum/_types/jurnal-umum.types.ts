export type JournalType = "MANUAL" | "AUTO_AR" | "AUTO_AP" | "AUTO_STOCK" | "ADJUSTMENT";
export type JournalStatus = "POSTED" | "DRAFT";

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  lineDescription: string;
}

export interface JournalHeader {
  id: string;
  code: string;
  date: string;
  description: string;
  reference: string;
  type: JournalType;
  status: JournalStatus;
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  lines: JournalEntryLine[];
}

export interface JournalLineForm {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  lineDescription: string;
}

export interface JournalHeaderForm {
  date: string;
  description: string;
  reference: string;
}

export interface AccountOption {
  id?: string;
  code: string;
  name: string;
  [key: string]: any;
}

export interface JournalKpiStats {
  totalJournals: number;
  totalDebitSum: number;
  totalCreditSum: number;
  unbalancedCount: number;
  postedCount: number;
  draftCount: number;
}
