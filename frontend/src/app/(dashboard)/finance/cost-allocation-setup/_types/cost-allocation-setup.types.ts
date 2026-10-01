import React from "react";

export interface CostAllocationRow {
  id: string;
  allocationDate: string;
  amount: number;
  fromCostCenter: string;
  toCostCenter: string;
  allocationMethod: string;
  basis?: string | null;
  notes?: string | null;
}

export const METHODS = ["DIRECT", "STEP_DOWN", "RECIPROCAL"] as const;
export type AllocationMethod = (typeof METHODS)[number];

export interface CostAllocationFormData {
  fromCostCenter: string;
  toCostCenter: string;
  amount: string;
  allocationMethod: string;
  basis: string;
  allocationDate: string;
  notes: string;
}

export interface CostAllocationHeaderProps {
  onCreateClick: () => void;
}

export interface CostAllocationKpiCardsProps {
  sourcePools: number;
  totalAmount: number;
  totalCount: number;
  dominantMethod: string;
  latestAllocationDate: string;
}

export interface CostAllocationTableProps {
  rows: CostAllocationRow[];
  isLoading: boolean;
  isError: boolean;
  methodFilter: string;
  onMethodFilterChange: (method: string) => void;
  onRetry: () => void;
}

export interface CostAllocationFormModalProps {
  isOpen: boolean;
  isSaving: boolean;
  formFrom: string;
  formTo: string;
  formAmount: string;
  formMethod: string;
  formBasis: string;
  formDate: string;
  formNotes: string;
  onFormFromChange: (val: string) => void;
  onFormToChange: (val: string) => void;
  onFormAmountChange: (val: string) => void;
  onFormMethodChange: (val: string) => void;
  onFormBasisChange: (val: string) => void;
  onFormDateChange: (val: string) => void;
  onFormNotesChange: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}
