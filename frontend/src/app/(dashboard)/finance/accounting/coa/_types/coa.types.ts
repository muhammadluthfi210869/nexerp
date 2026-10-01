export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type NormalBalance = "DEBIT" | "CREDIT";

export interface AccountParent {
  id: string;
  code: string;
  name: string;
}

export interface AccountModel {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  category: string;
  parentId?: string | null;
  parent?: AccountParent | null;
  allowManualJournal?: boolean;
  isHeader?: boolean;
  currency?: string;
  balance?: number;
  isActive: boolean;
}

export interface CoaFormData {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  category: string;
  parentId: string;
  isHeader: boolean;
  isActive: boolean;
}

export interface CoaKpis {
  totalAccounts: number;
  assetCount: number;
  liabilityCount: number;
  equityCount: number;
  revenueCount: number;
  expenseCount: number;
}
