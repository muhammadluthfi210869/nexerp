export const JENIS_DOKUMEN = [
  "Desain Label",
  "Desain Kemasan",
  "Formula",
  "BPOM",
  "Halal",
] as const;

export type JenisDokumen = typeof JENIS_DOKUMEN[number];

export const DOC_STATUS = ["APPROVED", "REVISION_NEEDED", "PENDING"] as const;

export type DocStatusType = typeof DOC_STATUS[number];

export const KEPUTUSAN_OPTIONS = ["RELEASE", "HOLD", "REJECT"] as const;

export type KeputusanOption = typeof KEPUTUSAN_OPTIONS[number];

export interface DocStatus {
  nama: string;
  status: string;
  catatan: string;
}

export interface ReleaseForm {
  batchRecord: string;
  jenisDokumen: string[];
  docStatuses: DocStatus[];
  nie: string;
  keputusan: string;
  ttdDigital: boolean;
}

export interface ApjReleaseRecord {
  id: string;
  batchRecord: string;
  keputusan: string;
  nie?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export type ApjReleaseTab = "log" | "new";

export const emptyForm: ReleaseForm = {
  batchRecord: "",
  jenisDokumen: [],
  docStatuses: [],
  nie: "",
  keputusan: "",
  ttdDigital: false,
};
