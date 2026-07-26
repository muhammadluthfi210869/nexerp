// ── Paid Ads & Results ──

export interface PaidAdsRow {
  month: string;
  channel: string;
  budget: number | null;
  spentLeft: number | null;
  spend: number | null;
  traffic: number | null;
  leads: number | null;
  prospecting: number | null;
  samples: number | null;
  notes: string;
}

export interface PaidAdsData {
  rows: PaidAdsRow[];
  totalBudget: number;
  totalSpend: number;
  totalLeads: number;
  totalSamples: number;
  totalTraffic: number;
  cpl: number | null;  // cost per lead
  cpa: number | null;  // cost per acquisition (samples)
}
