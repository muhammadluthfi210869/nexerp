// Types for marketing digital dashboard

export type ConnectionStatus = 
  | "CONNECTED" 
  | "DEGRADED" 
  | "DISCONNECTED" 
  | "NOT_CONFIGURED" 
  | "SYNCING" 
  | "connected" 
  | "degraded" 
  | "disconnected" 
  | "needs_configuration"
  | "error";

export type Freshness = any;

export interface Connection {
  id: string;
  name?: string;
  platform?: string;
  provider?: string;
  status: ConnectionStatus;
  freshness?: any;
  lastSync?: string;
  refreshedAt?: string;
  message?: string;
  errorMessage?: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpl: number;
  leads: number;
  reach?: number;
}

export interface Attribution {
  coverage: number | null;
  roas: number | null;
  attributedLeads?: number;
  attributedValue?: number;
  unattributedLeads?: number;
}

export interface SourceBreakdown {
  source?: string;
  leads: number;
  conversions: number;
  spend: number;
  cpl: number;
  name?: string;
}

export interface Client {
  id: string;
  name: string;
  brand?: string;
  company?: string;
  campaign?: string;
  owner?: string;
  stage?: string;
  status: string;
  phone?: string;
  source?: string;
  assignedTo?: string;
  value?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketingOverview {
  totalLeads?: number;
  totalSpend?: number;
  avgCpl?: number;
  conversionRate?: number;
  attribution?: Attribution;
  sourceBreakdown?: SourceBreakdown[];
  clients?: Client[];
  connections?: Connection[];
  campaigns?: MetaCampaign[];
  channels?: any[];
  crm?: any;
  kpis?: any;
  refreshedAt?: string;
  metaAds?: any;
  instagram?: any;
  googleOrganic?: any;
  freshness?: any;
}
