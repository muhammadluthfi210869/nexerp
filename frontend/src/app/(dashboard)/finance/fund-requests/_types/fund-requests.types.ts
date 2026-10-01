export type FundRequestLevel = "STAFF" | "HEAD_DIVISI";
export type ApprovalGateLevel = "HEAD_DIVISI" | "ACCOUNTING" | "DIREKTUR" | "COMPLETED";
export type FundRequestStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "DISBURSED";
export type DisbursementStatus = "DICAIRKAN" | "BELUM DICAIRKAN" | "MENUNGGU APPROVAL";

export interface FundRequestItem {
  id: string;
  requestNo: string;
  applicant: string;
  level: FundRequestLevel;
  department: string;
  purpose: string;
  amount: number;
  coaAccount: string;
  currentApprovalLevel: ApprovalGateLevel;
  approvalTier: string;
  disbursementStatus: DisbursementStatus;
  status: FundRequestStatus;
  requestDate: string;
  requiredDate: string;
  notes?: string;
}

export interface FundRequestFormData {
  level: FundRequestLevel | string;
  applicant: string;
  department: string;
  purpose: string;
  coaAccount: string;
  amount: string;
  requiredDate: string;
}

export interface FundRequestKpis {
  totalPengajuanBulanIni: number;
  totalMenungguApproval: number;
  totalDisbursed: number;
  totalCount: number;
}
