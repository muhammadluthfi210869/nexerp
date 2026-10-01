export interface CartItem {
  materialId: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
}

export interface ApproveDialogState {
  id: string;
  type: string;
}

export interface RejectDialogState {
  id: string;
  type: string;
}

export interface PurchasingVendor {
  id: string;
  name: string;
  [key: string]: any;
}

export interface PurchasingWarehouse {
  id: string;
  name: string;
  [key: string]: any;
}

export interface PurchasingMaterial {
  id: string;
  name: string;
  unit: string;
  unitPrice?: number | string;
  type?: string;
  [key: string]: any;
}

export interface PurchaseOrderItem {
  materialId?: string;
  itemName?: string;
  name?: string;
  quantity?: number;
  qty?: number;
  unitPrice?: number;
  price?: number;
  [key: string]: any;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  createdAt?: string;
  orderDate?: string;
  estArrival?: string;
  dueDate?: string;
  status: string;
  totalValue?: number | string;
  supplier?: {
    id?: string;
    name?: string;
  };
  supplierName?: string;
  scm?: {
    fullName?: string;
  };
  items?: PurchaseOrderItem[];
  notes?: string;
  discountAmount?: number;
  shippingCost?: number;
  taxPercent?: number;
  totalAmount?: number;
  [key: string]: any;
}

export interface PurchaseRequestItem {
  id?: string;
  materialId?: string;
  name?: string;
  qty?: number;
  [key: string]: any;
}

export interface PurchaseRequest {
  id: string;
  createdAt: string;
  status: string;
  warehouse?: {
    name?: string;
  };
  creator?: {
    fullName?: string;
  };
  createdBy?: string;
  items?: PurchaseRequestItem[];
  [key: string]: any;
}

export type StatusBadgeVariant = "success" | "warning" | "default" | "info" | "critical";

export const STATUS_BADGE_MAP: Record<string, StatusBadgeVariant> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "critical",
  ORDERED: "info",
  SHIPPED: "info",
  RECEIVED: "success",
  CANCELLED: "default",
  SUBMITTED: "warning",
};

export interface CreatePOPayload {
  supplierId: string;
  estArrival: string;
  dueDate?: string;
  notes?: string;
  discountAmount: number;
  shippingCost: number;
  taxPercent: number;
  totalAmount: number;
  items: {
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}
