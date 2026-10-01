export type DeliveryOutStatus = "DELIVERED" | "SHIPPED" | "PACKING" | "PENDING";

export interface DeliveryOutLineItem {
  name: string;
  unit: string;
  qtySales: number;
  qtyAvailable: number;
  qtyShip: number;
}

export interface DeliveryOutItem {
  id: string;
  code: string;
  date: string;
  soNumber: string;
  soDate: string;
  customer: string;
  creator: string;
  courier: string;
  trackingNo: string;
  status: DeliveryOutStatus;
  items: DeliveryOutLineItem[];
  notes?: string;
}

export interface OutboundFormData {
  code: string;
  date: string;
  soId: string;
  soNumber: string;
  customer: string;
  courier: string;
  trackingNo: string;
  notes: string;
  items: DeliveryOutLineItem[];
}
