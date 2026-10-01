export interface CoaAutoRule {
  id: string;
  ruleName: string;
  transactionType: string;
  documentType: string;
  condition: string;
  debitAccount: string;
  creditAccount: string;
  coaDebetId: string;
  coaCreditId: string;
  isActive: boolean;
  notes?: string;
}

export interface TransactionTypeOption {
  value: string;
  label: string;
}

export interface AccountOption {
  value: string;
  label: string;
}

export interface CoaAutoKpis {
  totalActiveRules: number;
  integratedDocumentsCount: number;
  mappedAccountsCount: number;
  doubleEntryEngineRate: string;
}

export const STANDARD_TRANSACTION_TYPES: TransactionTypeOption[] = [
  { value: "FAKTUR_PEMBELIAN_HUTANG", label: "FAKTUR_PEMBELIAN_HUTANG (Hutang Dagang Faktur Pembelian)" },
  { value: "FAKTUR_PEMBELIAN_DISKON", label: "FAKTUR_PEMBELIAN_DISKON (Potongan Faktur Pembelian)" },
  { value: "FAKTUR_PEMBELIAN_BIAYA_LAIN", label: "FAKTUR_PEMBELIAN_BIAYA_LAIN (Biaya Lain Faktur Pembelian)" },
  { value: "FAKTUR_PEMBELIAN_PPN_MASUKAN", label: "FAKTUR_PEMBELIAN_PPN_MASUKAN (PPN Masukan Faktur Pembelian)" },
  { value: "STOK_OPNAME_KOREKSI", label: "STOK_OPNAME_KOREKSI (Koreksi Stok Opname)" },
  { value: "PENGIRIMAN_BARANG_TRANSIT", label: "PENGIRIMAN_BARANG_TRANSIT (Persediaan Transit Pengiriman)" },
  { value: "FAKTUR_PENJUALAN_PIUTANG", label: "FAKTUR_PENJUALAN_PIUTANG (Piutang Dagang Faktur Penjualan)" },
  { value: "PENJUALAN_POTONGAN", label: "PENJUALAN_POTONGAN (Potongan Penjualan)" },
  { value: "PENJUALAN_PPN_KELUARAN", label: "PENJUALAN_PPN_KELUARAN (PPN Keluaran Faktur Penjualan)" },
  { value: "UANG_MUKA_PEMBELIAN", label: "UANG_MUKA_PEMBELIAN (DP Pembelian ke Supplier)" },
  { value: "UANG_MUKA_PENJUALAN", label: "UANG_MUKA_PENJUALAN (DP Penjualan dari Pelanggan)" },
  { value: "RETUR_PEMBELIAN_SELISIH", label: "RETUR_PEMBELIAN_SELISIH (Selisih Harga Retur Pembelian)" },
];
