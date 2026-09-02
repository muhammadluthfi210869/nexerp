// ── Google Sheet raw row types ──

export interface SheetInfo {
  name: string;
  sheetId: number;
}

export interface SheetRange {
  sheet: string;
  range: string;
  values: string[][];
}
