export type StockCategory = "Bahan Baku" | "Bahan Kemas" | "Barang Jadi";
export type StockTypeCode = "RAW_MATERIAL" | "PACKAGING" | "FINISHED_GOODS";
export type StockHealthStatus = "AMAN" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  specifications?: string;
  category: StockCategory;
  typeCode: StockTypeCode;
  warehouse: string;
  rackLocation: string;
  qtyOnHand: number;
  unit: string;
  safetyStock: number;
  fifoUnitCost: number;
  totalValuation: number;
  status: StockHealthStatus;
  batchNumber?: string;
  expiryDate?: string;
}

export interface StokKpis {
  totalValuation: number;
  totalSkus: number;
  totalPhysicalQty: number;
  lowStockCount: number;
}
