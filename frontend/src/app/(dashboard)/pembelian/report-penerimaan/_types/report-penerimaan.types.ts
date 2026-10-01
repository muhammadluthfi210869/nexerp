export interface ReceivingReportRow {
  id: string;
  grnNumber: string;
  receiveDate: string;
  poNumber: string;
  deliveryOrderNo: string;
  vendorName: string;
  warehouseName: string;
  itemCode: string;
  itemName: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyGood: number; // Jumlah Bagus
  qtyReject: number; // Jumlah Reject
  qtyFree: number; // Jumlah Barang Gratis (Free / Bonus Rp 0)
  unit: string;
  batchNumber: string;
  status: string;
  notes?: string;
}

export interface ReceivingReportKpis {
  totalReceivedItems: number;
  totalQtyReceived: number;
  totalQtyGood: number;
  totalQtyReject: number;
  totalQtyFree: number;
}
