export interface PipelineLead {
  id: string | number;
  clientName: string;
  brandName?: string | null;
  productInterest: string;
  category?: string | null;
  estimatedValue: number;
  status: string;
  slaDays: number;
  lastActionBy: string | null;
  lastActionAt?: string | null;
  notes?: string | null;
}

export interface AuditLogEntry {
  id: string | number;
  timestamp: string;
  clientName: string;
  fromStage: string | null;
  toStage: string | null;
  action: string;
  performedBy: string;
  effects: string[];
  artifacts: string[];
}
