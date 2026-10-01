export interface LabTestTester {
  id: string;
  fullName: string;
}

export interface LabTestResult {
  id: string;
  testNumber?: string;
  testDate: string;
  formulaId: string;
  formulaName?: string;
  formulaCode?: string;
  batchNumber?: string;
  productName?: string;
  testType?: string;
  parameterName?: string;
  actualPh: string;
  actualViscosity: string;
  actualDensity?: string;
  microbiologyResult?: string;
  microbiologyPass?: boolean;
  colorResult: string;
  aromaResult: string;
  textureResult: string;
  actualValue?: string;
  standardSpec?: string;
  stability40C: string;
  stabilityRT: string;
  stability4C: string;
  status?: "PASS" | "FAIL" | "CONDITIONAL" | "STABLE" | "UNSTABLE";
  notes?: string;
  tester?: LabTestTester;
}

export interface LabTestFormData {
  formulaId: string;
  batchNumber?: string;
  productName?: string;
  testType: string;
  parameterName: string;
  actualPh: string;
  actualViscosity: string;
  actualDensity: string;
  microbiologyResult: string;
  colorResult: string;
  aromaResult: string;
  textureResult: string;
  standardSpec: string;
  stability40C: string;
  stabilityRT: string;
  stability4C: string;
  status: "PASS" | "FAIL" | "CONDITIONAL" | "STABLE" | "UNSTABLE";
  notes: string;
}

export interface FormulaItem {
  id: string;
  name?: string;
  formulaCode?: string;
  version?: string;
  productName?: string;
  [key: string]: any;
}

export type LabTestTabType = "ALL" | "STABLE" | "UNSTABLE";
