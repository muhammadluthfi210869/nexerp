export type ProjectStatus = 
  | "ON_TRACK" 
  | "AT_RISK" 
  | "OFF_TRACK" 
  | "NOT_UPDATED" 
  | "DONE" 
  | "CANCELLED";

export type MilestoneStatus = 
  | "NOT_STARTED" 
  | "IN_PROGRESS" 
  | "WAITING_VERIFICATION" 
  | "DONE" 
  | "OVERDUE";

export type BlockerSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ProjectBlocker {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: BlockerSeverity;
  owner: string;
  createdAt: string;
  expectedResolution?: string;
  status: "ACTIVE" | "RESOLVED";
  relatedMilestoneId?: string;
}

export interface ProjectDecision {
  id: string;
  projectId: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  decisionOwner: string;
  optionsRecommendation?: string;
  impactIfDelayed?: string;
  status: "OPEN" | "DECIDED";
  decisionResult?: string;
  decidedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  sequence: number;
  milestone: string;
  pic: string;
  startDate: string;
  deadline: string;
  status: MilestoneStatus;
  isMandatory: boolean;
  weight?: number; // Optional percentage weight
  evidence?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  blocker?: string;
}

export interface Project {
  id: string;
  name: string;
  objective: string;
  definitionOfDone: string;
  department: string;
  owner: string;
  pic: string;
  sponsor?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  progress: number; // Derived automatically
  currentMilestone: string;
  currentMilestoneDue: string;
  blocker?: ProjectBlocker;
  decisionRequired: boolean;
  activeDecision?: ProjectDecision;
  lastUpdate: string;
  milestones: ProjectMilestone[];
  kpiLinked?: boolean;
}

export interface ProjectHealthSummary {
  totalActive: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  notUpdated: number;
  needDecision: number;
  completedThisMonth: number;
}
