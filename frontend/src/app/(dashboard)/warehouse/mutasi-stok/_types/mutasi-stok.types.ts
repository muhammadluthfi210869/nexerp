export type MutationType =
  | "INBOUND"
  | "OUTBOUND"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "OPNAME";

export interface MutationItem {
  id: string;
  datetime: string;
  docRef: string;
  itemCode: string;
  itemName: string;
  mutationType: MutationType;
  sourceWarehouse: string;
  destWarehouse: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
  unit: string;
  pic: string;
  notes: string;
}

export interface MutasiStokKpis {
  totalInbound: number;
  totalOutbound: number;
  totalTransfer: number;
  totalAdjustment: number;
}
