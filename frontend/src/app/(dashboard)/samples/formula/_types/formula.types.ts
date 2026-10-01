export type PhaseKey = "A" | "B" | "C" | "D" | "E";

export interface FormulaIngredient {
  id: string;
  phase: PhaseKey;
  materialCode: string; // Kode Bahan / SKU
  inciName: string;     // Nama Bahan / INCI
  functionName: string; // Fungsi Bahan
  percentage: number;   // Persentase (%)
  unitPrice: number;    // Harga Satuan (Rp/Kg)
  weightGram?: number;  // Kebutuhan Gram (Batch)
  subtotalCost?: number;// Subtotal Biaya (Rp)
}

export interface FormulaLabHeader {
  id: string;
  formulaCode: string;
  productName: string;
  customerName: string;
  category: string;
  version: string;
  formulatorPic: string;
  batchSizeGram: number;
  targetPh: string;
  targetViscosity: string;
  status: "DRAFT" | "LAB_TRIAL" | "STABILITY_TEST" | "LOCKED_PRODUCTION";
}

export interface FormulaKpiStats {
  totalIngredients: number;
  totalPercentage: number;
  costPerKg: number;
  isBalanced: boolean;
}

export interface MasterMaterialOption {
  id: string;
  code: string;
  name: string;
  inciName: string;
  functionName: string;
  unitPrice: number;
  category: string;
}
