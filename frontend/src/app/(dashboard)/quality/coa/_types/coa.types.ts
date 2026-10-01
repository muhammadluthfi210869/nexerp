export interface CoaParameters {
  ph?: string;
  viscosity?: string;
  organoleptic?: string;
  samplingVolume?: string;
  sealingCheck?: string;
  labelingCheck?: string;
  expDateCheck?: string;
  density?: string;
  homogenity?: boolean;
  torque?: string;
  leakTest?: boolean;
  dimension?: string;
  coaVerified?: boolean;
}

export interface CoaRecord {
  id: string;
  rawId: string;
  product: string;
  batch: string;
  releaseDate: string;
  status: "VERIFIED" | "PENDING";
  analyst: string;
  phase?: string;
  parameters: CoaParameters;
  defectCategory?: string;
  defectType?: string;
  notes?: string;
}
