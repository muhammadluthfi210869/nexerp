export type UrgencyLevel = "Normal" | "Tinggi" | "Darurat";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PurchaseRequestLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface PurchaseRequestApprovalItem {
  id: string;
  code: string;
  department: string;
  requesterName: string;
  creatorRole: string;
  urgency: UrgencyLevel;
  purpose: string;
  itemsCount: number;
  estimatedTotal: number;
  // Aliases read by ApprovalPageShell's search and stat aggregation.
  title: string;
  partnerName: string;
  totalAmount: number;
  date: string;
  dueDate: string;
  status: ApprovalStatus;
  notes: string;
  lineItems: PurchaseRequestLineItem[];
}

export interface RejectPurchaseRequestPayload {
  id: string;
  reason: string;
}
