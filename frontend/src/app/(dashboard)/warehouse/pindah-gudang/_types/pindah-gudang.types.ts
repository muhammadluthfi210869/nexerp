export type TransferStatus = "DRAFT" | "IN_TRANSIT" | "RECEIVED" | "VERIFIED" | "COMPLETED" | "CANCELLED";

export interface TransferItem {
  id: string;
  materialCode: string;
  materialName: string;
  transferQty: number;
  availableStockOrigin: number;
  unit: string;
  batchLot: string;
}

export interface WarehouseTransfer {
  id: string;
  transferNumber: string; // TRF-WH-YYYYMM-XXXX
  transferDate: string;
  fromWarehouse: string;
  toWarehouse: string;
  referenceDoc: string; // e.g. SPK-2026-0881 / Memo Internal
  totalItems: number; // Macam Item
  totalQty: number; // Total Qty Unit
  senderPic: string; // PIC Pengirim
  receiverPic?: string;
  receivedDate?: string;
  status: TransferStatus;
  notes?: string;
  items: TransferItem[];
}

export interface TransferCartItem {
  materialCode: string;
  materialName: string;
  transferQty: number;
  availableStockOrigin: number;
  unit: string;
  batchLot: string;
}

export interface AvailableCatalogItem {
  code: string;
  name: string;
  unit: string;
  stock: number;
  lot: string;
}

export interface TransferKpis {
  totalTransfers: number;
  inTransitCount: number;
  totalVolume: number;
  verifiedCount: number;
}
