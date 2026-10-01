export type KpiGrade = "A" | "B+" | "B" | "C";

export interface KpiScorecard {
  id: string;
  empId: string;
  empName: string;
  empRole: string;
  department: string;
  targetKpi: string;
  achievement: number; // percentage
  disciplineScore: number;
  objectiveScore: number;
  grade: KpiGrade;
  bonusMultiplier: number;
  bonusAmount: number;
}

export interface KpiRawEmployee {
  id?: string;
  employeeId?: string;
  nik?: string;
  employeeName?: string;
  name?: string;
  role?: string;
  department?: string;
  finalKpiScore?: number;
  roleSpecificScore?: number;
  kpiItems?: Array<{ name?: string }>;
}
