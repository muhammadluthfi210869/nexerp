export interface StatementRow {
  code: string;
  name: string;
  level: number;
  isHeader?: boolean;
  isTotal?: boolean;
  currentAmount: number;
  prevAmount: number;
  growthPct: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface LabaRugiKpis {
  totalPendapatan: number;
  totalHpp: number;
  labaKotor: number;
  labaOperasional: number;
  labaBersih: number;
  grossMarginPct: string;
  netMarginPct: string;
}

export interface LedgerLine {
  date?: string;
  journalNumber?: string;
  reference?: string;
  description?: string;
  debit?: number | string;
  credit?: number | string;
}

export interface LedgerDrilldownResponse {
  lines?: LedgerLine[];
  [key: string]: any;
}
