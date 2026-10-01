import React from "react";

export interface ProcurementItem {
  id: string;
  poId: string;
  receivedAt: string;
  items?: any[];
  [key: string]: any;
}

export interface InternalTransferItem {
  id: string;
  transferNumber: string;
  sourceWarehouse?: { name: string; [key: string]: any };
  destWarehouse?: { name: string; [key: string]: any };
  status: string;
  [key: string]: any;
}

export interface StockOpnameItem {
  id: string;
  opnameNumber: string;
  warehouse?: { name: string; [key: string]: any };
  items?: any[];
  approvalStatus: string;
  totalLossValue?: number;
  [key: string]: any;
}

export interface LogisticsItem {
  materialId: string;
  name: string;
  totalRequested: number | string;
  unit: string;
  currentStock: number | string;
  [key: string]: any;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  [key: string]: any;
}

export interface Material {
  id: string;
  name: string;
  stockQty?: number | string;
  [key: string]: any;
}

export interface FefoBatchSuggestion {
  batchNumber: string;
  expDate: string;
  location: {
    name: string;
  };
}

export interface FefoData {
  suggestedBatch: FefoBatchSuggestion;
  [key: string]: any;
}

export interface TransferFormItem {
  materialId: string;
  materialName: string;
  qty: number;
}

export interface OpnameFormItem {
  materialId: string;
  name: string;
  systemQty: number;
  actualQty: number;
}

export interface WorkCardProps {
  icon: React.ReactElement<any>;
  title: string;
  subtitle: string;
  status: string;
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
  isAmber?: boolean;
}

export type WorkstationTabId = "procurement" | "internal" | "logistics";
