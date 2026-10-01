export interface ClientSampleActivityRecord {
  id: string;
  tanggal: string; // e.g. "1/7" or "01/07/2026"
  no: string;
  namaClient: string;
  namaBrand: string;
  domisili: string;
  noTelp: string;
  prioStandar: "PRIORITAS" | "STANDAR" | string;
  sampleProduct: string;
  // FINANCE
  rencanaMoq: string; // e.g. "500", "1000", "100-300"
  rencanaBudgetClosing: string; // e.g. "Rp35.000.000" or raw number string
  // STATUS SAMPLE
  sample1Npf: string;
  sample1Delivery: string;
  revisi1Npf: string;
  revisi1Delivery: string;
  revisi2Npf: string;
  revisi2Delivery: string;
  statusProgress: string;
  terakhirFu: string;
  nextFu: string;
  // SUGGEST PROCESS
  fixFormula: string;
  hki: string;
  kemasanPrimer: string;
  kemasanSekunder: string;
  mockUp: string;
  // NEGOTIATION
  tglPermintaan: string;
  tglDikasih: string;
  tglTargetDp: string;
  statusAkhir: "PROCESS" | "POTENTIAL DEALING" | "NEGOTIABLE" | "DEAL" | "LOST" | string;
  lostReason: string;
  // NOTED / CATATAN BD
  source: string;
  arahanHeadBd: string;
  profilKlien: string;
  rekomendasiBd: string;
  // Computed / Deadline flag
  isOverdue?: boolean;
}
