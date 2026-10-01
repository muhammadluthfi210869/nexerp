export interface LedgerTransaction {
  id: string;
  postingDate: string;
  journalRef: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  reconciliationStatus: "RECONCILED" | "UNRECONCILED";
}

export interface LedgerAccountSummary {
  accountId: string;
  accountCode: string;
  accountName: string;
  opening: number;
  debit: number;
  credit: number;
  change: number;
  saldo: number;
}

export interface LedgerKpiStats {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface DateRange {
  start: string;
  end: string;
}
