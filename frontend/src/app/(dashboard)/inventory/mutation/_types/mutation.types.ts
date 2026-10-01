export type TransferStatus = "COMPLETED" | "PENDING" | "CANCELLED";

export interface TransferLineItem {
  materialId?: string;
  name: string;
  unit: string;
  qty: number;
  notes?: string;
}

export interface TransferItem {
  id: string;
  code: string;
  date: string;
  sourceWarehouse: string;
  destWarehouse: string;
  creator: string;
  vehicleNo: string;
  status: TransferStatus;
  notes?: string;
  items: TransferLineItem[];
}

export interface TransferCartItem {
  materialId: string;
  name: string;
  unit: string;
  qtyStock: number;
  qtyTransfer: number;
  notes: string;
}

export interface TransferFormData {
  sourceWarehouseId: string;
  destWarehouseId: string;
  date: string;
  vehicleNo: string;
  notes: string;
  cartItems: TransferCartItem[];
}

export interface NewItemDraft {
  materialId: string;
  name: string;
  unit: string;
  qtyStock: number;
  qtyTransfer: number;
  notes: string;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code?: string;
}

export interface CatalogMaterialOption {
  id: string;
  name: string;
  unit?: string;
  stock?: number | string;
  currentStock?: number | string;
}
