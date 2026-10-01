export interface StabilityResult {
  date: string;
  month: number;
  ph: string;
  viscosity: string;
  appearance: string;
  notes: string;
}

export interface StabilityStudy {
  id: string;
  product: string;
  batch: string;
  chamber: string;
  startDate: string;
  interval: string;
  notes: string;
  status: string;
  currentMonth: number;
  nextTest: string;
  results: StabilityResult[];
}

export interface NewStudyFormState {
  product: string;
  batch: string;
  chamber: string;
  startDate: string;
  interval: string;
  notes: string;
}

export interface LogResultFormState {
  date: string;
  month: number;
  ph: string;
  viscosity: string;
  appearance: string;
  notes: string;
}
