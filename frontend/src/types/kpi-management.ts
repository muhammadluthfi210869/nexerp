export type KPIStatus = "EXCELLENT" | "ON_TRACK" | "AT_RISK" | "OFF_TRACK";

export type KPICalculationType = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER" | "RATIO_COMPLIANCE";

export interface KPIItem {
  id: string;
  name: string;
  definition: string;
  departmentId: string;
  departmentName: string;
  weight: number; // e.g. 25 (%)
  target: number;
  actual: number;
  unit: string; // %, Rp, days, count, etc.
  calcType: KPICalculationType;
  achievement: number; // Raw achievement (%) calculated based on calcType
  cappedContribution: number; // Capped at max contribution (e.g. 120%)
  weightedScore: number; // (cappedContribution * weight) / 100
  status: KPIStatus;
  trend: number; // vs previous period (+/-)
  dataSource: string;
  lastUpdate: string;
  minThreshold?: number;
  maxContribution?: number; // Default 120%
}

export interface DepartmentKPI {
  id: string;
  departmentName: string;
  headOfDepartment: string;
  finalWeightedScore: number;
  targetScore: number;
  achievementPct: number;
  status: KPIStatus;
  trend: number; // pts vs last month
  lowestKpiName: string;
  lowestKpiScore: number;
  lastCalculated: string;
  kpis: KPIItem[];
}

export type SeniorityLevel = "STAFF" | "SENIOR" | "HEAD_OF_DEPARTMENT";

export interface IndividualKPI {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  manager: string;
  seniority: SeniorityLevel;
  finalKpiScore: number;
  targetScore: number;
  status: KPIStatus;
  trend: number;
  lowestKpiName: string;
  departmentSharedScore: number;
  roleSpecificScore: number;
  strategicProjectScore: number;
  lastCalculated: string;
  kpiItems: KPIItem[];
  evidenceCount?: number;
}

export interface KPISettingsConfig {
  id: string;
  kpiName: string;
  departmentName: string;
  role?: string;
  calcType: KPICalculationType;
  dataSource: string;
  target: number;
  unit: string;
  weight: number;
  minThreshold: number;
  maxContribution: number; // Default 120
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
}
