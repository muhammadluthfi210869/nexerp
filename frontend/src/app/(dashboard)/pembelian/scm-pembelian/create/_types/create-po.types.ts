export interface SupplierOption {
  id: string;
  name: string;
  categoryName?: string;
}

export interface WarehouseOption {
  id: string;
  name: string;
}

export interface MaterialOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  unitPrice: number;
  type: string;
  categoryName?: string;
}

export interface CartLineItem {
  id: string;
  materialId: string;
  qty: number;
  unitPrice: number;
}

export interface CartRowItem extends CartLineItem {
  materialName: string;
  materialCode: string;
  unit: string;
  subtotal: number;
}
