export interface PendingOrder {
  id: string;
  invoiceNumber: string;
  customerName: string;
  brandName: string;
  reference: string;
  issuedAt: string | null;
  dueDate: string | null;
  amountDue: number;
  outstanding: number;
  status: string;
  invoiceType: string;
}

export interface PendingSample {
  id: string;
  activityType: string;
  clientName: string;
  brandName: string;
  productInterest: string;
  notes: string;
  amount: number;
  createdAt: string | null;
}

export interface ReturnRow {
  id: string;
  returnDate: string | null;
  returnStatus: string;
  notes: string;
  soNumber: string;
  brandName: string;
  clientName: string;
  itemCount: number;
}

export interface SelectedTarget {
  kind: "order" | "sample";
  row: any;
}

export type ArHubTabId = "products" | "samples" | "returns";

export interface AccountOption {
  value: string;
  label: string;
}

export interface ArHubKpis {
  totalReceivables: number;
  unpaidCount: number;
  overdue30: number;
  collectionsMtd: number;
  pendingCount: number;
  pendingAmount: number;
  isInvoicesLoading: boolean;
  isPendingLoading: boolean;
}
