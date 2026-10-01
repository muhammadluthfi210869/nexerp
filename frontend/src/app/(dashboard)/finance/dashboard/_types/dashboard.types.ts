export interface FinanceDashboardTransaction {
  id: string;
  date: string;
  type: string;
  cat?: string;
  ref: string;
  amount: string | number;
  method: string;
  status: string;
}

export interface FinanceDashboardReceivable {
  id: string;
  name: string;
  out: string | number;
  due: string;
  status: string;
}

export interface FinanceDashboardPayable {
  id: string;
  name: string;
  out: string | number;
  due: string;
  status: string;
}

export interface FinanceDashboardExpenseBreakdown {
  cat: string;
  sub: string;
  amount: string | number;
}

export interface FinanceDashboardRevenueBreakdown {
  name: string;
  prod: string;
  type: string;
  amount: string | number;
}

export interface FinanceDashboardCashPosition {
  date: string;
  in: string | number;
  out: string | number;
  closing: string | number;
}

export interface FinanceDashboardKpiPerformance {
  period: string;
  status: string;
  margin: string | number;
  coll: string | number;
  score: string | number;
}

export interface FinanceDashboardMetrics {
  totalRevenue?: number | string;
  revenue?: number | string;
  collectionRate?: number;
  uncollected?: number | string;
  totalExpense?: number | string;
  expense?: number | string;
  cogs?: number | string;
  operational?: number | string;
  expenseRatio?: number;
  netCashFlow?: number | string;
  cashIn?: number | string;
  cashOut?: number | string;
  currentBalance?: number | string;
  netProfit?: number | string;
  margin?: number;
  grossProfit?: number | string;
  gpMargin?: number;
  overdueAr?: number | string;
  overdueAp?: number | string;
  cashRunwayAlert?: string;
  transactions?: FinanceDashboardTransaction[];
  receivables?: FinanceDashboardReceivable[];
  payables?: FinanceDashboardPayable[];
  expenseBreakdown?: FinanceDashboardExpenseBreakdown[];
  revenueBreakdown?: FinanceDashboardRevenueBreakdown[];
  cashPosition?: FinanceDashboardCashPosition[];
  kpiPerformance?: FinanceDashboardKpiPerformance[];
}

export interface UseFinanceDashboardOperationsResult {
  metrics: FinanceDashboardMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function formatMilyarJuta(val: any, defaultStr: string): string {
  if (val === undefined || val === null) return defaultStr;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (num >= 1000000000) {
    return `Rp ${(num / 1000000000).toFixed(1)} M`;
  }
  if (num >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(0)} Jt`;
  }
  return `Rp ${num.toLocaleString()}`;
}
