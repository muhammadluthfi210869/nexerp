export interface ArchivedFormula {
  id: string;
  formulaCode: string;
  name: string;
  category: string;
  version: string;
  status: "RELEASED" | "ARCHIVED" | "DRAFT";
  stability: "STABLE" | "UNSTABLE";
  updatedAt: string;
  pic: string;
  sampleCode: string;
  createdBy: string;
  releasedAt: string;
  activeVersion: string;
  ingredientCount: number;
  costPerKg: number;
  targetNetto: string;
}

export interface RepositoryKpiStats {
  totalFormulas: number;
  releasedCount: number;
  stableCount: number;
  archivedCount: number;
}
