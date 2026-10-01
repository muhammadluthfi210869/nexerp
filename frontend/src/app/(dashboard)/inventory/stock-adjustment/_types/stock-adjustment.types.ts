export interface AdjustmentLineItem {
  materialId?: string;
  name: string;
  unit: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  reason?: string;
}

export interface AdjustmentItem {
  id: string;
  code: string;
  date: string;
  warehouse: string;
  creator: string;
  notes: string;
  account: string;
  items: AdjustmentLineItem[];
}

export interface AdjustmentFormData {
  warehouseId: string;
  date: string;
  account: string;
  notes: string;
  items: AdjustmentLineItem[];
}

export interface AdjustmentNewItem {
  materialId: string;
  name: string;
  unit: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  reason: string;
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
  stock?: number;
  currentStock?: number;
}
