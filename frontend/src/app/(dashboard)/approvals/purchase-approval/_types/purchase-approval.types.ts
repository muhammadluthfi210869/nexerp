/**
 * Purchase Approval Types
 * Screen ID: SCR-SCM-POA-001 — Purchase Order & Approval Center workflow with conflict detection
 */

export type ApprovalStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "DRAFT"
  | "SUBMITTED";

export interface PurchaseOrderItem {
  id?: string;
  materialId?: string;
  itemName?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  unit?: string;
  currentStock?: number;
  price?: number;
  subtotal?: number;
  [key: string]: any;
}

export interface PurchaseOrderSupplier {
  id?: string;
  name?: string;
  code?: string;
  termOfPayment?: number;
}

export interface PurchaseOrderWarehouse {
  id?: string;
  name?: string;
  code?: string;
}

export interface PurchaseApprovalRecord {
  id: string;
  submissionNo: string;
  submissionDate: string;
  docType: string;
  refDocNo: string;
  requester: string;
  department: string;
  totalAmount: number;
  currentTier: string;
  status: ApprovalStatus;
  notes?: string;
  poNumber?: string;
  supplier?: PurchaseOrderSupplier;
  supplierName?: string;
  warehouse?: PurchaseOrderWarehouse;
  items?: PurchaseOrderItem[];
  discountAmount?: number;
  discountManual?: number;
  shippingCost?: number;
  estArrival?: string;
  orderDate?: string;
  createdAt?: string;
  [key: string]: any;
}

export type LineSource = "PO" | "STOCK";
export type LineSourcesState = Record<string, LineSource>;

export interface ConflictState {
  open: boolean;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface PurchaseApprovalFilterState {
  searchQuery: string;
  docTypeFilter: string;
  statusFilter: string;
  departmentFilter: string;
}
