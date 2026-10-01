export type OpnameItemStatus = "MATCH" | "SURPLUS" | "DEFICIT" | "PENDING_COUNT";
export type OpnameSessionStatus = "DRAFT_FREEZE" | "IN_COUNT" | "RECONCILED_CLOSED";

export interface OpnameItem {
  itemCode: string;
  itemName: string;
  batchLot: string;
  binLocation: string;
  systemQty: number;
  actualQty: number | null;
  differenceQty: number;
  unit: string;
  unitHpp: number;
  varianceValuation: number;
  status: OpnameItemStatus;
  notes?: string;
}

export interface OpnameSession {
  id: string;
  sessionCode: string;
  sessionDate: string;
  warehouseCode: string;
  warehouseName: string;
  auditorLead: string;
  auditorTeam: string[];
  totalSkus: number;
  countedSkus: number;
  matchedSkus: number;
  varianceSkus: number;
  netVarianceValuation: number;
  status: OpnameSessionStatus;
  notes?: string;
  isInventoryFrozen: boolean;
  items: OpnameItem[];
}

export interface NewSessionFormState {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  auditorLead: string;
  auditorTeam: string;
  notes: string;
  freezeInventory: boolean;
}

export interface WarehouseOption {
  id: string;
  code: string;
  name: string;
  [key: string]: any;
}

export interface OpnameKpis {
  total: number;
  active: number;
  closed: number;
  netVariance: number;
}
