/**
 * Purchase Requests (PR) Domain Types
 */

export interface PRItemDetail {
  id: string;
  materialCode: string;
  materialName: string;
  categoryCoa: string;
  qty: number;
  unit: string;
  estimatedPrice: number;
  subtotal: number;
  notes?: string;
}

export type PRStatus =
  | "DRAFT"
  | "PENDING_HEAD"
  | "PENDING_FINANCE"
  | "PENDING_DIRECTOR"
  | "APPROVED"
  | "REJECTED"
  | "ORDERED"
  | string;

export type PRPriority = "LOW" | "MEDIUM" | "URGENT";
export type PRRequesterRole = "STAFF" | "HEAD";

export interface PurchaseRequestRecord {
  id: string;
  prCode: string;
  date: string;
  department: string;
  requesterName: string;
  requesterRole: PRRequesterRole;
  categoryCoa: string;
  priority: PRPriority;
  targetDate: string;
  totalEstimated: number;
  status: PRStatus;
  approvalNotes?: string;
  items: PRItemDetail[];
}

export interface RawMaterialOption {
  id: string;
  code?: string;
  name?: string;
  unit?: string;
  [key: string]: any;
}
