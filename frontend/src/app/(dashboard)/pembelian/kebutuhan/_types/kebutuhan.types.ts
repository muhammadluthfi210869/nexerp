/**
 * Kebutuhan Barang (MRP) Domain Types
 */

export type MrpCategory = "Bahan Baku" | "Kemas Primer" | "Kemas Sekunder";
export type MrpStatus = "DEFICIT" | "PARTIAL_COVERED" | "SAFE_STOCK";

export interface MrpItemRecord {
  id: string;
  materialCode: string;
  materialName: string;
  category: MrpCategory;
  salesOrderRef: string;
  clientName: string;
  brandProduct: string;
  grossRequirement: number;
  realStockQty: number; // Pilar 1: Real Stok Gudang (Bagus)
  onOrderQty: number;   // PO Sedang Berjalan
  netNeedQty: number;   // Gross - Real Stock - On Order
  unit: string;
  primarySupplier: string;
  estimatedUnitPrice: number;
  estimatedTotalCost: number;
  status: MrpStatus;
}

export interface MrpFormData {
  materialCode: string;
  materialName: string;
  category: MrpCategory;
  salesOrderRef: string;
  clientName: string;
  brandProduct: string;
  grossRequirement: number;
  realStockQty: number;
  onOrderQty: number;
  unit: string;
  primarySupplier: string;
  estimatedUnitPrice: number;
}
