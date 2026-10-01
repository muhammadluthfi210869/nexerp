export interface EmployeeItem {
  id: string;
  name: string;
  nik?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  address?: string;
  bpjsKesehatan?: string;
  bpjsKetenagakerjaan?: string;
  joinedAt: string;
  contractEnd?: string;
  contractType?: "PKWT" | "PKWTT" | "INTERN" | "TETAP";
  isActive: boolean;
  position?: string;
  division?: string;
  baseSalary?: string;
  positionAllowance?: string;
  transportFlat?: string;
  transportTentativeDaily?: string;
  kpi?: number;
  disiplin?: number;
  roles?: Array<{ division: string; roleName: string; isPrimary?: boolean }>;
  loans?: EmployeeLoanItem[];
}

export interface EmployeeLoanItem {
  id: string;
  employeeId: string;
  totalAmount: number;
  remainingBalance: number;
  monthlyDeduction: number;
  status: "ACTIVE" | "PAID_OFF";
  reason?: string;
  createdAt: string;
}

export interface EmployeeFormData {
  name: string;
  nik: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
  bpjsKesehatan: string;
  bpjsKetenagakerjaan: string;
  joinedAt: string;
  contractEnd: string;
  contractType: "PKWT" | "PKWTT" | "INTERN";
  division: string;
  position: string;
  baseSalary: string;
  positionAllowance: string;
  transportFlat: string;
  transportTentativeDaily: string;
}
