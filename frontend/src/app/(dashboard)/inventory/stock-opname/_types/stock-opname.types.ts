export type OpnameStatus = "COMPLETED" | "DRAFT" | "PENDING_APPROVAL";

export interface OpnameItem {
  materialId?: string;
  name: string;
  unit: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  notes?: string;
}

export interface OpnameRecord {
  id: string;
  code: string;
  date: string;
  warehouse: string;
  creator: string;
  status: OpnameStatus;
  notes: string;
  items: OpnameItem[];
}

export interface OpnameFormData {
  warehouseId: string;
  warehouse: string;
  date: string;
  notes: string;
  items: OpnameItem[];
}

export interface OpnameNewItem {
  materialId: string;
  name: string;
  unit: string;
  systemQty: number;
  actualQty: number;
  difference: number;
  notes: string;
}

export interface WarehouseOption {
  id: string;
  code?: string;
  name: string;
  [key: string]: any;
}

export interface CatalogMaterialOption {
  id: string;
  code?: string;
  name: string;
  unit?: string;
  currentStock?: number;
  stockQty?: number;
  [key: string]: any;
}
