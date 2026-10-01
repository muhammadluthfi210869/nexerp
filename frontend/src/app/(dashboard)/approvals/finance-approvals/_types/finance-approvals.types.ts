export interface FundRequestUser {
  fullName?: string;
}

export type FundRequestStatus =
  | "PENDING_APPROVAL_MGR"
  | "APPROVED_BY_MGR"
  | "PAID"
  | (string & {});

export interface FundRequest {
  id: string;
  amount: number;
  reason: string;
  departmentId: string;
  status: FundRequestStatus;
  createdAt: string;
  user?: FundRequestUser;
}

export const INITIAL_FUND_REQUESTS: FundRequest[] = [
  {
    id: "1",
    amount: 2500000,
    reason: "Top Up Facebook Ads",
    departmentId: "MARKETING",
    status: "PENDING_APPROVAL_MGR",
    createdAt: new Date().toISOString(),
    user: { fullName: "Marketing Lead" },
  },
  {
    id: "2",
    amount: 500000,
    reason: "Beli Token Listrik Pabrik",
    departmentId: "GUDANG",
    status: "APPROVED_BY_MGR",
    createdAt: new Date().toISOString(),
    user: { fullName: "Staf GA" },
  },
];

export function getFundRequestStatusBadgeVariant(status: string): {
  variant: "warning" | "info" | "success" | "default";
  label: string;
} {
  switch (status) {
    case "PENDING_APPROVAL_MGR":
      return { variant: "warning", label: "Menunggu Manager" };
    case "APPROVED_BY_MGR":
      return { variant: "info", label: "Disetujui Manager" };
    case "PAID":
      return { variant: "success", label: "Sudah Cair" };
    default:
      return { variant: "default", label: status };
  }
}
