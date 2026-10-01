export interface PayrollItemRecord {
  id: string;
  payrollId: string;
  employeeId: string;
  employeeName: string;
  employeePosition?: string;
  department?: string;
  baseSalary: number;
  positionAllowance: number;
  transportFlat: number;
  transportTentative: number;
  overtimePay: number;
  kpiIncentive: number;
  grossIncome: number;
  bpjsHealth: number;
  bpjsEmployment: number;
  loanDeduction: number;
  remainingLoan?: number;
  pph21: number;
  totalDeductions: number;
  netSalary: number;
}

export interface PayrollRecord {
  id: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "AUTHORIZED" | "PAID";
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  items: PayrollItemRecord[];
}
