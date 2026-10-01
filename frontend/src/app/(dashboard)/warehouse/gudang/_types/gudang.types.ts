export type WarehouseType =
  | "RAW_MATERIAL"
  | "PACKAGING"
  | "FINISHED_GOODS"
  | "STAGING_WIP"
  | "QUARANTINE_REJECT";

export type WarehouseTemperatureZone =
  | "AMBIENT"
  | "COOL_ROOM"
  | "AIR_CONDITIONED";

export type WarehouseStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export interface WarehouseNode {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;
  typeLabel: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  picName: string;
  totalBins: number;
  capacityUtilityPercent: number;
  temperatureZone: WarehouseTemperatureZone;
  status: WarehouseStatus;
}

export type BinZoneType = "AMBIENT" | "COOL_ROOM";

export type BinStatus = "AVAILABLE" | "OCCUPIED" | "FULL" | "BLOCKED";

export interface BinLocation {
  id: string;
  binCode: string;
  warehouseCode: string;
  warehouseName: string;
  aisle: string;
  rackLevel: string;
  zoneType: BinZoneType;
  capacityMax: number;
  currentWeightOrQty: number;
  occupancyPercent: number;
  activeSku: string;
  status: BinStatus;
}

export interface GoodsCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  inventoryAccount: string;
  cogsAccount: string;
  salesAccount: string;
  salesReturnAccount: string;
  unbilledGoodsAccount: string;
}

export interface WarehouseFormData {
  name: string;
  code: string;
  type: WarehouseType;
  phone: string;
  province: string;
  city: string;
  address: string;
  picName: string;
}

export interface BinFormData {
  binCode: string;
  warehouseCode: string;
  aisle: string;
  rackLevel: string;
  zoneType: BinZoneType;
  capacityMax: number;
}

export interface CategoryFormData {
  code: string;
  name: string;
  description: string;
  inventoryAccount: string;
  cogsAccount: string;
  salesAccount: string;
  salesReturnAccount: string;
  unbilledGoodsAccount: string;
}
