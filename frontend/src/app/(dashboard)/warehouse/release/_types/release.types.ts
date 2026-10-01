export type FinancialGateStatus = "LUNAS" | "DP_APPROVED" | "ON_HOLD";
export type DeliveryStatus = "READY" | "IN_TRANSIT" | "DELIVERED" | "ON_HOLD" | "RETURNED";

export interface DeliveryItem {
  id: string;
  itemCode: string;
  itemName: string;
  qtyShipped: number;
  unit: string;
  boxCount: number;
  batchNumber: string;
}

export interface DeliveryOrder {
  id: string;
  deliveryNumber: string; // No Surat Jalan SJ-YYYYMM-XXXX
  shipDate: string;
  soNumber: string;
  clientName: string;
  brandName: string;
  destinationAddress: string;
  courierName: string; // Ekspedisi / Driver internal
  vehicleOrTrackingNo: string; // Plat nomor / No Resi
  totalBoxes: number;
  totalUnits: number;
  financialGateStatus: FinancialGateStatus; // LUNAS | DP_APPROVED | ON_HOLD
  deliveryStatus: DeliveryStatus;
  dispatchedBy: string;
  recipientName?: string;
  deliveredDate?: string;
  notes?: string;
  items: DeliveryItem[];
}

export interface ReleaseKpis {
  totalDeliveries: number;
  totalUnitsShipped: number;
  totalBoxes: number;
  onHoldCount: number;
}
