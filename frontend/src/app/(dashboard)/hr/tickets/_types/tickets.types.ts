export interface HrTicketItem {
  id: string;
  ticketNo: string;
  empId: string;
  empName: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: string;
  reason: string;
  approver: string;
  status: string;
}

export interface NewTicketFormState {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface EmployeeOption {
  id: string;
  name?: string;
  fullName?: string;
  employeeId?: string;
  nik?: string;
  department?: string;
  [key: string]: any;
}
